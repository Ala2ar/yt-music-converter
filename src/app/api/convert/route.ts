import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/youtube";
import { getSystemConfig } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, id, format = "mp3", apiKey } = body;

    const rawInput = url || id;
    if (!rawInput) {
      return NextResponse.json(
        { error: "URL or Video ID is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(rawInput);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube or YouTube Music link" },
        { status: 400 }
      );
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const selectedFormat = format.toLowerCase();

    // 1. Check if Admin configured a Global Private Backend, or user/env passed one
    const systemConfig = await getSystemConfig();
    let backendEngineUrl = (
      body.backendUrl ||
      systemConfig.activeBackendUrl ||
      process.env.CONVERTER_BACKEND_URL ||
      process.env.NEXT_PUBLIC_CONVERTER_BACKEND_URL ||
      ""
    ).trim().replace(/\/+$/, "");

    // Normalize common URL path suffixes
    if (backendEngineUrl.endsWith("/convert")) {
      backendEngineUrl = backendEngineUrl.replace(/\/convert$/, "");
    }
    if (backendEngineUrl.endsWith("/api")) {
      backendEngineUrl = backendEngineUrl.replace(/\/api$/, "");
    }

    if (backendEngineUrl) {
      // Check for common template placeholders
      if (
        backendEngineUrl.includes("your-service") ||
        backendEngineUrl.includes("your-user-space")
      ) {
        return NextResponse.json(
          {
            error:
              "Placeholder backend URL detected ('your-service'). Please sign in to the Admin Panel and enter your actual Render service URL (e.g. https://soundrip-backend.onrender.com).",
            needsBackend: true,
          },
          { status: 400 }
        );
      }

      const host = request.headers.get("host") || "";
      if (host && backendEngineUrl.includes(host)) {
        return NextResponse.json(
          {
            error:
              "Configuration error: You configured your Vercel frontend URL as the converter backend. Please enter your Render/Docker backend service URL instead in the Admin Panel.",
            needsBackend: true,
          },
          { status: 400 }
        );
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for audio conversion

        let endpoint = `${backendEngineUrl}/convert`;
        let backendRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: videoId,
            url: youtubeUrl,
            format: selectedFormat,
          }),
          signal: controller.signal,
        });

        // Fallback to /api/convert if /convert returned 404
        if (backendRes.status === 404) {
          endpoint = `${backendEngineUrl}/api/convert`;
          backendRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: videoId,
              url: youtubeUrl,
              format: selectedFormat,
            }),
            signal: controller.signal,
          });
        }

        clearTimeout(timeoutId);

        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData.downloadUrl) {
            return NextResponse.json({
              success: true,
              completed: true,
              downloadUrl: backendData.downloadUrl,
              title: backendData.title || "Audio Track",
              artist: backendData.artist || "Artist",
              format: selectedFormat,
              progress: 100,
            });
          }
        } else {
          const errData = await backendRes.json().catch(() => ({}));
          const is404 = backendRes.status === 404;
          return NextResponse.json(
            {
              error: is404
                ? `Backend at ${backendEngineUrl} returned 404 Not Found. Make sure your Render service deployed successfully with Root Directory set to 'backend' and check your service URL in the Admin Panel.`
                : errData.detail ||
                  `Backend conversion service returned status ${backendRes.status}`,
            },
            { status: 502 }
          );
        }
      } catch (backendErr: unknown) {
        const msg =
          backendErr instanceof Error ? backendErr.message : "Service unreachable";
        return NextResponse.json(
          {
            error: `Failed to connect to backend engine (${backendEngineUrl}): ${msg}. If using Render free tier, the service may be spinning up; please wait 30 seconds and retry.`,
          },
          { status: 504 }
        );
      }
    }

    // 2. Check if user or environment configured RapidAPI
    const rapidKey = apiKey || process.env.RAPIDAPI_KEY;
    if (rapidKey) {
      try {
        const rapidRes = await fetch(
          `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`,
          {
            headers: {
              "X-RapidAPI-Key": rapidKey,
              "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com",
            },
          }
        );
        if (rapidRes.ok) {
          const rapidData = await rapidRes.json();
          if (rapidData.link) {
            return NextResponse.json({
              success: true,
              completed: true,
              downloadUrl: rapidData.link,
              title: rapidData.title || "Audio Track",
              format: selectedFormat,
              progress: 100,
            });
          }
        }
      } catch (err) {
        console.warn("RapidAPI fallback error:", err);
      }
    }

    // 3. If neither private backend nor RapidAPI is configured
    return NextResponse.json(
      {
        error:
          "No conversion backend engine is connected. Please sign in as Admin (admin@soundip.com) and click 'Admin Engine' to set your Render backend URL.",
        needsBackend: true,
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Conversion request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
