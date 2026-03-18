'use server'

import { adminDb } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'

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
        return {
            ...settingsDoc.data(),
            id: settingsDoc.id
        }
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
            
        return teachersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
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
                date: e.created_at
            }
        })

        const totalGross = detailedPayments.reduce((acc, p) => acc + p.grossValue, 0)
        const totalPlatform = detailedPayments.reduce((acc, p) => acc + p.platformShare, 0)
        const totalTeacher = detailedPayments.reduce((acc, p) => acc + p.teacherShare, 0)

        return {
            totalGross,
            totalPlatform,
            totalTeacher,
            payments: detailedPayments,
            platformTaxPercent
        }
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
            
        return profilesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error("Error getting teacher students:", error)
        return []
    }
}
