import { NextRequest, NextResponse } from "next/server";
import { verifySession, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? verifySession(token) : null;

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawUrl = body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const cleanUrl = rawUrl.trim().replace(/\/+$/, "");

    const startTime = Date.now();
    try {
      const res = await fetch(`${cleanUrl}/health`, {
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);

      const rootRes = !res?.ok
        ? await fetch(`${cleanUrl}/`, {
            signal: AbortSignal.timeout(6000),
          }).catch(() => null)
        : res;

      const latencyMs = Date.now() - startTime;

      if (rootRes && rootRes.ok) {
        const data = await rootRes.json().catch(() => null);
        return NextResponse.json({
          online: true,
          status: rootRes.status,
          latencyMs,
          data,
          message: `Backend is Online (${latencyMs}ms)`,
        });
      }

      return NextResponse.json({
        online: false,
        latencyMs,
        status: rootRes?.status || 500,
        message: `Backend responded with status ${rootRes?.status || "unreachable"}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      return NextResponse.json({
        online: false,
        latencyMs: Date.now() - startTime,
        message: `Connection error: ${msg}`,
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Test failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
