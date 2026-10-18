import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

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

    // Instantly redirect with 307 Temporary Redirect to the direct audio stream URL.
    // This executes in milliseconds on Vercel without hitting execution or payload limits,
    // sending the client directly to the genuine media attachment without ads.
    return NextResponse.redirect(targetUrl, 307);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


