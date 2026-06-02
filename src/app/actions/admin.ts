'use server'

import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/app/actions/auth'
import { parseFirebaseDate } from '@/lib/date-utils'
import { deleteMuxAsset } from '@/app/actions/mux'

/**
 * Busca todas as configurações globais da plataforma.
 * Se não existir, retorna os padrões.
 */
export async function getPlatformSettings() {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getPlatformSettings");
        return { success: false, error: 'Não autorizado' };
    }
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
    const session = await getSessionUser()
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' }
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getAllTeachers");
        return [];
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getFinancialData");
        return { success: false, error: 'Não autorizado' };
    }
    try {
        // Buscamos as configurações de taxa atuais
        const settings = await getPlatformSettings() as any
        const platformTaxPercent = settings.platform_tax || 20

        // BUG-27 FIX: Filtra diretamente no Firestore, evitando carregar todos os enrollments em memória.
        // A query anterior carregava a coleção inteira e filtrava em JS — insustentável em escala.
        const enrollmentsSnap = await adminDb.collection('enrollments')
            .where('payment_confirmed', '==', true)
            .get()
        const enrollments = enrollmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

        if (enrollments.length === 0) {
            return { totalGross: 0, totalPlatform: 0, totalTeacher: 0, payments: [], platformTaxPercent }
        }

        // Extrai IDs únicos de cursos apenas das matrículas filtradas
        const courseIds = [...new Set(enrollments.map((e: any) => e.course_id).filter(Boolean))] as string[]

        const coursesMap = new Map()
        const profilesMap = new Map()

        // Busca cursos em chunks de 30
        const courseChunks: string[][] = []
        for (let i = 0; i < courseIds.length; i += 30) {
            courseChunks.push(courseIds.slice(i, i + 30))
        }
        const courseSnapshots = await Promise.all(
            courseChunks.map(chunk =>
                adminDb.collection('courses').where('__name__', 'in', chunk).get()
            )
        )
        courseSnapshots.forEach(snap =>
            snap.docs.forEach(doc => coursesMap.set(doc.id, { id: doc.id, ...doc.data() }))
        )

        // Extrai teacher_ids dos cursos encontrados e busca perfis em chunks de 30
        const foundTeacherIds = [...new Set(
            [...coursesMap.values()].map((c: any) => c.teacher_id).filter(Boolean)
        )] as string[]

        if (foundTeacherIds.length > 0) {
            const profileChunks: string[][] = []
            for (let i = 0; i < foundTeacherIds.length; i += 30) {
                profileChunks.push(foundTeacherIds.slice(i, i + 30))
            }
            const profileSnapshots = await Promise.all(
                profileChunks.map(chunk =>
                    adminDb.collection('profiles').where('__name__', 'in', chunk).get()
                )
            )
            profileSnapshots.forEach(snap =>
                snap.docs.forEach(doc => profilesMap.set(doc.id, { id: doc.id, ...doc.data() }))
            )
        }

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
                teacherId: teacher?.id || course?.teacher_id || null,
                grossValue,
                platformShare,
                teacherShare,
                date: parseFirebaseDate(e.created_at)?.toISOString(),
                commissionStatus: e.payment_confirmed === true ? 'paid' : 'pending'
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getTeacherStudents");
        return [];
    }
    try {
        // 1. Pegar cursos do professor
        const coursesSnap = await adminDb.collection('courses')
            .where('teacher_id', '==', teacherId)
            .get()
        
        const courseIds = coursesSnap.docs.map(doc => doc.id)
        if (courseIds.length === 0) return []

        // 2. Pegar enrollments para esses cursos (em chunks de 30)
        const courseChunks: string[][] = []
        for (let i = 0; i < courseIds.length; i += 30) {
            courseChunks.push(courseIds.slice(i, i + 30))
        }
        const enrollmentSnapshots = await Promise.all(
            courseChunks.map(chunk =>
                adminDb.collection('enrollments')
                    .where('course_id', 'in', chunk)
                    .get()
            )
        )
        const userIds = enrollmentSnapshots.flatMap(snap =>
            snap.docs.map(doc => doc.data().user_id)
        )
        if (userIds.length === 0) return []

        // 3. Pegar perfis desses usuários (em chunks de 30)
        const uniqueUserIds = Array.from(new Set(userIds))
        const userChunks: string[][] = []
        for (let i = 0; i < uniqueUserIds.length; i += 30) {
            userChunks.push(uniqueUserIds.slice(i, i + 30))
        }
        const profileSnapshots = await Promise.all(
            userChunks.map(chunk =>
                adminDb.collection('profiles')
                    .where('__name__', 'in', chunk)
                    .get()
            )
        )
        const students = profileSnapshots.flatMap(snap =>
            snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        )

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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getAllStudents");
        return [];
    }
    try {
        const studentsSnap = await adminDb.collection('profiles')
            .where('role', 'in', ['student', 'user'])
            .get()
        
        const students = studentsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[]
        
        // Busca todas as matrículas para contar cursos e somar tempo assistido
        const enrollmentsSnap = await adminDb.collection('enrollments').get()
        const enrollments = enrollmentsSnap.docs.map(doc => doc.data())

        const studentsWithData = students.map(student => {
            const userEnrollments = enrollments.filter(e => e.user_id === student.uid)
            const coursesCount = userEnrollments.length
            
            // Conta certificados do array concluded_courses no perfil
            const certificatesCount = student.concluded_courses?.length || 0
            
            // Soma o tempo: pega do perfil se existir (totalStudyTime/totalStudyTimeSeconds)
            // ou soma os 'last_timestamp' da coleção de matrículas
            let watchedTime = Number(student.totalStudyTime || student.totalStudyTimeSeconds) || 0;
            if (watchedTime === 0) {
                watchedTime = userEnrollments.reduce((acc, e) => acc + (Number(e.last_timestamp) || 0), 0);
            }
            
            return {
                id: student.id,
                uid: student.uid,
                full_name: student.full_name || 'Sem nome',
                email: student.email || 'Sem e-mail',
                role: student.role || 'user',
                ativo: student.ativo !== false,
                coursesCount,
                certificatesCount,
                watchedTime,
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getPendingCourses");
        return [];
    }
    try {
        const pendingStatusSnap = await adminDb.collection('courses')
            .where('status', '==', 'PENDENTE')
            .get()

        const pendingTrailerSnap = await adminDb.collection('courses')
            .where('trailer_review_status', '==', 'trailer_pending_review')
            .get()

        const coursesMap = new Map()
        pendingStatusSnap.docs.forEach(doc => {
            coursesMap.set(doc.id, { id: doc.id, ...doc.data() })
        })
        pendingTrailerSnap.docs.forEach(doc => {
            coursesMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        const courses = Array.from(coursesMap.values())

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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getPendingLessons");
        return [];
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getDeletionPendingCourses");
        return [];
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getDeletionPendingLessons");
        return [];
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado' };
    }
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
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'course_approved',
                title: 'Curso Aprovado!',
                message: `Seu curso "${courseData.title}" foi aprovado e agora está disponível para os alunos.`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado' };
    }
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
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'lesson_approved',
                title: 'Aula Aprovada!',
                message: `Sua aula "${lessonData.title}" foi aprovada e está disponível para os alunos.`,
                course_id: lessonData.course_id,
                lesson_id: lessonId,
                read: false,
                created_at: new Date()
            })
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado' };
    }
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
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'lesson_rejected',
                title: 'Aula Rejeitada',
                message: `Sua aula "${lessonData.title}" foi rejeitada. Motivo: ${reason}`,
                course_id: lessonData.course_id,
                lesson_id: lessonId,
                read: false,
                created_at: new Date()
            })
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado' };
    }
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
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'course_rejected',
                title: 'Curso Rejeitado',
                message: `Seu curso "${courseData.title}" foi rejeitado. Motivo: ${reason}`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const newStatus = !currentStatus
        await adminDb.collection('profiles').doc(uid).update({
            ativo: newStatus,
            updated_at: new Date()
        })

        // BUG-11 FIX: Revoga o refresh token server-side imediatamente ao banir.
        // Sem isso, o cookie de sessão Firebase permanece válido por até 1h.
        // O getSessionUser usa verifySessionCookie(token, true) que checa revogação.
        if (!newStatus) {
            try {
                await adminAuth.revokeRefreshTokens(uid)
            } catch (revokeErr) {
                // Não deve bloquear o ban — apenas loga o erro de revogação.
                console.error('[toggleUserStatus] Falha ao revogar tokens:', revokeErr)
            }
        }

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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getSalesLogs");
        return [];
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em approveCourseDeletion");
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        const courseData = courseDoc.data()

        if (!courseDoc.exists) {
            return { success: false, error: "Curso não encontrado." }
        }

        const lessonsSnapshot = await adminDb.collection('lessons').where('course_id', '==', courseId).get()

        // Deleta o asset do vídeo de introdução primeiro
        if (courseData?.intro_video_asset_id) {
            const muxResult = await deleteMuxAsset(courseData.intro_video_asset_id)
            if (muxResult.error) {
                console.error(`[approveCourseDeletion] Erro ao deletar intro_video_asset:`, muxResult.error)
                return { success: false, error: muxResult.error }
            }
        }

        // Deleta os assets de cada aula
        for (const lessonDoc of lessonsSnapshot.docs) {
            const lessonData = lessonDoc.data()
            if (lessonData?.mux_asset_id) {
                const muxResult = await deleteMuxAsset(lessonData.mux_asset_id)
                if (muxResult.error) {
                    console.error(`[approveCourseDeletion] Erro ao deletar lesson asset ${lessonData.mux_asset_id}:`, muxResult.error)
                    return { success: false, error: muxResult.error }
                }
            }
        }

        // Agora deleta os registros no Firestore
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em rejectCourseDeletion");
        return { success: false, error: 'Não autorizado' };
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em approveLessonDeletion");
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const lessonDoc = await adminDb.collection('lessons').doc(lessonId).get()
        const lessonData = lessonDoc.data()

        if (!lessonDoc.exists) {
            return { success: false, error: "Aula não encontrada." }
        }

        // Deleta o asset no Mux antes de remover do Firestore
        if (lessonData?.mux_asset_id) {
            const muxResult = await deleteMuxAsset(lessonData.mux_asset_id)
            if (muxResult.error) {
                console.error(`[approveLessonDeletion] Erro ao deletar Mux asset:`, muxResult.error)
                return { success: false, error: muxResult.error }
            }
        }

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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em rejectLessonDeletion");
        return { success: false, error: 'Não autorizado' };
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em getAllCourses");
        return [];
    }
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
                image_url: data.image_url || data.imageUrl || data.image || null,
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado' };
    }
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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado', message: '' };
    }
    try {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        await adminDb.collection('profiles').doc(teacherId).update({
            teacher_status: newStatus,
            updated_at: new Date()
        })

        await adminDb.collection('notifications').add({
            user_id: teacherId,
            type: action === 'approve' ? 'teacher_approved' : 'teacher_rejected',
            title: action === 'approve' ? 'Solicitação Aprovada' : 'Solicitação Rejeitada',
            message: action === 'approve'
                ? 'Sua solicitação para ser professor foi aprovada! Você já pode criar cursos.'
                : 'Sua solicitação para ser professor foi rejeitada. Entre em contato para mais informações.',
            read: false,
            created_at: new Date()
        })

        revalidatePath('/admin/teachers')

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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada");
        return { success: false, error: 'Não autorizado', message: '' };
    }
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

        // BUG-11 FIX: Revoga sessão Firebase imediatamente — sem isso o cookie
        // permanece válido por até 1h mesmo após o ban.
        try {
            await adminAuth.revokeRefreshTokens(teacherId)
        } catch (revokeErr) {
            console.error('[banTeacher] Falha ao revogar tokens:', revokeErr)
        }

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
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        console.error("Tentativa de acesso não autorizado detectada em reactivateTeacher");
        return { success: false, error: 'Não autorizado', message: '' };
    }
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
 * Busca detalhes completos de um aluno para o Admin Dashboard.
 * Inclui dados cadastrais (Asaas), acadêmicos (progresso) e segurança (MFA).
 */
export async function getStudentDetails(uid: string) {
    try {
        const userSession = await getSessionUser()
        if (!userSession || userSession.role !== 'admin') {
            throw new Error('Acesso negado: Apenas administradores podem ver detalhes de alunos.')
        }

        // 1. Dados de Perfil do Firestore
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        if (!profileDoc.exists) {
            throw new Error('Perfil não encontrado.')
        }
        const profileData = profileDoc.data() as any

        // 2. Dados de Segurança (Firebase Auth Admin)
        const authUser = await adminAuth.getUser(uid)
        const mfaStatus = profileData.mfaEnabled === true
        const lastLogin = authUser.metadata.lastSignInTime

        // 3. Dados Acadêmicos — busca apenas cursos onde o aluno está matriculado
        const enrollmentsSnap = await adminDb.collection('enrollments')
            .where('user_id', '==', uid)
            .get()

        const courseIds = [...new Set(enrollmentsSnap.docs.map(d => d.data().course_id).filter(Boolean))] as string[]

        const coursesMap = new Map()
        const lessonsCountByCourse = new Map()

        if (courseIds.length > 0) {
            // Busca apenas os cursos do aluno (em chunks de 30)
            const courseChunks: string[][] = []
            for (let i = 0; i < courseIds.length; i += 30) {
                courseChunks.push(courseIds.slice(i, i + 30))
            }
            const courseSnapshots = await Promise.all(
                courseChunks.map(chunk =>
                    adminDb.collection('courses').where('__name__', 'in', chunk).get()
                )
            )
            courseSnapshots.forEach(snap =>
                snap.docs.forEach(doc => coursesMap.set(doc.id, { id: doc.id, ...doc.data() }))
            )

            // Busca lições aprovadas apenas desses cursos
            const lessonChunks: string[][] = []
            for (let i = 0; i < courseIds.length; i += 30) {
                lessonChunks.push(courseIds.slice(i, i + 30))
            }
            const lessonSnapshots = await Promise.all(
                lessonChunks.map(chunk =>
                    adminDb.collection('lessons')
                        .where('course_id', 'in', chunk)
                        .where('status', '==', 'APROVADO')
                        .get()
                )
            )
            lessonSnapshots.forEach(snap =>
                snap.docs.forEach(doc => {
                    const cid = doc.data().course_id
                    lessonsCountByCourse.set(cid, (lessonsCountByCourse.get(cid) || 0) + 1)
                })
            )
        }

        const academicData = enrollmentsSnap.docs.map(doc => {
            const data = doc.data()
            const course = coursesMap.get(data.course_id)
            const completedCount = data.completed_lessons?.length || 0
            const totalCount = lessonsCountByCourse.get(data.course_id) || 0
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            const certificate = profileData.concluded_courses?.find((c: any) => c.courseId === data.course_id)

            return {
                courseId: data.course_id,
                courseTitle: course?.title || 'Curso N/A',
                progress,
                completedCount,
                totalCount,
                isConcluded: progress === 100,
                certificateCode: certificate?.credentialId || null,
                concludedAt: certificate?.date_conclusao || null
            }
        })

        // 4. Montar Objeto Final
        return JSON.parse(JSON.stringify({
            success: true,
            student: {
                uid: profileData.uid,
                username: profileData.username || 'N/A',
                fullName: profileData.full_name || 'N/A',
                email: profileData.email,
                phone: profileData.phone || profileData.mobilePhone || 'N/A',
                role: profileData.role,
                ativo: profileData.ativo !== false,
                createdAt: profileData.created_at ? parseFirebaseDate(profileData.created_at)?.toISOString() : null,
                address: {
                    cep: profileData.cep || profileData.postalCode || null,
                    logradouro: profileData.logradouro || profileData.address || profileData.rua || null,
                    numero: profileData.numero || profileData.addressNumber || null,
                    complemento: profileData.complemento || profileData.complement || null,
                    bairro: profileData.bairro || profileData.province || null,
                    cidade: profileData.cidade || profileData.city || null,
                    uf: profileData.uf || profileData.state || profileData.estado || null,
                },
                security: {
                    mfaEnabled: mfaStatus,
                    lastLogin: lastLogin,
                    emailVerified: authUser.emailVerified
                },
                academic: academicData
            }
        }))
    } catch (error: any) {
        console.error('Error fetching student details:', error)
        return { success: false, error: error.message || 'Falha ao buscar detalhes do aluno.' }
    }
}

/**
 * Busca detalhes completos de um professor para o Admin Dashboard.
 */
export async function getTeacherDetails(uid: string) {
    try {
        const userSession = await getSessionUser()
        if (!userSession || userSession.role !== 'admin') {
            throw new Error('Acesso negado: Apenas administradores podem ver detalhes de professores.')
        }

        // Helper para mascaramento de dados sensíveis (A-05)
        const maskSensitiveData = (value: any) => {
            if (!value) return 'N/A'
            const str = String(value).trim()
            if (str.length <= 4) return '****'
            return '*'.repeat(str.length - 4) + str.slice(-4)
        }

        // 1. Dados de Perfil do Firestore
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        if (!profileDoc.exists) {
            throw new Error('Perfil não encontrado.')
        }
        const profileData = profileDoc.data() as any

        // 2. Dados de Segurança (Firebase Auth Admin)
        const authUser = await adminAuth.getUser(uid)
        const mfaStatus = profileData.mfaEnabled === true
        const lastLogin = authUser.metadata.lastSignInTime

        // 3. Dados Profissionais (Cursos)
        const coursesSnap = await adminDb.collection('courses')
            .where('teacher_id', '==', uid)
            .get()
        
        const courses = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate().toISOString() : null
        }))

        // 4. Montar Objeto Final (Padrão Industrial com Mascaramento A-05)
        return JSON.parse(JSON.stringify({
            success: true,
            teacher: {
                uid: profileData.uid || uid,
                username: profileData.username || 'N/A',
                fullName: profileData.full_name || 'N/A',
                email: profileData.email,
                phone: profileData.phone || profileData.mobilePhone || 'N/A',
                cpfCnpj: maskSensitiveData(profileData.cpf_cnpj),
                role: profileData.role,
                ativo: profileData.ativo !== false,
                teacherStatus: profileData.teacher_status || 'active',
                createdAt: profileData.created_at ? parseFirebaseDate(profileData.created_at)?.toISOString() : null,
                address: {
                    cep: profileData.cep || profileData.postalCode || null,
                    logradouro: profileData.logradouro || profileData.address || profileData.rua || null,
                    numero: profileData.numero || profileData.addressNumber || null,
                    complemento: profileData.complemento || profileData.complement || null,
                    bairro: profileData.bairro || profileData.province || null,
                    cidade: profileData.cidade || profileData.city || null,
                    uf: profileData.uf || profileData.state || profileData.estado || null,
                },
                pix_key: maskSensitiveData(profileData.pix_key),
                bank: {
                    name: profileData.bank_name || null,
                    agency: maskSensitiveData(profileData.bank_agency),
                    account: maskSensitiveData(profileData.bank_account),
                    type: profileData.bank_account_type || null,
                },
                security: {
                    mfaEnabled: mfaStatus,
                    lastLogin: lastLogin,
                    emailVerified: authUser.emailVerified
                },
                courses: courses
            }
        }))
    } catch (error: any) {
        console.error('Error fetching teacher details:', error)
        return { success: false, error: error.message || 'Falha ao buscar detalhes do professor.' }
    }
}

/**
 * Aprova um trailer pendente de um curso APROVADO.
 * Gera playback ID público no Mux, mapeia campos temporários para principais,
 * limpa campos temporários e notifica o professor.
 */
export async function approveTrailerAction(courseId: string) {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()
        const courseData = courseDoc.data()

        if (!courseDoc.exists || !courseData) {
            return { success: false, error: 'Curso não encontrado.' }
        }

        const pendingAssetId = courseData.pendingTrailerAssetId
        if (!pendingAssetId) {
            return { success: false, error: 'Nenhum trailer pendente para aprovar.' }
        }

        // Gera playback ID público no Mux
        const { ensurePublicPlaybackId } = await import('@/app/actions/mux')
        const playbackResult = await ensurePublicPlaybackId(pendingAssetId)
        if (playbackResult.error || !playbackResult.playback_id) {
            return { success: false, error: playbackResult.error || 'Falha ao gerar playback ID público.' }
        }

        // Mapeia campos temporários para principais
        await courseRef.update({
            intro_video_url: courseData.pendingTrailerUrl || '',
            intro_video_mux_id: courseData.pendingTrailerMuxId || '',
            intro_video_asset_id: courseData.pendingTrailerAssetId || '',
            intro_video_playback_id: playbackResult.playback_id,
            pendingTrailerUrl: null,
            pendingTrailerMuxId: null,
            pendingTrailerAssetId: null,
            pendingTrailerPlaybackId: null,
            trailer_review_status: 'APROVADO',
            updated_at: new Date()
        })

        // Notifica professor
        if (courseData.teacher_id) {
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'trailer_approved',
                title: 'Trailer Aprovado!',
                message: `O novo trailer do seu curso "${courseData.title}" foi aprovado e já está visível para os alunos.`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
        }

        revalidatePath('/admin/all-courses')
        revalidatePath('/course')
        revalidatePath('/dashboard-student')
        return { success: true }
    } catch (error) {
        console.error("Error approving trailer:", error)
        return { success: false, error: "Falha ao aprovar trailer." }
    }
}

/**
 * Rejeita um trailer pendente de um curso APROVADO.
 * Remove o asset do Mux, limpa campos temporários e notifica o professor.
 */
export async function rejectTrailerAction(courseId: string, reason: string) {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()
        const courseData = courseDoc.data()

        if (!courseDoc.exists || !courseData) {
            return { success: false, error: 'Curso não encontrado.' }
        }

        const pendingAssetId = courseData.pendingTrailerAssetId

        // Apaga o vídeo pendente no Mux
        if (pendingAssetId) {
            const { deleteMuxAsset } = await import('@/app/actions/mux')
            const muxResult = await deleteMuxAsset(pendingAssetId)
            if (muxResult.error) {
                console.error('[rejectTrailerAction] Erro ao deletar Mux asset:', muxResult.error)
            }
        }

        // Limpa campos temporários e salva rejeição
        await courseRef.update({
            pendingTrailerUrl: null,
            pendingTrailerMuxId: null,
            pendingTrailerAssetId: null,
            pendingTrailerPlaybackId: null,
            trailer_review_status: 'REJEITADO',
            motivoRejeicaoTrailer: reason,
            updated_at: new Date()
        })

        // Notifica professor
        if (courseData.teacher_id) {
            await adminDb.collection('notifications').add({
                user_id: courseData.teacher_id,
                type: 'trailer_rejected',
                title: 'Trailer Rejeitado',
                message: `O novo trailer do seu curso "${courseData.title}" foi rejeitado. Motivo: ${reason}`,
                course_id: courseId,
                read: false,
                created_at: new Date()
            })
        }

        revalidatePath('/admin/all-courses')
        return { success: true }
    } catch (error) {
        console.error("Error rejecting trailer:", error)
        return { success: false, error: "Falha ao rejeitar trailer." }
    }
}

/**
 * Remove o trailer ativo de um curso (apaga asset no Mux e limpa campos principais).
 */
export async function deleteActiveTrailerAction(courseId: string) {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const courseRef = adminDb.collection('courses').doc(courseId)
        const courseDoc = await courseRef.get()
        const courseData = courseDoc.data()

        if (!courseDoc.exists || !courseData) {
            return { success: false, error: 'Curso não encontrado.' }
        }

        // Apaga o asset ativo no Mux
        if (courseData.intro_video_asset_id) {
            const { deleteMuxAsset } = await import('@/app/actions/mux')
            const muxResult = await deleteMuxAsset(courseData.intro_video_asset_id)
            if (muxResult.error) {
                console.error('[deleteActiveTrailerAction] Erro ao deletar Mux asset:', muxResult.error)
            }
        }

        // Limpa campos principais
        await courseRef.update({
            intro_video_url: '',
            intro_video_mux_id: '',
            intro_video_asset_id: '',
            intro_video_playback_id: '',
            trailer_review_status: null,
            updated_at: new Date()
        })

        revalidatePath('/admin/all-courses')
        return { success: true }
    } catch (error) {
        console.error("Error deleting active trailer:", error)
        return { success: false, error: "Falha ao deletar trailer ativo." }
    }
}

/**
 * Busca detalhes completos de um curso para o modal de visualização do admin.
 * Suporta paginação incremental: retorna apenas `page * pageSize` lessons
 * no total, corretamente agrupadas por módulo.
 */
export async function getCourseFullDetailsAdmin(courseId: string, page: number = 1, pageSize: number = 10) {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
        return { success: false, error: 'Não autorizado' };
    }
    try {
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) {
            return { success: false, error: 'Curso não encontrado.' }
        }
        const courseData = courseDoc.data()!

        const lessonsSnap = await adminDb.collection('lessons')
            .where('course_id', '==', courseId)
            .orderBy('position', 'asc')
            .get()

        const allLessons = lessonsSnap.docs.map(doc => {
            const d = doc.data()
            return {
                id: doc.id,
                title: d.title,
                type: d.type || 'video',
                status: d.status,
                duration: d.duration,
                position: d.position,
                module_id: d.module_id || 'sem-modulo',
                module_title: d.module_title || 'Sem módulo',
                is_quiz: d.is_quiz || false,
            }
        }) as any[]

        const totalCount = allLessons.length

        // Aplica paginação: page * pageSize define quantas lessons incluir
        const limit = page * pageSize
        const paginatedLessons = allLessons.slice(0, limit)

        // Agrupa as lessons paginadas por módulo
        const moduleMap = new Map<string, { id: string; title: string; lessons: any[] }>()
        for (const lesson of paginatedLessons) {
            const moduleId = lesson.module_id
            const moduleTitle = lesson.module_title
            if (!moduleMap.has(moduleId)) {
                moduleMap.set(moduleId, { id: moduleId, title: moduleTitle, lessons: [] })
            }
            moduleMap.get(moduleId)!.lessons.push({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                status: lesson.status,
                duration: lesson.duration,
                position: lesson.position,
                is_quiz: lesson.is_quiz,
            })
        }

        // Se o curso tiver campo modules (da criação), respeita a ordem original
        const courseModules = (courseData as any).modules
        const modules = courseModules?.length > 0
            ? courseModules.map((m: any) => ({
                id: m.id,
                title: m.title,
                lessons: moduleMap.get(m.id)?.lessons || []
            })).filter((m: any) => m.lessons.length > 0)
            : Array.from(moduleMap.values())

        return JSON.parse(JSON.stringify({
            success: true,
            course: { id: courseDoc.id, ...courseData },
            modules,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize),
            hasMore: limit < totalCount,
            pageSize,
        }))
    } catch (error) {
        console.error("Error getting course full details:", error)
        return { success: false, error: "Falha ao buscar detalhes do curso." }
    }
}
