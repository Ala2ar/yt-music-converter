import { NextRequest, NextResponse } from "next/server";
import { verifySession, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = verifySession(token);
    if (!session) {
      const res = NextResponse.json({ user: null });
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        username: session.username,
        role: session.role,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Session error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
