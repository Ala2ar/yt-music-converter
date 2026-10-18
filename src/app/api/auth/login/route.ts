import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import {
  verifyPassword,
  signSession,
  ensureDefaultAdmin,
  AUTH_COOKIE_NAME,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrUsername, password } = body;

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Ensure default master admin exists if DB is uninitialized
    await ensureDefaultAdmin();

    const cleanInput = emailOrUsername.trim();
    const user = await findUserByEmail(cleanInput);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your username or password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your username or password." },
        { status: 401 }
      );
    }

    // Create session token
    const token = signSession({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
