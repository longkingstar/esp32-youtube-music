import express from "express";
import { Innertube } from "youtubei.js";

const app = express();

app.get("/play", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "Missing query" });

    // Create YouTube client
    const yt = await Innertube.create();

    // Search video
    const search = await yt.search(q);
    if (!search.results.length)
      return res.json({ error: "video_not_found" });

    const video = search.results[0];
    const videoId = video.id;

    // Get full video info
    const info = await yt.getInfo(videoId);

    // Direct audio URL YouTube provides (opus/webm)
    const audioUrl = info.primary_audio_url;

    return res.json({
      videoId,
      title: info.basic_info.title,
      url: audioUrl
    });

  } catch (err) {
    return res.json({ error: err.toString() });
  }
});

app.get("/", (req, res) => {
  res.send("YouTube Audio API OK");
});

app.listen(3000, () => console.log("Server running on 3000"));
