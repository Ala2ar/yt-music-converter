import { TelegramUser, TelegramWebApp } from "@/types/telegram";

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isRunningInTelegram(): boolean {
  const tg = getTelegramWebApp();
  return (
    tg !== null &&
    typeof tg.initData === "string" &&
    tg.platform !== "unknown" &&
    tg.platform !== undefined
  );
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (!tg) return null;

  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#090a10");
    tg.setBackgroundColor("#090a10");
  } catch (err) {
    console.warn("Telegram WebApp init warning:", err);
  }

  return tg;
}

export function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "error"
) {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (type === "success" || type === "error") {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // ignore
  }
}

export function shareToTelegram(url: string, text: string) {
  const tg = getTelegramWebApp();
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(text)}`;

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else if (typeof window !== "undefined") {
    window.open(shareUrl, "_blank");
  }
}

/**
 * Downloads audio file cleanly across both Telegram Mini App and standard web browsers.
 * Eliminates truncated/962-byte error files and avoids third-party ad popups.
 */
export async function downloadAudioFile({
  directUrl,
  cleanFilename,
}: {
  directUrl: string;
  cleanFilename: string;
}): Promise<boolean> {
  const tg = getTelegramWebApp();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const proxyUrl = `${origin}/api/download?url=${encodeURIComponent(
    directUrl
  )}&filename=${encodeURIComponent(cleanFilename)}`;

  // 1. If running inside Telegram Mini App
  if (isRunningInTelegram() && tg) {
    // If Telegram client supports Bot API 8.0+ native downloadFile
    if (typeof tg.downloadFile === "function" && tg.isVersionAtLeast?.("8.0")) {
      try {
        tg.downloadFile(
          { url: directUrl, file_name: cleanFilename },
          (isDownloading) => {
            if (!isDownloading && typeof tg.openLink === "function") {
              tg.openLink(directUrl);
            }
          }
        );
        return true;
      } catch (err) {
        console.warn("tg.downloadFile error, falling back to openLink:", err);
      }
    }

    // Try in-memory blob first for desktop / web Telegram
    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        const blob = await res.blob();
        if (
          blob.size >= 50000 &&
          !blob.type.includes("html") &&
          !blob.type.includes("json")
        ) {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = cleanFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
          return true;
        }
      }
    } catch {
      // In-app mobile webview may restrict blob downloads
    }

    // On mobile Telegram Mini App (iOS/Android), openLink hands the direct CDN attachment
    // stream to the phone's native browser (Safari/Chrome) where Content-Disposition attachment downloads the audio.
    if (typeof tg.openLink === "function") {
      tg.openLink(directUrl);
      return true;
    }
  }

  // 2. Standard Web Browser:
  // Primary strategy: Direct in-memory blob fetch from CDN (bypasses Vercel 10s execution limits)
  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      const blob = await res.blob();
      // STRICT CHECK: Genuine audio files are ALWAYS >= 50KB.
      // An error page (like Vercel 504 / Cloudflare error) is ~962 bytes.
      if (
        blob.size >= 50000 &&
        !blob.type.includes("html") &&
        !blob.type.includes("json")
      ) {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = cleanFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
        return true;
      }
    }
  } catch (directErr) {
    console.warn("Direct CDN fetch failed, trying proxy fallback:", directErr);
  }

  // Secondary strategy: Fetch via same-origin streaming proxy /api/download
  try {
    const proxyRes = await fetch(proxyUrl);
    if (!proxyRes.ok) {
      throw new Error(`Download proxy error (${proxyRes.status})`);
    }

    const proxyBlob = await proxyRes.blob();
    // Validate size to guarantee no 962-byte corrupted files are ever saved
    if (
      proxyBlob.size < 50000 ||
      proxyBlob.type.includes("html") ||
      proxyBlob.type.includes("json")
    ) {
      throw new Error(
        `Received invalid audio stream (${proxyBlob.size} bytes). Link may have expired.`
      );
    }

    const blobUrl = window.URL.createObjectURL(proxyBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    return true;
  } catch (proxyErr) {
    console.error("Audio download error:", proxyErr);
    throw proxyErr;
  }
}

