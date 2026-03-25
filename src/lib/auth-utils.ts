import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserSession {
    uid: string;
    email?: string;
    role: UserRole;
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
        // Verify the session cookie
        const decodedToken = await adminAuth.verifySessionCookie(token, true);
        const uid = decodedToken.uid;
        const tokenRole = decodedToken.role as UserRole | undefined;

        // Fetch user profile from Firestore (fallback or for additional data)
        const profileDoc = await adminDb.collection('profiles').doc(uid).get();
        const profileData = profileDoc.data();
        
        // Priority: Custom Claim > Firestore > Default (student)
        const role = tokenRole || (profileData?.role as UserRole) || 'student';

        return {
            uid,
            email: decodedToken.email,
            role,
        };
    } catch (error) {
        console.error('getServerSession: Error verifying session cookie:', error);
        return null;
    }
}
