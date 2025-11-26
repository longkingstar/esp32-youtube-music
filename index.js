import express from "express";
import axios from "axios";
import cors from "cors";
import NodeCache from "node-cache";

const app = express();
app.use(cors());
app.use(express.json());

// CONFIG — chỉ còn 1 upstream stable
const PORT = process.env.PORT || 3000;

const UPSTREAM = "https://zingmp3-api.vercel.app";

// Cache 30 giây
const cache = new NodeCache({ stdTTL: 30 });

const axiosInstance = axios.create({
  timeout: 7000,
  headers: {
    "User-Agent": "Mozilla/5.0 (longking-music)",
    Accept: "application/json"
  }
});

// Call upstream with cache
async function upstreamGet(path, params = {}) {
  const cacheKey = `u:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(path, UPSTREAM).toString();
  const resp = await axiosInstance.get(url, { params });

  if (resp?.data) {
    cache.set(cacheKey, resp.data);
    return resp.data;
  }

  throw new Error("Invalid upstream response");
}

//===========================
// SEARCH
//===========================
app.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ error: "missing_q" });

    const data = await upstreamGet("/api/search", { query: q });
    const items = data.items || data.data || [];

    const out = items
      .map(item => ({
        encodeId: item.encodeId,
        title: item.title,
        artistsNames: item.artistsNames,
        thumbnail: item.thumbnailM || item.thumbnail,
        duration: item.duration
      }))
      .filter(x => x.encodeId);

    res.json(out);
  } catch (err) {
    res.json({ error: "upstream_error", detail: err.toString() });
  }
});

//===========================
// SONG
//===========================
app.get("/song", async (req, res) => {
  try {
    const id = (req.query.id || "").trim();
    if (!id) return res.json({ error: "missing_id" });

    const data = await upstreamGet("/api/song", { id });
    const d = data.data || {};

    res.json({
      id,
      title: d.title,
      artist: d.artistsNames,
      thumbnail: d.thumbnailM || d.thumbnail,
      stream: {
        "128": d["128"],
        "320": d["320"]
      }
    });
  } catch (err) {
    res.json({ error: "upstream_error", detail: err.toString() });
  }
});

//===========================
// PLAY
//===========================
app.get("/play", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ error: "missing_q" });

    const data = await upstreamGet("/api/search", { query: q });
    const items = data.items || [];

    if (items.length === 0)
      return res.json({ error: "not_found" });

    const encodeId = items[0].encodeId;

    const songData = await upstreamGet("/api/song", { id: encodeId });
    const d = songData.data || {};

    res.json({
      encodeId,
      title: d.title,
      artist: d.artistsNames,
      stream: {
        "128": d["128"],
        "320": d["320"]
      }
    });
  } catch (err) {
    res.json({ error: "upstream_error", detail: err.toString() });
  }
});

app.get("/", (req, res) => res.send("longking-music API OK"));
app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () =>
  console.log(`longking-music API running on port ${PORT}`)
);
