FROM python:3.11-slim

# Install system dependencies (FFmpeg, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Ensure latest yt-dlp release
RUN pip install --no-cache-dir --upgrade yt-dlp

# Copy application source
COPY . .

# Set default port
ENV PORT=8080
EXPOSE 8080

# Run FastAPI with dynamic port binding for Render, Railway, etc.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
