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

export async function processCheckoutAction(courseIds: string[]) {
    const user = await getAuthUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const settingsDoc = await adminDb.collection('config').doc('platform_settings').get()
        const platformTaxPercent = settingsDoc.exists ? settingsDoc.data()?.platform_tax : 20

        const batch = adminDb.batch()
        
        for (const id of courseIds) {
            const courseDoc = await adminDb.collection('courses').doc(id).get()
            if (!courseDoc.exists) continue
            
            const courseData = courseDoc.data() as any
            const enrollRef = adminDb.collection('enrollments').doc()
            batch.set(enrollRef, {
                user_id: user.uid,
                course_id: id,
                created_at: new Date()
            })

            const platformShare = (courseData.price || 0) * (platformTaxPercent / 100)
            const teacherShare = (courseData.price || 0) - platformShare

            const saleRef = adminDb.collection('vendas_logs').doc()
            batch.set(saleRef, {
                idTransacao: `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                alunoId: user.uid,
                cursoId: id,
                professorId: courseData.teacher_id,
                valorBruto: courseData.price || 0,
                taxaPlataforma: platformShare,
                repasseProfessor: teacherShare,
                statusPagamento: 'pago',
                dataCriacao: new Date()
            })
        }

        await batch.commit()

        revalidatePath('/dashboard-student')
        return { success: true }
    } catch (error) {
        console.error('Erro no checkout:', error)
        return { success: false, error: 'Falha ao registrar matrículas.' }
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
