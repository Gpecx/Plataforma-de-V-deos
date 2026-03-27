import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Trigger que observa novas vendas e cria notificações em tempo real para o professor.
 */
export const onNewSaleNotification = functions.firestore
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
export const onNewMessageNotification = functions.firestore
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
