import express from "express";
import cors from "cors";
import ytdl from "@distube/ytdl-core";
import ytSearch from "yt-search";

const app = express();
app.use(cors());

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "esp32-youtube-music API running" });
});

/**
 * GET /play?keyword=...
 * Search YouTube for a song and return an audio-only stream URL
 * Response:
 *  {
 *    "title": "...",
 *    "videoId": "...",
 *    "url": "https://...googlevideo.com/..."
 *  }
 */
app.get("/play", async (req, res) => {
  try {
    const keyword = (req.query.keyword || "").toString().trim();
    if (!keyword) {
      return res.status(400).json({ error: "Missing 'keyword' query parameter" });
    }

    console.log("[/play] keyword =", keyword);

    // 1. Search YouTube
    const search = await ytSearch(keyword);
    if (!search.videos || search.videos.length === 0) {
      return res.status(404).json({ error: "No video found for keyword", keyword });
    }

    const video = search.videos[0];
    console.log("[/play] picked video:", video.title, video.url);

    // 2. Get video info and filter audio-only formats
    const info = await ytdl.getInfo(video.url);
    const formats = ytdl.filterFormats(info.formats, "audioonly");

    if (!formats || formats.length === 0) {
      return res.status(500).json({ error: "No audio-only formats found" });
    }

    // Prefer highest audio bitrate
    const sorted = formats
      .filter(f => !!f.url)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    const streamUrl = sorted[0].url;

    return res.json({
      title: video.title,
      videoId: video.videoId,
      url: streamUrl
    });
  } catch (err) {
    console.error("Error in /play:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`esp32-youtube-music server listening on port ${PORT}`);
});
