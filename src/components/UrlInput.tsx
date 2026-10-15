"use client";

import React, { useState } from "react";
import { Search, Link as LinkIcon, Clipboard, X, ArrowRight, Loader2, Music } from "lucide-react";
import { isValidYouTubeUrl } from "@/lib/youtube";

interface UrlInputProps {
  onConvert: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onConvert, isLoading }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError(null);
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  const handleClear = () => {
    setUrl("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter or paste a YouTube / YouTube Music link");
      return;
    }

    if (!isValidYouTubeUrl(trimmed)) {
      setError("Invalid link. Please provide a valid YouTube or YouTube Music URL or video ID.");
      return;
    }

    setError(null);
    onConvert(trimmed);
  };

  const sampleLinks = [
    { label: "Rick Astley - Never Gonna Give You Up", url: "https://music.youtube.com/watch?v=dQw4w9WgXcQ" },
    { label: "Lofi Hip Hop Beats", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
    { label: "The Weeknd - Blinding Lights", url: "https://music.youtube.com/watch?v=4NRXx6U8ABQ" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl glass-panel-glow p-2 transition-all duration-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
          <div className="pl-3 pr-2 text-purple-400">
            <LinkIcon className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste YouTube or YouTube Music link (e.g., https://music.youtube.com/watch?v=...)"
            disabled={isLoading}
            className="w-full bg-transparent text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none px-2 py-3"
          />

          <div className="flex items-center gap-1.5 pr-1">
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-white/5 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-purple-400" />
                Paste
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting</span>
                </>
              ) : (
                <>
                  <span>Extract Audio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-rose-400 pl-4 flex items-center gap-1.5 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {error}
          </p>
        )}
      </form>

      {/* Quick sample pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Music className="w-3 h-3 text-purple-400" />
          Quick samples:
        </span>
        {sampleLinks.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setUrl(sample.url);
              setError(null);
              onConvert(sample.url);
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
