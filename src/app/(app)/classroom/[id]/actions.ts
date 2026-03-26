'use server'

import { adminDb } from '@/lib/firebase-admin'

export async function getClassroomData(courseId: string, userId: string) {
    try {
        // 1. Verificação de acesso: checa se o aluno possui o curso
        // Busca o perfil para checar se é admin ou se tem curso na lista
        const profileDoc = await adminDb.collection('profiles').doc(userId).get()
        const profileData = profileDoc.exists ? profileDoc.data() : null
        
        const isAdmin = profileData?.role === 'admin'
        const purchasedFromProfile = profileData?.cursos_comprados || []

        // Busca na coleção de enrollments (fonte de verdade no dashboard)
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', userId)
            .where('course_id', '==', courseId)
            .get()

        const hasEnrollment = !enrollmentsSnapshot.empty
        
        const hasCourse = isAdmin || 
                         hasEnrollment || 
                         purchasedFromProfile.includes(courseId)

        if (!hasCourse) {
            console.log('Classroom Access Server DEBUG - DENIED:', { isAdmin, hasEnrollment, purchasedFromProfile, courseId, userId })
            return { success: false, error: 'ACCESS_DENIED' }
        }

        // 2. Busca curso
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) {
            return { success: false, error: 'COURSE_NOT_FOUND' }
        }
        
        const courseRawData = courseDoc.data() || {}
        const courseData = { 
            id: courseDoc.id, 
            ...courseRawData,
            created_at: courseRawData.created_at?.toDate ? courseRawData.created_at.toDate().toISOString() : null,
            updated_at: courseRawData.updated_at?.toDate ? courseRawData.updated_at.toDate().toISOString() : null,
        }

        // 3. Busca lições
        const lessonsSnapshot = await adminDb.collection('lessons')
            .where('course_id', '==', courseId)
            .orderBy('position', 'asc')
            .get()
        
        const isTeacher = courseRawData.teacher_id === userId
        let lessonsData = lessonsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : null,
                updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : null,
            }
        })

        // Filtrar lições para estudantes (não admin, não teacher)
        if (!isAdmin && !isTeacher) {
            lessonsData = lessonsData.filter((l: any) => l.status === 'APROVADO')
        }

        return { 
            success: true, 
            course: courseData, 
            lessons: lessonsData 
        }

    } catch (err: any) {
        console.error("Erro no servidor ao carregar conteúdo:", err)
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}
