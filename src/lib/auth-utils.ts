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
 * Verifies the 'firebase-token' cookie and fetches user role from Firestore.
 */
export async function getServerSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-token')?.value;

    if (!token) {
        return null;
    }

    try {
        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(token);
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
        console.error('getServerSession: Error verifying token:', error);
        return null;
    }
}
