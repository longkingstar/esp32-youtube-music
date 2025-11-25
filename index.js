import express from "express";
import ytSearch from "yt-search";

// Import play-dl (CommonJS)
import playdl from "play-dl";
const { youtube } = playdl;

const app = express();

app.get("/play", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword)
      return res.json({ error: "Missing keyword" });

    // 1. Search YouTube
    const r = await ytSearch(keyword);
    const video = r.videos[0];
    if (!video)
      return res.json({ error: "Video not found" });

    // 2. Get info via play-dl (This bypasses YouTube anti-bot)
    const info = await youtube(video.url);

    // 3. Lấy audio stream
    const audio = info.streams.find(s => s.audio && !s.video);
    if (!audio)
      return res.json({ error: "No audio stream" });

    res.json({
      title: info.title,
      author: info.channel,
      thumbnail: info.thumbnails[0].url,
      url: audio.url
    });

  } catch (err) {
    console.error("YT API Error:", err);
    res.json({
      error: "Internal error",
      details: err.message
    });
  }
});

// Render uses port 3000
app.listen(3000, () => console.log("YouTube Music API is running!"));
