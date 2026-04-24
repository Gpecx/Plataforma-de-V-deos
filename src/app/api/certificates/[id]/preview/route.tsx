import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'
import { validateAndGetCertificate } from '@/lib/certificates'
import { generatePDF } from '@/lib/pdf-generator'

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

    // URL para renderização via Playwright
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const secret = process.env.CERTIFICATE_RENDER_SECRET
    
    const renderUrl = `${protocol}://${host}/certificate-render/${courseId}?userId=${user.uid}&secret=${secret}`
    
    console.log('Generating high-fidelity PDF via Playwright at:', renderUrl)
    
const pdfBuffer = await generatePDF(renderUrl)
 
    const blob = new Blob([pdfBuffer as unknown as BlobPart], { type: 'application/pdf' })

    return new NextResponse(blob, {
      headers: {
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Erro ao gerar PDF', { status: 500 })
  }
}
