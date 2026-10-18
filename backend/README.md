# SoundRip Backend Audio Converter Engine 🎵

A private, 100% ad-free, high-performance YouTube & YouTube Music audio conversion microservice powered by **FastAPI**, **yt-dlp**, and **FFmpeg**.

---

## Features
- **100% Ad-Free**: Pure media streaming with zero popups, redirects, or third-party ads.
- **Permanent**: Owned and controlled by you — no monthly subscription or token expirations.
- **High-Fidelity Audio**: Converts directly to 320kbps MP3, M4A, AAC, FLAC, and WAV.
- **Automatic Caching**: Stores converted tracks locally so repeat downloads are instantaneous.
- **CORS Enabled**: Seamlessly integrates with Vercel WebApp and Telegram Mini App.

---

## 🚀 Free Cloud Deployment Options (Choose Any)

### Option 1: Deploy on Koyeb (Recommended • Free • Always Online)
1. Go to [app.koyeb.com](https://app.koyeb.com/) and sign up for a free account.
2. Click **Create Service** and select **GitHub**.
3. Choose your repository: `Ala2ar/yt-music-converter`.
4. Set **Builder** to `Dockerfile`.
5. Under **Root Directory**, set: `backend`.
6. Select the **Free** instance type.
7. Click **Deploy**. Koyeb will give you a public URL (e.g. `https://your-service.koyeb.app`).

---

### Option 2: Deploy on Render (Free Web Service)
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `Ala2ar/yt-music-converter`.
4. Set **Runtime** to `Docker`.
5. Set **Root Directory** to `backend`.
6. Select the **Free** plan and click **Create Web Service**.
7. Render will provide your public URL (e.g. `https://your-service.onrender.com`).

---

### Option 3: Deploy on Hugging Face Spaces (Free • 16GB RAM)
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Set Space SDK to **Docker** (Blank).
3. Upload the files in `backend/` (`main.py`, `Dockerfile`, `requirements.txt`).
4. Click **Create Space**. Hugging Face builds and hosts your backend for free forever!

---

## 🔗 Connecting the Backend to your App

Once your backend is deployed and you have its public URL (e.g. `https://your-backend.koyeb.app`):

### In Vercel:
1. Go to your project on Vercel > **Settings** > **Environment Variables**.
2. Add a new variable:
   - **Key:** `CONVERTER_BACKEND_URL`
   - **Value:** `https://your-backend.koyeb.app`
3. Click **Save** and trigger a **Redeploy**.

### In the App UI:
You can also connect immediately without touching Vercel:
1. Open your SoundRip app.
2. Click **Settings** in the top navigation.
3. Paste your backend URL in the **Private Backend URL** field and click **Save Settings**!

---

## 💻 Running Locally on your Computer

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
Your backend will start at: `http://localhost:8080`.
You can view the interactive API documentation at: `http://localhost:8080/docs`.
