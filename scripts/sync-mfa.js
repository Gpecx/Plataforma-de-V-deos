const admin = require('firebase-admin');
const path = require('path');

/**
 * Script de Sincronização e Ativação Obrigatória de MFA
 * 
 * Este script garante que o campo 'mfaEnabled' esteja setado como 'true'
 * para todos os usuários, já que o 2FA é agora um requisito obrigatório
 * da plataforma PowerPlay.
 */

if (!admin.apps.length) {
    try {
        const serviceAccount = require('../serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin inicializado.');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function enforceMFA() {
    console.log('\n🛡️ Aplicando obrigatoriedade de MFA em todos os perfis...\n');
    
    let totalUpdated = 0;
    let profilesCount = 0;

    try {
        const profilesSnap = await db.collection('profiles').get();
        profilesCount = profilesSnap.size;

        for (const doc of profilesSnap.docs) {
            const data = doc.data();
            const email = data.email || 'N/A';
            
            // Força mfaEnabled: true se não estiver ou se for diferente de true
            if (data.mfaEnabled !== true) {
                console.log(`[FORCING TRUE] Usuário: ${email} | ID: ${doc.id}`);
                await doc.ref.update({
                    mfaEnabled: true,
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });
                totalUpdated++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🏁 SINCRONIZAÇÃO DE OBRIGATORIEDADE CONCLUÍDA');
        console.log('='.repeat(50));
        console.log(`📊 Total de Perfis:    ${profilesCount}`);
        console.log(`🔄 Perfis Ativados:    ${totalUpdated}`);
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('❌ Erro durante a execução:', error);
    }
}

enforceMFA().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
