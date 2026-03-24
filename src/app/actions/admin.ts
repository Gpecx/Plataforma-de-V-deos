'use server'

import { adminDb } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'
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
            
        const teachers = teachersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

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
 * Lista todos os usuários que são alunos (role == 'student' ou sem role).
 */
export async function getAllStudents() {
    try {
        const studentsSnap = await adminDb.collection('profiles')
            .where('role', '==', 'student')
            .get()
            
        const students = studentsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return JSON.parse(JSON.stringify(students))
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
 * Aprova apenas o curso (aulas continuam pendentes).
 */
// ... dentro da função approveCourse
export async function approveCourse(courseId: string) {
    try {
        // 1. Atualiza apenas o curso
        const courseRef = adminDb.collection('courses').doc(courseId)
        await courseRef.update({ 
            status: 'APROVADO',
            updated_at: new Date()
        })

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
        await adminDb.collection('lessons').doc(lessonId).update({
            status: 'APROVADO',
            approved_at: new Date(),
            updated_at: new Date()
        })
        
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
        await adminDb.collection('lessons').doc(lessonId).update({
            status: 'REJEITADO',
            motivoRejeicao: reason,
            updated_at: new Date()
        })
        
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
        await adminDb.collection('courses').doc(courseId).update({
            status: 'REJEITADO',
            motivoRejeicao: reason,
            updated_at: new Date()
        })
        
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
