'use server'

import { adminDb } from '@/lib/firebase-admin'
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ICertificate } from '@/lib/types/certificate'

function generateVerificationCode(): string {
    const hexChars = '0123456789ABCDEF'
    let code = 'PP-2026-'
    for (let i = 0; i < 6; i++) {
        code += hexChars[Math.floor(Math.random() * hexChars.length)]
    }
    return code
}

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

export async function getUserCourseProgress(userId: string, courseId: string) {
    try {
        const progressDoc = await adminDb.collection('userProgress').doc(`${userId}_${courseId}`).get()
        
        if (progressDoc.exists) {
            const data = progressDoc.data()
            return {
                success: true,
                completedLessons: data?.completedLessons || [],
                lastLessonId: data?.lastLessonId || null,
                lastTimestamp: data?.lastTimestamp || 0
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
        const progressId = `${userId}_${courseId}`
        const progressRef = doc(db, 'userProgress', progressId)
        
        const progressDoc = await getDoc(progressRef)
        
        if (progressDoc.exists()) {
            const data = progressDoc.data()
            const currentCompleted = data?.completedLessons || []
            
            let newCompleted: string[]
            if (completed) {
                newCompleted = [...currentCompleted, lessonId]
            } else {
                newCompleted = currentCompleted.filter((id: string) => id !== lessonId)
            }
            
            await setDoc(progressRef, {
                userId,
                courseId,
                completedLessons: newCompleted,
                updatedAt: new Date()
            }, { merge: true })
        } else {
            if (completed) {
                await setDoc(progressRef, {
                    userId,
                    courseId,
                    completedLessons: [lessonId],
                    updatedAt: new Date()
                })
            }
        }
        
        return { success: true }
    } catch (err: any) {
        console.error("Erro ao salvar progresso:", err)
        return { success: false, error: err.message }
    }
}

export async function saveLessonProgress(
    courseId: string,
    lessonId: string,
    userId: string,
    timestamp: number
) {
    try {
        const progressId = `${userId}_${courseId}`
        await adminDb.collection('userProgress').doc(progressId).set({
            userId,
            courseId,
            lastLessonId: lessonId,
            lastTimestamp: timestamp,
            updatedAt: new Date()
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

        console.log('Classroom Access DEBUG:', { 
            userId, 
            courseId, 
            isAdmin, 
            hasEnrollment, 
            purchasedFromProfile, 
            hasCourse 
        })

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
        const instructorName = courseData?.instructorName || courseData?.instructor_name || 'Fred'

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
            verificationCode,
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
            console.log('Certificado preparado mas gravação no Firestore aguardando liberação das Security Rules:', firestoreError)
        }
        */

        return { success: true, data: certificate }

    } catch (err: any) {
        console.error("Erro ao processar certificação:", err)
        return { success: false, data: null, error: err.message || 'Erro interno' }
    }
}
