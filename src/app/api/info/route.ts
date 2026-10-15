import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, parseTrackInfo } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url") || searchParams.get("id");

    if (!urlParam) {
      return NextResponse.json(
        { error: "URL or Video ID is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(urlParam);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube or YouTube Music link" },
        { status: 400 }
      );
    }

    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      targetUrl
    )}&format=json`;

    const oembedRes = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 3600 },
    });

    if (!oembedRes.ok) {
      // Fallback to NoEmbed if YouTube oembed has any issue
      const noembedRes = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`
      );
      if (!noembedRes.ok) {
        return NextResponse.json(
          { error: "Could not retrieve video details from YouTube" },
          { status: 404 }
        );
      }
      const noembedData = await noembedRes.json();
      const parsed = parseTrackInfo(
        noembedData.title || "Unknown Track",
        noembedData.author_name || "Unknown Artist"
      );

      return NextResponse.json({
        id: videoId,
        url: targetUrl,
        title: noembedData.title || "YouTube Audio Track",
        cleanTitle: parsed.cleanTitle,
        artist: parsed.artist,
        authorUrl: noembedData.author_url || "",
        thumbnail:
          noembedData.thumbnail_url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }

    const data = await oembedRes.json();
    const parsed = parseTrackInfo(
      data.title || "Unknown Track",
      data.author_name || "Unknown Artist"
    );

    // Prefer high-res maxresdefault thumbnail with hqdefault fallback
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    return NextResponse.json({
      id: videoId,
      url: targetUrl,
      title: data.title || "YouTube Audio Track",
      cleanTitle: parsed.cleanTitle,
      artist: parsed.artist,
      authorUrl: data.author_url || "",
      thumbnail: thumbnail,
      fallbackThumbnail:
        data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
