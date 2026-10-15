"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can I convert tracks directly from YouTube Music (music.youtube.com)?",
      a: "Yes! SoundRip fully supports URLs from music.youtube.com, regular youtube.com, youtu.be short links, and YouTube Shorts. Simply copy the link from your browser address bar or the YouTube app's share sheet and paste it in the input field.",
    },
    {
      q: "What audio formats and bitrates are available?",
      a: "You can convert and download audio in MP3 (up to 320 kbps high quality), M4A / AAC (256 kbps, optimized for Apple devices), lossless FLAC (for audiophile fidelity), and studio WAV.",
    },
    {
      q: "Can I use this as a Telegram Mini App inside Telegram?",
      a: "Yes! SoundRip is fully optimized as a Telegram Mini App. You can connect it to any Telegram bot using @BotFather (via /newapp or /setmenubutton). It opens seamlessly inside Telegram with full native styling, haptic feedback, and in-app music playback.",
    },
    {
      q: "Where are downloaded files saved?",
      a: "Downloaded audio files are saved directly into your device's default 'Downloads' folder with properly formatted ID3 metadata (Artist - Title.mp3). You can then import them into iTunes, Apple Music, Spotify Local Files, VLC, or any media player.",
    },
    {
      q: "Is there a limit on how many tracks I can download?",
      a: "No! There are no daily limits. SoundRip is completely free to use. You can also configure your own optional RapidAPI key in Settings if you want a dedicated private conversion route.",
    },
  ];

  return (
    <section id="faq" className="w-full max-w-4xl mx-auto py-16 px-4 sm:px-6">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          Got Questions?
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl glass-panel border border-white/10 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-purple-300 transition-colors"
              >
                <span className="text-sm sm:text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-purple-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
