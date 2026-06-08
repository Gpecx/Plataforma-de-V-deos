'use server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { removeSessionCookie } from '@/app/actions/auth'
import { createPayment, payWithCreditCard, BillingType, getStudentAsaasId, createCustomer, getPaymentQrCode, withRetry, getPayment, getPaymentIdentification, getTeacherWalletInfo, calculateSplitValues } from '@/services/asaasService'
import { sanitizeCpfCnpj } from '@/lib/utils'

async function getClientIp(): Promise<string> {
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    return headersList.get('x-real-ip') || 'unknown'
}

async function getAuthUser() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('session')?.value
    if (!token) return null

    try {
        return await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        return null
    }
}

export async function getProfile() {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
        const data = profileDoc.data()
        if (!data) return { success: true, data: null }

        // Converte todos os Timestamp do Firestore em strings ISO serializáveis
        // E enriquece cursos concluídos com nome do professor se faltar
        const plainData = { ...data }
        
        for (const [key, value] of Object.entries(plainData)) {
            if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
                plainData[key] = (value as any).toDate().toISOString()
            }
        }

        // Soft Migration: Enriquece concluded_courses se teacherName estiver ausente
        if (plainData.concluded_courses && Array.isArray(plainData.concluded_courses)) {
            const enrichedCourses = []
            for (const course of plainData.concluded_courses) {
                if (!course.teacherName && course.courseId) {
                    try {
                        const courseDoc = await adminDb.collection('courses').doc(course.courseId).get()
                        if (courseDoc.exists) {
                            const cData = courseDoc.data()
                            const tId = cData?.teacher_id
                            if (tId) {
                                const tDoc = await adminDb.collection('profiles').doc(tId).get()
                                if (tDoc.exists) {
                                    course.teacherName = tDoc.data()?.full_name || tDoc.data()?.displayName
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Erro ao enriquecer certificado:', e)
                    }
                }
                enrichedCourses.push(course)
            }
            plainData.concluded_courses = enrichedCourses
        }

        return { success: true, data: plainData }
    } catch (error) {
        return { success: false, error: 'Erro ao buscar perfil' }
    }
}

export async function processCheckoutAction(
    courseIds: string[],
    billingType: BillingType = 'PIX',
    termsAccepted: boolean = false,
    cardData?: {
        creditCard: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string };
        creditCardHolderInfo: { name: string; email: string; cpfCnpj: string; postalCode: string; addressNumber: string; phone?: string };
    },
    bundleData?: { bundle_id: string; course_ids: string[]; bundle_price: number } | null
): Promise<
    | { success: true; isFree: true; data?: undefined; error?: undefined }
    | { success: true; isFree?: undefined; data: { invoiceUrl: string; paymentId: string; billingType: string; status?: string; pixQrCode?: string; payload?: string }; error?: undefined }
    | { success: false; error: string; isFree?: undefined; data?: undefined }
> {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    if (!termsAccepted) {
        return { success: false, error: 'Você precisa aceitar os Termos de Uso e Política de Privacidade.' }
    }

    try {
        const settingsDoc = await adminDb.collection('config').doc('platform_settings').get()
        const platformTaxPercent = settingsDoc.exists ? settingsDoc.data()?.platform_tax : 20

        // Busca todos os cursos e calcula o total
        const courseDocs = await Promise.all(
            courseIds.map(id => adminDb.collection('courses').doc(id).get())
        )
        const coursesData = courseDocs
            .filter(doc => doc.exists)
            .map(doc => ({ id: doc.id, ...(doc.data() as any) }))

        const totalAmount = coursesData.reduce((sum, c) => sum + (Number(c.price) || 0), 0)
        

        // Para cursos GRATUITOS: commit imediato (não precisa de confirmação externa)
        // Para cursos PAGOS: commit apenas após Asaas criar o pagamento com paymentId válido
        const buildBatch = (paymentId?: string, asaasStatus?: string, invoiceUrl?: string) => {
            const isInstantlyConfirmed = billingType === 'CREDIT_CARD' && (asaasStatus === 'CONFIRMED' || asaasStatus === 'RECEIVED')
            const isFree = totalAmount === 0
            const now = new Date()
            const isConfirmed = isInstantlyConfirmed || isFree
            const batch = adminDb.batch()
            for (const courseData of coursesData) {
                const enrollRef = adminDb.collection('enrollments').doc()
                batch.set(enrollRef, {
                    user_id: user.uid,
                    course_id: courseData.id,
                    created_at: now,
                    ...(paymentId ? { payment_id: paymentId } : {}),
                    ...(isConfirmed ? {
                        payment_confirmed: true,
                        purchasedAt: now,
                        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
                        ...(isInstantlyConfirmed ? { updated_at: now } : {})
                    } : {
                        status: 'pending',
                    }),
                    ...(bundleData ? { bundle_id: bundleData.bundle_id } : {}),
                })

                const { platformAmount: platformShare, teacherAmount: teacherShare } = calculateSplitValues(Number(courseData.price) || 0, platformTaxPercent)

                const saleRef = adminDb.collection('vendas_logs').doc()
                batch.set(saleRef, {
                    idTransacao: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    // paymentId do Asaas — usado pelo webhook para confirmar matrícula em cursos pagos
                    ...(paymentId ? { paymentId } : {}),
                    ...(invoiceUrl ? { invoiceUrl } : {}),
                    alunoId: user.uid,
                    userId: user.uid,
                    cursoId: courseData.id,
                    professorId: courseData.teacher_id,
                    valorBruto: Number(courseData.price) || 0,
                    taxaPlataforma: platformShare,
                    repasseProfessor: teacherShare,
                    statusPagamento: totalAmount === 0 || isInstantlyConfirmed ? 'pago' : 'pendente',
                    billingType: billingType,
                    dataCriacao: new Date(),
                    ...(isInstantlyConfirmed ? { paymentDate: new Date() } : {}),
                    ...(bundleData ? { bundle_id: bundleData.bundle_id, course_ids: bundleData.course_ids, is_bundle_purchase: true } : {}),
                })

                if (isInstantlyConfirmed) {
                    const wishlistRef = adminDb.collection('profiles').doc(user.uid).collection('wishlist').doc(courseData.id)
                    batch.delete(wishlistRef)
                }
            }
            return batch
        }

        if (totalAmount === 0) {
            await buildBatch().commit()

            // Remove cursos gratuitos da lista de desejos
            const batch = adminDb.batch()
            for (const courseData of coursesData) {
                const wishlistRef = adminDb.collection('profiles').doc(user.uid).collection('wishlist').doc(courseData.id)
                batch.delete(wishlistRef)
            }
            await batch.commit()
        }

        // Consent Log (LGPD) - Separate collection for audit
        const ipAddress = await getClientIp()
        await adminDb.collection('consent_logs').add({
            user_id: user.uid,
            accepted_at: new Date().toISOString(),
            ip_address: ipAddress,
            version: 'v1.0',
            form_source: 'checkout_page',
            course_ids: courseIds,
            total_amount: totalAmount,
            billing_type: billingType,
            // LGPD: retenção de 24 meses. Após esta data o
            // /api/admin/cleanup-consent deleta o log de auditoria.
            consent_expires_at: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000)
        })

        revalidatePath('/dashboard-student')

        // Curso gratuito: matrícula já commitada acima
        if (totalAmount === 0) {
            return { success: true, isFree: true }
        }

        // Curso pago: gera cobrança no Asaas
        let customerId = await getStudentAsaasId(user.uid)
        
        if (!customerId) {
            const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
            const profileData = profileDoc.data() as any
            const rawCpf = profileData?.cpf_cnpj || profileData?.cpf
            const sanitizedCpf = rawCpf ? sanitizeCpfCnpj(rawCpf) : undefined

            if (!sanitizedCpf || sanitizedCpf.length < 11) {
                return { 
                    success: false, 
                    error: "Você precisa cadastrar seu CPF/CNPJ em 'Perfil' antes de realizar o pagamento." 
                }
            }

            const rawCep = profileData?.cep
            const sanitizedCep = rawCep ? rawCep.replace(/\D/g, '') : undefined
            const addressNumber = profileData?.numero || profileData?.numero_endereco || undefined

            if (!sanitizedCep || !addressNumber) {
                return { 
                    success: false, 
                    error: "Você precisa cadastrar seu CEP e Número de Endereço em 'Perfil' antes de realizar o pagamento." 
                }
            }

            const newCustomer = await createCustomer({
                name: profileData?.name || profileData?.displayName || profileData?.full_name || 'Aluno',
                email: profileData?.email || user.email || '',
                cpfCnpj: sanitizedCpf,
                phone: profileData?.phone || undefined,
                postalCode: sanitizedCep,
                addressNumber: addressNumber,
                externalReference: user.uid,
            })

            customerId = newCustomer.id

            await adminDb.collection('profiles').doc(user.uid).set({
                asaas_customer_id: customerId
            }, { merge: true })
        }

        // Declarado fora do try para ficar acessível no catch (rollback dos enrollments)
        const enrollRefs: { ref: FirebaseFirestore.DocumentReference; courseData: any }[] = []
        try {
            // 1. Cria enrollment ANTES de chamar o Asaas
            for (const courseData of coursesData) {
                const enrollRef = adminDb.collection('enrollments').doc()
                await enrollRef.set({
                    user_id: user.uid,
                    course_id: courseData.id,
                    status: 'pending',
                    created_at: new Date(),
                    ...(bundleData ? { bundle_id: bundleData.bundle_id } : {}),
                })
                enrollRefs.push({ ref: enrollRef, courseData })
            }

            // 1. Mapeia as wallets dos professores necessários
            const uniqueTeacherIds = [...new Set(coursesData.map((c: any) => c.teacher_id).filter(Boolean))]
            const teacherWalletMap = new Map<string, string>()
            let allWalletsFound = true

            for (const teacherId of uniqueTeacherIds) {
                const teacherWallet = await getTeacherWalletInfo(teacherId)
                if (!teacherWallet) {
                    allWalletsFound = false
                    break
                }
                teacherWalletMap.set(teacherId, teacherWallet.walletId)
            }

            // 2. Define o Payload Base do Asaas
            const paymentPayload: any = {
                customer: customerId,
                billingType,
                value: totalAmount,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: `Compra de ${coursesData.length} curso(s) na plataforma`,
                externalReference: `checkout-${user.uid}-${Date.now()}`,
            }

            // 3. Adiciona o Split no formato estrito exigido pela API do Asaas
            if (allWalletsFound) {
                paymentPayload.split = {
                    container: {
                        splits: coursesData.map((course: any) => {
                            const { teacherAmount } = calculateSplitValues(Number(course.price) || 0, platformTaxPercent)
                            return {
                                walletId: teacherWalletMap.get(course.teacher_id),
                                percent: 100 - platformTaxPercent,
                                amount: teacherAmount,
                            }
                        })
                    }
                }
            }

            if (billingType === 'CREDIT_CARD' && cardData) {
                paymentPayload.creditCard = cardData.creditCard
                paymentPayload.creditCardHolderInfo = cardData.creditCardHolderInfo
            }

            const asaasResponse = await createPayment(paymentPayload)

            // 3. Atualiza enrollment com o paymentId e status se confirmado instantaneamente
            const isInstantlyConfirmed = billingType === 'CREDIT_CARD' && (asaasResponse.status === 'CONFIRMED' || asaasResponse.status === 'RECEIVED')
            
            for (const { ref } of enrollRefs) {
                const updateData: any = {
                    payment_id: asaasResponse.id
                }
                if (isInstantlyConfirmed) {
                    updateData.payment_confirmed = true
                    updateData.status = 'active'
                    updateData.updated_at = new Date()
                }
                await ref.update(updateData)
            }

            // Cria vendas_logs
            for (const { courseData } of enrollRefs) {
                const { platformAmount: platformShare, teacherAmount: teacherShare } = calculateSplitValues(Number(courseData.price) || 0, platformTaxPercent)
                await adminDb.collection('vendas_logs').add({
                    idTransacao: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    paymentId: asaasResponse.id,
                    invoiceUrl: asaasResponse.invoiceUrl || null,
                    alunoId: user.uid,
                    userId: user.uid,
                    cursoId: courseData.id,
                    professorId: courseData.teacher_id,
                    valorBruto: Number(courseData.price) || 0,
                    taxaPlataforma: platformShare,
                    repasseProfessor: teacherShare,
                    statusPagamento: isInstantlyConfirmed ? 'pago' : 'pendente',
                    billingType: billingType,
                    dataCriacao: new Date(),
                    ...(isInstantlyConfirmed ? { paymentDate: new Date() } : {}),
                    ...(bundleData ? { bundle_id: bundleData.bundle_id, course_ids: bundleData.course_ids, is_bundle_purchase: true } : {}),
                })
            }

            // Para PIX: busca QR Code via API (não usa pixTransaction do createPayment)
            if (billingType === 'PIX') {
                try {
                    const pixResponse = await withRetry(
                        () => getPaymentQrCode(asaasResponse.id),
                        { retries: 2, delayMs: 1000 }
                    )
                    const pixQrCode = pixResponse.encodedImage
                    const pixPayload = pixResponse.payload

                    return { 
                        success: true,
                        data: { 
                            invoiceUrl: asaasResponse.invoiceUrl, 
                            paymentId: asaasResponse.id,
                            billingType: asaasResponse.billingType,
                            status: asaasResponse.status,
                            pixQrCode,
                            payload: pixPayload,
                        } 
                    }
                } catch (pixError) {
                    const pixMsg = pixError instanceof Error ? pixError.message : 'Erro ao buscar dados do PIX'
                    console.error("ERRO_AO_BUSCAR_QRCODE_PIX_NO_CHECKOUT:", pixMsg)
                    return { success: false, error: pixMsg }
                }
            }

            const creditCardConfirmed = billingType === 'CREDIT_CARD' && (asaasResponse.status === 'CONFIRMED' || asaasResponse.status === 'RECEIVED')

            const returnData: any = { 
                success: true,
                ...(creditCardConfirmed ? { status: asaasResponse.status } : {}),
                data: { 
                    invoiceUrl: asaasResponse.invoiceUrl, 
                    paymentId: asaasResponse.id,
                    billingType: asaasResponse.billingType,
                    status: asaasResponse.status,
                    ...(creditCardConfirmed ? { paymentConfirmed: true } : {})
                } 
            }

            return returnData
        } catch (asaasError: any) {
            console.error("ERRO_ASAAS_DEPLOY:", asaasError.response?.data || asaasError.message || asaasError)

            // Rollback: o pagamento falhou, então remove os enrollments "pending" criados
            // nesta tentativa para não travar o curso no dashboard como "Aguardando Pagamento".
            await Promise.all(
                enrollRefs.map(({ ref }) =>
                    ref.delete().catch((delErr: any) =>
                        console.error("ERRO_ROLLBACK_ENROLLMENT:", delErr?.message || delErr)
                    )
                )
            )

            const asaasMessage = asaasError.response?.data?.errors?.[0]?.description || asaasError.message || 'Erro ao gerar cobrança'
            throw new Error(`Falha no pagamento: ${asaasMessage}`)
        }
    } catch (error: any) {
        console.error('Erro no checkout:', error)
        return { success: false, error: error.message || 'Falha ao processar pagamento.' }
    }
}

export async function updateProfile(prevState: any, formData: FormData) {
    const user = await getAuthUser()
    if (!user) throw new Error('Não autorizado')

    const fullName = formData.get('fullName') as string
    const photoURL = formData.get('photoURL') as string

    try {
        const updateData: Record<string, any> = {
            full_name: fullName,
            updated_at: new Date()
        }

        // Se photoURL for uma string vazia, pode significar que o usuário removeu a foto
        // ou se for uma URL, atualizamos. Se for null/undefined, não mexemos.
        if (photoURL !== null) {
            updateData.photoURL = photoURL
        }

        // A-03: Proteção contra manipulação de campos sensíveis
        const sensitiveFields = ['role', 'teacher_status', 'cursos_comprados', 'asaas_customer_id']
        sensitiveFields.forEach(field => delete updateData[field])

        await adminDb.collection('profiles').doc(user.uid).update(updateData)

        revalidatePath('/dashboard-student')
        revalidatePath('/dashboard-student/profile')
        return { success: true }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { success: false, error: 'Falha ao atualizar perfil.' }
    }
}

export async function updateSettings(prevState: any, formData: FormData) {
    const user = await getAuthUser()
    if (!user) throw new Error('Não autorizado')

    const pixKey = formData.get('pix_key') as string
    const bankName = formData.get('bank_name') as string
    const logradouro = formData.get('logradouro') as string
    const numero = formData.get('numero') as string
    const bairro = formData.get('bairro') as string
    const cidade = formData.get('cidade') as string
    const estado = formData.get('estado') as string
    const cep = formData.get('cep') as string

    try {
        const updateData: Record<string, any> = {
            updated_at: new Date()
        }

        if (pixKey) updateData.pix_key = pixKey
        if (bankName) updateData.bank_name = bankName
        if (logradouro) updateData.logradouro = logradouro
        if (numero) updateData.numero = numero
        if (bairro) updateData.bairro = bairro
        if (cidade) updateData.cidade = cidade
        if (estado) updateData.estado = estado
        if (cep) updateData.cep = cep

        // A-03: Proteção contra manipulação de campos sensíveis
        const sensitiveFields = ['role', 'teacher_status', 'cursos_comprados', 'asaas_customer_id']
        sensitiveFields.forEach(field => delete updateData[field])

        await adminDb.collection('profiles').doc(user.uid).set(updateData, { merge: true })

        revalidatePath('/dashboard-student')
        revalidatePath('/dashboard-student/settings')
        return { success: true }
    } catch (error) {
        console.error('Erro ao atualizar configurações:', error)
        return { success: false, error: 'Falha ao atualizar configurações.' }
    }
}

export async function updatePassword(formData: FormData) {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    const password = formData.get('password') as string

    try {
        await adminAuth.updateUser(user.uid, {
            password: password
        })
        return { success: true }
    } catch (error) {
        console.error('Erro ao atualizar senha:', error)
        return { success: false, error: 'Falha ao atualizar senha.' }
    }
}

export async function deleteAccount() {
    const user = await getAuthUser()
    if (user) {
        try {
            await adminAuth.deleteUser(user.uid)
            // Também deveria deletar o profile no Firestore se quiser cleanup completo
            await adminDb.collection('profiles').doc(user.uid).delete()
        } catch (error) {
            console.error('Erro ao deletar conta:', error)
        }
    }
    await removeSessionCookie()
    redirect('/')
}

export async function signOut() {
    await removeSessionCookie()
    redirect('/')
}

export async function getStudentTransactions() {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        // Busca por alunoId (legado) e userId (checkout novo) para cobrir todos os sistemas
        const [alunoSnap, userSnap] = await Promise.all([
            adminDb.collection('vendas_logs').where('alunoId', '==', user.uid).get(),
            adminDb.collection('vendas_logs').where('userId', '==', user.uid).get(),
        ])
        const seen = new Set<string>()
        const vendasDocs = [...alunoSnap.docs, ...userSnap.docs].filter(doc => {
            if (seen.has(doc.id)) return false
            seen.add(doc.id)
            return true
        })
        function serializeDoc(data: Record<string, any>): Record<string, any> {
            const plain: Record<string, any> = {}
            for (const [key, value] of Object.entries(data)) {
                if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
                    plain[key] = (value as any).toDate().toISOString()
                } else {
                    plain[key] = value
                }
            }
            return plain
        }

        type Transaction = Record<string, any> & {
            id: string
            cursoTitulo: string
            courseThumbnail: string | null
            dataCriacao: string
        }

        const transactionPromises: Promise<Transaction>[] = vendasDocs.map(async (doc) => {
            const data = doc.data()
            let cursoTitulo = 'Curso'
            let courseThumbnail: string | null = null

            if (data.cursoId) {
                try {
                    const courseDoc = await adminDb.collection('courses').doc(data.cursoId).get()
                    if (courseDoc.exists) {
                        const courseData = courseDoc.data()
                        cursoTitulo = courseData?.title || 'Curso'
                        courseThumbnail = courseData?.thumbnail || null
                    }
                } catch (e) {
                    console.error('Erro ao buscar curso:', e)
                }
            }

            const dataCriacao = data.dataCriacao?.toDate?.().toISOString() || new Date().toISOString()

            return {
                id: doc.id,
                ...serializeDoc(data),
                cursoTitulo,
                courseThumbnail,
                dataCriacao,
            }
        })

        const transactions = await Promise.all(transactionPromises)

        // Sort on server side to avoid missing index errors in Firebase
        transactions.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())

        return { success: true, data: transactions }
    } catch (error) {
        console.error('Erro ao buscar transações:', error)
        return { success: false, error: 'Erro ao buscar histórico de transações' }
    }
}

export async function getAllUserProgress() {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const enrollmentsSnapshot = await adminDb
            .collection('enrollments')
            .where('user_id', '==', user.uid)
            .get()

        const progressMap: Record<string, any> = {}
        enrollmentsSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.course_id) {
                progressMap[data.course_id] = {
                    completedLessons: data.completed_lessons || [],
                    lastLessonId: data.last_lesson_id || null,
                    lastTimestamp: data.last_timestamp || 0
                }
            }
        })

        return { success: true, data: progressMap }
    } catch (error) {
        console.error('Erro ao buscar todo o progresso:', error)
        return { success: false, error: 'Falha ao carregar progresso.' }
    }
}
export async function getLatestCoursePrices(courseIds: string[]) {
    try {
        const courseDocs = await Promise.all(
            courseIds.map(id => adminDb.collection('courses').doc(id).get())
        )
        
        const prices = courseDocs
            .filter(doc => doc.exists)
            .map(doc => ({
                id: doc.id,
                price: Number(doc.data()?.price) || 0
            }))

        return { success: true, data: prices }
    } catch (error) {
        console.error('Erro ao buscar preços atualizados:', error)
        return { success: false, error: 'Falha ao sincronizar preços' }
    }
}

export async function getPaymentStatusAction(paymentId: string) {
    try {
        const payment = await getPayment(paymentId)
        return { success: true, data: payment }
    } catch (error: any) {
        console.error('Erro ao buscar status do pagamento:', error)
        return { success: false, error: error.message }
    }
}

export async function payPendingCreditCardAction(
    paymentId: string,
    cardData: {
        creditCard: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string };
        creditCardHolderInfo: { name: string; email: string; cpfCnpj: string; postalCode: string; addressNumber: string; phone?: string };
    }
) {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const asaasResponse = await payWithCreditCard(paymentId, cardData)

        if (asaasResponse.status === 'CONFIRMED' || asaasResponse.status === 'RECEIVED') {
            const vendasSnapshot = await adminDb.collection('vendas_logs')
                .where('paymentId', '==', paymentId)
                .where('userId', '==', user.uid)
                .get()

            const batch = adminDb.batch()
            vendasSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    statusPagamento: 'pago',
                    paymentDate: new Date(),
                    invoiceUrl: asaasResponse.invoiceUrl || doc.data().invoiceUrl || null,
                })
            })

            const enrollmentsSnapshot = await adminDb.collection('enrollments')
                .where('user_id', '==', user.uid)
                .get()

            vendasSnapshot.forEach(vendaDoc => {
                const vendaData = vendaDoc.data()
                const cursoId = vendaData.cursoId
                if (cursoId) {
                    const matchEnrollment = enrollmentsSnapshot.docs.find(
                        e => e.data().course_id === cursoId
                    )
                    if (matchEnrollment) {
                        const now = new Date()
                        batch.update(matchEnrollment.ref, {
                            payment_confirmed: true,
                            purchasedAt: now,
                            expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
                            payment_id: paymentId,
                            updated_at: now,
                            status: FieldValue.delete(),
                        })

                        // Remove da lista de desejos, se existir
                        const wishlistRef = adminDb.collection('profiles').doc(user.uid).collection('wishlist').doc(cursoId)
                        batch.delete(wishlistRef)
                    }
                }
            })

            await batch.commit()
            revalidatePath('/dashboard-student/payments')
        }

        return {
            success: true,
            data: {
                status: asaasResponse.status,
                invoiceUrl: asaasResponse.invoiceUrl,
            }
        }
    } catch (error: any) {
        console.error('Erro no payPendingCreditCardAction:', error)
        const asaasMessage = error.response?.data?.errors?.[0]?.description || error.message || 'Erro ao processar pagamento do cartão'
        return { success: false, error: asaasMessage }
    }
}

export async function getPixDataAction(paymentId: string) {
    try {
        const pix = await getPaymentQrCode(paymentId)
        return { success: true, data: pix }
    } catch (error: any) {
        console.error('Erro ao buscar dados do PIX:', error)
        return { success: false, error: error.message }
    }
}

export async function getBoletoDataAction(paymentId: string) {
    try {
        const boleto = await getPaymentIdentification(paymentId)
        return { success: true, data: boleto }
    } catch (error: any) {
        console.error('Erro ao buscar dados do Boleto:', error)
        return { success: false, error: error.message }
    }
}

export async function syncPaymentStatusAction(paymentId: string) {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const asaasPayment = await getPayment(paymentId)

        if (!['RECEIVED', 'CONFIRMED'].includes(asaasPayment.status)) {
            return { success: false, error: 'Pagamento ainda não confirmado no Asaas' }
        }

        // 1. Leituras: todas antes de qualquer escrita
        const vendasSnapshot = await adminDb.collection('vendas_logs')
            .where('paymentId', '==', paymentId)
            .where('userId', '==', user.uid)
            .get()

        if (vendasSnapshot.empty) {
            return { success: false, error: 'Transação não encontrada no banco local' }
        }

        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', user.uid)
            .get()

        // 2. Monta o batch com TODAS as operações
        const batch = adminDb.batch()

        // Atualiza vendas_logs
        vendasSnapshot.forEach(doc => {
            batch.update(doc.ref, {
                statusPagamento: 'pago',
                paymentDate: new Date(),
                invoiceUrl: asaasPayment.invoiceUrl || doc.data().invoiceUrl || null,
            })
        })

        // Atualiza enrollments — se algum curso não tiver enrollment, aborta
        const vendaDocs = vendasSnapshot.docs
        for (const vendaDoc of vendaDocs) {
            const vendaData = vendaDoc.data()
            const cursoId = vendaData.cursoId

            if (!cursoId) {
                throw new Error(`Venda ${vendaDoc.id} sem cursoId — operação abortada`)
            }

            const matchEnrollment = enrollmentsSnapshot.docs.find(
                e => e.data().course_id === cursoId
            )

            if (!matchEnrollment) {
                throw new Error(`Enrollment não encontrado para curso ${cursoId} — operação abortada`)
            }

            batch.update(matchEnrollment.ref, {
                payment_confirmed: true,
                purchasedAt: new Date(),
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                payment_id: paymentId,
                updated_at: new Date(),
                status: FieldValue.delete(),
            })
        }

        // 3. Commit único — tudo ou nada
        await batch.commit()
        revalidatePath('/dashboard-student/payments')
        return { success: true }
    } catch (error: any) {
        console.error('Erro no syncPaymentStatusAction:', error)
        return { success: false, error: error.message }
    }
}

export async function getStudentStats() {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const [profileDoc, enrollmentsSnapshot, lessonsSnapshot] = await Promise.all([
            adminDb.collection('profiles').doc(user.uid).get(),
            adminDb.collection('enrollments').where('user_id', '==', user.uid).get(),
            adminDb.collection('lessons').get()
        ])

        const profileData = profileDoc.data() || {}
        const enrollments = enrollmentsSnapshot.docs.map(doc => doc.data())
        const allLessons = lessonsSnapshot.docs.map(doc => doc.data())

        // 1. Cursos Concluídos
        let concludedCount = 0
        enrollments.forEach(enrollment => {
            const courseId = enrollment.course_id
            const courseLessons = allLessons.filter(l => l.course_id === courseId)
            const completedCount = (enrollment.completed_lessons || []).length
            
            if (courseLessons.length > 0 && completedCount === courseLessons.length) {
                concludedCount++
            }
        })

        // 2. Tempo de Estudo
        const totalStudySeconds = profileData.totalStudyTime || 0 // Supondo que esteja em segundos
        const hours = Math.floor(totalStudySeconds / 3600)
        const minutes = Math.floor((totalStudySeconds % 3600) / 60)

        // 3. Streak (Dias Seguidos)
        const loginHistory = profileData.loginHistory || [] // Array de strings ISO ou Timestamps
        let streak = 0
        
        if (loginHistory.length > 0) {
            // Converter para datas únicas (apenas ano-mes-dia) e ordenar descendente
            const uniqueDates = Array.from(new Set(loginHistory.map((lh: any) => {
                const date = typeof lh.toDate === 'function' ? lh.toDate() : new Date(lh)
                return date.toISOString().split('T')[0] as string
            }))).sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime()) as string[]

            const today = new Date().toISOString().split('T')[0]
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

            // Se o último acesso não foi hoje nem ontem, o streak quebrou (0)
            if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
                streak = 1
                for (let i = 0; i < uniqueDates.length - 1; i++) {
                    const current = new Date(uniqueDates[i])
                    const next = new Date(uniqueDates[i+1])
                    const diff = (current.getTime() - next.getTime()) / (1000 * 3600 * 24)
                    
                    if (diff === 1) {
                        streak++
                    } else {
                        break
                    }
                }
            }
        }

        return {
            success: true,
            data: {
                concludedCount,
                totalEnrollments: enrollments.length,
                studyTime: { hours, minutes },
                streak
            }
        }
    } catch (error) {
        console.error('Erro ao buscar estatísticas do aluno:', error)
        return { success: false, error: 'Erro ao processar estatísticas' }
    }
}
