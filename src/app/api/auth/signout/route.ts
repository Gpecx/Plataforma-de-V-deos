import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("redirectTo") ?? "/login";

  // Anti open-redirect: só aceita caminho relativo interno. Rejeita URLs
  // absolutas (https://evil.com) e protocol-relative (//evil.com).
  const safeRedirect =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/login";

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));

  // Clear both session cookies by setting maxAge to 0
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };

  response.cookies.set("session", "", clearOptions);
  response.cookies.set("active_session_id", "", clearOptions);

  return response;
}
