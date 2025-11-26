import express from "express";
import Innertube from "youtubei.js";

const app = express();
let youtube;

// Init YouTubeI (API private, bypass block)
(async () => {
  youtube = await Innertube.create({
    lang: "vi",
    location: "VN",
    retrieve_player: true,
    retrieve_cookie: true,
  });

  console.log("YouTube API READY (v16.x)");
})();

/* ======================================
   SEARCH VIDEO
====================================== */
app.get("/search", async (req, res) => {
  try {
    if (!youtube) return res.json({ error: "YT_not_ready" });

    const q = req.query.q;
    if (!q) return res.json({ error: "missing_q" });

    const result = await youtube.search(q, { type: "video" });

    if (!result?.videos?.length)
      return res.json({ error: "not_found" });

    const v = result.videos[0];

    res.json({
      videoId: v.id,
      title: v.title,
      thumbnails: v.thumbnails
    });

  } catch (e) {
    console.error(e);
    res.json({ error: e.toString() });
  }
});

/* ======================================
   GET AUDIO STREAM URL
====================================== */
app.get("/stream", async (req, res) => {
  try {
    if (!youtube) return res.json({ error: "YT_not_ready" });

    const id = req.query.id;
    if (!id) return res.json({ error: "missing_id" });

    const info = await youtube.getInfo(id);

    const formats = info?.streaming_data?.adaptive_formats || [];

    const audio = formats.find(f =>
      f.mime_type.includes("audio") && f.url
    );

    if (!audio)
      return res.json({ error: "no_audio_stream" });

    res.json({
      url: audio.url,
      mime: audio.mime_type,
      bitrate: audio.bitrate
    });

  } catch (e) {
    console.error(e);
    res.json({ error: e.toString() });
  }
});

app.listen(3000, () => {
  console.log("ESP32 YouTube Server RUNNING on 3000");
});
