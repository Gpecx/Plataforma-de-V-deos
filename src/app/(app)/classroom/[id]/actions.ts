'use server'

import { adminDb } from '@/lib/firebase-admin'
import { serializeFirestoreData } from '@/lib/date-utils'
import { ICertificate } from '@/lib/types/certificate'



function generateVerificationCode(): string {
    const hexChars = '0123456789ABCDEF'
    let code = 'PP-2026-'
    for (let i = 0; i < 6; i++) {
        code += hexChars[Math.floor(Math.random() * hexChars.length)]
    }
    return code
}

export async function getUserCourseProgress(userId: string, courseId: string) {
    try {
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', userId)
            .where('course_id', '==', courseId)
            .limit(1)
            .get()
        
        if (!enrollmentsSnapshot.empty) {
            const enrollmentDoc = enrollmentsSnapshot.docs[0]
            const data = enrollmentDoc.data()
            return {
                success: true,
                completedLessons: data?.completed_lessons || [],
                lastLessonId: data?.last_lesson_id || null,
                lastTimestamp: data?.last_timestamp || 0
            }
        }
        
        return {
            success: true,
            completedLessons: [],
            lastLessonId: null,
            lastTimestamp: 0
        }
    } catch (err: any) {
        console.error("Erro ao buscar progresso:", err)
        return { success: false, error: err.message }
    }
}

export async function toggleLessonCompletion(
    courseId: string, 
    lessonId: string, 
    userId: string, 
    completed: boolean
) {
    try {
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', userId)
            .where('course_id', '==', courseId)
            .limit(1)
            .get()
        
        if (enrollmentsSnapshot.empty) {
            return { success: false, error: 'Matrícula não encontrada' }
        }
        
        const enrollmentDoc = enrollmentsSnapshot.docs[0]
        const enrollmentRef = adminDb.collection('enrollments').doc(enrollmentDoc.id)
        const data = enrollmentDoc.data()
        const currentCompleted = data?.completed_lessons || []
        
        let newCompleted: string[]
        if (completed) {
            if (!currentCompleted.includes(lessonId)) {
                newCompleted = [...currentCompleted, lessonId]
            } else {
                newCompleted = currentCompleted
            }
        } else {
            newCompleted = currentCompleted.filter((id: string) => id !== lessonId)
        }
        
        await enrollmentRef.set({
            completed_lessons: newCompleted,
            updated_at: new Date()
        }, { merge: true })
        
        const lessonsSnapshot = await adminDb.collection('lessons')
            .where('course_id', '==', courseId)
            .where('status', '==', 'APROVADO')
            .get()
        const totalLessons = lessonsSnapshot.size
        
        const percentage = newCompleted.length / totalLessons
        const completed100 = percentage >= 1.0
        
        if (completed100) {
            const courseDoc = await adminDb.collection('courses').doc(courseId).get()
            const courseData = courseDoc.data()
            const courseTitle = courseData?.title || 'Curso'
            
            await processCourseCompletion(userId, courseId, courseTitle)
        }
        
        return { success: true, completedLessons: newCompleted, completedPercentage: percentage }
    } catch (err: any) {
        console.error("Erro ao salvar progresso:", err)
        return { success: false, error: err.message }
    }
}

async function processCourseCompletion(userId: string, courseId: string, courseTitle: string) {
    try {
        const profileDoc = await adminDb.collection('profiles').doc(userId).get()
        const profileData = profileDoc.exists ? profileDoc.data() : null
        const concludedCourses = profileData?.concluded_courses || []
        
        const alreadyConcluded = concludedCourses.some((c: any) => c.courseId === courseId)
        if (alreadyConcluded) return
        
        // Busca o nome do instrutor para incluir no certificado
        let teacherName = 'Professor(a) Responsável'
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (courseDoc.exists) {
            const courseData = courseDoc.data()
            const teacherId = courseData?.teacher_id
            if (teacherId) {
                const teacherDoc = await adminDb.collection('profiles').doc(teacherId).get()
                if (teacherDoc.exists) {
                    teacherName = teacherDoc.data()?.full_name || teacherDoc.data()?.displayName || teacherName
                }
            }
        }
        
        const credentialId = generateVerificationCode()
        const newConcluded = {
            courseId,
            courseTitle,
            teacherName,
            date_conclusao: new Date().toISOString(),
            credentialId
        }
        
        await adminDb.collection('profiles').doc(userId).set({
            concluded_courses: [...concludedCourses, newConcluded]
        }, { merge: true })
    } catch (err) {
        console.error('Erro ao processar conclusão:', err)
    }
}

export async function saveLessonProgress(
    courseId: string,
    lessonId: string,
    userId: string,
    timestamp: number
) {
    try {
        const enrollmentsSnapshot = await adminDb.collection('enrollments')
            .where('user_id', '==', userId)
            .where('course_id', '==', courseId)
            .limit(1)
            .get()
        
        if (enrollmentsSnapshot.empty) {
            return { success: false, error: 'Matrícula não encontrada' }
        }
        
        const enrollmentDoc = enrollmentsSnapshot.docs[0]
        
        await adminDb.collection('enrollments').doc(enrollmentDoc.id).set({
            last_lesson_id: lessonId,
            last_timestamp: timestamp,
            updated_at: new Date()
        }, { merge: true })
        
        return { success: true }
    } catch (err: any) {
        console.error("Erro ao salvar progresso (server):", err)
        return { success: false, error: err.message }
    }
}

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
            return { success: false, error: 'ACCESS_DENIED' }
        }

        // 2. Busca curso
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) {
            return { success: false, error: 'COURSE_NOT_FOUND' }
        }
        
        const courseRawData = courseDoc.data() || {}
        const courseData = serializeFirestoreData({ 
            id: courseDoc.id, 
            ...courseRawData,
        })

        // 3. Busca lições
        const lessonsSnapshot = await adminDb.collection('lessons')
            .where('course_id', '==', courseId)
            .orderBy('position', 'asc')
            .get()
        
        const isTeacher = courseRawData.teacher_id === userId
        let lessonsData = lessonsSnapshot.docs.map(doc => {
            const data = doc.data()
            data.id = doc.id
            return serializeFirestoreData(data)
        })

        // Filtrar lições para estudantes (não admin, não teacher)
        if (!isAdmin && !isTeacher) {
            lessonsData = lessonsData.filter((l: any) => l.status === 'APROVADO')
        }

        // 4. Busca progresso do usuário
        const progressResult = await getUserCourseProgress(userId, courseId)
        const completedLessons = progressResult.success ? progressResult.completedLessons : []

        return { 
            success: true, 
            course: courseData, 
            lessons: lessonsData,
            completedLessons,
            username: profileData?.username || null,
            progress: {
                lastLessonId: progressResult.lastLessonId,
                lastTimestamp: progressResult.lastTimestamp
            }
        }

    } catch (err: any) {
        console.error("Erro no servidor ao carregar conteúdo:", err)
        return { success: false, error: err.message || 'INTERNAL_ERROR' }
    }
}

export async function processCertificateIssuance(courseId: string, userId: string): Promise<{ success: boolean; data: ICertificate | null; error?: string; percentage?: number }> {
    try {
        // 1. Buscar progresso do usuário
        const progressResult = await getUserCourseProgress(userId, courseId)
        if (!progressResult.success) {
            return { success: false, data: null, error: 'Erro ao buscar progresso' }
        }

        // 2. Buscar total de lições do curso
        const lessonsSnapshot = await adminDb.collection('lessons')
            .where('course_id', '==', courseId)
            .where('status', '==', 'APROVADO')
            .get()

        const totalLessons = lessonsSnapshot.size
        const completedLessons = progressResult.completedLessons?.length || 0

        if (totalLessons === 0) {
            return { success: false, data: null, error: 'Nenhuma lição encontrada para este curso' }
        }

        // 3. Validar se 100% foi concluído
        const percentage = completedLessons / totalLessons
        if (percentage < 1.0) {
            return { success: false, data: null, error: 'Curso não concluído', percentage: Math.round(percentage * 100) }
        }

        // 4. Buscar dados do curso
        const courseDoc = await adminDb.collection('courses').doc(courseId).get()
        if (!courseDoc.exists) {
            return { success: false, data: null, error: 'Curso não encontrado' }
        }

        const courseData = courseDoc.data()
        const courseTitle = courseData?.title || 'Curso'

        // 5. Buscar dados do perfil do aluno (nome)
        const profileDoc = await adminDb.collection('profiles').doc(userId).get()
        const profileData = profileDoc.exists ? profileDoc.data() : null
        const studentName = profileData?.full_name || 'Aluno'

        // 6. Buscar nome do instrutor
        let instructorName = courseData?.instructorName || courseData?.instructor_name
        if (!instructorName && courseData?.teacher_id) {
            const teacherDoc = await adminDb.collection('profiles').doc(courseData.teacher_id).get()
            if (teacherDoc.exists) {
                instructorName = teacherDoc.data()?.full_name || teacherDoc.data()?.displayName
            }
        }
        if (!instructorName) instructorName = 'Fred'

        // 7. Gerar código de verificação
        const verificationCode = generateVerificationCode()

        // 8. Criar objeto do certificado
        const certificate: ICertificate = {
            userId,
            courseId,
            courseTitle,
            studentName,
            instructorName,
            issueDate: new Date().toISOString(),
            date_conclusao: new Date().toISOString(),
            verificationCode,
            credentialId: verificationCode,
            percentage: 100,
            status: 'pending_rules'
        }

        // 9. Tentativa de gravação no Firestore (comentada aguardando liberação das Security Rules)
        /*
        try {
            await adminDb.collection('certificates').add({
                ...certificate,
                createdAt: new Date()
            })
            certificate.status = 'issued'
        } catch (firestoreError) {
            console.error('Certificado preparado mas gravação no Firestore aguardando liberação das Security Rules:', firestoreError)
        }
        */

        return { success: true, data: certificate }

    } catch (err: any) {
        console.error("Erro ao processar certificação:", err)
        return { success: false, data: null, error: err.message || 'Erro interno' }
    }
}
