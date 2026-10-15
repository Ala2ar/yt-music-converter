# 🎵 SoundRip - YouTube & YouTube Music Audio Downloader

> A fast, modern YouTube & YouTube Music to audio converter and downloadable system, built with Next.js 15, React 19, and Tailwind CSS. Specially engineered to deploy and run seamlessly on **Vercel Serverless**.

![SoundRip Preview](https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg)

---

## ✨ Features

- 🎧 **YouTube & YouTube Music Support**: Accepts standard `youtube.com/watch?v=...`, `music.youtube.com/watch?v=...`, `youtu.be/...`, and YouTube Shorts.
- 🔊 **Studio Bitrate & Formats**:
  - **MP3 (320 kbps)** - High-fidelity universal audio
  - **M4A / AAC (256 kbps)** - Apple-optimized crisp high frequency
  - **FLAC** - Lossless audiophile playback
  - **WAV** - Uncompressed studio waveform
- ⏯️ **In-Browser Audio Preview**: Listen to and scrub through the converted track directly before downloading, with an interactive animated equalizer.
- 💾 **One-Click Download**: Automatically formats ID3 filenames (`Artist - Title.mp3`) and triggers direct browser downloads.
- 🕒 **Conversion History**: Automatically saves your recently converted tracks to local storage for instant re-download or listening.
- ⚡ **Vercel Serverless Optimized**: Bypasses the 4.5 MB Lambda response size limit and function timeouts through asynchronous conversion polling and streaming URLs.
- 🛡️ **Clean & Ad-Free**: No popups, no scam redirects, no account registration required.

---

## 🚀 Quick Start (Run Locally)

### 1. Clone or Open the Repository
```bash
git clone <your-repo-url>
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

## 🌐 Deploy to Vercel (Live in 2 Minutes)

### Option A: Deploy via Vercel CLI (Fastest)

Run the following in the project directory:

```bash
npx vercel
```

- When asked `Set up and deploy?`, press `y`.
- Accept the default project name and settings.
- To deploy directly to production, run:
```bash
npx vercel --prod
```

### Option B: Deploy via GitHub (Continuous Deployment)

1. Push this repository to your GitHub account:
```bash
git add .
git commit -m "Initial commit of SoundRip YouTube Music Audio Downloader"
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

2. Visit [Vercel Dashboard](https://vercel.com/new).
3. Click **"Import"** next to your GitHub repository.
4. Keep the default Next.js build settings and click **"Deploy"**.
5. Your converter will be live at `https://<your-project>.vercel.app`!

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
│   │   │   ├── info/route.ts      # Video metadata & thumbnail resolver
│   │   │   └── progress/route.ts  # Conversion job status poller
│   │   ├── globals.css            # Dark glassmorphic theme & audio animations
│   │   ├── layout.tsx             # Root layout with responsive mesh gradient
│   │   └── page.tsx               # Converter UI, state management & audio player
│   ├── components/
│   │   ├── AudioPlayer.tsx        # HTML5 preview player with visualizer
│   │   ├── Faq.tsx                # Frequently asked questions accordion
│   │   ├── Features.tsx           # Highlights & performance specs
│   │   ├── HistoryList.tsx        # Recent conversions list
│   │   ├── Navbar.tsx             # Header with logo & settings trigger
│   │   ├── SettingsModal.tsx      # Format & API preferences modal
│   │   ├── TrackCard.tsx          # Artwork, format selector, progress & download
│   │   └── UrlInput.tsx           # Smart link input & clipboard paste
│   └── lib/
│       └── youtube.ts             # Link parser, validator, ID extractor & title cleaner
├── vercel.json                    # Vercel serverless function timeouts & CORS rules
├── tailwind.config.ts             # Custom colors, keyframes, audio bars
├── tsconfig.json                  # TypeScript compiler settings
└── package.json                   # Dependencies & scripts
```

---

## 📜 License
MIT License. For personal, educational, and fair-use purposes.
