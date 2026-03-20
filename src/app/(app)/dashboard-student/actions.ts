'use server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAuthUser() {
    const cookieStore = cookies()
    const token = (await cookieStore).get('firebase-token')?.value
    if (!token) return null

    try {
        return await adminAuth.verifyIdToken(token)
    } catch (error) {
        return null
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

export async function processCheckoutAction(courseIds: string[]): Promise<
    | { success: true; isFree: true; invoiceUrl?: undefined; error?: undefined }
    | { success: true; isFree?: undefined; invoiceUrl: string; error?: undefined }
    | { success: false; error: string; isFree?: undefined; invoiceUrl?: undefined }
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

        // Curso pago: gera cobrança no Asaas e retorna o invoiceUrl
        const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
        const profileData = profileDoc.data() as any

        const asaasPayload = {
            customer: profileData?.asaas_customer_id || user.uid,
            billingType: 'UNDEFINED', // O Asaas exibirá a seleção de método na página deles
            value: totalAmount,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Compra de ${coursesData.length} curso(s) na plataforma`,
            externalReference: `checkout-${user.uid}-${Date.now()}`,
        }

        const asaasResponse = await fetch(`${process.env.ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY || '',
            },
            body: JSON.stringify(asaasPayload),
        })

        if (!asaasResponse.ok) {
            const errorBody = await asaasResponse.text()
            console.error('Erro Asaas:', errorBody)
            return { success: false, error: 'Falha ao gerar cobrança no Asaas.' }
        }

        const asaasData = await asaasResponse.json()
        const invoiceUrl: string = asaasData.invoiceUrl

        return { success: true, invoiceUrl }
    } catch (error) {
        console.error('Erro no checkout:', error)
        return { success: false, error: 'Falha ao processar pagamento.' }
    }
}

export async function updateProfile(prevState: any, formData: FormData) {
    const user = await getAuthUser()
    if (!user) throw new Error('Não autorizado')

    const fullName = formData.get('fullName') as string

    try {
        await adminDb.collection('profiles').doc(user.uid).update({
            full_name: fullName,
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
        ; (await cookieStore).delete('firebase-token')
    redirect('/')
}

export async function signOut() {
    const cookieStore = cookies()
        ; (await cookieStore).delete('firebase-token')
    redirect('/')
}
