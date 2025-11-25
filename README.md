# esp32-youtube-music

Simple YouTube audio search & streaming API for ESP32 / Xiaozhi-style voice assistants.  
Designed to be deployed on **Render (Free tier)**.

## 1. Features

- `GET /` – health check
- `GET /play?keyword=<text>` – search YouTube for the best matching video and return:
  ```json
  {
    "title": "Lạc Trôi - Sơn Tùng M-TP",
    "videoId": "abc123",
    "url": "https://rr3---sn-....googlevideo.com/..."
  }
  ```
- The `url` field is an **audio-only stream URL** that ESP32 can open via HTTP client and feed into its audio pipeline.

> ⚠️ This server does NOT download or re-host media files.  
> It only returns the original audio stream URL provided by YouTube.

## 2. Local development

```bash
npm install
npm start
```

Then:

```bash
curl "http://localhost:3000/play?keyword=lac%20troi"
```

## 3. Deploy to Render

1. Push this folder to your GitHub as a repo, e.g. `esp32-youtube-music`
2. Go to Render dashboard → **New** → **Web Service**
3. Choose "Build from GitHub", pick your repo
4. Render should auto-detect:
   - Environment: Node
   - Build command: `npm install`
   - Start command: `npm start`
5. Choose **Free** plan
6. Deploy

You will get a URL like:

```text
https://esp32-youtube-music-xxxx.onrender.com
```

Test it:

```bash
curl "https://esp32-youtube-music-xxxx.onrender.com/play?keyword=phia%20sau%20mot%20co%20gai"
```

## 4. Example ESP32 usage (pseudo-code)

On ESP32 side (C++ / ESP-IDF), you can:

1. Build the query URL:

```c++
std::string api = "https://esp32-youtube-music-xxxx.onrender.com/play?keyword=" + url_encode(song_name);
```

2. Do HTTP GET, parse JSON response to get the `url` field
3. Pass that URL into your audio pipeline:

```c++
audio_service.PlayUrl(streamUrl.c_str());
```

Where `audio_service` is your existing audio player in the Xiaozhi firmware.

## 5. Notes

- Designed to be used as a **tool** from LLM / MCP:
  - Tool name: `play_music`
  - Argument: `song` (string – user requested keyword)
- LLM calls: `/play?keyword=<song>`
- ESP32 parses response and plays the `url` field.

---
