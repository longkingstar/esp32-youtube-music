import express from "express";
import ytdl from "@distube/ytdl-core";
import ytSearch from "yt-search";

const app = express();

const YT_HEADERS = {
  "User-Agent":
    "com.google.android.youtube/19.15.41 (Linux; U; Android 13)",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "*/*"
};

app.get("/play", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) return res.json({ error: "Missing keyword" });

    const search = await ytSearch(keyword);
    const video = search.videos[0];
    if (!video) return res.json({ error: "Video not found" });

    const info = await ytdl.getInfo(video.url, {
      requestOptions: { headers: YT_HEADERS },
      client: "ANDROID"   // << FIX YOUTUBE BOT BLOCK
    });

    const formats = ytdl.filterFormats(info.formats, "audioonly");
    if (!formats.length) return res.json({ error: "No audio streams" });

    res.json({
      title: video.title,
      author: video.author.name,
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

app.listen(3000, () => console.log("Server OK on port 3000"));
