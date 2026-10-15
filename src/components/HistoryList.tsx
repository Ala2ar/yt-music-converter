"use client";

import React from "react";
import { History, Download, Trash2, ExternalLink, Music } from "lucide-react";
import { VideoMetadata } from "@/lib/youtube";
import { downloadAudioFile, triggerHaptic } from "@/lib/telegram";

export interface HistoryItem {
  id: string;
  metadata: VideoMetadata;
  format: string;
  downloadUrl: string;
  timestamp: number;
}

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onSelect,
  onClear,
}) => {
  if (items.length === 0) {
    return null;
  }

  const handleDownload = async (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("medium");
    const cleanFilename = `${item.metadata.artist} - ${item.metadata.cleanTitle}.${item.format}`;
    await downloadAudioFile({
      directUrl: item.downloadUrl,
      cleanFilename,
    });
    triggerHaptic("success");
  };

  return (
    <section id="history" className="w-full max-w-3xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
            Recent Conversions ({items.length})
          </h3>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          title="Clear conversion history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.timestamp}`}
            onClick={() => onSelect(item)}
            className="flex items-center gap-3.5 p-3 rounded-2xl glass-panel hover:border-purple-500/40 cursor-pointer transition-all duration-200 group"
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 border border-white/10 relative">
              <img
                src={item.metadata.thumbnail}
                alt={item.metadata.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${item.metadata.id}/hqdefault.jpg`;
                }}
              />
            </div>

            {/* Song title & artist */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {item.metadata.cleanTitle}
              </h4>
              <p className="text-xs text-gray-400 truncate">
                {item.metadata.artist}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {item.format}
                </span>
                <span className="text-[10px] text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={(e) => handleDownload(item, e)}
              className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Download again"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
