import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

/**
 * Trigger que observa novas vendas e cria notificações em tempo real para o professor.
 */
export const onNewSaleNotification = functions
    .region("us-central1")
    .firestore
    .document("sales/{saleId}")
    .onWrite(async (change, context) => {
        // Apenas para criações (confirmadas)
        if (!change.after.exists || change.before.exists) return;

        const saleData = change.after.data();
        if (!saleData) return;

        const { teacherId, courseName, amount } = saleData;

        if (!teacherId) {
            console.error("Venda sem teacherId identificado:", context.params.saleId);
            return;
        }

        try {
            await admin.firestore().collection("notifications").add({
                teacherId,
                type: 'sale',
                message: `Nova venda: O curso "${courseName}" foi adquirido por R$ ${amount}.`,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`[Success] Notificação de venda enviada para: ${teacherId}`);
        } catch (error) {
            console.error("[Error] Falha ao criar notificação de venda:", error);
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
                subject: "Seu código de verificação PowerPlay",
                text: `Seu código de verificação PowerPlay é: ${pin}. Este código expira em 5 minutos.`,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`[Success] MFA email sent to ${email}`);

                // 3. Salvar no Perfil (Só após envio com sucesso) - Manobra Técnica para evitar erro de permissão
                await admin.firestore().collection("profiles").doc(userId).update({
                    mfa_auth_temp: {
                        code: pin,
                        expiresAt: Date.now() + 300000, // 5 minutos
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    }
                });

                console.log(`[MFA] PIN salvo no documento de perfil para: ${userId}`);
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
        // 2. Buscar PIN no Firestore
        const pinDoc = await admin.firestore().collection("temp_mfa_codes").doc(uid).get();

        if (!pinDoc.exists) {
            return { success: false, error: "Código não encontrado ou já expirado." };
        }

        const pinData = pinDoc.data();

        // 3. Validar expiração
        if (Date.now() > pinData?.expiresAt) {
            await admin.firestore().collection("temp_mfa_codes").doc(uid).delete().catch(() => {});
            return { success: false, error: "Este código expirou." };
        }

        // 4. Validar valor do PIN
        if (pinData?.code !== code) {
            return { success: false, error: "Código de verificação incorreto." };
        }

        // 5. Sucesso: Limpeza
        // Deletar PIN
        await admin.firestore().collection("temp_mfa_codes").doc(uid).delete().catch(() => {});
        // Resetar mfaCodeRequested no perfil
        await admin.firestore().collection("profiles").doc(uid).update({
            mfaCodeRequested: false
        }).catch(() => {});

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
