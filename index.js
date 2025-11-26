import express from "express";
import { Innertube } from "youtubei.js";

const app = express();
app.use(express.json());

let yt;

// Khởi động youtubei.js
(async () => {
  yt = await Innertube.create({
    location: "VN",
    cookie: process.env.YT_COOKIE || ""
  });
})();

/* STREAM AUDIO */
app.get("/audio", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.json({ error: "missing_id" });

    const info = await yt.getInfo(id);

    const audio = info.streaming_data?.adaptive_formats?.find(
      x => x.mime_type.includes("audio")
    );

    if (!audio) return res.json({ error: "no_audio" });

    res.json({
      url: audio.url,
      bitrate: audio.bitrate,
      mime: audio.mime_type
    });

  } catch (err) {
    res.json({ error: err.toString() });
  }
});

/* TEST */
app.get("/", (req, res) => res.send("YouTube Audio Server OK"));

app.listen(3000, () => console.log("Server running"));
