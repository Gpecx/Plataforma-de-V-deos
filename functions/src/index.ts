import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

function generateMfaEmailHTML(pin: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu código PowerPlay</title>
</head>
<body style="margin:0;padding:0;background-color:#0D1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ⚡ Seu código de acesso PowerPlay está pronto. Use-o em até 5 minutos.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D1117;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#161B22;border-radius:12px;border:1px solid #21262D;border-top:3px solid #22c55e;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36">
                      <rect width="32" height="32" rx="4" fill="#0D1117"/>
                      <path d="M4 4L28 16L4 28Z" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-width="2.5" stroke-linejoin="round"/>
                      <path d="M13.5 9L9 17H12L11 23L16 15H13L13.5 9Z" fill="#22c55e"/>
                    </svg>
                  </td>
                  <td style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:1px;vertical-align:middle;">POWERPLAY</td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:13px;color:#8B949E;letter-spacing:0.5px;">Verificação de Identidade</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#21262D;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#E6EDF3;line-height:1.6;">
                Use o código abaixo para confirmar seu login:
              </p>
              <div style="background-color:#0D2818;border:1px solid #22c55e;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;color:#22c55e;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">
                  ${pin}
                </span>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#8B949E;line-height:1.5;">
                Este código expira em <strong style="color:#E6EDF3;">5 minutos</strong>.
              </p>
              <p style="margin:0;font-size:12px;color:#6E7681;line-height:1.5;">
                Se você não solicitou este código, ignore este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="height:1px;background-color:#22c55e;opacity:0.2;margin-bottom:20px;"></div>
              <p style="margin:0;font-size:11px;color:#6E7681;text-align:center;">
                © 2026 POWERPLAY – VoltsMind Holding. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
    .region("us-central1")
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
    .region("us-central1")
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

/**
 * Função sendMfaEmail: Dispara e-mail com PIN quando um novo código é gerado.
 */
/**
 * Função sendMfaEmail: Gera um PIN, envia e-mail e salva no Firestore quando
 * o campo mfaCodeRequested no perfil do usuário é alterado para true.
 */
export const sendMfaEmail = functions
    .region("us-central1")
    .firestore
    .document("profiles/{userId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        if (!newValue || !previousValue) return;

        // Gatilho: mfaCodeRequested mudou de false/missing para true
        const wasRequested = previousValue.mfaCodeRequested;
        const isRequested = newValue.mfaCodeRequested;

        if (isRequested === true && wasRequested !== true) {
            const userId = context.params.userId;
            const email = newValue.email;

            console.log(`[MFA] Iniciando processo para: ${userId} | email: ${email}`);
            
            if (!email) {
                console.error("[MFA] E-mail não encontrado no perfil:", userId);
                return;
            }

            // 1. Gerar o código
            const pin = Math.floor(100000 + Math.random() * 900000).toString();

            // 2. Enviar o e-mail
            const gmailEmail = functions.config().gmail?.email;
            const gmailPassword = functions.config().gmail?.password;

            if (!gmailEmail || !gmailPassword) {
                console.error("Gmail credentials not configured in functions.config().");
                return;
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailEmail,
                    pass: gmailPassword,
                },
            });

            const mailOptions = {
                from: `"PowerPlay" <${gmailEmail}>`,
                to: email,
                subject: "⚡ Seu código de verificação PowerPlay",
                html: generateMfaEmailHTML(pin),
                text: `Seu código PowerPlay: ${pin}. Expira em 5 minutos.`,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`[Success] MFA email sent to ${email}`);

                // 3. Salvar no perfil do usuário (campo mfa_auth_temp)
                // As Firestore Rules permitem que o dono leia seu próprio perfil.
                await admin.firestore().collection("profiles").doc(userId).update({
                    mfa_auth_temp: {
                        code: pin,
                        expiresAt: Date.now() + 300000, // 5 minutos
                    }
                });

                console.log(`[MFA] PIN salvo em profiles/${userId}.mfa_auth_temp`);
            } catch (error) {
                console.error("[MFA] Falha no processo de envio/salvamento:", error);
            }
        }
    });

/**
 * Função verifyMfaCode (HTTPS Callable): Valida o PIN inserido pelo usuário,
 * realiza a limpeza dos dados temporários e libera o login.
 */
export const verifyMfaCode = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
    // 1. Verificar autenticação
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "O usuário deve estar logado.");
    }

    const uid = context.auth.uid;
    const { code } = data;

    if (!code || code.length !== 6) {
        throw new functions.https.HttpsError("invalid-argument", "Código inválido.");
    }

    try {
        // 2. Buscar PIN na coleção isolada temp_mfa_codes
        const mfaDoc = await admin.firestore().collection("temp_mfa_codes").doc(uid).get();

        if (!mfaDoc.exists) {
            return { success: false, error: "Código não encontrado ou já expirado." };
        }

        const mfaData = mfaDoc.data()!;

        // 3. Validar expiração
        if (Date.now() > mfaData.expiresAt) {
            await admin.firestore().collection("temp_mfa_codes").doc(uid).delete().catch(() => {});
            return { success: false, error: "Este código expirou." };
        }

        // 4. Validar valor do PIN
        if (mfaData.code !== code) {
            return { success: false, error: "Código de verificação incorreto." };
        }

        // 5. Sucesso: deleta o código da coleção isolada
        await admin.firestore().collection("temp_mfa_codes").doc(uid).delete();

        return { success: true };
    } catch (error) {
        console.error("Erro na verificação de MFA:", error);
        throw new functions.https.HttpsError("internal", "Erro interno ao validar o código.");
    }
});

/**
 * Função cancelMfaRequest (HTTPS Callable): Limpa os dados de MFA caso o usuário desista do login.
 */
export const cancelMfaRequest = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "O usuário deve estar logado.");
    }

    const uid = context.auth.uid;

    try {
        await admin.firestore().collection("temp_mfa_codes").doc(uid).delete().catch(() => {});
        await admin.firestore().collection("profiles").doc(uid).update({
            mfaCodeRequested: false
        }).catch(() => {});

        return { success: true };
    } catch (error) {
        console.error("Erro ao cancelar MFA:", error);
        throw new functions.https.HttpsError("internal", "Erro ao cancelar a requisição.");
    }
});
