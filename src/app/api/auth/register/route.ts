import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  saveUser,
  getAllUsers,
  UserRecord,
} from "@/lib/db";
import {
  hashPassword,
  signSession,
  AUTH_COOKIE_NAME,
  ADMIN_SETUP_KEY,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, adminKey } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Check if user already exists
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or username already exists" },
        { status: 409 }
      );
    }

    // Determine role:
    // If user provides the correct admin key, or if this is the very first registered user, promote to Admin!
    const users = await getAllUsers();
    const isFirstUser = users.length === 0;
    const isAdminKeyMatch = adminKey && adminKey.trim() === ADMIN_SETUP_KEY;
    const role: "admin" | "user" = isFirstUser || isAdminKeyMatch ? "admin" : "user";

    const { hash, salt } = hashPassword(password);
    const userId = "usr_" + Math.random().toString(36).substring(2, 11);

    const newUser: UserRecord = {
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      passwordHash: hash,
      salt: salt,
      role: role,
      createdAt: Date.now(),
    };

    await saveUser(newUser);

    // Create session token
    const token = signSession({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
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
    const msg = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
