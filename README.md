# 🎵 SoundRip - YouTube & YouTube Music Audio Downloader

> A fast, modern YouTube & YouTube Music to audio converter and downloadable system, built with Next.js 15, React 19, and Tailwind CSS. Featuring native **Telegram Mini App** integration and a clean, 100% ad-free experience.

![SoundRip Preview](https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg)

---

## ✨ Features

- 🎧 **YouTube & YouTube Music Support**: Accepts standard `youtube.com/watch?v=...`, `music.youtube.com/watch?v=...`, `youtu.be/...`, and YouTube Shorts.
- 📱 **Telegram Mini App (TMA) Ready**: Runs directly inside Telegram chats with theme detection, native haptic vibrations, and instant music sharing.
- 🔊 **Studio Bitrate & Formats**:
  - **MP3 (320 kbps)** - High-fidelity universal audio
  - **M4A / AAC (256 kbps)** - Apple-optimized crisp high frequency
  - **FLAC** - Lossless audiophile playback
  - **WAV** - Uncompressed studio waveform
- ⏯️ **In-Browser Audio Preview**: Listen to and scrub through the converted track directly before downloading, with an interactive animated equalizer.
- 💾 **One-Click Ad-Free Download**: In-memory blob downloader saves files directly to your device with proper ID3 tags (`Artist - Title.mp3`) without popup ads.
- 🕒 **Conversion History**: Automatically saves your recently converted tracks to local storage for instant re-download or listening.
- 🛡️ **Clean & Zero Ads**: No popups, no scam redirects, no account registration required.

---

## 📱 How to Use as a Telegram Mini App

You can run this application as a native **Telegram Mini App** inside any Telegram bot!

### Step 1: Deploy the App
Deploy this repository to your preferred hosting provider (Vercel, Railway, Render, or your own server) to get a public HTTPS URL (e.g. `https://your-soundrip.vercel.app`).

### Step 2: Open @BotFather on Telegram
1. Search for [`@BotFather`](https://t.me/BotFather) in Telegram.
2. If you don't have a bot yet, send `/newbot` and follow the instructions to create one.

### Step 3: Configure the Mini App (Menu Button)
1. Send `/setmenubutton` to `@BotFather`.
2. Select your bot.
3. Send the public HTTPS URL of your deployed app (e.g., `https://your-soundrip.vercel.app`).
4. Set the button title to: `🎵 Audio Downloader` (or `SoundRip`).

### Step 4 (Optional): Create a Named Web App Link
1. Send `/newapp` to `@BotFather`.
2. Select your bot and provide a title, description, and photo.
3. When prompted for the Web App URL, paste your deployed URL.
4. Set a short name (e.g. `music`). You will receive a direct link: `t.me/YourBotName/music`.

Now, users can open the converter right inside Telegram, convert songs, listen to audio, and download tracks with native haptic feedback!

---

## 🚀 Quick Start (Run Locally)

### 1. Clone or Open the Repository
```bash
git clone https://github.com/Ala2ar/yt-music-converter.git
cd yt-music-converter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Optional Environment Variables

The app includes a built-in free conversion engine out of the box. However, if you'd like to use a dedicated RapidAPI endpoint for custom rate limits, you can add:

```env
RAPIDAPI_KEY=your_rapidapi_key_here
```

Users can also enter their own RapidAPI key directly in the app's **Settings** modal in the top navigation bar.

---

## 📁 Project Architecture

```
yt-music-converter/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── convert/route.ts   # Audio conversion initiator
│   │   │   ├── download/route.ts  # Clean ad-free streaming download proxy
│   │   │   ├── info/route.ts      # Video metadata & thumbnail resolver
│   │   │   └── progress/route.ts  # Conversion job status poller
│   │   ├── globals.css            # Dark glassmorphic theme & audio animations
│   │   ├── layout.tsx             # Root layout with Telegram WebApp SDK
│   │   └── page.tsx               # Converter UI, Telegram integration & player
│   ├── components/
│   │   ├── AudioPlayer.tsx        # HTML5 preview player with visualizer
│   │   ├── Faq.tsx                # Frequently asked questions accordion
│   │   ├── Features.tsx           # Highlights & performance specs
│   │   ├── HistoryList.tsx        # Recent conversions list
│   │   ├── Navbar.tsx             # Header with logo & settings trigger
│   │   ├── SettingsModal.tsx      # Format & API preferences modal
│   │   ├── TrackCard.tsx          # Artwork, format selector, progress & download
│   │   └── UrlInput.tsx           # Smart link input & clipboard paste
│   ├── lib/
│   │   ├── telegram.ts            # Telegram WebApp lifecycle, haptics & sharing
│   │   └── youtube.ts             # Link parser, validator, ID extractor & title cleaner
│   └── types/
│       └── telegram.d.ts          # Telegram WebApp TypeScript declarations
├── tailwind.config.ts             # Custom colors, keyframes, audio bars
├── tsconfig.json                  # TypeScript compiler settings
└── package.json                   # Dependencies & scripts
```

---

## 📜 License
MIT License. For personal, educational, and fair-use purposes.
