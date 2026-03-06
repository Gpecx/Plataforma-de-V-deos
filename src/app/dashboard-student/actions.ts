import { auth, db } from '@/lib/firebase'
import { signOut as firebaseSignOut, updatePassword as firebaseUpdatePassword } from 'firebase/auth'
import { collection, addDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'
import { useCartStore } from '@/store/useCartStore'

export async function buyCourse(courseId: string, userId: string) {
    const user = auth.currentUser

    console.log(`[buyCourse] Iniciando compra. Auth UID: ${user?.uid}, Form UID: ${userId}`)

    if (!user || user.uid !== userId) {
        throw new Error('Inconsistência de sessão: Usuário não autorizado ou IDs não coincidem.')
    }

    try {
        const courseSnap = await getDoc(doc(db, 'courses', courseId))
        const courseData = courseSnap.data()

        await addDoc(collection(db, 'enrollments'), {
            user_id: user.uid,
            course_id: courseId,
            created_at: new Date().toISOString()
        })

        if (courseData) {
            await addDoc(collection(db, 'sales'), {
                teacherId: courseData.teacher_id,
                courseId: courseId,
                courseName: courseData.title,
                studentId: user.uid,
                amount: courseData.price || 0,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            })
        }

        return { success: true }
    } catch (error: any) {
        console.error('Erro na compra:', error.message)
        return { success: false }
    }
}

/**
 * Action para processar o checkout de múltiplos cursos de uma vez
 */
export async function processCheckoutAction(courseIds: string[], userId: string) {
    const user = auth.currentUser

    console.log(`[processCheckoutAction] Iniciando checkout. Auth UID: ${user?.uid}, Form UID: ${userId}`)

    if (!user || user.uid !== userId) {
        return { success: false, error: 'Inconsistência de sessão: Por favor, faça login novamente.' }
    }

    try {
        for (const id of courseIds) {
            const courseSnap = await getDoc(doc(db, 'courses', id))
            const courseData = courseSnap.data()

            await addDoc(collection(db, 'enrollments'), {
                user_id: user.uid,
                course_id: id,
                created_at: new Date().toISOString()
            })

            if (courseData) {
                await addDoc(collection(db, 'sales'), {
                    teacherId: courseData.teacher_id,
                    courseId: id,
                    courseName: courseData.title,
                    studentId: user.uid,
                    amount: courseData.price || 0,
                    status: 'confirmed',
                    createdAt: new Date().toISOString()
                })
            }
        }
        return { success: true }
    } catch (error: any) {
        console.error('Erro no checkout:', error.message)
        return { success: false, error: 'Falha ao registrar matrículas.' }
    }
}

export async function updateProfile(
    prevState: { success: boolean; error?: any },
    formData: FormData
) {
    const user = auth.currentUser
    if (!user) return { success: false, error: 'Não autorizado' }

    const fullName = formData.get('fullName') as string
    const avatarUrl = formData.get('avatarUrl') as string

    try {
        await updateDoc(doc(db, 'profiles', user.uid), {
            full_name: fullName,
            avatar_url: avatarUrl
        })
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error.message)
        return { success: false, error: error.message }
    }
}

export async function updatePassword(formData: FormData) {
    const user = auth.currentUser
    if (!user) throw new Error('Não autorizado')

    const password = formData.get('password') as string

    try {
        await firebaseUpdatePassword(user, password)
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar senha:', error.message)
        return { success: false, error: error.message }
    }
}

export async function signOut() {
    try {
        await firebaseSignOut(auth)
        useCartStore.getState().clearCart() // Limpa o carrinho ao sair
        window.location.href = '/'
    } catch (error) {
        console.error('Erro ao sair:', error)
    }
}

export async function deleteAccount() {
    const user = auth.currentUser
    if (!user) throw new Error('Não autorizado')

    try {
        // Delete the user's profile from Firestore
        const { deleteDoc } = await import('firebase/firestore')
        await deleteDoc(doc(db, 'profiles', user.uid))
        // Delete the Firebase Auth account
        await user.delete()
        window.location.href = '/'
    } catch (error: any) {
        console.error('Erro ao excluir conta:', error.message)
        throw error
    }
}