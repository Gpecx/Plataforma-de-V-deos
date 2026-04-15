import * as admin from 'firebase-admin';

// Tenta limpar a private key se ela vier com escapamento de string
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '');

if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
            });
            console.log('Firebase Admin: Inicializado com sucesso.');
        } catch (error) {
            console.error('Firebase Admin: Erro durante a inicialização:', error);
        }
    } else {
        // No build do GitHub Actions/Docker as chaves podem não estar presentes
        console.warn('Firebase Admin: Variáveis de ambiente ausentes. O Admin SDK não será inicializado agora (comum em tempo de build).');
    }
}

/**
 * Helper para exportar serviços de forma segura.
 * Se o app não estiver inicializado, retorna um Proxy que só joga erro se for acessado.
 */
function createSafeService<T>(getService: () => T, serviceName: string): T {
    return new Proxy({} as any, {
        get(_, prop) {
            if (!admin.apps.length) {
                // Se estivermos em produção e sem chaves, aí sim é um erro crítico.
                // Durante o build, apenas emitimos o erro se algo tentar usar o serviço.
                throw new Error(`Firebase Admin: O serviço ${serviceName} foi acessado mas o SDK não foi inicializado. Verifique se as variáveis de ambiente FIREBASE_* estão configuradas.`);
            }
            const service = getService();
            return (service as any)[prop];
        }
    }) as T;
}

// Exportamos as instâncias usando o helper seguro
export const adminDb = createSafeService(() => admin.firestore(), 'Firestore');
export const adminAuth = createSafeService(() => admin.auth(), 'Auth');
export const adminStorage = createSafeService(() => admin.storage(), 'Storage');