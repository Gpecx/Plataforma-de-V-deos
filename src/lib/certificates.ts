import { adminDb } from '@/lib/firebase-admin'

export function generateVerificationCode(): string {
  const chars = 'ABCDEF0123456789'
  let code = 'PP-2026-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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
  const studentName = profileData?.full_name || 'Aluno'

  const instructorName = courseData?.instructorName || courseData?.instructor_name || 'Fred'
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
