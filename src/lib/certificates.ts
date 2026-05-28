import { adminDb } from '@/lib/firebase-admin'
import { randomBytes } from 'crypto'

// M-03: Use cryptographically secure random bytes instead of Math.random()
export function generateVerificationCode(): string {
  return 'PP-2026-' + randomBytes(3).toString('hex').toUpperCase()
}

export async function validateAndGetCertificate(courseId: string, userId: string) {
  // Check progress
  const enrollmentsSnapshot = await adminDb.collection('enrollments')
    .where('user_id', '==', userId)
    .where('course_id', '==', courseId)
    .limit(1)
    .get()

  if (enrollmentsSnapshot.empty) {
    return { valid: false, error: 'Matrícula não encontrada' }
  }

  const enrollmentData = enrollmentsSnapshot.docs[0].data()
  const completedLessons = enrollmentData.completed_lessons?.length || 0

  const lessonsSnapshot = await adminDb.collection('lessons')
    .where('course_id', '==', courseId)
    .where('status', '==', 'APROVADO')
    .get()

  const totalLessons = lessonsSnapshot.size

  if (totalLessons === 0) {
    return { valid: false, error: 'Nenhuma lição encontrada' }
  }

  const percentage = completedLessons / totalLessons
  if (percentage < 1.0) {
    return { valid: false, error: 'Curso não concluído', percentage: Math.round(percentage * 100) }
  }

  const courseDoc = await adminDb.collection('courses').doc(courseId).get()
  if (!courseDoc.exists) {
    return { valid: false, error: 'Curso não encontrado' }
  }

  const courseData = courseDoc.data()
  const courseTitle = courseData?.title || 'Curso'

  const profileDoc = await adminDb.collection('profiles').doc(userId).get()
  const profileData = profileDoc.exists ? profileDoc.data() : null

  if (profileData?.ativo === false) {
    return { valid: false, error: 'Acesso negado: sua conta está inativa ou suspensa.' }
  }

  const studentName = profileData?.full_name || 'Aluno'

  // Melhora a resolução do nome do professor
  let instructorName = courseData?.instructorName || courseData?.instructor_name
  if (!instructorName && courseData?.teacher_id) {
    const teacherDoc = await adminDb.collection('profiles').doc(courseData.teacher_id).get()
    if (teacherDoc.exists) {
      instructorName = teacherDoc.data()?.full_name || teacherDoc.data()?.displayName
    }
  }
  
  if (!instructorName) {
    instructorName = 'Instrutor da Plataforma'
  }

  const duration = courseData?.duration || courseData?.carga_horaria || 12

  // Check if already has a code in profile
  const concludedCourses = profileData?.concluded_courses || []
  const existingConcluded = concludedCourses.find((c: any) => c.courseId === courseId)
  
  const verificationCode = existingConcluded?.credentialId || generateVerificationCode()
  const issueDate = existingConcluded?.date_conclusao || new Date().toISOString()

  return {
    valid: true,
    certificate: {
      studentName,
      courseTitle,
      instructorName,
      duration,
      issueDate,
      verificationCode,
    }
  }
}
