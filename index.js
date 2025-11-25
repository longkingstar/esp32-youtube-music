import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "Missing q" });

    const url = `https://zingmp3.vn/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`;

    const resp = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(resp.data);

    const first = $("div.media-content span.song-title-item a").first();
    const href = first.attr("href") || "";

    const match = href.match(/\/([A-Za-z0-9]+)\.html/);
    if (!match) return res.json({ error: "encodeId_not_found" });

    const encodeId = match[1];

    res.json({ encodeId, href });
  } catch (err) {
    res.json({ error: err.toString() });
  }
});

app.get("/stream", async (req, res) => {
  try {
    const id = req.query.id;

    const url = `https://api.zingmp3.vn/api/v2/song/get/streaming?id=${id}&type=audio&_api=1`;

    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.json(resp.data);
  } catch (err) {
    res.json({ error: err.toString() });
  }
});

app.listen(3000, () =>
  console.log("Zing API Server running on port 3000")
);
