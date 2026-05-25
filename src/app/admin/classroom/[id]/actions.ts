'use server'

import { adminDb } from '@/lib/firebase-admin'
import { revalidatePath } from 'next/cache'
import { suspendLesson } from '@/app/actions/admin'
import { getSessionUser } from '@/app/actions/auth'

function serializeFirestoreData(data: any): any {
    if (data === null || data === undefined) return null
    if (data instanceof Date) return data.toISOString()
    if (typeof data === 'object' && data._seconds !== undefined) {
        return new Date(data._seconds * 1000).toISOString()
    }
    if (Array.isArray(data)) {
        return data.map(item => serializeFirestoreData(item))
    }
    if (typeof data === 'object') {
        const result: any = {}
        for (const key of Object.keys(data)) {
            result[key] = serializeFirestoreData(data[key])
        }
        return result
    }
    return data
}

export async function getAdminClassroomData(courseId: string) {
    const session = await getSessionUser()
    if (!session || (session.role !== 'admin' && session.role !== 'teacher')) {
        return { success: false, error: 'UNAUTHORIZED' }
    }

    try {
        // Busca curso
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) {
            return { success: false, error: 'COURSE_NOT_FOUND' }
        }
        
        const courseRawData = courseDoc.data() || {}
        const courseData = serializeFirestoreData({ 
            id: courseDoc.id, 
            ...courseRawData,
        })

        // Busca todas as lições SEM filtro de status
        const lessonsSnapshot = await adminDb.collection('lessons')
            .where('course_id', '==', courseId)
            .get()
        
        const lessonsData = lessonsSnapshot.docs.map(doc => {
            const data = doc.data()
            data.id = doc.id
            return serializeFirestoreData(data)
        })

        // Ordena por módulo (position) → lição (position)
        const courseModules: { id: string; position: number }[] = courseRawData.modules || []
        const modulePositionMap = new Map<string, number>()
        courseModules.forEach((m) => modulePositionMap.set(m.id, m.position))
        lessonsData.sort((a: any, b: any) => {
            const aModPos = modulePositionMap.get(a.module_id) ?? 999
            const bModPos = modulePositionMap.get(b.module_id) ?? 999
            if (aModPos !== bModPos) return aModPos - bModPos
            return (a.position ?? 0) - (b.position ?? 0)
        })

        // Busca nome do professor
        let teacherName = 'Professor N/A'
        if (courseRawData.teacher_id) {
            const profileDoc = await adminDb.collection('profiles').doc(courseRawData.teacher_id).get()
            const profileData = profileDoc.data()
            teacherName = profileData?.full_name || profileData?.name || 'Professor N/A'
        }

        return { 
            success: true, 
            course: { ...courseData, teacherName }, 
            lessons: lessonsData 
        }

    } catch (err: any) {
        console.error("Erro no servidor ao carregar conteúdo:", err)
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

export async function adminSuspendLesson(lessonId: string) {
    return suspendLesson(lessonId)
}
