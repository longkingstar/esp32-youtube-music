import express from "express";
import { soundcloud, spotify, youtube } from "play-dl";
import ytSearch from "yt-search";

const app = express();

app.get("/play", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword)
      return res.json({ error: "Missing keyword" });

    // 1. Search Youtube
    const search = await ytSearch(keyword);
    const video = search.videos[0];
    if (!video)
      return res.json({ error: "Video not found" });

    // 2. Get audio stream URL via play-dl
    const info = await youtube(video.url);

    const formats = info.streams.filter(s => s.audio);
    if (!formats.length)
      return res.json({ error: "No audio stream" });

    res.json({
      title: info.title,
      thumbnail: info.thumbnails[0].url,
      url: formats[0].url
    });

  } catch (err) {
    console.error("YT API Error:", err);
    res.json({
      error: "Internal error",
      details: err.message
    });
  }
});

app.listen(3000, () =>
  console.log("YouTube Music API running on port 3000")
);
