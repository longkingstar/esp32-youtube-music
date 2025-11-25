import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

// ========================
// 1) SEARCH ZINGMP3
// ========================
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "Missing q" });

    const url = `https://zingmp3.vn/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);

    // ĐÚNG THEO HTML BẠN CHỤP
    const first = $("div.media-content span.song-title-item a").first();
    const href = first.attr("href") || "";

    // Lấy encodeId từ .../ABC12345.html
    const match = href.match(/\/([A-Za-z0-9]+)\.html/);
    if (!match) return res.json({ error: "encodeId_not_found" });

    const encodeId = match[1];
    const title = first.find("div.title-wrapper").text().trim() || "";

    res.json({
      encodeId,
      title,
      href
    });

  } catch (err) {
    console.error(err);
    res.json({ error: err.toString() });
  }
});

// ========================
// 2) GET STREAM LINK
// ========================
app.get("/stream", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.json({ error: "Missing id" });

    const api = `https://api.zingmp3.vn/api/v2/song/get/streaming?type=audio&id=${id}&_api=1`;

    const response = await axios.get(api, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.json({ error: err.toString() });
  }
});

// ========================
// START SERVER
// ========================
app.listen(3000, () => console.log("Zing API Server running"));
