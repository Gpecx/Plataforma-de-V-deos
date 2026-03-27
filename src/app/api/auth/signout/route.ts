import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo") ?? "/login";

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

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
