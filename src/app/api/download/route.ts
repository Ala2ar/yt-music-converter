import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "audio.mp3";

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing download URL parameter" },
        { status: 400 }
      );
    }

    // Fetch the raw audio stream from the CDN
    const remoteResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!remoteResponse.ok || !remoteResponse.body) {
      // If direct streaming fails, redirect to the direct URL as a fallback
      return NextResponse.redirect(targetUrl, 302);
    }

    const contentType =
      remoteResponse.headers.get("content-type") || "audio/mpeg";

    // Clean filename to prevent header injection
    const safeFilename = filename.replace(/["\r\n]/g, "").trim();

    return new Response(remoteResponse.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          safeFilename
        )}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
