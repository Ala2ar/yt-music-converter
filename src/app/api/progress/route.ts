import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const progressUrlParam = searchParams.get("progressUrl");

    const progressEndpoint = progressUrlParam;

    if (!progressEndpoint) {
      return NextResponse.json(
        { error: "Progress URL is required" },
        { status: 400 }
      );
    }

    const response = await fetch(progressEndpoint, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Progress server error (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Normalize progress scale if scaled to 1000
    let numericProgress = 0;
    if (typeof data.progress === "number") {
      numericProgress = data.progress > 100 ? Math.round(data.progress / 10) : data.progress;
    }

    const isComplete = data.success === 1 && !!data.download_url;

    return NextResponse.json({
      success: true,
      completed: isComplete,
      progress: isComplete ? 100 : Math.min(numericProgress, 99),
      text: data.text || "Converting audio stream...",
      downloadUrl: data.download_url || null,
      title: data.title || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
