export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  cleanTitle: string;
  artist: string;
  authorUrl: string;
  thumbnail: string;
  duration?: string;
  views?: string;
}

export interface AudioFormatOption {
  id: string;
  label: string;
  extension: string;
  bitrate?: string;
  badge: string;
  description: string;
}

export const AUDIO_FORMATS: AudioFormatOption[] = [
  {
    id: "mp3",
    label: "MP3 Audio",
    extension: "mp3",
    bitrate: "320 kbps",
    badge: "High Quality",
    description: "Universal compatibility, rich dynamic audio",
  },
  {
    id: "m4a",
    label: "M4A (AAC)",
    extension: "m4a",
    bitrate: "256 kbps",
    badge: "Apple & High Fidelity",
    description: "Crisp highs, native iOS/macOS container",
  },
  {
    id: "flac",
    label: "FLAC Audio",
    extension: "flac",
    bitrate: "Lossless",
    badge: "Audiophile",
    description: "Full uncompressed frequency spectrum",
  },
  {
    id: "wav",
    label: "WAV Audio",
    extension: "wav",
    bitrate: "Lossless PCM",
    badge: "Studio",
    description: "Raw uncompressed studio waveform",
  },
];

/**
 * Extracts YouTube video ID from various YouTube and YouTube Music URLs
 */
export function extractVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const input = urlOrId.trim();

  // If already an 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Regex patterns covering standard youtube, music.youtube, youtu.be, shorts, embeds
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|music\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|music\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|music\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|music\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.|music\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = input.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validates if the given string is a valid YouTube or YouTube Music URL/ID
 */
export function isValidYouTubeUrl(input: string): boolean {
  return extractVideoId(input) !== null;
}

/**
 * Cleans song title and separates artist from title if in "Artist - Song" format
 */
export function parseTrackInfo(rawTitle: string, defaultAuthor: string) {
  // Remove common YouTube suffixes
  const cleaned = rawTitle
    .replace(/\[official (?:video|audio|music video|hd|4k|lyric video|lyrics|visualizer)\]/gi, "")
    .replace(/\(official (?:video|audio|music video|hd|4k|lyric video|lyrics|visualizer)\)/gi, "")
    .replace(/\((?:4k|hd|remastered|remaster|hq|explicit)\)/gi, "")
    .replace(/\[(?:4k|hd|remastered|remaster|hq|explicit)\]/gi, "")
    .replace(/\|.*$/g, "")
    .trim();

  let artist = defaultAuthor.replace(/ - Topic$/i, "").replace(/VEVO$/i, "").trim();
  let trackTitle = cleaned;

  if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ");
    if (parts.length >= 2) {
      artist = parts[0].trim();
      trackTitle = parts.slice(1).join(" - ").trim();
    }
  }

  return {
    artist: artist || defaultAuthor,
    cleanTitle: trackTitle || rawTitle,
    fullCleanName: `${artist || defaultAuthor} - ${trackTitle || rawTitle}`,
  };
}

/**
 * Formats duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
