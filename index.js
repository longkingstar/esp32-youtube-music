import express from "express";
import axios from "axios";

const app = express();

/* =========================================
   1) SEARCH ZING WITHOUT CHEERIO
   ========================================= */
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "Missing q" });

    const url = `https://zingmp3.vn/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`;

    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = resp.data;

    // Regex tìm bài hát đầu tiên
    const match = html.match(/\/([A-Za-z0-9]{8})\.html/);

    if (!match) return res.json({ error: "encodeId_not_found" });

    const encodeId = match[1];

    res.json({
      encodeId,
      href: `/bai-hat/${encodeId}.html`
    });

  } catch (err) {
    console.error(err);
    res.json({ error: err.toString() });
  }
});


/* =========================================
   2) STREAM LINK
   ========================================= */
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


/* =========================================
   SERVER
   ========================================= */
app.listen(3000, () => {
  console.log("Zing API (no-cheerio) running!");
});
