import express from "express";
import axios from "axios";
import cors from "cors";
import NodeCache from "node-cache";

const app = express();
app.use(cors());
app.use(express.json());

// CONFIG
const PORT = process.env.PORT || 3000;
const UPSTREAMS = [
  "https://zingmp3-api.vercel.app",
  "https://mp3.zingmp3.workers.dev",
  "https://zingmp3-api.s3-website-vn.amazonaws.com" // fallback (if exists)
];
// choose upstream from env or fallback array
const UPSTREAM = process.env.UPSTREAM_BASE || UPSTREAMS[0];

// simple cache to reduce upstream calls
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 }); // seconds

const axiosInstance = axios.create({
  timeout: 7000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; longking-music/1.0)",
    Accept: "application/json, text/plain, */*"
  }
});

async function upstreamGet(path, params = {}) {
  const cacheKey = `u:${path}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // try main then fallbacks
  const candidates = [UPSTREAM, ...UPSTREAMS.filter(u => u !== UPSTREAM)];
  let lastErr = null;
  for (const base of candidates) {
    try {
      const url = new URL(path, base).toString();
      const resp = await axiosInstance.get(url, { params });
      if (resp && resp.data) {
        cache.set(cacheKey, resp.data);
        return resp.data;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No upstream available");
}

/**
 * /search?q=...
 * returns list of items (encodeId, title, artistsNames, thumbnail)
 */
app.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "missing_q" });

  try {
    // using nvhung9/mp3-api endpoint
    const data = await upstreamGet("/api/search", { query: q });
    // different mirrors may return different shapes, normalize
    const items = (data.items || data.data || data).slice ? (data.items || data.data || data) : [];
    const out = items.map(it => {
      // try multiple shapes
      const encodeId = it.encodeId || it.id || (it.data && it.data.encodeId) || null;
      const title = it.title || it.name || (it.data && it.data.title) || "";
      const artistsNames = it.artistsNames || (it.artists && it.artists.map(a=>a.name).join(", ")) || "";
      const thumbnail = it.thumbnail || it.thumbnailM || (it.thumbnailUrl) || "";
      const duration = it.duration || it.duration_seconds || null;
      return { encodeId, title, artistsNames, thumbnail, duration };
    }).filter(x => x.encodeId);
    res.json(out.slice(0, 10));
  } catch (err) {
    console.error("search err:", err.message || err);
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

/**
 * /song?id=ENCODEID
 * returns: { "128": url, "320": url, title, artist, thumbnail }
 */
app.get("/song", async (req, res) => {
  const id = (req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "missing_id" });

  try {
    const data = await upstreamGet("/api/song", { id });
    // normalize
    const d = data.data || data || {};
    const url128 = d["128"] || d["128kbps"] || d.stream?.["128"] || null;
    const url320 = d["320"] || d.stream?.["320"] || null;
    const title = d.title || d.name || "";
    const artist = d.artistsNames || (d.artists && d.artists.map(a=>a.name).join(", ")) || "";
    const thumbnail = d.thumbnail || d.thumbnailM || "";
    res.json({ id, title, artist, thumbnail, stream: { "128": url128, "320": url320 } });
  } catch (err) {
    console.error("song err:", err.message || err);
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

/**
 * /play?q=search-term
 * convenience: search first match then return best stream urls
 */
app.get("/play", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "missing_q" });

  try {
    const list = await upstreamGet("/api/search", { query: q });
    const items = (list.items || list.data || list) || [];
    if (!items || items.length === 0) return res.status(404).json({ error: "not_found" });
    const first = items[0];
    const encodeId = first.encodeId || first.id || (first.data && first.data.encodeId);
    if (!encodeId) return res.status(404).json({ error: "no_encodeId" });

    const songData = await upstreamGet("/api/song", { id: encodeId });
    const d = songData.data || songData || {};
    const url128 = d["128"] || d.stream?.["128"] || null;
    const url320 = d["320"] || d.stream?.["320"] || null;
    return res.json({
      encodeId,
      title: d.title || first.title || "",
      artist: d.artistsNames || first.artistsNames || "",
      stream: { "128": url128, "320": url320 }
    });
  } catch (err) {
    console.error("play err:", err.message || err);
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

/**
 * /info?id=...
 * pass-through info if available
 */
app.get("/info", async (req, res) => {
  const id = (req.query.id || "").trim();
  if (!id) return res.status(400).json({ error: "missing_id" });
  try {
    const data = await upstreamGet("/api/song", { id });
    res.json(data);
  } catch (err) {
    console.error("info err:", err.message || err);
    res.status(500).json({ error: "upstream_error", detail: err.toString() });
  }
});

/* health */
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

/* basic root */
app.get("/", (req, res) => res.send("longking-music API"));

/* start */
app.listen(PORT, () => {
  console.log(`longking-music API listening on ${PORT}`);
});
