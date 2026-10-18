import os
import time
import shutil
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("yt-converter")

app = FastAPI(
    title="SoundRip Audio Conversion Engine",
    description="Permanent, ad-free YouTube and YouTube Music audio conversion microservice powered by yt-dlp & FFmpeg.",
    version="1.0.0"
)

# Enable CORS for all origins so WebApp & Telegram Mini App can connect freely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Accept-Ranges"]
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

# Format to MIME mappings
MIME_TYPES = {
    "mp3": "audio/mpeg",
    "m4a": "audio/mp4",
    "aac": "audio/aac",
    "flac": "audio/flac",
    "wav": "audio/wav",
    "opus": "audio/opus",
    "ogg": "audio/ogg"
}

def clean_old_files(max_age_seconds: int = 7200):
    """Removes cached audio files older than 2 hours to conserve disk space."""
    now = time.time()
    try:
        for filename in os.listdir(STORAGE_DIR):
            file_path = os.path.join(STORAGE_DIR, filename)
            if os.path.isfile(file_path):
                if now - os.path.getmtime(file_path) > max_age_seconds:
                    os.remove(file_path)
                    logger.info(f"Cleaned up expired cache file: {filename}")
    except Exception as e:
        logger.warning(f"Error during cache cleanup: {e}")

class ConvertRequest(BaseModel):
    url: Optional[str] = None
    id: Optional[str] = None
    format: Optional[str] = "mp3"
    bitrate: Optional[str] = "320"

@app.on_event("startup")
def on_startup():
    clean_old_files()
    logger.info("SoundRip Backend Engine initialized successfully.")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SoundRip Audio Conversion Engine",
        "ad_free": True,
        "supported_formats": list(MIME_TYPES.keys()),
        "endpoints": {
            "info": "/info?id=VIDEO_ID",
            "convert": "POST /convert",
            "download": "/download/{filename}"
        }
    }

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/info")
@app.get("/api/info")
def get_info(url: Optional[str] = None, id: Optional[str] = None):
    target = url or (f"https://www.youtube.com/watch?v={id}" if id else None)
    if not target:
        raise HTTPException(status_code=400, detail="Missing 'url' or 'id' query parameter")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target, download=False)
            return {
                "success": True,
                "id": info.get("id"),
                "title": info.get("title"),
                "artist": info.get("artist") or info.get("uploader") or "Unknown Artist",
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
                "url": f"https://www.youtube.com/watch?v={info.get('id')}"
            }
    except Exception as e:
        logger.error(f"Error extracting metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/convert")
@app.post("/convert/")
@app.post("/api/convert")
@app.post("/api/convert/")
def convert_audio(req: ConvertRequest, request: Request, background_tasks: BackgroundTasks):
    video_id = req.id
    raw_url = req.url

    if not video_id and raw_url:
        # Extract video ID from URL
        if "v=" in raw_url:
            video_id = raw_url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in raw_url:
            video_id = raw_url.split("youtu.be/")[1].split("?")[0]

    if not video_id:
        raise HTTPException(status_code=400, detail="Valid YouTube URL or Video ID is required")

    target_format = (req.format or "mp3").lower().strip()
    if target_format not in MIME_TYPES:
        target_format = "mp3"

    bitrate = req.bitrate or "320"
    target_filename = f"{video_id}_{target_format}.{target_format}"
    target_filepath = os.path.join(STORAGE_DIR, target_filename)

    # Check if file is already converted & cached (> 50KB)
    if os.path.exists(target_filepath) and os.path.getsize(target_filepath) > 50000:
        base_url = str(request.base_url).rstrip("/")
        download_url = f"{base_url}/download/{target_filename}"
        return {
            "success": True,
            "completed": True,
            "id": video_id,
            "format": target_format,
            "cached": True,
            "downloadUrl": download_url,
            "progress": 100
        }

    youtube_url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": os.path.join(STORAGE_DIR, f"{video_id}_{target_format}.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": target_format,
            "preferredquality": bitrate,
        }],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            title = info.get("title", "Audio Track")
            artist = info.get("artist") or info.get("uploader") or "Artist"

        if not os.path.exists(target_filepath) or os.path.getsize(target_filepath) < 10000:
            raise Exception("File extraction resulted in empty or incomplete audio")

        background_tasks.add_task(clean_old_files)

        base_url = str(request.base_url).rstrip("/")
        download_url = f"{base_url}/download/{target_filename}"

        return {
            "success": True,
            "completed": True,
            "id": video_id,
            "title": title,
            "artist": artist,
            "format": target_format,
            "downloadUrl": download_url,
            "progress": 100
        }

    except Exception as e:
        logger.error(f"Conversion error for {video_id}: {e}")
        # Clean up partial artifacts
        if os.path.exists(target_filepath):
            try:
                os.remove(target_filepath)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")

@app.get("/download/{filename}")
@app.get("/api/download/{filename}")
def download_file(filename: str, title: Optional[str] = None):
    # Sanitize filename
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(STORAGE_DIR, safe_filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Requested audio track not found or has expired.")

    ext = safe_filename.split(".")[-1].lower() if "." in safe_filename else "mp3"
    media_type = MIME_TYPES.get(ext, "audio/mpeg")

    download_name = f"{title}.{ext}" if title else safe_filename

    response = FileResponse(
        path=filepath,
        filename=download_name,
        media_type=media_type,
        headers={
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"
        }
    )
    return response

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
