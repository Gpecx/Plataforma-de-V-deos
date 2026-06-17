import { Resend } from 'resend'
import { generateVerificationEmailHTML, generateResetPasswordEmailHTML } from './email-template'

// SEC: HTML escape for user data
function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

const resendApiKey = process.env.RESEND_API_KEY

let resend: Resend | null = null
if (resendApiKey) {
    resend = new Resend(resendApiKey)
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
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
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Olá, ${escapeHtml(studentName)}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Seu acesso ao curso foi liberado com sucesso.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
<tr><td>
<h2 style="font-size: 18px; font-weight: 700; margin: 0 0 4px; color: #1a1a1a;">${escapeHtml(courseName)}</h2>
<p style="font-size: 14px; color: #777; margin: 0;">Acesso válido por <strong>12 meses</strong> a partir da compra.</p>
</td></tr>
</table>
<a href="${escapeHtml(accessLink)}" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Acessar Curso</a>
<p style="font-size: 13px; color: #999; margin-top: 32px;">Se você não realizou esta compra, ignore este e-mail.</p>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.<br>
<span style="font-size:11px;color:#9ca3af;">Este e-mail foi enviado automaticamente pela PowerPlay Cursos.<br>
Para mais informações, consulte nossa <a href="https://powerplaycursos.com.br/privacidade" style="color:#6b7280;text-decoration:underline;">Política de Privacidade</a>.</span>
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
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Parabéns, ${escapeHtml(teacherName)}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Você acaba de realizar uma nova venda na plataforma.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
<tr><td>
<p style="font-size: 14px; color: #555; margin: 0 0 4px;"><strong>Aluno:</strong> ${escapeHtml(studentName)}</p>
<p style="font-size: 14px; color: #555; margin: 0;"><strong>Curso:</strong> ${escapeHtml(courseName)}</p>
</td></tr>
</table>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/dashboard-teacher" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Ir para o Painel</a>
<p style="font-size: 13px; color: #999; margin-top: 32px;">Continue produzindo conteúdo de qualidade e transformando carreiras!</p>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.<br>
<span style="font-size:11px;color:#9ca3af;">Este e-mail foi enviado automaticamente pela PowerPlay Cursos.<br>
Para mais informações, consulte nossa <a href="https://powerplaycursos.com.br/privacidade" style="color:#6b7280;text-decoration:underline;">Política de Privacidade</a>.</span>
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
            subject: `💬 ${escapeHtml(studentName)} enviou uma mensagem — ${escapeHtml(courseName)}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Olá, ${escapeHtml(teacherName)}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">O aluno <strong>${escapeHtml(studentName)}</strong> enviou uma nova mensagem sobre o curso <strong>${escapeHtml(courseName)}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #1D5F31;">
<tr><td>
<p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${escapeHtml(truncated)}"</p>
</td></tr>
</table>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/dashboard-teacher/chat" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Responder Aluno</a>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.<br>
<span style="font-size:11px;color:#9ca3af;">Este e-mail foi enviado automaticamente pela PowerPlay Cursos.<br>
Para mais informações, consulte nossa <a href="https://powerplaycursos.com.br/privacidade" style="color:#6b7280;text-decoration:underline;">Política de Privacidade</a>.</span>
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

export async function sendTeacherStatusEmail(params: {
    teacherEmail: string
    teacherName: string
    status: 'pending' | 'approved' | 'rejected'
    rejectionReason?: string
}) {
    if (!resend) return
    const { teacherEmail, teacherName, status, rejectionReason } = params
    const to = resolveToEmail(teacherEmail)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'

    let subject: string
    let heading: string
    let bodyHtml: string

    if (status === 'pending') {
        subject = `📋 ${escapeHtml(teacherName)}, seu cadastro foi recebido!`
        heading = `Olá, ${escapeHtml(teacherName)}!`
        bodyHtml = `
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Seu cadastro de professor foi recebido com sucesso e está em análise pela nossa equipe.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
<tr><td>
<p style="font-size: 14px; color: #555; margin: 0;"><strong>Status:</strong> <span style="color: #d97706;">Em análise</span></p>
<p style="font-size: 14px; color: #555; margin: 8px 0 0;">Assim que sua solicitação for analisada, você receberá uma notificação por e-mail.</p>
</td></tr>
</table>
<p style="font-size: 14px; color: #999; margin: 0;">Agradecemos pelo interesse em fazer parte do nosso time de instrutores!</p>`
    } else if (status === 'approved') {
        subject = `✅ ${escapeHtml(teacherName)}, sua solicitação foi aprovada!`
        heading = `Parabéns, ${escapeHtml(teacherName)}!`
        bodyHtml = `
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Sua solicitação para se tornar professor da PowerPlay foi <strong style="color: #1D5F31;">aprovada</strong>!</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
<tr><td>
<p style="font-size: 14px; color: #333; margin: 0 0 8px;">Você já pode acessar o painel do professor e começar a criar seus cursos.</p>
</td></tr>
</table>
<a href="${appUrl}/dashboard-teacher" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Acessar Painel do Professor</a>
<p style="font-size: 13px; color: #999; margin-top: 32px;">Estamos ansiosos para ver seu conteúdo na plataforma!</p>`
    } else {
        subject = `❌ ${escapeHtml(teacherName)}, sua solicitação foi revisada`
        heading = `Olá, ${escapeHtml(teacherName)}!`
        const safeReason = rejectionReason ? escapeHtml(rejectionReason) : '' // SEC
        const reasonBlock = rejectionReason
            ? `<table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #fecaca;">
<tr><td>
<p style="font-size: 14px; font-weight: 700; color: #991b1b; margin: 0 0 8px;">O que você precisa melhorar:</p>
<p style="font-size: 14px; color: #333; margin: 0;">${safeReason}</p>
</td></tr>
</table>`
            : ''
        bodyHtml = `
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">Seu cadastro de professor foi analisado e, infelizmente, não foi aprovado neste momento.</p>
${reasonBlock}
<p style="font-size: 14px; color: #999; margin: 24px 0 0;">Você pode refazer seu cadastro a qualquer momento com as melhorias sugeridas. Estamos à disposição para ajudar!</p>`
    }

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">${heading}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.<br>
<span style="font-size:11px;color:#9ca3af;">Este e-mail foi enviado automaticamente pela PowerPlay Cursos.<br>
Para mais informações, consulte nossa <a href="https://powerplaycursos.com.br/privacidade" style="color:#6b7280;text-decoration:underline;">Política de Privacidade</a>.</span>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de status do professor:', error)
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
            subject: `📩 ${escapeHtml(teacherName)} respondeu sua dúvida — ${escapeHtml(courseName)}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 8px; overflow: hidden;">
<tr><td style="padding: 48px 40px 32px;">
<h1 style="font-size: 24px; font-weight: 800; margin: 0 0 8px; color: #1a1a1a;">Olá, ${escapeHtml(studentName)}!</h1>
<p style="font-size: 16px; color: #555; margin: 0 0 24px;">O professor <strong>${escapeHtml(teacherName)}</strong> respondeu sua mensagem sobre o curso <strong>${escapeHtml(courseName)}</strong>.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #1D5F31;">
<tr><td>
<p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${escapeHtml(truncated)}"</p>
</td></tr>
</table>
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://powerplay.cursos'}/dashboard-student/chat" style="display: inline-block; background: #1D5F31; color: #ffffff; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 6px; text-decoration: none;">Ver Resposta</a>
</td></tr>
<tr><td style="padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #aaa; text-align: center;">
PowerPlay — Transformando precisão técnica em resultados estratégicos.<br>
<span style="font-size:11px;color:#9ca3af;">Este e-mail foi enviado automaticamente pela PowerPlay Cursos.<br>
Para mais informações, consulte nossa <a href="https://powerplaycursos.com.br/privacidade" style="color:#6b7280;text-decoration:underline;">Política de Privacidade</a>.</span>
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

export async function sendVerificationEmail(params: {
    to: string
    code: string
}) {
    if (!resend) return
    const { to, code } = params
    const recipient = resolveToEmail(to)

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: recipient,
            subject: '⚡ Seu código de verificação PowerPlay',
            html: generateVerificationEmailHTML(code),
            text: `Seu código PowerPlay: ${code}. Expira em 5 minutos.`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de verificação:', error)
    }
}

export async function sendResetPasswordEmail(params: {
    to: string
    resetLink: string
}) {
    if (!resend) return
    const { to, resetLink } = params
    const recipient = resolveToEmail(to)

    try {
        const data = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: recipient,
            subject: '🔐 Redefinição de Senha - PowerPlay',
            html: generateResetPasswordEmailHTML(resetLink),
            text: `Redefina sua senha PowerPlay acessando: ${resetLink}. Este link expira em 1 hora.`,
        })
        return data
    } catch (error) {
        console.error('[mail.ts] Erro ao enviar e-mail de redefinição de senha:', error)
    }
}
