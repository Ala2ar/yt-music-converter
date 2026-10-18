import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/youtube";

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

    // 1. Check if user or environment configured a dedicated Private Converter Backend
    const backendEngineUrl = (
      body.backendUrl ||
      process.env.CONVERTER_BACKEND_URL ||
      process.env.NEXT_PUBLIC_CONVERTER_BACKEND_URL ||
      ""
    ).replace(/\/+$/, "");

    if (backendEngineUrl) {
      try {
        const backendRes = await fetch(`${backendEngineUrl}/convert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: videoId,
            url: youtubeUrl,
            format: selectedFormat,
          }),
        });

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
        }
      } catch (backendErr) {
        console.warn("Private backend engine error:", backendErr);
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

    // 3. High-speed universal conversion engine

    const apiUrl = `https://loader.to/ajax/download.php?format=${selectedFormat}&url=${encodeURIComponent(
      youtubeUrl
    )}`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://loader.to/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Converter server responded with status ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.success && !data.id) {
      return NextResponse.json(
        { error: data.text || "Failed to initialize conversion" },
        { status: 500 }
      );
    }

    // If conversion is already cached and download URL is immediately available
    if (data.download_url) {
      return NextResponse.json({
        success: true,
        completed: true,
        jobId: data.id,
        downloadUrl: data.download_url,
        title: data.title,
        format: selectedFormat,
        progress: 100,
      });
    }

    // Return the job info and progress URL for polling
    return NextResponse.json({
      success: true,
      completed: false,
      jobId: data.id,
      progressUrl: data.progress_url,
      title: data.title,
      format: selectedFormat,
      progress: 0,
      thumbnail: data.info?.image || data.thumbnail_url,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Conversion request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
