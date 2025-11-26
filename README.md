# ESP32 YouTube Server (youtubei.js)

API:
  GET /play?q=<tên bài>

Trả về:
  {
    "videoId": "...",
    "title": "...",
    "url": "https://googlevideo.com/....audio..."
  }

Cách deploy Render:
  1. Upload repo lên GitHub
  2. Render → New Web Service
  3. Build: npm install
  4. Start: node index.js
