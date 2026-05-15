import { validateAndGetCertificate } from '@/lib/certificates'
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate'
import { notFound } from 'next/navigation'
import { getSessionUser } from '@/app/actions/auth'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ secret: string }>
}

export default async function CertificateRenderPage({ params, searchParams }: PageProps) {
  const { id: courseId } = await params
  const { secret } = await searchParams

  // Basic security check: secret must match env
  if (secret !== process.env.CERTIFICATE_RENDER_SECRET) {
    console.error('Unauthorized access to certificate render page')
    return notFound()
  }

  const session = await getSessionUser()
  if (!session) {
    console.error('No session found for certificate rendering')
    return notFound()
  }

  // A-01: Use session identity instead of URL parameter
  const userId = session.uid

  const result = await validateAndGetCertificate(courseId, userId)

  if (!result.valid || !result.certificate) {
    console.error('Invalid certificate for rendering:', result.error)
    return notFound()
  }

  const cert = result.certificate

  return (
    <div className="w-[1123px] h-[794px] bg-white overflow-hidden">
        {/* Force specific A4 dimensions for high-fidelity capture */}
      <CertificateTemplate 
        studentName={cert.studentName}
        courseName={cert.courseTitle}
        duration={cert.duration}
        credentialId={cert.verificationCode}
        date={new Date(cert.issueDate).toLocaleDateString('pt-BR')}
        teacherName={cert.instructorName}
      />
    </div>
  )
}
