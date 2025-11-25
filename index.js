import express from "express";
import axios from "axios";
import crypto from "crypto";

const app = express();

// Key lấy từ app Zing (đã public khắp GitHub)
const API_KEY = "88265e23";
const SECRET_KEY = "2aa2a1f6d5a6ccc9e9a487f5e6e05b8f";
const VERSION = "1.6.34";

function getHmac512(str) {
  return crypto.createHmac("sha512", SECRET_KEY)
    .update(str)
    .digest("hex");
}

function encodeParams(params) {
  return Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
}

/* ============================================================
   1) SEARCH SONG
   GET /search?q=...
   ============================================================ */
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "Missing q" });

    const ctime = Math.floor(Date.now() / 1000);

    const params = {
      q,
      ctime,
      version: VERSION
    };

    const paramStr = encodeParams(params);
    const sig = getHmac512("/api/v2/search/multi" + paramStr);

    const url =
      `https://zingmp3.vn/api/v2/search/multi?${paramStr}&sig=${sig}&apiKey=${API_KEY}`;

    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.json(resp.data);

  } catch (err) {
    res.json({ error: err.toString() });
  }
});


/* ============================================================
   2) GET STREAM URL
   GET /stream?id=...
   ============================================================ */
app.get("/stream", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.json({ error: "Missing id" });

    const ctime = Math.floor(Date.now() / 1000);

    const params = {
      id,
      ctime,
      version: VERSION
    };

    const paramStr = encodeParams(params);
    const sig = getHmac512("/api/v2/song/get/streaming" + paramStr);

    const url =
      `https://zingmp3.vn/api/v2/song/get/streaming?${paramStr}&sig=${sig}&apiKey=${API_KEY}`;

    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.json(resp.data);

  } catch (err) {
    res.json({ error: err.toString() });
  }
});


/* ============================================================
   SERVER
   ============================================================ */
app.listen(3000, () => {
  console.log("Zing API (signature bypass) running!");
});
