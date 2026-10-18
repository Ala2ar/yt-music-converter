import { NextRequest, NextResponse } from "next/server";
import { getSystemConfig, updateSystemConfig, getAllUsers } from "@/lib/db";
import { verifySession, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? verifySession(token) : null;

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const config = await getSystemConfig();
    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      config,
      totalUsers: users.length,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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
    const { activeBackendUrl, allowRegistration, maintenanceMode } = body;

    const updated = await updateSystemConfig({
      ...(typeof activeBackendUrl === "string" ? { activeBackendUrl: activeBackendUrl.trim() } : {}),
      ...(typeof allowRegistration === "boolean" ? { allowRegistration } : {}),
      ...(typeof maintenanceMode === "boolean" ? { maintenanceMode } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Admin configuration updated successfully",
      config: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
