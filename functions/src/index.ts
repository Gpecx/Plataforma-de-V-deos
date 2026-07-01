import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Configuração robusta do Transporter com Pool e Timeouts explícitos.
// Criado sob demanda para garantir que os secrets SMTP_USER/SMTP_PASS já
// estejam disponíveis em process.env no momento da execução.
function createTransporter() {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    pool: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

interface VendaLog {
    alunoId: string
    cursoId: string
    professorId: string
    valorBruto: number
    statusPagamento: string
    billingType?: string
    dataCriacao?: FirebaseFirestore.Timestamp
}

/**
 * Trigger que observa vendas em vendas_logs e cria notificações em tempo real para o professor.
 * Só dispara quando o statusPagamento TRANSICIONA para 'pago' (ex: webhook do Asaas).
 */
export const onNewSaleNotification = functions
    .region("southamerica-east1")
    .firestore
    .document("vendas_logs/{saleId}")
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data() as VendaLog | undefined;
        const afterData = change.after.data() as VendaLog | undefined;

        if (!beforeData || !afterData) {
            functions.logger.warn("Venda sem dados:", context.params.saleId);
            return;
        }

        const wasPaid = beforeData.statusPagamento === 'pago';
        const isNowPaid = afterData.statusPagamento === 'pago';
        if (wasPaid || !isNowPaid) return;

        const { professorId, cursoId, valorBruto } = afterData;

        if (!professorId) {
            functions.logger.warn("Venda sem professorId:", context.params.saleId);
            return;
        }

        try {
            let courseName = "Curso";
            try {
                const courseDoc = await admin.firestore().collection("courses").doc(cursoId).get();
                if (courseDoc.exists) {
                    courseName = courseDoc.data()?.title || courseDoc.data()?.shortTitle || courseName;
                }
            } catch (err) {
                functions.logger.warn("Erro ao buscar nome do curso:", err);
            }

            await admin.firestore().collection("notifications").add({
                teacherId: professorId,
                type: 'sale',
                message: `Nova venda: O curso "${courseName}" foi adquirido por R$ ${Number(valorBruto).toFixed(2)}.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            functions.logger.info(`[Success] Notificação de venda enviada para: ${professorId}`);
        } catch (error) {
            functions.logger.error("[Error] Falha ao criar notificação de venda:", error);
        }
    });

/**
 * Exemplo de trigger para novas mensagens (Opcional no momento, conforme requisito)
 */
export const onNewMessageNotification = functions
    .region("southamerica-east1")
    .firestore
    .document("comments/{commentId}")
    .onCreate(async (snapshot, context) => {
        const commentData = snapshot.data();
        if (!commentData) return;

        // Supondo que o comentário tenha teacherId-destino se for dúvida
        const { targetTeacherId, studentName, courseName } = commentData;

        if (targetTeacherId) {
            await admin.firestore().collection("notifications").add({
                teacherId: targetTeacherId,
                type: 'message',
                message: `${studentName} enviou uma nova dúvida no curso ${courseName}.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    });

async function checkRateLimit(identifier: string, type: 'ip' | 'email', options: { max: number, windowMinutes: number }) {
  const docId = `${type}_${identifier.replace(/\//g, '_')}`; 
  const ref = admin.firestore().collection("_otp_rate_limits").doc(docId);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    const now = Date.now();
    const windowMs = options.windowMinutes * 60 * 1000;
    
    if (!doc.exists) {
      transaction.set(ref, {
        count: 1,
        resetAt: now + windowMs
      });
      return;
    }
    
    const data = doc.data();
    if (!data) return;
    
    if (now > data.resetAt) {
      transaction.set(ref, {
        count: 1,
        resetAt: now + windowMs
      });
    } else {
      if (data.count >= options.max) {
        throw new functions.https.HttpsError("resource-exhausted", "Muitas tentativas. Aguarde antes de solicitar um novo código.");
      }
      transaction.update(ref, {
        count: admin.firestore.FieldValue.increment(1)
      });
    }
  });
}

export const sendEmailVerificationCode = functions
  .region("southamerica-east1")
  .runWith({ secrets: ["SMTP_USER", "SMTP_PASS"] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    
    const email = data.email;
    if (!email || typeof email !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Email inválido.");
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const ip = context.rawRequest.ip || "unknown";
    
    await checkRateLimit(ip, 'ip', { max: 5, windowMinutes: 15 });
    await checkRateLimit(normalizedEmail, 'email', { max: 5, windowMinutes: 60 });
    
    const pin = crypto.randomInt(100000, 1000000).toString().padStart(6, '0');
    
    await admin.firestore().collection("_email_otps").doc(normalizedEmail).set({
      code: pin,
      expiresAt: Date.now() + 600000,
      attempts: 0,
      userId: context.auth.uid,
      createdAt: Date.now(),
    });
    
    try {
      const smtpUser = process.env.SMTP_USER || "";
      await createTransporter().sendMail({
        from: `"PowerPlay" <${smtpUser}>`,
        replyTo: smtpUser,
        to: normalizedEmail,
        subject: `${pin} é o seu código de verificação PowerPlay`,
        text: `⚡ PowerPlay - Verificação de Identidade\n\nUse o código abaixo para confirmar seu cadastro:\n\n${pin}\n\nEste código expira em 10 minutos.\n\nSe você não solicitou este código, ignore este e-mail.`,
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Verificação de Identidade PowerPlay</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d;">
  <span style="display:none; max-height:0; overflow:hidden; opacity:0; color:#0d0d0d;">Seu código PowerPlay é ${pin}. Expira em 10 minutos.</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#141414; border:1px solid #262626; border-radius:12px;">
          <tr>
            <td style="padding:40px 32px; font-family:Arial,Helvetica,sans-serif; text-align:center;">
              <div style="font-size:30px; font-weight:bold; color:#ffffff; margin:0 0 4px;"><span style="color:#ffc400;">⚡</span> PowerPlay</div>
              <div style="font-size:13px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; color:#00ff88; margin:0 0 28px;">Verificação de Identidade</div>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#cccccc;">Use o código abaixo para confirmar seu cadastro:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px;">
                <tr>
                  <td style="background-color:#0a0a0a; border:2px solid #00ff88; border-radius:10px; padding:20px 32px; font-size:38px; font-weight:bold; letter-spacing:10px; color:#00ff88; font-family:'Courier New',Courier,monospace;">${pin}</td>
                </tr>
              </table>
              <p style="margin:0 0 20px; font-size:14px; font-weight:bold; color:#ffc400;">Este código expira em 10 minutos.</p>
              <p style="margin:0; font-size:12px; line-height:1.6; color:#888888;">Se você não solicitou este código, ignore este e-mail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
      console.log(`[MFA] E-mail enviado com sucesso para ${normalizedEmail}`);
      return { success: true };
    } catch (error: any) {
      const code = error?.code || error?.name || "UNKNOWN";
      console.error(`[MFA] Erro ao enviar MFA para ${normalizedEmail}. Tipo:`, code);
      
      if (code === 'EAUTH') {
        console.error("[MFA] Erro de Autenticação SMTP. Verifique as credenciais.");
      } else if (code === 'EENVELOPE') {
        console.error("[MFA] Erro de Envelope SMTP. O e-mail de destino pode ser inválido ou rejeitado pelo servidor.");
      } else if (code === 'ETIMEDOUT') {
        console.error("[MFA] Timeout na conexão SMTP. O servidor demorou muito para responder.");
      }
      
      throw new functions.https.HttpsError("internal", "Erro ao enviar e-mail.");
    }
  });

export const verifyEmailCode = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
    }
    
    const { email, code } = data;
    if (!email || !code || typeof email !== "string" || typeof code !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Dados inválidos.");
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const otpRef = admin.firestore().collection("_email_otps").doc(normalizedEmail);
    
    const result = await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(otpRef);
      if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Código expirado ou não encontrado. Solicite um novo.");
      }
      
      const otpData = doc.data();
      if (!otpData) {
        throw new functions.https.HttpsError("not-found", "Código inválido.");
      }
      
      if (Date.now() > otpData.expiresAt) {
        transaction.delete(otpRef);
        throw new functions.https.HttpsError("deadline-exceeded", "Código expirado ou não encontrado. Solicite um novo.");
      }
      
      if (otpData.attempts >= 5) {
        transaction.delete(otpRef);
        throw new functions.https.HttpsError("resource-exhausted", "Número máximo de tentativas excedido. Solicite um novo código.");
      }
      
      if (otpData.code !== code) {
        transaction.update(otpRef, {
          attempts: admin.firestore.FieldValue.increment(1)
        });
        throw new functions.https.HttpsError("invalid-argument", "Código incorreto.");
      }
      
      // Todas as leituras devem ocorrer antes de qualquer escrita na transação
      const profileRef = admin.firestore().collection("profiles").doc(context.auth!.uid);
      const profileDoc = await transaction.get(profileRef);
      const profileData = profileDoc.data();

      transaction.delete(otpRef);

      return {
        success: true,
        role: profileData?.role || 'student',
        teacher_status: profileData?.teacher_status
      };
    });
    
    return result;
  });

