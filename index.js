import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ZingMP3 API KEY
const API_KEY = "88265e23"; // key public ai cũng dùng được

// Function gọi API Zing
async function zingApi(path, params = {}) {
  const url = "https://zingmp3.vn/api" + path;

  const response = await axios.get(url, {
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://zingmp3.vn/",
      "Origin": "https://zingmp3.vn/",
      "User-Agent": "Mozilla/5.0"
    },
    params: {
      ...params,
      apiKey: API_KEY,
      ctime: Math.floor(Date.now() / 1000)
    }
  });

  return response.data;
}

// SEARCH
app.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ error: "missing_q" });

  try {
    const data = await zingApi("/v2/search", { q });
    res.json(data.data.songs);
  } catch (err) {
    res.json({ error: err.toString() });
  }
});

// GET SONG STREAM URL
app.get("/song", async (req, res) => {
  const id = req.query.id;
  if (!id) return res.json({ error: "missing_id" });

  try {
    const data = await zingApi("/v2/song/get/streaming", { id });
    res.json(data.data);
  } catch (err) {
    res.json({ error: err.toString() });
  }
});

// SERVER START
app.listen(3000, () => {
  console.log("longking-music API running on port 3000");
});
