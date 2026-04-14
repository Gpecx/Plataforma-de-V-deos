import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate'

async function getAuthUser() {
  const cookieStore = cookies()
  const token = (await cookieStore).get('session')?.value
  if (!token) return null

  try {
    return await adminAuth.verifySessionCookie(token, true)
  } catch (error) {
    return null
  }
}

function generateVerificationCode(): string {
  const chars = 'ABCDEF0123456789'
  let code = 'PP-2026-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function validateAndGetCertificate(courseId: string, userId: string) {
  const progressResult = await adminDb.collection('user_progress')
    .where('user_id', '==', userId)
    .where('course_id', '==', courseId)
    .get()

  if (progressResult.empty) {
    return { valid: false, error: 'Progresso não encontrado' }
  }

  const lessonsSnapshot = await adminDb.collection('lessons')
    .where('course_id', '==', courseId)
    .where('status', '==', 'APROVADO')
    .get()

  const totalLessons = lessonsSnapshot.size
  const progressData = progressResult.docs[0].data()
  const completedLessons = progressData.completed_lessons?.length || 0

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

  return {
    valid: true,
    certificate: {
      studentName,
      courseTitle,
      instructorName,
      issueDate: new Date().toISOString(),
      verificationCode: generateVerificationCode(),
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id: courseId } = await params

    const validation = await validateAndGetCertificate(courseId, user.uid)
    if (!validation.valid) {
      return new NextResponse(validation.error || 'Certificado inválido', { status: 400 })
    }

    if (!validation.certificate) {
      return new NextResponse('Dados do certificado não encontrados', { status: 404 })
    }

    const pdfStream = await renderToStream(
      <CertificateTemplate certificate={validation.certificate} />
    )

    const chunks: Uint8Array[] = []
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Erro ao gerar PDF', { status: 500 })
  }
}
