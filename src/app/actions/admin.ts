'use server'

import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/app/actions/auth'
import { parseFirebaseDate } from '@/lib/date-utils'

/**
 * Busca todas as configurações globais da plataforma.
 * Se não existir, retorna os padrões.
 */
export async function getPlatformSettings() {
    try {
        const settingsDoc = await adminDb.collection('config').doc('platform_settings').get()
        if (!settingsDoc.exists) {
            // Se não existir, podemos criar ou retornar padrão
            return {
                platform_tax: 20, // Padrão 20% solicitado
                updated_at: new Date()
            }
        }
        return JSON.parse(JSON.stringify({
            ...settingsDoc.data(),
            id: settingsDoc.id
        }))
    } catch (error) {
        console.error("Error getting platform settings:", error)
        return { platform_tax: 20 }
    }
}

/**
 * Atualiza a porcentagem de taxa da plataforma.
 */
export async function updatePlatformTax(tax: number) {
    try {
        await adminDb.collection('config').doc('platform_settings').set({
            platform_tax: tax,
            updated_at: new Date()
        }, { merge: true })
        
        revalidatePath('/admin/dashboard')
        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
        console.error("Error updating platform tax:", error)
        return { success: false, error: "Falha ao atualizar taxa." }
    }
}

/**
 * Lista todos os usuários que são professores.
 */
export async function getAllTeachers() {
    try {
        const teachersSnap = await adminDb.collection('profiles')
            .where('role', '==', 'teacher')
            .get()
            
        const teachers = teachersSnap.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : null
            }
        })

        return JSON.parse(JSON.stringify(teachers))
    } catch (error) {
        console.error("Error getting teachers:", error)
        return []
    }
}

/**
 * Busca todos os pagamentos/vendas para o dashboard financeiro.
 * No PowerPlay, as vendas parecem ser registradas em 'enrollments' ou numa futura 'payments'.
 * Atualmente usaremos enrollments + courses info para calcular.
 */
export async function getFinancialData() {
    try {
        // Buscamos as configurações de taxa atuais
        const settings = await getPlatformSettings() as any
        const platformTaxPercent = settings.platform_tax || 20

        // Buscamos todos os enrollments
        const enrollmentsSnap = await adminDb.collection('enrollments').get()
        const enrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

        // Buscamos todos os cursos para saber os preços e professores
        const coursesSnap = await adminDb.collection('courses').get()
        const coursesMap = new Map()
        coursesSnap.docs.forEach(doc => {
            coursesMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        // Buscamos todos os perfis para saber nomes dos professores
        const profilesSnap = await adminDb.collection('profiles').get()
        const profilesMap = new Map()
        profilesSnap.docs.forEach(doc => {
            profilesMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        const detailedPayments = enrollments.map(e => {
            const course = coursesMap.get(e.course_id)
            const teacher = course ? profilesMap.get(course.teacher_id) : null
            const grossValue = Number(course?.price) || 0
            
            const platformShare = grossValue * (platformTaxPercent / 100)
            const teacherShare = grossValue - platformShare

            return {
                id: e.id,
                courseName: course?.title || 'Curso Deletado',
                teacherName: teacher?.full_name || 'Professor N/A',
                grossValue,
                platformShare,
                teacherShare,
                date: parseFirebaseDate(e.created_at)?.toISOString()
            }
        }).sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0
            const dateB = b.date ? new Date(b.date).getTime() : 0
            return dateB - dateA
        })

        const totalGross = detailedPayments.reduce((acc, p) => acc + p.grossValue, 0)
        const totalPlatform = detailedPayments.reduce((acc, p) => acc + p.platformShare, 0)
        const totalTeacher = detailedPayments.reduce((acc, p) => acc + p.teacherShare, 0)

        const result = {
            totalGross,
            totalPlatform,
            totalTeacher,
            payments: detailedPayments,
            platformTaxPercent
        }

        return JSON.parse(JSON.stringify(result))
    } catch (error) {
        console.error("Error getting financial data:", error)
        return { totalGross: 0, totalPlatform: 0, totalTeacher: 0, payments: [], platformTaxPercent: 20 }
    }
}

/**
 * Filtra matrículas de um professor específico.
 */
export async function getTeacherStudents(teacherId: string) {
    try {
        // 1. Pegar cursos do professor
        const coursesSnap = await adminDb.collection('courses')
            .where('teacher_id', '==', teacherId)
            .get()
        
        const courseIds = coursesSnap.docs.map(doc => doc.id)
        if (courseIds.length === 0) return []

        // 2. Pegar enrollments para esses cursos
        // Nota: se tiver > 10 cursos, precisa bater em chunks
        const enrollmentsSnap = await adminDb.collection('enrollments')
            .where('course_id', 'in', courseIds)
            .get()
            
        const userIds = enrollmentsSnap.docs.map(doc => doc.data().user_id)
        if (userIds.length === 0) return []

        // 3. Pegar perfis desses usuários
        const uniqueUserIds = Array.from(new Set(userIds))
        const profilesSnap = await adminDb.collection('profiles')
            .where('__name__', 'in', uniqueUserIds)
            .get()
            
        const students = profilesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return JSON.parse(JSON.stringify(students))
    } catch (error) {
        console.error("Error getting teacher students:", error)
        return []
    }
}

/**
 * Lista todos os usuários que são alunos (role == 'student' ou 'user').
 * Inclui quantidade de cursos adquiridos e tempo assistido.
 */
export async function getAllStudents() {
    try {
        const studentsSnap = await adminDb.collection('profiles')
            .where('role', 'in', ['student', 'user'])
            .get()
        
        const students = studentsSnap.docs.map(doc => doc.data())
        const studentIds = students.map(s => s.uid)

        const enrollmentsSnap = await adminDb.collection('enrollments').get()
        const enrollments = enrollmentsSnap.docs.map(doc => doc.data())

        const studentsWithData = students.map(student => {
            const userEnrollments = enrollments.filter(e => e.user_id === student.uid)
            const coursesCount = userEnrollments.length
            
            return {
                id: student.id,
                uid: student.uid,
                full_name: student.full_name || 'Sem nome',
                email: student.email || 'Sem e-mail',
                role: student.role || 'user',
                coursesCount,
                watchedTime: 0,
                lastAccess: student.last_access || null,
                createdAt: student.created_at || null,
            }
        })

        return JSON.parse(JSON.stringify(studentsWithData))
    } catch (error) {
        console.error("Error getting students:", error)
        return []
    }
}
/**
 * Lista todos os cursos com status PENDENTE.
 */
export async function getPendingCourses() {
    try {
        const coursesSnap = await adminDb.collection('courses')
            .where('status', '==', 'PENDENTE')
            .get()
            
        const courses = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return JSON.parse(JSON.stringify(courses))
    } catch (error) {
        console.error("Error getting pending courses:", error)
        return []
    }
}

/**
 * Lista todas as aulas com status PENDENTE.
 */
export async function getPendingLessons() {
    try {
        const lessonsSnap = await adminDb.collection('lessons')
            .where('status', '==', 'PENDENTE')
            .get()
            
        const lessons = await Promise.all(lessonsSnap.docs.map(async (doc) => {
            const data = doc.data()
            // Busca o nome do curso para contexto
            const courseDoc = await adminDb.collection('courses').doc(data.course_id).get()
            const courseData = courseDoc.exists ? courseDoc.data() : null
            
            return {
                id: doc.id,
                ...data,
                course_title: courseData?.title || 'Curso N/A',
                course_status: courseData?.status || 'N/A',
                teacher_id: courseData?.teacher_id || null
            }
        }))

        return JSON.parse(JSON.stringify(lessons))
    } catch (error) {
        console.error("Error getting pending lessons:", error)
        return []
    }
}

/**
 * Lista todos os cursos com status SOLICITADO_EXCLUSAO.
 */
export async function getDeletionPendingCourses() {
    try {
        const coursesSnap = await adminDb.collection('courses')
            .where('status', '==', 'SOLICITADO_EXCLUSAO')
            .get()
            
        const courses = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return JSON.parse(JSON.stringify(courses))
    } catch (error) {
        console.error("Error getting deletion pending courses:", error)
        return []
    }
}

/**
 * Lista todas as aulas com status SOLICITADO_EXCLUSAO.
 */
export async function getDeletionPendingLessons() {
    try {
        const lessonsSnap = await adminDb.collection('lessons')
            .where('status', '==', 'SOLICITADO_EXCLUSAO')
            .get()
            
        const lessons = await Promise.all(lessonsSnap.docs.map(async (doc) => {
            const data = doc.data()
            const courseDoc = await adminDb.collection('courses').doc(data.course_id).get()
            const courseData = courseDoc.exists ? courseDoc.data() : null
            
            return {
                id: doc.id,
                ...data,
                course_title: courseData?.title || 'Curso N/A',
                course_status: courseData?.status || 'N/A',
                teacher_id: courseData?.teacher_id || null
            }
        }))

        return JSON.parse(JSON.stringify(lessons))
    } catch (error) {
        console.error("Error getting deletion pending lessons:", error)
        return []
    }
}

/**
 * Aprova apenas o curso (aulas continuam pendentes).
 */
// ... dentro da função approveCourse
export async function approveCourse(courseId: string) {
    try {
        // Busca dados do curso para obter o teacher_id
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        // 1. Atualiza apenas o curso
        const courseRef = adminDb.collection('courses').doc(courseId)
        await courseRef.update({ 
            status: 'APROVADO',
            updated_at: new Date()
        })

        // Cria notificação para o professor
        if (courseData?.teacher_id) {
            console.log('[approveCourse] Creating notification for teacher:', courseData.teacher_id)
            const notifRef = await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'course_approved',
                title: 'Curso Aprovado!',
                message: `Seu curso "${courseData.title}" foi aprovado e agora está disponível para os alunos.`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
            console.log('[approveCourse] Notification created with ID:', notifRef.id)
        } else {
            console.warn('[approveCourse] No teacher_id found for course:', courseId)
        }

        revalidatePath('/admin/approvals')
        revalidatePath('/course')
        revalidatePath('/dashboard-student')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Error approving course:", error)
        return { success: false, error: "Falha ao aprovar curso." }
    }
}

/**
 * Aprova uma aula individualmente.
 */
export async function approveLesson(lessonId: string) {
    try {
        // Busca dados da aula para obter course_id e título
        const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()
        const lessonData = lessonDoc.data()

        if (!lessonData) {
            return { success: false, error: "Aula não encontrada." }
        }

        await adminDb.collection('lessons').doc(lessonId).update({
            status: 'APROVADO',
            approved_at: new Date(),
            updated_at: new Date()
        })

        // Busca o curso para obter o teacher_id
        const courseDoc = await adminDb.collection('courses').doc(lessonData.course_id).get()
        const courseData = courseDoc.data()

        // Cria notificação para o professor
        if (courseData?.teacher_id) {
            console.log('[approveLesson] Creating notification for teacher:', courseData.teacher_id)
            const notifRef = await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'lesson_approved',
                title: 'Aula Aprovada!',
                message: `Sua aula "${lessonData.title}" foi aprovada e está disponível para os alunos.`,
                course_id: lessonData.course_id,
                lesson_id: lessonId,
                read: false,
                created_at: new Date()
            })
            console.log('[approveLesson] Notification created with ID:', notifRef.id)
        } else {
            console.warn('[approveLesson] No teacher_id found for course:', lessonData.course_id)
        }
        
        revalidatePath('/admin/approvals')
        revalidatePath('/course')
        revalidatePath('/dashboard-student')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Error approving lesson:", error)
        return { success: false, error: "Falha ao aprovar aula." }
    }
}

/**
 * Rejeita uma aula individualmente.
 */
export async function rejectLesson(lessonId: string, reason: string) {
    try {
        // Primeiro busca a aula para obter o course_id
        const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()
        const lessonData = lessonDoc.data()
        
        if (!lessonData) {
            return { success: false, error: "Aula não encontrada." }
        }

        await adminDb.collection('lessons').doc(lessonId).update({
            status: 'REJEITADO',
            motivoRejeicao: reason,
            updated_at: new Date()
        })

        // Busca o curso para obter o teacher_id
        const courseDoc = await adminDb.collection('courses').doc(lessonData.course_id).get()
        const courseData = courseDoc.data()

        // Cria notificação para o professor
        if (courseData?.teacher_id) {
            console.log('[rejectLesson] Creating notification for teacher:', courseData.teacher_id)
            const notifRef = await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'lesson_rejected',
                title: 'Aula Rejeitada',
                message: `Sua aula "${lessonData.title}" foi rejeitada. Motivo: ${reason}`,
                course_id: lessonData.course_id,
                lesson_id: lessonId,
                read: false,
                created_at: new Date()
            })
            console.log('[rejectLesson] Notification created with ID:', notifRef.id)
        } else {
            console.warn('[rejectLesson] No teacher_id found for course:', lessonData.course_id)
        }
        
        revalidatePath('/admin/approvals')
        return { success: true }
    } catch (error) {
        console.error("Error rejecting lesson:", error)
        return { success: false, error: "Falha ao rejeitar aula." }
    }
}

/**
 * Rejeita um curso e salva o motivo.
 */
export async function rejectCourse(courseId: string, reason: string) {
    try {
        // Busca o curso para obter o teacher_id
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        if (!courseData) {
            return { success: false, error: "Curso não encontrado." }
        }

        await adminDb.collection('courses').doc(courseId).update({
            status: 'REJEITADO',
            motivoRejeicao: reason,
            updated_at: new Date()
        })

        // Cria notificação para o professor
        if (courseData.teacher_id) {
            console.log('[rejectCourse] Creating notification for teacher:', courseData.teacher_id)
            const notifRef = await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'course_rejected',
                title: 'Curso Rejeitado',
                message: `Seu curso "${courseData.title}" foi rejeitado. Motivo: ${reason}`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
            console.log('[rejectCourse] Notification created with ID:', notifRef.id)
        } else {
            console.warn('[rejectCourse] No teacher_id found for course:', courseId)
        }
        
        revalidatePath('/admin/approvals')
        return { success: true }
    } catch (error) {
        console.error("Error rejecting course:", error)
        return { success: false, error: "Falha ao rejeitar curso." }
    }
}

/**
 * Ativa ou desativa um usuário (aluno ou professor).
 */
export async function toggleUserStatus(uid: string, currentStatus: boolean) {
    try {
        await adminDb.collection('profiles').doc(uid).update({
            ativo: !currentStatus,
            updated_at: new Date()
        })
        
        revalidatePath('/admin/users')
        revalidatePath('/admin/teachers')
        return { success: true }
    } catch (error) {
        console.error("Error toggling user status:", error)
        return { success: false, error: "Falha ao atualizar status do usuário." }
    }
}

/**
 * Busca logs de vendas com filtros opcionais.
 */
export async function getSalesLogs(professorId?: string, startDate?: Date, endDate?: Date) {
    try {
        let query: any = adminDb.collection('vendas_logs')

        if (professorId) {
            query = query.where('professorId', '==', professorId)
        }

        // Ordenação por data (descendente)
        query = query.orderBy('dataCriacao', 'desc')

        const salesSnap = await query.get()
        let sales = salesSnap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            dataCriacao: doc.data().dataCriacao?.toDate() || new Date()
        }))

        // Filtro de data via código (Firestore não permite múltiplos filtros de desigualdade facilmente sem índices complexos)
        if (startDate) {
            sales = sales.filter((s: any) => s.dataCriacao >= startDate)
        }
        if (endDate) {
            sales = sales.filter((s: any) => s.dataCriacao <= endDate)
        }

        return JSON.parse(JSON.stringify(sales))
    } catch (error) {
        console.error("Error getting sales logs:", error)
        return []
    }
}

export async function approveCourseDeletion(courseId: string) {
    try {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        if (!courseDoc.exists) {
            return { success: false, error: "Curso não encontrado." }
        }

        const lessonsSnapshot = await adminDb.collection('lessons').where('course_id', '==', courseId).get()
        const batch = adminDb.batch()
        lessonsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
        batch.delete(adminDb.collection('courses').doc(courseId))
        await batch.commit()

        if (courseData?.teacher_id) {
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'course_deleted',
                title: 'Curso Excluído',
                message: `Seu curso "${courseData.title}" foi removido permanentemente por um administrador.`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
        }

        revalidatePath('/admin/approvals')
        revalidatePath('/dashboard-teacher/courses')
        revalidatePath('/admin/all-courses')
        return { success: true }
    } catch (error) {
        console.error("Error approving course deletion:", error)
        return { success: false, error: "Falha ao excluir curso." }
    }
}

export const deleteCourse = approveCourseDeletion

/**
 * Rejeita a exclusão de um curso (mantém o curso como APROVADO)
 */
export async function rejectCourseDeletion(courseId: string) {
    try {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        await adminDb.collection('courses').doc(courseId).update({
            status: 'APROVADO',
            updated_at: new Date()
        })

        if (courseData?.teacher_id) {
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'deletion_rejected',
                title: 'Exclusão de Curso Rejeitada',
                message: `A solicitação de exclusão do seu curso "${courseData.title}" foi rejeitada. O curso permanece ativo.`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
        }

        revalidatePath('/admin/approvals')
        revalidatePath('/dashboard-teacher/courses')
        return { success: true }
    } catch (error) {
        console.error("Error rejecting course deletion:", error)
        return { success: false, error: "Falha ao rejeitar exclusão." }
    }
}

/**
 * Aprova a exclusão de uma aula (exclui permanentemente)
 */
export async function approveLessonDeletion(lessonId: string) {
    try {
        const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()
        const lessonData = lessonDoc.data()

        if (!lessonDoc.exists) {
            return { success: false, error: "Aula não encontrada." }
        }

        // TODO: Implementar Mux SDK para deletar o asset via mux_asset_id antes de remover do DB
        // if (lessonData?.mux_asset_id) {
        //     await mux.video.assets.delete(lessonData.mux_asset_id);
        // }

        await adminDb.collection('lessons').doc(lessonId).delete()

        if (lessonData?.course_id) {
            const courseDoc = await adminDb.collection('courses').doc(lessonData.course_id).get()
            const courseData = courseDoc.data()

            if (courseData?.teacher_id) {
                await adminDb.collection('notifications').add({
                    user_id: courseData.teacher_id,
                    type: 'lesson_deleted',
                    title: 'Aula Excluída',
                    message: `Sua aula "${lessonData.title}" foi removida permanentemente por um administrador.`,
                    course_id: lessonData.course_id,
                    lesson_id: lessonId,
                    read: false,
                    created_at: new Date()
                })
            }
        }

        revalidatePath('/admin/approvals')
        revalidatePath(`/dashboard-teacher/courses/${lessonData?.course_id}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error approving lesson deletion:", error)
        return { success: false, error: "Falha ao excluir aula." }
    }
}

/**
 * Rejeita a exclusão de uma aula (mantém a aula como APROVADO)
 */
export async function rejectLessonDeletion(lessonId: string) {
    try {
        const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()
        const lessonData = lessonDoc.data()

        await adminDb.collection('lessons').doc(lessonId).update({
            status: 'APROVADO',
            updated_at: new Date()
        })

        if (lessonData?.course_id) {
            const courseDoc = await adminDb.collection('courses').doc(lessonData.course_id).get()
            const courseData = courseDoc.data()

            if (courseData?.teacher_id) {
                await adminDb.collection('notifications').add({
                    user_id: courseData.teacher_id,
                    type: 'deletion_rejected',
                    title: 'Exclusão de Aula Rejeitada',
                    message: `A solicitação de exclusão da sua aula "${lessonData.title}" foi rejeitada. A aula permanece ativa.`,
                    course_id: lessonData.course_id,
                    lesson_id: lessonId,
                    read: false,
                    created_at: new Date()
                })
            }
        }

        revalidatePath('/admin/approvals')
        revalidatePath(`/dashboard-teacher/courses/${lessonData?.course_id}/edit`)
        return { success: true }
    } catch (error) {
        console.error("Error rejecting lesson deletion:", error)
        return { success: false, error: "Falha ao rejeitar exclusão." }
    }
}

/**
 * Busca todos os cursos com nomes dos professores.
 */
export async function getAllCourses() {
    try {
        const coursesSnap = await adminDb.collection('courses').orderBy('created_at', 'desc').get()
        
        const courses = await Promise.all(coursesSnap.docs.map(async (doc) => {
            const data = doc.data()
            let teacherName = 'Professor N/A'
            
            if (data.teacher_id) {
                const profileDoc = await adminDb.collection('profiles').doc(data.teacher_id).get()
                const profileData = profileDoc.data()
                teacherName = profileData?.full_name || profileData?.name || 'Professor N/A'
            }

            return {
                id: doc.id,
                ...data,
                teacherName
            }
        }))

        return JSON.parse(JSON.stringify(courses))
    } catch (error) {
        console.error("Error getting all courses:", error)
        return []
    }
}

/**
 * Suspende uma aula (status = SUSPENSO).
 */
export async function suspendLesson(lessonId: string) {
    try {
        const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()
        const lessonData = lessonDoc.data()

        if (!lessonData) {
            return { success: false, error: "Aula não encontrada." }
        }

        await adminDb.collection('lessons').doc(lessonId).update({
            status: 'SUSPENSO',
            updated_at: new Date()
        })

        if (lessonData?.course_id) {
            const courseDoc = await adminDb.collection('courses').doc(lessonData.course_id).get()
            const courseData = courseDoc.data()

            if (courseData?.teacher_id) {
                await adminDb.collection('notifications').add({
                    user_id: courseData.teacher_id,
                    type: 'lesson_suspended',
                    title: 'Aula Suspensa',
                    message: `Sua aula "${lessonData.title}" foi suspensa por um administrador.`,
                    course_id: lessonData.course_id,
                    lesson_id: lessonId,
                    read: false,
                    created_at: new Date()
                })
            }
        }

        revalidatePath('/admin/all-courses')
        revalidatePath('/admin/approvals')
        return { success: true }
    } catch (error) {
        console.error("Error suspending lesson:", error)
        return { success: false, error: "Falha ao suspender aula." }
    }
}

/**
 * Processa a aprovação ou rejeição de um professor.
 * Esta função será conectada ao Firestore quando as Security Rules forem liberadas.
 */
export async function handleTeacherApproval(
    teacherId: string,
    action: 'approve' | 'reject'
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        console.log(`[TeacherApproval] Processando ${action} para professor ${teacherId}`)

        if (action === 'approve') {
            console.log(`[TeacherApproval] Professor ${teacherId} APROVADO`)
            console.log(`[TeacherApproval] Atualizando status para 'approved' no Firestore...`)
        } else {
            console.log(`[TeacherApproval] Professor ${teacherId} REJEITADO`)
            console.log(`[TeacherApproval] Removendo perfil de professor ou definindo status 'rejected'...`)
        }

        return {
            success: true,
            message: action === 'approve'
                ? `Professor aprovado com sucesso!`
                : `Solicitação rejeitada.`
        }
    } catch (error) {
        console.error("[TeacherApproval] Erro ao processar aprovação:", error)
        return {
            success: false,
            error: "Erro ao processar solicitação.",
            message: ""
        }
    }
}

/**
 * Bane um professor (muda teacher_status para 'banned').
 */
export async function banTeacher(teacherId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const profileRef = adminDb.collection('profiles').doc(teacherId)
        const profileDoc = await profileRef.get()
        
        if (!profileDoc.exists) {
            return { success: false, error: "Professor não encontrado.", message: "" }
        }

        await profileRef.update({
            teacher_status: 'banned',
            updated_at: new Date()
        })

        await adminDb.collection('notifications').add({
            user_id: teacherId,
            type: 'teacher_banned',
            title: 'Conta Banida',
            message: 'Sua conta de professor foi banida por um administrador. Entre em contato para mais informações.',
            read: false,
            created_at: new Date()
        })

        revalidatePath('/admin/teachers')
        return { success: true, message: "Professor banido com sucesso.", error: "" }
    } catch (error) {
        console.error("[banTeacher] Erro ao banir professor:", error)
        return { success: false, error: "Erro ao banir professor.", message: "" }
    }
}

/**
 * Reativa um professor banned (muda teacher_status para 'active').
 */
export async function reactivateTeacher(teacherId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const profileRef = adminDb.collection('profiles').doc(teacherId)
        const profileDoc = await profileRef.get()
        
        if (!profileDoc.exists) {
            return { success: false, error: "Professor não encontrado.", message: "" }
        }

        await profileRef.update({
            teacher_status: 'active',
            updated_at: new Date()
        })

        await adminDb.collection('notifications').add({
            user_id: teacherId,
            type: 'teacher_reactivated',
            title: 'Conta Reativada',
            message: ' Sua conta de professor foi reativada por um administrador. Bem-vindo de volta!',
            read: false,
            created_at: new Date()
        })

        revalidatePath('/admin/teachers')
        return { success: true, message: "Professor reativado com sucesso.", error: "" }
    } catch (error) {
        console.error("[reactivateTeacher] Erro ao reativar professor:", error)
        return { success: false, error: "Erro ao reativar professor.", message: "" }
    }
}

/**
 * Promove um professor para a função de administrador.
 * Requisitos: O chamador deve ser admin, o alvo deve ser teacher.
 */
export async function promoteTeacherToAdmin(teacherId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        // 1. Validar se o chamador é admin
        const session = await getSessionUser()
        if (!session || session.role !== 'admin') {
            return { success: false, error: "Não autorizado. Apenas administradores podem realizar esta ação.", message: "" }
        }

        // 2. Buscar o perfil do professor alvo
        const profileRef = adminDb.collection('profiles').doc(teacherId)
        const profileDoc = await profileRef.get()
        
        if (!profileDoc.exists) {
            return { success: false, error: "Usuário alvo não encontrado.", message: "" }
        }

        const profileData = profileDoc.data()
        
        // 3. Validar se a role atual é rigorosamente 'teacher'
        if (profileData?.role !== 'teacher') {
            return { success: false, error: "Apenas usuários com a função 'teacher' podem ser promovidos desta forma.", message: "" }
        }

        // 4. Atualizar Firestore para role 'admin'
        await profileRef.update({
            role: 'admin',
            updated_at: new Date(),
            promoted_at: new Date(),
            promoted_by: session.uid
        })

        // 5. Atualizar Custom Claims no Firebase Auth para garantir consistência tokens/permissões
        await adminAuth.setCustomUserClaims(teacherId, { role: 'admin' })

        // 6. Criar notificação para o novo administrador
        await adminDb.collection('notifications').add({
            user_id: teacherId,
            type: 'role_promoted',
            title: 'Promoção a Administrador',
            message: 'Parabéns! Sua conta foi promovida para a função de Administrador da plataforma.',
            read: false,
            created_at: new Date()
        })

        revalidatePath('/admin/teachers')
        revalidatePath('/admin/dashboard')
        
        return { 
            success: true, 
            message: `Professor(a) ${profileData?.full_name || teacherId} promovido(a) a Administrador com sucesso.`, 
            error: "" 
        }
    } catch (error) {
        console.error("[promoteTeacherToAdmin] Erro ao promover professor:", error)
        return { success: false, error: "Erro interno ao processar a promoção.", message: "" }
    }
}
