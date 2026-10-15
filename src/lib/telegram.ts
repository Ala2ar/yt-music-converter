import { TelegramUser, TelegramWebApp } from "@/types/telegram";

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function isRunningInTelegram(): boolean {
  const tg = getTelegramWebApp();
  return tg !== null && typeof tg.initData === "string" && tg.platform !== "unknown";
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
