import { auth, db } from '@/lib/firebase'
import { signOut as firebaseSignOut, updatePassword as firebaseUpdatePassword } from 'firebase/auth'
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore'

export async function buyCourse(courseId: string) {
    const user = auth.currentUser
    if (!user) throw new Error('Não autorizado')

    try {
        await addDoc(collection(db, 'enrollments'), {
            user_id: user.uid,
            course_id: courseId,
            created_at: new Date().toISOString()
        })
        return { success: true }
    } catch (error: any) {
        console.error('Erro na compra:', error.message)
        return { success: false }
    }
}

/**
 * Action para processar o checkout de múltiplos cursos de uma vez
 */
export async function processCheckoutAction(courseIds: string[]) {
    const user = auth.currentUser
    if (!user) return { success: false, error: 'Não autorizado' }

    try {
        const promises = courseIds.map(id =>
            addDoc(collection(db, 'enrollments'), {
                user_id: user.uid,
                course_id: id,
                created_at: new Date().toISOString()
            })
        )
        await Promise.all(promises)
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

    try {
        await updateDoc(doc(db, 'profiles', user.uid), {
            full_name: fullName
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