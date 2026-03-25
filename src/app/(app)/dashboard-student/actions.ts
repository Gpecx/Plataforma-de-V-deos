'use server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createPayment, BillingType, getStudentAsaasId, createCustomer } from '@/services/asaasService'
import { sanitizeCpfCnpj } from '@/lib/utils'

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
        const plainData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => {
                if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
                    return [key, (value as any).toDate().toISOString()]
                }
                return [key, value]
            })
        )

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

export async function processCheckoutAction(courseIds: string[], billingType: BillingType = 'PIX'): Promise<
    | { success: true; isFree: true; data?: undefined; error?: undefined }
    | { success: true; isFree?: undefined; data: { invoiceUrl: string; paymentId: string; billingType: string }; error?: undefined }
    | { success: false; error: string; isFree?: undefined; data?: undefined }
> {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

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

        const totalAmount = coursesData.reduce((sum, c) => sum + (c.price || 0), 0)

        // Grava matrículas e logs de venda em lote
        const batch = adminDb.batch()
        for (const courseData of coursesData) {
            const enrollRef = adminDb.collection('enrollments').doc()
            batch.set(enrollRef, {
                user_id: user.uid,
                course_id: courseData.id,
                created_at: new Date()
            })

            const platformShare = (courseData.price || 0) * (platformTaxPercent / 100)
            const teacherShare = (courseData.price || 0) - platformShare

            const saleRef = adminDb.collection('vendas_logs').doc()
            batch.set(saleRef, {
                idTransacao: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                alunoId: user.uid,
                cursoId: courseData.id,
                professorId: courseData.teacher_id,
                valorBruto: courseData.price || 0,
                taxaPlataforma: platformShare,
                repasseProfessor: teacherShare,
                statusPagamento: totalAmount === 0 ? 'pago' : 'pendente',
                dataCriacao: new Date()
            })
        }
        await batch.commit()

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

            const newCustomer = await createCustomer({
                name: profileData?.name || profileData?.displayName || profileData?.full_name || 'Aluno',
                email: profileData?.email || user.email || '',
                cpfCnpj: sanitizedCpf,
                phone: profileData?.phone || undefined,
                externalReference: user.uid,
            })

            customerId = newCustomer.id

            await adminDb.collection('profiles').doc(user.uid).set({
                asaas_customer_id: customerId
            }, { merge: true })
        }

        const asaasResponse = await createPayment({
            customer: customerId,
            billingType,
            value: totalAmount,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Compra de ${coursesData.length} curso(s) na plataforma`,
            externalReference: `checkout-${user.uid}-${Date.now()}`,
        })

        return { 
            success: true, 
            data: { 
                invoiceUrl: asaasResponse.invoiceUrl, 
                paymentId: asaasResponse.id,
                billingType: asaasResponse.billingType
            } 
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
        const cpf = formData.get('cpf') as string

    try {
        await adminDb.collection('profiles').doc(user.uid).update({
            full_name: fullName,
            cpf_cnpj: cpf,
            updated_at: new Date()
        })

        revalidatePath('/dashboard-student')
        revalidatePath('/dashboard-student/profile')
        return { success: true }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { success: false, error: 'Falha ao atualizar perfil.' }
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
