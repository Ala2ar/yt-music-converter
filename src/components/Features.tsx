"use client";

import React from "react";
import {
  Zap,
  Music,
  Headphones,
  Shield,
  Cloud,
  Smartphone,
  Sliders,
  CheckCircle,
  Send,
} from "lucide-react";

export const Features: React.FC = () => {
  const features = [
    {
      icon: Music,
      title: "YouTube & YT Music",
      description:
        "Seamlessly supports regular YouTube videos, music.youtube.com tracks, Shorts, and shared links.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Headphones,
      title: "320 kbps Crystal Audio",
      description:
        "Extract audio at pristine 320kbps MP3, AAC M4A, lossless FLAC, or uncompressed WAV studio formats.",
      color: "from-pink-500 to-rose-500",
    },
    {
      icon: Zap,
      title: "Built-in Preview Player",
      description:
        "Listen to the converted track instantly inside your browser with scrub controls and volume before saving.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Send,
      title: "Telegram Mini App Ready",
      description:
        "Runs natively inside Telegram chats with dynamic theme matching, haptic vibrations, and instant sharing.",
      color: "from-sky-500 to-blue-600",
    },
    {
      icon: Shield,
      title: "Zero Spam & Ad-Free",
      description:
        "Clean, modern experience with no misleading popups, no malware, and direct browser file downloads.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Smartphone,
      title: "Mobile & Offline Ready",
      description:
        "Responsive glassmorphism UI with local history tracking so you can access your favorite rips anywhere.",
      color: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <section id="features" className="w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
          Engineered for Speed & Quality
        </h2>
        <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Everything You Need In an Audio Downloader
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Convert music tracks and podcasts into audio files ready for your phone, car, or offline listening.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl glass-panel hover:border-purple-500/40 transition-all duration-300 group hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {feat.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
