import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'
import { validateAndGetCertificate } from '@/lib/certificates'
import { generatePDF } from '@/lib/pdf-generator'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    let user;
    try {
      user = await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
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
    
    // A-01: Remove userId from query string to prevent IDOR
    const renderUrl = `${protocol}://${host}/certificate-render/${courseId}?secret=${secret}`
    
    // A-02: Secure logging - do not log the full URL (contains secret)
    // LGPD: não logar o uid do usuário (dado pessoal).
    console.log('[certificates] gerando PDF (preview)')
    
    // Pass session cookie to Playwright so it can authenticate as the user
    const domain = host.split(':')[0]
    const pdfBuffer = await generatePDF(renderUrl, [
      {
        name: 'session',
        value: token,
        domain: domain,
      }
    ])
 
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
