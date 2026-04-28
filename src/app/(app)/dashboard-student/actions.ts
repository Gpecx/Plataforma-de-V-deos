'use server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createPayment, BillingType, getStudentAsaasId, createCustomer, getPaymentQrCode, getPayment, getPaymentIdentification } from '@/services/asaasService'
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

export async function buyCourse(courseId: string) {
    const user = await getAuthUser()
    if (!user) throw new Error('Não autorizado')

    try {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) return { success: false, error: 'Curso não encontrado' }

        const courseData = courseDoc.data() as any
        const settingsDoc = await adminDb.collection('config').doc('platform_settings').get()
        const platformTaxPercent = settingsDoc.exists ? settingsDoc.data()?.platform_tax : 20

        const platformShare = (courseData.price || 0) * (platformTaxPercent / 100)
        const teacherShare = (courseData.price || 0) - platformShare

        await adminDb.collection('enrollments').add({
            user_id: user.uid,
            course_id: courseId,
            created_at: new Date()
        })

        // Log da Venda
        await adminDb.collection('vendas_logs').add({
            idTransacao: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            alunoId: user.uid,
            cursoId: courseId,
            professorId: courseData.teacher_id,
            valorBruto: courseData.price || 0,
            taxaPlataforma: platformShare,
            repasseProfessor: teacherShare,
            statusPagamento: 'pago',
            dataCriacao: new Date()
        })

        revalidatePath('/dashboard-student')
        return { success: true }
    } catch (error) {
        console.error('Erro na compra:', error)
        return { success: false }
    }
}

export async function processCheckoutAction(courseIds: string[], billingType: BillingType = 'PIX', termsAccepted: boolean = false): Promise<
    | { success: true; isFree: true; data?: undefined; error?: undefined }
    | { success: true; isFree?: undefined; data: { invoiceUrl: string; paymentId: string; billingType: string; pixData?: any }; error?: undefined }
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
        
        console.log("DEBUG_PAYMENT_VALUE:", { totalAmount, courseIds, userId: user.uid })


        // Grava matrículas e logs de venda em lote
        const batch = adminDb.batch()
        for (const courseData of coursesData) {
            const enrollRef = adminDb.collection('enrollments').doc()
            batch.set(enrollRef, {
                user_id: user.uid,
                course_id: courseData.id,
                created_at: new Date()
            })

            const platformShare = (Number(courseData.price) || 0) * (platformTaxPercent / 100)
            const teacherShare = (Number(courseData.price) || 0) - platformShare

            const saleRef = adminDb.collection('vendas_logs').doc()
            batch.set(saleRef, {
                idTransacao: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                alunoId: user.uid,
                cursoId: courseData.id,
                professorId: courseData.teacher_id,
                valorBruto: Number(courseData.price) || 0,
                taxaPlataforma: platformShare,
                repasseProfessor: teacherShare,
                statusPagamento: totalAmount === 0 ? 'pago' : 'pendente',
                dataCriacao: new Date()
            })
        }
        await batch.commit()

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
            billing_type: billingType
        })

        revalidatePath('/dashboard-student')

        // Curso gratuito: não precisa de cobrança externa
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

        try {
            const asaasResponse = await createPayment({
                customer: customerId,
                billingType,
                value: totalAmount,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: `Compra de ${coursesData.length} curso(s) na plataforma`,
                externalReference: `checkout-${user.uid}-${Date.now()}`,
            })

            let pixData = null
            if (billingType === 'PIX') {
                try {
                    pixData = await getPaymentQrCode(asaasResponse.id)
                } catch (pixError) {
                    console.error("ERRO_AO_BUSCAR_QRCODE_PIX_NO_CHECKOUT:", pixError)
                }
            }

            return { 
                success: true, 
                data: { 
                    invoiceUrl: asaasResponse.invoiceUrl, 
                    paymentId: asaasResponse.id,
                    billingType: asaasResponse.billingType,
                    pixData
                } 
            }
        } catch (asaasError: any) {
            console.error("ERRO_ASAAS_DEPLOY:", asaasError.response?.data || asaasError.message || asaasError)
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

    const cpfCnpj = formData.get('cpf_cnpj') as string
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

        if (cpfCnpj) updateData.cpf_cnpj = cpfCnpj
        if (pixKey) updateData.pix_key = pixKey
        if (bankName) updateData.bank_name = bankName
        if (logradouro) updateData.logradouro = logradouro
        if (numero) updateData.numero = numero
        if (bairro) updateData.bairro = bairro
        if (cidade) updateData.cidade = cidade
        if (estado) updateData.estado = estado
        if (cep) updateData.cep = cep

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
    const cookieStore = cookies()
        ; (await cookieStore).delete('session')
        ; (await cookieStore).delete('active_session_id')
    redirect('/')
}

export async function signOut() {
    const cookieStore = cookies()
        ; (await cookieStore).delete('session')
        ; (await cookieStore).delete('active_session_id')
    redirect('/')
}

export async function getStudentTransactions() {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const vendasSnapshot = await adminDb
            .collection('vendas_logs')
            .where('alunoId', '==', user.uid)
            .get()

        let transactions = vendasSnapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                dataCriacao: data.dataCriacao?.toDate?.().toISOString() || new Date().toISOString()
            }
        })

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
        const progressSnapshot = await adminDb
            .collection('userProgress')
            .where('userId', '==', user.uid)
            .get()

        const progressMap: Record<string, any> = {}
        progressSnapshot.forEach(doc => {
            const data = doc.data()
            if (data.courseId) {
                progressMap[data.courseId] = {
                    completedLessons: data.completedLessons || [],
                    lastLessonId: data.lastLessonId || null,
                    lastTimestamp: data.lastTimestamp || 0
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
