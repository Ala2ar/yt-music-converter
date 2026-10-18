import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    // Validate targetUrl protocol
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return NextResponse.json({ error: "Invalid URL scheme" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Malformed URL parameter" }, { status: 400 });
    }

    // Fetch the raw audio stream from CDN with proper Referer & User-Agent
    const remoteResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://loader.to/",
        Accept: "audio/*,application/octet-stream,*/*;q=0.9",
      },
    });

    if (!remoteResponse.ok || !remoteResponse.body) {
      return NextResponse.json(
        { error: `Storage server returned status ${remoteResponse.status}` },
        { status: 502 }
      );
    }

    const rawContentType = remoteResponse.headers.get("content-type") || "";

    // STRICT CHECK: If remote server returned an HTML error page, Cloudflare challenge, or JSON error,
    // NEVER stream it as an MP3 attachment! Return an explicit 502 JSON error so the client can handle it.
    if (
      rawContentType.includes("text/html") ||
      rawContentType.includes("application/json") ||
      rawContentType.includes("text/plain")
    ) {
      return NextResponse.json(
        { error: "Remote audio stream is unavailable, blocked, or expired." },
        { status: 502 }
      );
    }

    const contentLength = remoteResponse.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) < 50000) {
      // Audio files are never under 50KB; this indicates an error payload
      return NextResponse.json(
        { error: "Downloaded file size is invalid or truncated." },
        { status: 502 }
      );
    }

    const contentType = rawContentType || "audio/mpeg";
    const safeFilename = filename.replace(/["\r\n]/g, "").trim();

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
    );
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(remoteResponse.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

