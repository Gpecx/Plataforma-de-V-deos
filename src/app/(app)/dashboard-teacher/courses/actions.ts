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
        const decoded = await adminAuth.verifySessionCookie(token, true)
        // Validação de role: busca o perfil e verifica se é teacher ou admin
        const profileDoc = await adminDb.collection('profiles').doc(decoded.uid).get()
        if (!profileDoc.exists) return null
        const role = profileDoc.data()?.role
        if (role !== 'teacher' && role !== 'admin') return null
        return decoded
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
        // Constrói metadados dos módulos
        const modules =
            formData.modules && formData.modules.length > 0
                ? formData.modules.map((m: any, i: number) => ({
                      id: m.id || `mod-${Date.now()}-${i}`,
                      title: m.title || `MÓDULO ${i + 1}`,
                      position: i,
                  }))
                : formData.lessons && formData.lessons.length > 0
                  ? [
                        {
                            id: `mod-${Date.now()}`,
                            title: 'ESTRUTURA DO CURSO',
                            position: 0,
                        },
                    ]
                  : []

        const courseData = {
            teacher_id: user.uid,
            title: formData.title,
            subtitle: formData.subtitle,
            description: formData.description || '',
            category: formData.category || '',
            price: formData.pricing_type === 'free' ? 0 : (Number(formData.price) || 157.0),
            pricing_type: formData.pricing_type || 'standard',
            duration: Number(formData.duration) || 0,
            status: 'PENDENTE',
            image_url: formData.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070",
            intro_video_url: formData.intro_video_url || '',
            intro_video_mux_id: formData.intro_video_mux_id || '',
            intro_video_asset_id: formData.intro_video_asset_id || '',
            intro_video_playback_id: formData.intro_video_playback_id || '',
            curriculum: formData.curriculum || [],
            tags: formData.tags || [],
            modules,
            created_at: new Date(),
            updated_at: new Date()
        }

        const courseRef = await adminDb.collection('courses').add(courseData)
        const courseId = courseRef.id

        // 2. Insere as aulas vinculadas a este curso
        if (formData.lessons && formData.lessons.length > 0 && modules.length > 0) {
            const batch = adminDb.batch()

            // Se não veio estrutura de módulos explícita, usa módulo único
            const moduleLessonMap =
                formData.modules && formData.modules.length > 0
                    ? formData.modules
                    : [{ ...modules[0], lessons: formData.lessons }]

            moduleLessonMap.forEach((module: any) => {
                const moduleId = modules.find((m: any) => m.position === module.position)?.id || module.id
                ;(module.lessons || []).forEach((lesson: any, index: number) => {
                    const lessonRef = adminDb.collection('lessons').doc()
                    const lessonPayload: any = {
                        course_id: courseId,
                        module_id: moduleId,
                        title: lesson.title,
                        video_url: lesson.video_url || '',
                        mux_upload_id: lesson.mux_upload_id || '',
                        mux_playback_id: lesson.mux_playback_id || '',
                        mux_asset_id: lesson.mux_asset_id || '',
                        position: index,
                        description: lesson.description || '',
                        notas: lesson.notas || '',
                        status: 'PENDENTE',
                        created_at: new Date(),
                    }

                    if (lesson.type) lessonPayload.type = lesson.type
                    if (lesson.quizData) lessonPayload.quizData = lesson.quizData

                    batch.set(lessonRef, lessonPayload)
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

        const currentData = courseDoc.data()
        if (currentData?.pricing_type === 'free' && formData.pricing_type !== undefined && formData.pricing_type !== 'free') {
            return { error: "Cursos gratuitos não podem ser alterados para pagos por questões de segurança e integridade." }
        }

        const isApproved = currentData?.status === 'APROVADO'
        const hasNewIntroVideo = 
            (formData.intro_video_url !== undefined && formData.intro_video_url !== (currentData?.intro_video_url || '')) ||
            (formData.intro_video_mux_id !== undefined && formData.intro_video_mux_id !== (currentData?.intro_video_mux_id || '')) ||
            (formData.intro_video_asset_id !== undefined && formData.intro_video_asset_id !== (currentData?.intro_video_asset_id || '')) ||
            (formData.intro_video_playback_id !== undefined && formData.intro_video_playback_id !== (currentData?.intro_video_playback_id || ''))

        const updateData: any = { updated_at: new Date() }
        if (formData.title !== undefined) updateData.title = formData.title
        if (formData.price !== undefined && !isNaN(formData.price)) updateData.price = Number(formData.price)
        if (formData.pricing_type !== undefined) updateData.pricing_type = formData.pricing_type
        if (formData.status !== undefined) updateData.status = formData.status
        if (formData.subtitle !== undefined) updateData.subtitle = formData.subtitle
        if (formData.description !== undefined) updateData.description = formData.description
        if (formData.category !== undefined) updateData.category = formData.category
        if (formData.duration !== undefined) updateData.duration = Number(formData.duration)
        if (formData.image_url !== undefined) updateData.image_url = formData.image_url
        if (formData.curriculum !== undefined) updateData.curriculum = formData.curriculum
        if (formData.tags !== undefined) updateData.tags = formData.tags

        // Se curso está APROVADO e há novos campos de intro vídeo, grava em pendingTrailer
        if (isApproved && hasNewIntroVideo) {
            // Só deleta o pending anterior se for um asset DIFERENTE do que está sendo enviado.
            // Caso contrário, o auto-save já persistiu e estaríamos deletando o asset recém-criado.
            if (currentData?.pendingTrailerAssetId && formData.intro_video_asset_id !== currentData.pendingTrailerAssetId) {
                console.log(`[updateCourseAction] Removendo trailer pendente anterior do Mux: ${currentData.pendingTrailerAssetId}`)
                const muxResult = await deleteMuxAsset(currentData.pendingTrailerAssetId)
                if (muxResult.error) {
                    console.error(`[updateCourseAction] Erro ao deletar Mux asset pendente anterior:`, muxResult.error)
                }
            }

            if (formData.intro_video_url !== undefined) updateData.pendingTrailerUrl = formData.intro_video_url
            if (formData.intro_video_mux_id !== undefined) updateData.pendingTrailerMuxId = formData.intro_video_mux_id
            if (formData.intro_video_asset_id !== undefined) updateData.pendingTrailerAssetId = formData.intro_video_asset_id
            if (formData.intro_video_playback_id !== undefined) updateData.pendingTrailerPlaybackId = formData.intro_video_playback_id
            updateData.trailer_review_status = 'trailer_pending_review'
            updateData.motivoRejeicaoTrailer = ''
        } else if (!isApproved) {
            // Se o curso não está aprovado, mantém fluxo antigo (atualização direta)
            if (formData.intro_video_url !== undefined) updateData.intro_video_url = formData.intro_video_url
            if (formData.intro_video_mux_id !== undefined) updateData.intro_video_mux_id = formData.intro_video_mux_id
            if (formData.intro_video_asset_id !== undefined) updateData.intro_video_asset_id = formData.intro_video_asset_id
            if (formData.intro_video_playback_id !== undefined) updateData.intro_video_playback_id = formData.intro_video_playback_id
        }

        await courseRef.update(updateData)

        // Atualiza metadados dos módulos no curso
        if (formData.modules !== undefined) {
            const modulesMeta = formData.modules.map((m: any, i: number) => ({
                id: m.id,
                title: m.title,
                position: i,
            }))
            await courseRef.update({ modules: modulesMeta })
        }

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

        // Agrupa aulas por module_id para position relativa ao módulo
        const lessonsByModule: Record<string, any[]> = {}
        lessons.forEach((lesson: any) => {
            const mid = lesson.module_id || 'default'
            if (!lessonsByModule[mid]) lessonsByModule[mid] = []
            lessonsByModule[mid].push(lesson)
        })

        // Upsert
        Object.values(lessonsByModule).forEach((moduleLessons: any[]) => {
            moduleLessons.forEach((lesson: any, lessonIndex: number) => {
                const isNew = !lesson.id || lesson.id.startsWith('new-')
                const lessonRef = isNew ? lessonsRef.doc() : lessonsRef.doc(lesson.id)

                const payload: any = {
                    course_id: courseId,
                    module_id: lesson.module_id || 'default',
                    title: lesson.title,
                    video_url: lesson.video_url || '',
                    mux_upload_id: lesson.mux_upload_id || '',
                    mux_playback_id: lesson.mux_playback_id || '',
                    mux_asset_id: lesson.mux_asset_id || '',
                    position: lessonIndex,
                    description: lesson.description || '',
                    notas: lesson.notas || '',
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
                                          existing.notas !== lesson.notas ||
                                          JSON.stringify(existing.quizData) !== JSON.stringify(lesson.quizData)
                        // Só reseta para PENDENTE se não for uma solicitação de exclusão e houver mudanças
                        if (hasChanged && lesson.status !== 'SOLICITADO_EXCLUSAO') {
                            payload.status = 'PENDENTE'
                        }
                    }
                }

                batch.set(lessonRef, payload, { merge: true })
            })
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
export async function deleteVideoAction(
    id: string, 
    collectionName: 'courses' | 'lessons', 
    videoUrl: string, 
    muxAssetId?: string,
    isPendingTrailer: boolean = false
) {
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
            updated_at: new Date()
        }
        
        if (collectionName === 'courses') {
            if (isPendingTrailer) {
                updateData.pendingTrailerUrl = ''
                updateData.pendingTrailerMuxId = ''
                updateData.pendingTrailerAssetId = ''
                updateData.pendingTrailerPlaybackId = ''
                updateData.trailer_review_status = ''
                updateData.motivoRejeicaoTrailer = ''
            } else {
                updateData.video_url = ""
                updateData.intro_video_mux_id = ''
                updateData.intro_video_asset_id = ''
                updateData.intro_video_playback_id = ''
            }
        } else {
            updateData.video_url = ""
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

/**
 * Action para remover trailer (pendente ou ativo) de um curso.
 * Usado pelo professor no botão "Remover Vídeo" da página de edição.
 * Prioriza remoção do trailer pendente se existir.
 */
export async function deleteTrailerAction(courseId: string) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()

        if (!courseDoc.exists || courseDoc.data()?.teacher_id !== user.uid) {
            return { error: 'Não autorizado ou curso não encontrado.' }
        }

        const courseData = courseDoc.data()

        if (courseData?.pendingTrailerAssetId) {
            // Remove trailer pendente do Mux
            const muxResult = await deleteMuxAsset(courseData.pendingTrailerAssetId)
            if (muxResult.error) {
                console.error('[deleteTrailerAction] Erro ao deletar pending trailer asset:', muxResult.error)
            }
            // Limpa campos pendentes
            await courseRef.update({
                pendingTrailerUrl: null,
                pendingTrailerMuxId: null,
                pendingTrailerAssetId: null,
                pendingTrailerPlaybackId: null,
                trailer_review_status: null,
                motivoRejeicaoTrailer: null,
                updated_at: new Date()
            })
        } else if (courseData?.intro_video_asset_id) {
            // Remove trailer ativo do Mux
            const muxResult = await deleteMuxAsset(courseData.intro_video_asset_id)
            if (muxResult.error) {
                console.error('[deleteTrailerAction] Erro ao deletar active trailer asset:', muxResult.error)
            }
            // Limpa campos principais
            await courseRef.update({
                intro_video_url: '',
                intro_video_mux_id: '',
                intro_video_asset_id: '',
                intro_video_playback_id: '',
                updated_at: new Date()
            })
        }

        revalidatePath(`/dashboard-teacher/courses/${courseId}/edit`)
        revalidatePath('/dashboard-teacher/courses')
        return { success: true }
    } catch (error) {
        console.error('Erro ao remover trailer:', error)
        return { error: 'Falha ao remover trailer.' }
    }
}

/**
 * Autosave: persiste módulos + aulas em background.
 * Upserts todos os módulos e aulas do estado local, deleta aulas removidas,
 * e retorna um mapa de IDs new-* → IDs reais do Firestore.
 */
export async function autosaveCourseAction(courseId: string, formData: { modules: any[] }) {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()
        if (!courseDoc.exists || courseDoc.data()?.teacher_id !== user.uid) {
            return { error: "Curso não encontrado ou você não tem permissão para editá-lo." }
        }

        const modules = formData.modules || []
        const allLessons = modules.flatMap((m: any) => m.lessons || [])
        const lessonsRef = adminDb.collection('lessons')
        const batch = adminDb.batch()
        const idMap: Record<string, string> = {}

        // Salva metadados dos módulos no documento do curso
        const modulesMeta = modules.map((m: any, i: number) => ({
            id: m.id,
            title: m.title,
            position: i,
        }))
        batch.set(courseRef, { modules: modulesMeta, updated_at: new Date() }, { merge: true })

        // Deleta aulas que foram removidas pelo professor
        const existingLessonsSnapshot = await lessonsRef.where('course_id', '==', courseId).get()
        const existingIds = existingLessonsSnapshot.docs.map(doc => doc.id)
        const incomingIds = allLessons.map((l: any) => l.id).filter((id: string) => id && !id.startsWith('new-'))
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))

        for (const id of idsToDelete) {
            const lessonDoc = existingLessonsSnapshot.docs.find(d => d.id === id)
            const lessonData = lessonDoc?.data()
            if (lessonData?.status === 'APROVADO') {
                batch.update(lessonsRef.doc(id), { status: 'SOLICITADO_EXCLUSAO', updated_at: new Date() })
            } else {
                if (lessonData?.mux_asset_id) {
                    try {
                        await deleteMuxAsset(lessonData.mux_asset_id)
                    } catch (e) {
                        console.error('[autosave] Erro ao deletar Mux asset:', e)
                    }
                }
                batch.delete(lessonsRef.doc(id))
            }
        }

        // Upsert aulas com module_id e position relativa ao módulo
        modules.forEach((module: any) => {
            ;(module.lessons || []).forEach((lesson: any, lessonIndex: number) => {
                const isNew = !lesson.id || lesson.id.startsWith('new-')
                const lessonRef = isNew ? lessonsRef.doc() : lessonsRef.doc(lesson.id)

                if (isNew) {
                    idMap[lesson.id] = lessonRef.id
                }

                const payload: any = {
                    course_id: courseId,
                    module_id: module.id,
                    title: lesson.title,
                    video_url: lesson.video_url || '',
                    mux_upload_id: lesson.mux_upload_id || '',
                    mux_playback_id: lesson.mux_playback_id || '',
                    mux_asset_id: lesson.mux_asset_id || '',
                    position: lessonIndex,
                    description: lesson.description || '',
                    notas: lesson.notas || '',
                    updated_at: new Date(),
                }

                if (lesson.type) payload.type = lesson.type
                if (lesson.quizData) payload.quizData = lesson.quizData

                if (isNew) {
                    payload.created_at = new Date()
                    payload.status = 'PENDENTE'
                } else {
                    payload.status = lesson.status || 'PENDENTE'
                }

                batch.set(lessonRef, payload, { merge: true })
            })
        })

        await batch.commit()

        return { success: true, idMap }
    } catch (error) {
        console.error('Erro no autosave:', error)
        return { error: 'Falha ao salvar automaticamente.' }
    }
}

/**
 * Server Action segura para buscar estatísticas reais do instrutor do Firestore
 */
export async function getInstructorStatsAction() {
    const user = await getAuthUser()
    if (!user) return { error: "Não autorizado" }

    try {
        // Valida se o usuário tem a role teacher ou admin no profile
        const profileDoc = await adminDb.collection('profiles').doc(user.uid).get()
        const profileData = profileDoc.data()
        
        if (profileData?.role !== 'teacher' && profileData?.role !== 'admin') {
            return { error: "Não autorizado. Acesso restrito a professores." }
        }

        // 1. Busca todos os cursos deste instrutor
        const coursesSnap = await adminDb.collection('courses')
            .where('teacher_id', '==', user.uid)
            .get()
        
        const courseIds = coursesSnap.docs.map(doc => doc.id)
        const totalCourses = courseIds.length

        if (totalCourses === 0) {
            return { totalStudents: 0, totalReviews: 0, totalCourses: 0, averageRating: 0.0 }
        }

        // 2. Calcula o total de alunos matriculados nos cursos
        let totalStudents = 0
        for (let i = 0; i < courseIds.length; i += 30) {
            const chunk = courseIds.slice(i, i + 30)
            const enrollmentsSnap = await adminDb.collection('enrollments')
                .where('course_id', 'in', chunk)
                .count()
                .get()
            totalStudents += enrollmentsSnap.data().count
        }

        // 3. Calcula total de reviews e média aritmética de ratings a partir da coleção real 'evaluations'
        const evaluationsSnap = await adminDb.collection('evaluations')
            .where('teacher_id', '==', user.uid)
            .get()

        const totalReviews = evaluationsSnap.size
        let sumRatings = 0

        evaluationsSnap.docs.forEach(doc => {
            const data = doc.data()
            // Parsing robusto e defensivo caso venha como string
            sumRatings += (Number(data.rating) || 0)
        })

        const averageRating = totalReviews > 0 ? Math.round((sumRatings / totalReviews) * 10) / 10 : 0.0

        return {
            totalStudents,
            totalReviews,
            totalCourses,
            averageRating
        }
    } catch (error) {
        console.error('getInstructorStatsAction Error:', error)
        return { error: 'Falha ao processar estatísticas do instrutor.' }
    }
}
