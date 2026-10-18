"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Music2,
  Headphones,
  CheckCircle2,
  Zap,
  Radio,
  DownloadCloud,
  Send,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UrlInput } from "@/components/UrlInput";
import { TrackCard } from "@/components/TrackCard";
import { HistoryList, HistoryItem } from "@/components/HistoryList";
import { Features } from "@/components/Features";
import { Faq } from "@/components/Faq";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthModal, AuthUser } from "@/components/AuthModal";
import { AdminModal } from "@/components/AdminModal";
import { VideoMetadata, extractVideoId } from "@/lib/youtube";
import {
  initTelegramApp,
  triggerHaptic,
  isRunningInTelegram,
  downloadAudioFile,
} from "@/lib/telegram";

export default function Home() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("mp3");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversionState, setConversionState] = useState<{
    isConverting: boolean;
    progress: number;
    statusText: string;
    downloadUrl: string | null;
    error: string | null;
  }>({
    isConverting: false,
    progress: 0,
    statusText: "",
    downloadUrl: null,
    error: null,
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  const [autoDownload, setAutoDownload] = useState(false);
  const [telegramUser, setTelegramUser] = useState<string | null>(null);


  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Telegram WebApp, restore user session, and load preferences
  useEffect(() => {
    try {
      const tg = initTelegramApp();
      if (tg?.initDataUnsafe?.user?.first_name) {
        setTelegramUser(tg.initDataUnsafe.user.first_name);
      }
    } catch {
      // Not in telegram
    }

    // Check active auth session
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => null);

    try {
      const savedHistory = localStorage.getItem("soundrip_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedFormat = localStorage.getItem("soundrip_default_format");
      if (savedFormat) setSelectedFormat(savedFormat);

      const savedApiKey = localStorage.getItem("soundrip_api_key");
      if (savedApiKey) setApiKey(savedApiKey);

      const savedBackend = localStorage.getItem("soundrip_backend_url");
      if (savedBackend) setBackendUrl(savedBackend);

      const savedAutoDl = localStorage.getItem("soundrip_auto_download");
      if (savedAutoDl) setAutoDownload(savedAutoDl === "true");
    } catch {
      // localStorage disabled/restricted
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleLogout = async () => {
    triggerHaptic("medium");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
  };



  const saveHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.id === item.id && h.format === item.format)
      );
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem("soundrip_history", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("soundrip_history");
    } catch {
      // ignore
    }
  };

  const startPolling = (
    progressUrl: string,
    meta: VideoMetadata,
    format: string
  ) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/progress?progressUrl=${encodeURIComponent(progressUrl)}`
        );
        if (!res.ok) throw new Error("Progress check failed");

        const data = await res.json();

        if (data.completed && data.downloadUrl) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setConversionState({
            isConverting: false,
            progress: 100,
            statusText: "Audio ready!",
            downloadUrl: data.downloadUrl,
            error: null,
          });

          // Save to history
          saveHistory({
            id: meta.id,
            metadata: meta,
            format: format,
            downloadUrl: data.downloadUrl,
            timestamp: Date.now(),
          });

          // Auto trigger download if enabled
          if (autoDownload) {
            const cleanFilename = `${meta.artist} - ${meta.cleanTitle}.${format}`;
            downloadAudioFile({
              directUrl: data.downloadUrl,
              cleanFilename,
            }).catch((dlErr) => console.warn("Auto-download failed:", dlErr));
          }

        } else {
          setConversionState((prev) => ({
            ...prev,
            progress: data.progress || prev.progress,
            statusText: data.text || "Encoding high-fidelity audio...",
          }));
        }
      } catch (err: unknown) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        const msg = err instanceof Error ? err.message : "Polling error";
        setConversionState((prev) => ({
          ...prev,
          isConverting: false,
          error: msg,
        }));
      }
    }, 1800);
  };

  const startConversion = async (
    targetUrl: string,
    meta: VideoMetadata,
    format: string
  ) => {
    setConversionState({
      isConverting: true,
      progress: 5,
      statusText: "Connecting to audio conversion engine...",
      downloadUrl: null,
      error: null,
    });

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          id: meta.id,
          format: format,
          apiKey: apiKey || undefined,
          backendUrl: backendUrl || undefined,
        }),
      });


      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start conversion");
      }

      if (data.completed && data.downloadUrl) {
        setConversionState({
          isConverting: false,
          progress: 100,
          statusText: "Ready for download!",
          downloadUrl: data.downloadUrl,
          error: null,
        });

        saveHistory({
          id: meta.id,
          metadata: meta,
          format: format,
          downloadUrl: data.downloadUrl,
          timestamp: Date.now(),
        });
      } else if (data.progressUrl) {
        setConversionState((prev) => ({
          ...prev,
          progress: 15,
          statusText: "Processing stream...",
        }));
        startPolling(data.progressUrl, meta, format);
      } else {
        throw new Error("No download link or progress URL received");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion error";
      setConversionState({
        isConverting: false,
        progress: 0,
        statusText: "",
        downloadUrl: null,
        error: msg,
      });
    }
  };

  const handleUrlSubmit = async (inputUrl: string) => {
    setIsLoading(true);
    setConversionState({
      isConverting: false,
      progress: 0,
      statusText: "",
      downloadUrl: null,
      error: null,
    });

    try {
      // 1. Fetch metadata first to display artwork and track title
      const infoRes = await fetch(`/api/info?url=${encodeURIComponent(inputUrl)}`);
      const infoData = await infoRes.json();

      if (!infoRes.ok) {
        throw new Error(infoData.error || "Unable to fetch video details");
      }

      const meta: VideoMetadata = {
        id: infoData.id,
        url: infoData.url,
        title: infoData.title,
        cleanTitle: infoData.cleanTitle,
        artist: infoData.artist,
        authorUrl: infoData.authorUrl,
        thumbnail: infoData.thumbnail,
      };

      setMetadata(meta);
      setIsLoading(false);

      // 2. Automatically begin conversion to the selected format
      await startConversion(meta.url, meta, selectedFormat);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to load link";
      setConversionState((prev) => ({
        ...prev,
        error: msg,
      }));
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setMetadata(item.metadata);
    setSelectedFormat(item.format);
    setConversionState({
      isConverting: false,
      progress: 100,
      statusText: "Ready!",
      downloadUrl: item.downloadUrl,
      error: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
        onScrollToSection={scrollToSection}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
      />


      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
        <div id="hero" className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-6 animate-pulse-glow">
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            <span>YouTube & YouTube Music Audio Downloader</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight mb-4">
            Convert YouTube Music to{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              High-Quality Audio
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Extract crystal-clear audio from any YouTube or YouTube Music song.
            Preview in-browser with live visualizers and download 320kbps MP3,
            AAC, or FLAC directly to your device.
          </p>

          {/* Telegram Greeting Badge */}
          {telegramUser && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold mb-4 animate-fadeIn">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Mini App Active • Welcome, {telegramUser}!</span>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-400 mb-8">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-400" /> No Account Needed
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-pink-400" /> 320 kbps Studio MP3
            </span>
            <span className="flex items-center gap-1.5">
              <Send className="w-4 h-4 text-sky-400" /> Telegram Mini App Ready
            </span>
          </div>

          {/* URL Input Form */}
          <UrlInput onConvert={handleUrlSubmit} isLoading={isLoading} />
        </div>

        {/* Track Card (Display when metadata is loaded) */}
        {metadata && (
          <div className="mt-8 animate-fadeIn">
            <TrackCard
              metadata={metadata}
              selectedFormat={selectedFormat}
              onFormatChange={(fmt) => setSelectedFormat(fmt)}
              onStartConversion={(fmt) =>
                startConversion(metadata.url, metadata, fmt)
              }
              conversionState={conversionState}
            />
          </div>
        )}

        {/* History List */}
        <HistoryList
          items={history}
          onSelect={handleSelectHistoryItem}
          onClear={handleClearHistory}
        />

        {/* Features Showcase */}
        <Features />

        {/* Frequently Asked Questions */}
        <Faq />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 glass-panel py-8 px-4 text-center text-xs text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-gray-300">
            <Music2 className="w-4 h-4 text-purple-400" />
            <span>SoundRip Audio Downloader</span>
          </div>
          <p className="text-gray-400">
            For personal and educational use. Respect copyright owners.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-white transition-colors"
            >
              Settings
            </button>
            <span className="flex items-center gap-1.5 text-sky-400">
              <Send className="w-3.5 h-3.5" />
              Telegram Bot Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultFormat={selectedFormat}
        onSaveDefaultFormat={(fmt) => {
          setSelectedFormat(fmt);
          try {
            localStorage.setItem("soundrip_default_format", fmt);
          } catch {
            // ignore
          }
        }}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          try {
            localStorage.setItem("soundrip_api_key", key);
          } catch {
            // ignore
          }
        }}
        backendUrl={backendUrl}
        onSaveBackendUrl={(url) => {
          setBackendUrl(url);
          try {
            localStorage.setItem("soundrip_backend_url", url);
          } catch {
            // ignore
          }
        }}
        autoDownload={autoDownload}
        onToggleAutoDownload={(val) => {
          setAutoDownload(val);
          try {
            localStorage.setItem("soundrip_auto_download", String(val));
          } catch {
            // ignore
          }
        }}
      />

      {/* Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          if (u.role === "admin") {
            setIsAdminOpen(true);
          }
        }}
      />

      {/* Admin Modal (Dynamic Backend Switcher & Users) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentBackendUrl={backendUrl}
        onBackendUpdated={(newUrl) => {
          setBackendUrl(newUrl);
          try {
            localStorage.setItem("soundrip_backend_url", newUrl);
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
}

