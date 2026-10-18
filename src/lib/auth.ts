import crypto from "crypto";
import {
  UserRecord,
  getAllUsers,
  findUserByEmail,
  saveUser,
} from "./db";

const JWT_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "soundrip_super_secure_jwt_secret_key_2026";

export const AUTH_COOKIE_NAME = "soundrip_session";
export const ADMIN_SETUP_KEY = process.env.ADMIN_KEY || "admin123";

export function hashPassword(
  password: string,
  providedSalt?: string
): { hash: string; salt: string } {
  const salt = providedSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(hash, "utf-8"),
    Buffer.from(storedHash, "utf-8")
  );
}

export interface SessionPayload {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
  exp: number;
}

export function signSession(user: {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
}): string {
  const payload: SessionPayload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;

    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "utf-8"),
        Buffer.from(expectedSig, "utf-8")
      )
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Initializes default admin if database is brand new
 */
export async function ensureDefaultAdmin() {
  const users = await getAllUsers();
  if (users.length === 0) {
    const { hash, salt } = hashPassword("admin123");
    const defaultAdmin: UserRecord = {
      id: "admin_master_1",
      email: "admin@soundrip.app",
      username: "admin",
      passwordHash: hash,
      salt: salt,
      role: "admin",
      createdAt: Date.now(),
    };
    await saveUser(defaultAdmin);
  }
}
