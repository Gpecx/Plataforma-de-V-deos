import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        // Tentamos limpar a chave do .env se ela existir
        const rawKey = process.env.FIREBASE_PRIVATE_KEY;
        const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n').replace(/"/g, '') : undefined;

        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
            console.log('Firebase Admin: Tentando inicializar via Variáveis de Ambiente...');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                storageBucket: 'cursos-a5922.firebasestorage.app'
            });
        } else {
            // Se as variáveis falharem, usamos o arquivo físico (Mais seguro para você agora)
            console.log('Firebase Admin: Usando arquivo serviceAccountKey.json');
            const serviceAccount = require('../../serviceAccountKey.json');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: 'cursos-a5922.firebasestorage.app'
            });
        }
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();