"use server"

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Action para criar um novo curso
 */
export async function createCourseAction(formData: any) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    // 1. Insere o curso e pega o ID gerado
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert([
            {
                teacher_id: user.id,
                title: formData.title,
                subtitle: formData.subtitle,
                description: formData.description,
                category: formData.category,
                price: formData.price || 157.0,
                duration: formData.duration || 0,
                status: 'published',
                image_url: formData.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"
            }
        ])
        .select()
        .single()

    if (courseError) return { error: courseError.message }

    // 2. Insere as aulas vinculadas a este curso
    if (formData.lessons && formData.lessons.length > 0) {
        const lessonsToInsert = formData.lessons.map((lesson: any, index: number) => ({
            course_id: course.id,
            title: lesson.title,
            video_url: lesson.video_url,
            position: index + 1
        }))

        const { error: lessonsError } = await supabase
            .from('lessons')
            .insert(lessonsToInsert)

        if (lessonsError) {
            console.error('Erro ao salvar aulas:', lessonsError)
        }
    }

    // Limpa o cache das páginas para mostrar o novo curso imediatamente
    revalidatePath('/dashboard-teacher/courses')
    revalidatePath('/course')

    return { success: true, courseId: course.id }
}

/**
 * Action para excluir um curso existente
 */
export async function deleteCourseAction(courseId: string) {
    const supabase = await createClient()

    // 1. Verifica se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    // 2. Tenta excluir o curso
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('teacher_id', user.id)

    if (error) return { error: error.message }

    // 3. Atualiza a lista de cursos na interface
    revalidatePath('/dashboard-teacher/courses')

    return { success: true }
}

/**
 * Action para atualizar um curso e suas aulas
 */
export async function updateCourseAction(courseId: string, formData: any) {
    const supabase = await createClient()

    // 1. Verifica autorização
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    // 2. Atualiza os dados básicos do curso
    const updateData: any = {}
    if (formData.title !== undefined) updateData.title = formData.title
    if (formData.price !== undefined && !isNaN(formData.price)) updateData.price = formData.price
    if (formData.status !== undefined) updateData.status = formData.status
    if (formData.duration !== undefined) updateData.duration = formData.duration
    if (formData.image_url !== undefined) updateData.image_url = formData.image_url

    console.log('Atualizando curso:', courseId, updateData)

    const { data: updatedData, error: courseError } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .eq('teacher_id', user.id)
        .select()

    if (courseError) {
        console.error('Erro ao atualizar curso:', courseError)
        return { error: courseError.message }
    }

    if (!updatedData || updatedData.length === 0) {
        return { error: "Curso não encontrado ou você não tem permissão para editá-lo." }
    }

    // 3. Gerencia as aulas
    const lessons = formData.lessons || []

    // Pega as IDs atuais no banco para saber o que deletar
    const { data: existingLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)

    const existingIds = existingLessons?.map(l => l.id) || []
    const incomingIds = lessons.map((l: any) => l.id).filter((id: string) => !id.startsWith('new-'))

    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))

    // Deleção
    if (idsToDelete.length > 0) {
        await supabase.from('lessons').delete().in('id', idsToDelete)
    }

    // Upsert (Insert ou Update)
    const lessonsToUpsert = lessons.map((lesson: any, index: number) => {
        const payload: any = {
            course_id: courseId,
            title: lesson.title,
            video_url: lesson.video_url,
            position: index + 1
        }
        if (!lesson.id.startsWith('new-')) {
            payload.id = lesson.id
        }
        return payload
    })

    const { error: lessonsError } = await supabase
        .from('lessons')
        .upsert(lessonsToUpsert)

    if (lessonsError) {
        console.error('Erro ao atualizar aulas:', lessonsError)
    }

    revalidatePath(`/dashboard-teacher/courses/${courseId}/edit`)
    revalidatePath(`/classroom/${courseId}`)
    revalidatePath('/dashboard-teacher/courses')

    return { success: true }
}