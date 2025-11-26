import express from "express";
import axios from "axios";
import cors from "cors";
import NodeCache from "node-cache";

const app = express();
app.use(cors());
app.use(express.json());

// CONFIG — chỉ còn 2 upstream hoạt động
const PORT = process.env.PORT || 3000;

const UPSTREAMS = [
  "https://zingmp3-api.vercel.app",
  "https://mp3.zingmp3.workers.dev"
];

const UPSTREAM = process.env.UPSTREAM_BASE || UPSTREAMS[0];

// Cache 30 giây
const cache = new NodeCache({ stdTTL: 30 });

// HTTP client
const axiosInstance = axios.create({
  timeout: 7000,
  headers: {
    "User-Agent": "Mozilla/5.0 (longking-music)",
    Accept: "application/json"
  }
});

// hàm gọi upstream có fallback
async function upstreamGet(path, params = {}) {
  const cacheKey = `u:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let lastErr = null;
  const candidates = [UPSTREAM, ...UPSTREAMS.filter(u => u !== UPSTREAM)];

  for (const base of candidates) {
    try {
      const url = new URL(path, base).toString();
      const resp = await axiosInstance.get(url, { params });

      if (resp?.data) {
        cache.set(cacheKey, resp.data);
        return resp.data;
      }
    } catch (err) {
      lastErr = err;
      // thử tiếp mirror khác
    }
  }

  throw lastErr || new Error("All upstreams failed");
}

//===========================
// SEARCH
//===========================
app.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "missing_q" });

  try {
    const data = await upstreamGet("/api/search", { query: q });
    const items = data.items || data.data || [];

    const normalized = items.map(it => ({
      encodeId: it.encodeId,
      title: it.title,
      artistsNames: it.artistsNames,
      thumbnail: it.thumbnailM || it.thumbnail,
      duration: it.duration
    })).filter(x => x.encodeId);

    res.json(normalized.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

//===========================
// SONG STREAMING
//===========================
app.get("/song", async (req, res) => {
  const id = (req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "missing_id" });

  try {
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
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

//===========================
// PLAY (search → stream)
//===========================
app.get("/play", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "missing_q" });

  try {
    const list = await upstreamGet("/api/search", { query: q });
    const items = list.items || [];

    if (!items.length) return res.json({ error: "not_found" });

    const first = items[0];
    const encodeId = first.encodeId;

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
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`longking-music API running on port ${PORT}`);
});
