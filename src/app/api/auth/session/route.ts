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

    // Verify the ID token and extract uid
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // (Maneuver) Permite a criação da sessão mesmo sem e-mail verificado para que o 
    // usuário possa acessar a rota /verify-email com estado autenticado.
    // O bloqueio de acesso a áreas restritas continuará sendo feito nos layouts/middleware.

    // Generate a unique session identifier
    const sessionId = crypto.randomUUID();

    // Persist the active session ID in Firestore (overwrites previous device)
    await adminDb
      .collection("profiles")
      .doc(uid)
      .set({ active_session_id: sessionId }, { merge: true });

    // Create the Firebase session cookie via Admin SDK
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Build response and set both HttpOnly cookies
    const response = NextResponse.json({ status: "ok" });

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
