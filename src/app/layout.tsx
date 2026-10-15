import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundRip - Fast YouTube & YouTube Music Audio Downloader",
  description:
    "Convert YouTube and YouTube Music videos to high-quality MP3, M4A, FLAC, and WAV audio tracks. Free, instant, and downloadable directly to your device.",
  keywords: [
    "youtube to mp3",
    "youtube music converter",
    "youtube audio downloader",
    "convert youtube to audio",
    "yt music mp3 320kbps",
    "soundrip",
  ],
  authors: [{ name: "SoundRip" }],
  openGraph: {
    title: "SoundRip - YouTube & YouTube Music to Audio Converter",
    description:
      "Extract and download crystal-clear MP3 audio from any YouTube or YouTube Music link.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a10] text-gray-100 antialiased selection:bg-purple-600 selection:text-white">
        <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />
        <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed -top-20 -right-20 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed bottom-0 left-1/3 w-[500px] h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
