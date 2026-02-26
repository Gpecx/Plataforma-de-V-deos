'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function buyCourse(courseId: string) {
    const supabase = await createClient()

    // 1. Pega o usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    // 2. Insere a matrícula na tabela que criamos
    const { error } = await supabase
        .from('enrollments')
        .insert([
            { user_id: user.id, course_id: courseId }
        ])

    if (error) {
        console.error('Erro na compra:', error.message)
        return { success: false }
    }

    // 3. Atualiza a página para o curso "mudar de lista" na hora
    revalidatePath('/dashboard-student')
    return { success: true }
}

/**
 * Action para processar o checkout de múltiplos cursos de uma vez
 */
export async function processCheckoutAction(courseIds: string[]) {
    const supabase = await createClient()

    // 1. Pega o usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Não autorizado' }

    // 2. Prepara os dados de matrícula
    const enrollments = courseIds.map(id => ({
        user_id: user.id,
        course_id: id
    }))

    // 3. Insere em massa
    const { error } = await supabase
        .from('enrollments')
        .insert(enrollments)

    if (error) {
        console.error('Erro no checkout:', error.message)
        return { success: false, error: 'Falha ao registrar matrículas.' }
    }

    // 4. Limpa o cache
    revalidatePath('/dashboard-student')

    return { success: true }
}

export async function updateProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autorizado')

    const fullName = formData.get('fullName') as string

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (error) {
        console.error('Erro ao atualizar perfil:', error.message)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard-student')
    revalidatePath('/dashboard-student/profile')
    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteAccount() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}