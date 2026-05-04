const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function inspectUser(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        console.log(`\n--- Inspeção de Usuário: ${email} ---`);
        console.log('UID:', user.uid);
        console.log('MFA Enrolled Factors:', JSON.stringify(user.multiFactor?.enrolledFactors || [], null, 2));
        
        const profile = await admin.firestore().collection('profiles').doc(user.uid).get();
        console.log('Firestore Profile Data:', JSON.stringify(profile.data(), null, 2));
    } catch (e) {
        console.error('Erro ao inspecionar:', e.message);
    }
}

const targetEmail = 'danielferreiraaraujo2026@gmail.com';
inspectUser(targetEmail).then(() => process.exit(0));
