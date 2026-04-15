'use server'
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { deleteMuxAsset } from '@/app/actions/mux'

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

/**
 * Action para criar um novo curso
 */
export async function createCourseAction(formData: any) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseData = {
            teacher_id: user.uid,
            title: formData.title,
            subtitle: formData.subtitle,
            description: formData.description || '',
            category: formData.category || '',
            price: Number(formData.price) || 157.0,
            duration: Number(formData.duration) || 0,
            status: 'PENDENTE',
            image_url: formData.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070",
            intro_video_url: formData.intro_video_url || '',
            intro_video_mux_id: formData.intro_video_mux_id || '',
            intro_video_asset_id: formData.intro_video_asset_id || '',
            intro_video_playback_id: formData.intro_video_playback_id || '',
            curriculum: formData.curriculum || [],
            tags: formData.tags || [],
            created_at: new Date(),
            updated_at: new Date()
        }

        const courseRef = await adminDb.collection('courses').add(courseData)
        const courseId = courseRef.id

        // 2. Insere as aulas vinculadas a este curso
        if (formData.lessons && formData.lessons.length > 0) {
            const batch = adminDb.batch()
            formData.lessons.forEach((lesson: any, index: number) => {
                const lessonRef = adminDb.collection('lessons').doc()
                batch.set(lessonRef, {
                    course_id: courseId,
                    title: lesson.title,
                    video_url: lesson.video_url || '',
                    mux_upload_id: lesson.mux_upload_id || '',
                    mux_playback_id: lesson.mux_playback_id || '',
                    mux_asset_id: lesson.mux_asset_id || '',
                    position: index + 1,
                    description: lesson.description || '',
                    status: 'PENDENTE',
                    created_at: new Date()
                })
            })
            await batch.commit()
        }

        revalidatePath('/dashboard-teacher/courses')
        revalidatePath('/dashboard-teacher')
        revalidatePath('/dashboard-student')
        revalidatePath('/')
        revalidatePath('/course')

        return { success: true, courseId }
    } catch (error) {
        console.error('Erro ao criar curso:', error)
        return { error: 'Falha ao criar curso.' }
    }
}

/**
 * Action para excluir um curso existente
 * Se o curso estiver APROVADO, solicita exclusão ao admin ao invés de excluir imediatamente
 */
export async function deleteCourseAction(courseId: string) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()

        if (!courseDoc.exists || courseDoc.data()?.teacher_id !== user.uid) {
            return { error: 'Não autorizado ou curso não encontrado.' }
        }

        const currentStatus = courseDoc.data()?.status

        if (currentStatus === 'APROVADO') {
            await courseRef.update({
                status: 'SOLICITADO_EXCLUSAO',
                updated_at: new Date()
            })
            revalidatePath('/dashboard-teacher/courses')
            return { success: true, requested: true }
        }

        const courseData = courseDoc.data()
        const lessonsSnapshot = await adminDb.collection('lessons').where('course_id', '==', courseId).get()

        // Deleta o asset do vídeo de introdução primeiro
        if (courseData?.intro_video_asset_id) {
            const muxResult = await deleteMuxAsset(courseData.intro_video_asset_id)
            if (muxResult.error) {
                console.error(`[deleteCourseAction] Erro ao deletar intro_video_asset:`, muxResult.error)
            }
        }

        // Deleta os assets de cada aula
        for (const lessonDoc of lessonsSnapshot.docs) {
            const lessonData = lessonDoc.data()
            if (lessonData?.mux_asset_id) {
                const muxResult = await deleteMuxAsset(lessonData.mux_asset_id)
                if (muxResult.error) {
                    console.error(`[deleteCourseAction] Erro ao deletar lesson asset ${lessonData.mux_asset_id}:`, muxResult.error)
                }
            }
        }

        // Agora deleta os registros no Firestore
        const batch = adminDb.batch()
        lessonsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
        batch.delete(courseRef)
        await batch.commit()

        revalidatePath('/dashboard-teacher/courses')
        return { success: true }
    } catch (error) {
        console.error('Erro ao excluir curso:', error)
        return { error: 'Falha ao excluir curso.' }
    }
}

/**
 * Action para atualizar um curso e suas aulas
 */
export async function updateCourseAction(courseId: string, formData: any) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()

        if (!courseDoc.exists || courseDoc.data()?.teacher_id !== user.uid) {
            return { error: "Curso não encontrado ou você não tem permissão para editá-lo." }
        }

        const updateData: any = { updated_at: new Date() }
        if (formData.title !== undefined) updateData.title = formData.title
        if (formData.price !== undefined && !isNaN(formData.price)) updateData.price = Number(formData.price)
        if (formData.status !== undefined) updateData.status = formData.status
        if (formData.subtitle !== undefined) updateData.subtitle = formData.subtitle
        if (formData.description !== undefined) updateData.description = formData.description
        if (formData.category !== undefined) updateData.category = formData.category
        if (formData.duration !== undefined) updateData.duration = Number(formData.duration)
        if (formData.image_url !== undefined) updateData.image_url = formData.image_url
        if (formData.intro_video_url !== undefined) updateData.intro_video_url = formData.intro_video_url
        if (formData.intro_video_mux_id !== undefined) updateData.intro_video_mux_id = formData.intro_video_mux_id
        if (formData.intro_video_asset_id !== undefined) updateData.intro_video_asset_id = formData.intro_video_asset_id
        if (formData.intro_video_playback_id !== undefined) updateData.intro_video_playback_id = formData.intro_video_playback_id
        if (formData.curriculum !== undefined) updateData.curriculum = formData.curriculum
        if (formData.tags !== undefined) updateData.tags = formData.tags

        await courseRef.update(updateData)

        // 3. Gerencia as aulas
        const lessons = formData.lessons || []
        const lessonsRef = adminDb.collection('lessons')
        const existingLessonsSnapshot = await lessonsRef.where('course_id', '==', courseId).get()
        const existingLessonsMap = new Map()
        existingLessonsSnapshot.docs.forEach(doc => {
            existingLessonsMap.set(doc.id, doc.data())
        })
        const existingIds = Array.from(existingLessonsMap.keys())

        const incomingIds = lessons.map((l: any) => l.id).filter((id: string) => id && !id.startsWith('new-'))
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))

        const batch = adminDb.batch()

        // Deleta as que não vieram (se APROVADO, solicita exclusão ao invés de deletar)
        for (const id of idsToDelete) {
            const lessonData = existingLessonsMap.get(id)
            if (lessonData?.status === 'APROVADO') {
                batch.update(lessonsRef.doc(id), { status: 'SOLICITADO_EXCLUSAO', updated_at: new Date() })
            } else {
                // Deleta o asset no Mux antes de remover do Firestore
                if (lessonData?.mux_asset_id) {
                    const muxResult = await deleteMuxAsset(lessonData.mux_asset_id)
                    if (muxResult.error) {
                        console.error(`[updateCourseAction] Erro ao deletar Mux asset ${lessonData.mux_asset_id}:`, muxResult.error)
                    }
                }
                batch.delete(lessonsRef.doc(id))
            }
        }

        // Upsert
        lessons.forEach((lesson: any, index: number) => {
            const isNew = !lesson.id || lesson.id.startsWith('new-')
            const lessonRef = isNew ? lessonsRef.doc() : lessonsRef.doc(lesson.id)

            const payload: any = {
                course_id: courseId,
                title: lesson.title,
                video_url: lesson.video_url || '',
                mux_upload_id: lesson.mux_upload_id || '',
                mux_playback_id: lesson.mux_playback_id || '',
                mux_asset_id: lesson.mux_asset_id || '',
                position: index + 1,
                description: lesson.description || '',
                updated_at: new Date()
            }

            if (lesson.type) {
                payload.type = lesson.type
            }
            if (lesson.quizData) {
                payload.quizData = lesson.quizData
            }

            // Se o status for explicitamento enviado (ex: resubmit), usa ele
            if (lesson.status && !isNew) {
                payload.status = lesson.status
            } else if (isNew) {
                payload.created_at = new Date()
                payload.status = 'PENDENTE'
            } else {
                // Se já existia, verifica se mudou algo vital para resetar o status
                const existing = existingLessonsMap.get(lesson.id)
                if (existing) {
                    const hasChanged = existing.title !== lesson.title || 
                                      existing.video_url !== lesson.video_url || 
                                      existing.description !== lesson.description ||
                                      JSON.stringify(existing.quizData) !== JSON.stringify(lesson.quizData)
                    if (hasChanged) {
                        payload.status = 'PENDENTE'
                    }
                }
            }

            batch.set(lessonRef, payload, { merge: true })
        })

        await batch.commit()

        revalidatePath(`/dashboard-teacher/courses/${courseId}/edit`)
        revalidatePath(`/classroom/${courseId}`)
        revalidatePath('/dashboard-teacher/courses')
        revalidatePath('/admin/approvals')

        return { success: true }
    } catch (error) {
        console.error('Erro ao atualizar curso:', error)
        return { error: 'Falha ao atualizar curso.' }
    }
}

/**
 * Action para remover vídeo fisicamente do Storage e limpar referência no Firestore
 * Opcionalmente pode receber mux_asset_id para deletar também no Mux
 */
export async function deleteVideoAction(id: string, collectionName: 'courses' | 'lessons', videoUrl: string, muxAssetId?: string) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        // Deleta asset no Mux se fornecido
        if (muxAssetId) {
            const muxResult = await deleteMuxAsset(muxAssetId)
            if (muxResult.error) {
                console.error(`[deleteVideoAction] Erro ao deletar Mux asset:`, muxResult.error)
            }
        }

        // Se há URL de vídeo legado, deleta do Storage
        if (videoUrl) {
            // 1. Extrai o path do arquivo no Storage a partir da URL
            // Ex: .../o/courses%2Fabc%2Fvideo.mp4?alt=media... -> courses/abc/video.mp4
            const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
            const decodedUrl = decodeURIComponent(videoUrl);

            // Tenta encontrar a parte entre /o/ e o primeiro ?
            const parts = decodedUrl.split('/o/');
            if (parts.length >= 2) {
                const filePath = parts[1].split('?')[0];

                // 2. Deleta do Storage via Admin SDK
                const bucket = adminStorage.bucket();
                const file = bucket.file(filePath);

                const [exists] = await file.exists();
                if (exists) {
                    await file.delete();
                    console.log(`Arquivo removido do Storage: ${filePath}`);
                }
            }
        }

        // 3. Limpa as referências no Firestore
        const updateData: any = {
            video_url: "",
            updated_at: new Date()
        }
        
        if (collectionName === 'courses') {
            updateData.intro_video_mux_id = ''
            updateData.intro_video_asset_id = ''
            updateData.intro_video_playback_id = ''
        } else {
            updateData.mux_upload_id = ''
            updateData.mux_asset_id = ''
            updateData.mux_playback_id = ''
        }
        
        await adminDb.collection(collectionName).doc(id).update(updateData)

        revalidatePath('/dashboard-teacher/courses');

        return { success: true };
    } catch (error) {
        console.error('Erro ao remover vídeo:', error);
        return { error: 'Falha ao processar remoção física do vídeo.' };
    }
}

/**
 * Action para cancelar solicitação de exclusão de curso
 */
export async function cancelCourseDeletionRequest(courseId: string) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()

        if (!courseDoc.exists || courseDoc.data()?.teacher_id !== user.uid) {
            return { error: 'Não autorizado ou curso não encontrado.' }
        }

        if (courseDoc.data()?.status !== 'SOLICITADO_EXCLUSAO') {
            return { error: 'Este curso não tem uma solicitação de exclusão pendente.' }
        }

        await courseRef.update({
            status: 'APROVADO',
            updated_at: new Date()
        })

        revalidatePath('/dashboard-teacher/courses')
        return { success: true }
    } catch (error) {
        console.error('Erro ao cancelar solicitação:', error)
        return { error: 'Falha ao cancelar solicitação.' }
    }
}

/**
 * Action para cancelar solicitação de exclusão de aula
 */
export async function cancelLessonDeletionRequest(lessonId: string, courseId: string) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()

        if (!courseDoc.exists || courseDoc.data()?.teacher_id !== user.uid) {
            return { error: 'Não autorizado ou curso não encontrado.' }
        }

        const lessonRef = adminDb.collection('lessons').doc(lessonId)
        const lessonDoc = await lessonRef.get()

        if (!lessonDoc.exists || lessonDoc.data()?.status !== 'SOLICITADO_EXCLUSAO') {
            return { error: 'Esta aula não tem uma solicitação de exclusão pendente.' }
        }

        await lessonRef.update({
            status: 'APROVADO',
            updated_at: new Date()
        })

        revalidatePath(`/dashboard-teacher/courses/${courseId}/edit`)
        return { success: true }
    } catch (error) {
        console.error('Erro ao cancelar solicitação:', error)
        return { error: 'Falha ao cancelar solicitação.' }
    }
}
