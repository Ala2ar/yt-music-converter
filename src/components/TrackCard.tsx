"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Download,
  CheckCircle2,
  ExternalLink,
  Music2,
  FileAudio,
  Loader2,
  Sparkles,
  Share2,
  Send,
} from "lucide-react";
import confetti from "canvas-confetti";
import { VideoMetadata, AUDIO_FORMATS, AudioFormatOption } from "@/lib/youtube";
import { AudioPlayer } from "./AudioPlayer";
import {
  triggerHaptic,
  shareToTelegram,
  isRunningInTelegram,
  downloadAudioFile,
} from "@/lib/telegram";

interface TrackCardProps {
  metadata: VideoMetadata;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  onStartConversion: (format: string) => void;
  conversionState: {
    isConverting: boolean;
    progress: number;
    statusText: string;
    downloadUrl: string | null;
    error: string | null;
  };
}

export const TrackCard: React.FC<TrackCardProps> = ({
  metadata,
  selectedFormat,
  onFormatChange,
  onStartConversion,
  conversionState,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!conversionState.downloadUrl || isDownloading) return;

    setIsDownloading(true);
    setDownloadError(null);
    triggerHaptic("medium");

    const cleanFilename = `${metadata.artist} - ${metadata.cleanTitle}.${selectedFormat}`;

    try {
      await downloadAudioFile({
        directUrl: conversionState.downloadUrl,
        cleanFilename: cleanFilename,
      });

      triggerHaptic("success");

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#a855f7", "#ec4899", "#3b82f6", "#10b981"],
        });
      } catch {
        // Ignore if canvas is unavailable
      }
    } catch (err: unknown) {
      console.warn("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    triggerHaptic("light");
    if (isRunningInTelegram()) {
      shareToTelegram(
        metadata.url,
        `🎵 Check out "${metadata.cleanTitle}" by ${metadata.artist} on SoundRip!`
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(metadata.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const currentFormatObj =
    AUDIO_FORMATS.find((f) => f.id === selectedFormat) || AUDIO_FORMATS[0];

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl glass-panel-glow overflow-hidden shadow-2xl transition-all duration-300">
      {/* Top Banner / Track Info */}
      <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start">
        {/* Album Artwork */}
        <div className="relative w-full md:w-56 h-48 sm:h-52 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 bg-neutral-900 border border-white/10 group">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback if maxresdefault doesn't exist
              (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${metadata.id}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Audio Source
          </div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-gray-300">
            <span className="truncate max-w-[140px] font-medium">{metadata.artist}</span>
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Open on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Details & Controls */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Track Detected
              </span>
              <button
                onClick={handleShare}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors ml-auto"
                title="Copy track link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? "Copied!" : "Share"}</span>
              </button>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-2">
              {metadata.cleanTitle}
            </h3>
            <p className="text-sm text-gray-400 font-medium mt-1">
              By <span className="text-purple-300">{metadata.artist}</span>
            </p>
          </div>

          {/* Format Selector */}
          <div className="mt-5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
              Select Output Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIO_FORMATS.map((format) => {
                const isSelected = selectedFormat === format.id;
                return (
                  <button
                    key={format.id}
                    type="button"
                    disabled={conversionState.isConverting}
                    onClick={() => {
                      triggerHaptic("light");
                      onFormatChange(format.id);
                      if (conversionState.downloadUrl) {
                        onStartConversion(format.id);
                      }
                    }}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10"
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase flex items-center justify-between">
                      {format.label.split(" ")[0]}
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {format.bitrate}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Conversion Section */}
      <div className="px-6 sm:px-8 pb-8 pt-2">
        {conversionState.isConverting ? (
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-purple-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                {conversionState.statusText || "Converting YouTube Music..."}
              </span>
              <span className="font-mono text-gray-300 font-bold">
                {conversionState.progress}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(conversionState.progress, 6)}%` }}
              />
            </div>
          </div>
        ) : conversionState.downloadUrl ? (
          <div className="space-y-4">
            {/* Audio Preview Player */}
            <AudioPlayer
              src={conversionState.downloadUrl}
              title={metadata.cleanTitle}
              artist={metadata.artist}
            />

            {/* Ready to Download Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 disabled:opacity-75 disabled:cursor-wait shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving Audio Track...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>
                      Download {currentFormatObj.label} ({currentFormatObj.bitrate})
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onStartConversion(selectedFormat)}
                className="w-full sm:w-auto py-4 px-5 rounded-2xl font-semibold text-xs text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white transition-colors"
                title="Convert in another format"
              >
                Re-Convert
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onStartConversion(selectedFormat)}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
          >
            <FileAudio className="w-5 h-5" />
            <span>Convert to {currentFormatObj.label} ({currentFormatObj.bitrate})</span>
          </button>
        )}

        {conversionState.error && (
          <div className="mt-3 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
            <span>{conversionState.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
