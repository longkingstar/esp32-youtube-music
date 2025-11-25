import express from "express";
import { youtube } from "play-dl";
import ytSearch from "yt-search";

const app = express();

app.get("/play", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) return res.json({ error: "Missing keyword" });

    // Search video
    const r = await ytSearch(keyword);
    const video = r.videos[0];
    if (!video) return res.json({ error: "Video not found" });

    // Get audio stream using play-dl (not ytdl-core)
    const info = await youtube(video.url);

    const audio = info.streams.find(s => s.audio && !s.video);
    if (!audio) return res.json({ error: "No audio stream" });

    res.json({
      title: info.title,
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

app.listen(3000, () => console.log("YouTube Music API running"));
