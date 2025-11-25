import express from "express";
import ytdl from "@distube/ytdl-core";
import ytSearch from "yt-search";

const app = express();

const YT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "*/*"
};

app.get("/play", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) return res.json({ error: "Missing keyword" });

    // 1) Search YouTube
    const search = await ytSearch(keyword);
    const video = search.videos[0];
    if (!video) return res.json({ error: "Video not found" });

    // 2) Get info with headers (fix login bot detect)
    const info = await ytdl.getInfo(video.url, {
      requestOptions: { headers: YT_HEADERS }
    });

    const formats = ytdl.filterFormats(info.formats, "audioonly");
    if (!formats.length) return res.json({ error: "No audio streams" });

    // 3) Link audio
    const audioUrl = formats[0].url;

    res.json({
      title: video.title,
      author: video.author.name,
      url: audioUrl
    });

  } catch (err) {
    console.error("YT API Error:", err);
    res.json({
      error: "Internal error",
      details: err.message
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
