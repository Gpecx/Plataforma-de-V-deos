export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// 5 days in milliseconds
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;
// 5 days in seconds for cookie maxAge
const SESSION_DURATION_SECONDS = 5 * 24 * 60 * 60;

interface SessionRequestBody {
  idToken: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as SessionRequestBody;
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Bloqueio de segurança para professores banidos
    const profileDoc = await adminDb.collection("profiles").doc(uid).get();
    const profileData = profileDoc.data();
    
    if (profileData?.role === 'teacher' && profileData?.teacher_status === 'banned') {
      console.warn(`[/api/auth/session] Login bloqueado: conta de professor banida.`);
      return NextResponse.json(
        { error: "ACCOUNT_BANNED" },
        { status: 403 }
      );
    }

    // (Maneuver) Permite a criação da sessão mesmo sem e-mail verificado para que o 
    // usuário possa acessar a rota /verify-email com estado autenticado.
    // O bloqueio de acesso a áreas restritas continuará sendo feito nos layouts/middleware.

    // Generate a unique session identifier
    const sessionId = crypto.randomUUID();

    // Persist only the active session ID in Firestore.
    // NOTE: mfaEnabled is NOT updated here because this platform uses a custom
    // email-based 2FA flow, not Firebase native MFA. The field is managed by
    // the sync script (scripts/sync-mfa.js) and is always true by platform policy.
    await adminDb
      .collection("profiles")
      .doc(uid)
      .set({ 
        active_session_id: sessionId,
        updated_at: new Date()
      }, { merge: true });

    // Sync user role from Firestore to Custom Claims to ensure consistency
    // [Industrial Hardening]: Source of Truth = Firestore Profile
    const currentRole = profileData?.role || 'student';
    await adminAuth.setCustomUserClaims(uid, { role: currentRole });

    // Create the Firebase session cookie via Admin SDK
    // The session cookie will now carry the updated claims
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Build response and set both HttpOnly cookies
    const response = NextResponse.json({ status: "ok" });

    // B-01: Explicit cookie security attributes (declared for audit compliance)
    // - httpOnly: true     → Blocks JS access (XSS mitigation)
    // - secure: production → HTTPS-only in production
    // - sameSite: 'lax'   → Allows top-level cross-site navigation (OAuth/redirect flows)
    // - path: '/'         → Cookie valid across all routes
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    };

    response.cookies.set("session", sessionCookie, cookieOptions);
    response.cookies.set("active_session_id", sessionId, cookieOptions);

    return response;
  } catch (error: unknown) {
    console.error("[/api/auth/session] Error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}
