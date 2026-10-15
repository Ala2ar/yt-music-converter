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
 * Downloads audio file cleanly across both Telegram Mini App and standard web browsers
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
  const fullDownloadUrl = `${origin}/api/download?url=${encodeURIComponent(
    directUrl
  )}&filename=${encodeURIComponent(cleanFilename)}`;

  // 1. If running inside Telegram Mini App
  if (isRunningInTelegram() && tg) {
    // If Telegram client supports Bot API 8.0+ native downloadFile
    if (typeof tg.downloadFile === "function" && tg.isVersionAtLeast?.("8.0")) {
      try {
        tg.downloadFile(
          { url: fullDownloadUrl, file_name: cleanFilename },
          (isDownloading) => {
            if (!isDownloading && tg.openLink) {
              tg.openLink(fullDownloadUrl);
            }
          }
        );
        return true;
      } catch (err) {
        console.warn("tg.downloadFile error, falling back to openLink:", err);
      }
    }

    // In Telegram WebViews, blob: URLs are silently ignored by iOS/Android webviews.
    // openLink hands the download stream to the phone's default browser (Safari/Chrome)
    // where Content-Disposition attachment downloads the file directly to device storage!
    if (typeof tg.openLink === "function") {
      tg.openLink(fullDownloadUrl);
      return true;
    }
  }

  // 2. Standard Web Browser: Download via in-memory Blob (no new tabs, 100% ad-free)
  try {
    const res = await fetch(fullDownloadUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    return true;
  } catch (err) {
    console.warn("Blob download fallback:", err);
    // Fallback: direct same-origin download anchor
    const link = document.createElement("a");
    link.href = fullDownloadUrl;
    link.setAttribute("download", cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
}
