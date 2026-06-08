import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

let resend: Resend | null = null
if (resendApiKey) {
    resend = new Resend(resendApiKey)
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'nao-responder@powerplay.cursos'
const FROM_NAME = 'PowerPlay'

// Plano gratuito do Resend: apenas e-mails verificados (onboarding@resend.dev, admin, domínio verificado).
// Em dev, use RESEND_TEST_EMAIL para redirecionar todos os disparos.
const TEST_EMAIL = process.env.RESEND_TEST_EMAIL || ''

function resolveToEmail(to: string): string {
    if (TEST_EMAIL && to !== TEST_EMAIL) {
        console.log(`[mail.ts] Modo teste: redirecionando e-mail de "${to}" para "${TEST_EMAIL}"`)
        return TEST_EMAIL
    }
    return to
}

export async function sendCourseReleasedEmail(params: {
    studentEmail: string
    studentName: string
    courseName: string
    courseId: string
}) {
    if (!resend) return
    const { studentEmail, studentName, courseName, courseId } = params
    const to = resolveToEmail(studentEmail)
    const accessLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/classroom/${courseId}`

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject: `🎓 ${courseName} — Seu curso foi liberado!`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Olá, ${studentName}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Seu acesso ao curso foi liberado com sucesso.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
<tr><td>
<h2 style="font-size: 18px; font-weight: 700; margin: 0 0 4px; color: #1a1a1a;">${courseName}</h2>
<p style="font-size: 14px; color: #777; margin: 0;">Acesso válido por <strong>12 meses</strong> a partir da compra.</p>
</td></tr>
</table>
<a href="${accessLink}" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Acessar Curso</a>
<p style="font-size: 13px; color: #999; margin-top: 32px;">Se você não realizou esta compra, ignore este e-mail.</p>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de curso liberado:', error)
    }
}

export async function sendNewSaleEmail(params: {
    teacherEmail: string
    teacherName: string
    studentName: string
    courseName: string
}) {
    if (!resend) return
    const { teacherEmail, teacherName, studentName, courseName } = params
    const to = resolveToEmail(teacherEmail)

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject: `💰 Nova venda — ${courseName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Parabéns, ${teacherName}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Você acaba de realizar uma nova venda na plataforma.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
<tr><td>
<p style="font-size: 14px; color: #555; margin: 0 0 4px;"><strong>Aluno:</strong> ${studentName}</p>
<p style="font-size: 14px; color: #555; margin: 0;"><strong>Curso:</strong> ${courseName}</p>
</td></tr>
</table>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/dashboard-teacher" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Ir para o Painel</a>
<p style="font-size: 13px; color: #999; margin-top: 32px;">Continue produzindo conteúdo de qualidade e transformando carreiras!</p>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de nova venda:', error)
    }
}

export async function sendNewChatMessageEmail(params: {
    teacherEmail: string
    teacherName: string
    studentName: string
    courseName: string
    messagePreview: string
}) {
    if (!resend) return
    const { teacherEmail, teacherName, studentName, courseName, messagePreview } = params
    const to = resolveToEmail(teacherEmail)
    const truncated = messagePreview.length > 150 ? messagePreview.slice(0, 150) + '…' : messagePreview

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject: `💬 ${studentName} enviou uma mensagem — ${courseName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Olá, ${teacherName}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">O aluno <strong>${studentName}</strong> enviou uma nova mensagem sobre o curso <strong>${courseName}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #1D5F31;">
<tr><td>
<p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${truncated}"</p>
</td></tr>
</table>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/dashboard-teacher/chat" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Responder Aluno</a>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de nova mensagem:', error)
    }
}

export async function sendChatReplyEmail(params: {
    studentEmail: string
    studentName: string
    teacherName: string
    courseName: string
    messagePreview: string
}) {
    if (!resend) return
    const { studentEmail, studentName, teacherName, courseName, messagePreview } = params
    const to = resolveToEmail(studentEmail)
    const truncated = messagePreview.length > 150 ? messagePreview.slice(0, 150) + '…' : messagePreview

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject: `📩 ${teacherName} respondeu sua dúvida — ${courseName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Olá, ${studentName}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">O professor <strong>${teacherName}</strong> respondeu sua mensagem sobre o curso <strong>${courseName}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #1D5F31;">
<tr><td>
<p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${truncated}"</p>
</td></tr>
</table>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/dashboard-student/chat" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Ver Resposta</a>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de resposta do chat:', error)
    }
}
