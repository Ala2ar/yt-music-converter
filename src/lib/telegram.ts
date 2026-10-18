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
 * Eliminates 962-byte Vercel serverless errors, bypasses CORS, and avoids third-party ad popups.
 */
export async function downloadAudioFile({
  directUrl,
  cleanFilename,
}: {
  directUrl: string;
  cleanFilename: string;
}): Promise<boolean> {
  const tg = getTelegramWebApp();

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

    // On mobile Telegram Mini App (iOS/Android), openLink hands the direct CDN attachment
    // stream to the phone's native browser (Safari/Chrome) where Content-Disposition attachment downloads the audio.
    if (typeof tg.openLink === "function") {
      tg.openLink(directUrl);
      return true;
    }
  }

  // 2. Standard Web Browser (Chrome, Safari, Firefox, Edge - Desktop & Mobile):
  // Direct anchor trigger without target="_blank".
  // Because the storage server sends "Content-Disposition: attachment; filename=...",
  // the browser immediately downloads the binary MP3 without navigating away and without ads!
  try {
    const link = document.createElement("a");
    link.href = directUrl;
    link.setAttribute("download", cleanFilename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.warn("Direct anchor download error, trying iframe fallback:", err);
  }

  // Fallback: Invisible iframe
  try {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = directUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 15000);
    return true;
  } catch (iframeErr) {
    console.error("Iframe download error:", iframeErr);
    window.location.assign(directUrl);
    return true;
  }
}


