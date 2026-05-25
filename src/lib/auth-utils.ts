import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserSession {
    uid: string;
    email?: string;
    role: UserRole;
    emailVerified?: boolean;
}

/**
 * Gets the current user session on the server side.
 * Verifies the 'session' cookie (Firebase Session Cookie) and fetches user role from Firestore.
 */
export async function getServerSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(token, true);
        const uid = decodedToken.uid;
        const tokenRole = decodedToken.role as UserRole | undefined;

        const userRecord = await adminAuth.getUser(uid)
        
        const profileDoc = await adminDb.collection('profiles').doc(uid).get();
        const profileData = profileDoc.data();

        // Bloqueio de acesso para usuários inativos ou banidos
        if (profileData?.ativo === false || (profileData?.role === 'teacher' && profileData?.teacher_status === 'banned')) {
            console.warn(`[getServerSession] Acesso bloqueado: Usuário ${uid} está inativo ou banido.`);
            return null;
        }
        
        // A-03: EXCLUSIVE source of truth: Custom Claims.
        // Do not use profileData?.role as fallback for authorization.
        const role = (tokenRole as UserRole) || 'student';

        return {
            uid,
            email: decodedToken.email,
            role,
            emailVerified: userRecord.emailVerified || false,
        };
    } catch (error) {
        console.error('getServerSession: Error verifying session cookie:', error);
        return null;
    }
}
