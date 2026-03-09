import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID || "cursos-a5922",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
                storageBucket: 'cursos-a5922.firebasestorage.app'
            });
        } else {
            // Fallback para arquivo apenas se as variáveis não estiverem setadas (útil para dev local se o arquivo existir)
            console.warn('Firebase Admin: Usando fallback para arquivo serviceAccountKey.json');
            admin.initializeApp({
                credential: admin.credential.cert(require('../../serviceAccountKey.json')),
                storageBucket: 'cursos-a5922.firebasestorage.app'
            });
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
