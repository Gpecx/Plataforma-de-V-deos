import * as admin from 'firebase-admin';

// ─── Diagnóstico de Runtime ──────────────────────────────────────────────────
// Loga apenas a PRESENÇA das variáveis, nunca os seus valores.
// Usar estes logs para confirmar a configuração no Cloud Run.
console.log('[firebase-admin] Status das credenciais (runtime):', {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
});

// Normaliza a private key: trata tanto "\n" (escape literal) quanto quebras reais de linha.
// Também remove aspas externas que possam ter sido adicionadas ao configurar a variável.
const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/^"([\s\S]*)"$/, '$1')      // Remove aspas envolventes (ex: "-----BEGIN...")
    ?.replace(/\\n/g, '\n');           // Converte \n literal em quebra de linha real

if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
                    || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
            });
            console.log('[firebase-admin] Inicializado com sucesso.');
        } catch (error) {
            console.error('[firebase-admin] Erro durante a inicialização:', error);
        }
    } else {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            // Em produção, a ausência das credenciais é um erro crítico.
            // O log aqui ajuda a diagnosticar rapidamente nos logs do Cloud Run.
            console.error(
                '[firebase-admin] CRÍTICO: Credenciais ausentes em produção! ' +
                'Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY ' +
                'nas variáveis de ambiente do Cloud Run.'
            );
        } else {
            // Em build/local sem .env.local completo, é apenas um aviso.
            console.warn(
                '[firebase-admin] Credenciais ausentes. ' +
                'O Admin SDK não será inicializado (comum em tempo de build).'
            );
        }
    }
}

/**
 * Helper para exportar serviços de forma segura via Proxy.
 * Se o SDK não estiver inicializado, lança um erro descritivo no momento de uso.
 */
function createSafeService<T>(getService: () => T, serviceName: string): T {
    return new Proxy({} as any, {
        get(_, prop) {
            if (!admin.apps.length) {
                throw new Error(
                    `[firebase-admin] O serviço "${serviceName}" foi acessado mas o SDK não foi inicializado. ` +
                    `Verifique as variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no Cloud Run.`
                );
            }
            const service = getService();
            return (service as any)[prop];
        }
    }) as T;
}

export const adminDb = createSafeService(() => admin.firestore(), 'Firestore');
export const adminAuth = createSafeService(() => admin.auth(), 'Auth');
export const adminStorage = createSafeService(() => admin.storage(), 'Storage');