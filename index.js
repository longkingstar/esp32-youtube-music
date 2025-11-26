import express from "express";
import axios from "axios";

const app = express();

/*==========================================
  TÌM KIẾM TỪ ZINGMP3 MOBILE HTML
==========================================*/
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ error: "missing_q" });

    const url = `https://m.zingmp3.vn/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`;
    
    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = resp.data;

    // Regex tìm tất cả encodeId kiểu ZxxxZZxx.html
    const regex = /\/([A-Z0-9]{8})\.html/g;

    const results = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      results.push({ encodeId: match[1] });
    }

    if (results.length === 0) {
      return res.json({ error: "no_result" });
    }

    res.json(results);

  } catch (err) {
    console.error(err);
    res.json({ error: err.toString() });
  }
});


/*==========================================
  LẤY LINK STREAM NHẠC KHÔNG CẦN SIG
  (dùng API open-source của cộng đồng)
==========================================*/
app.get("/stream", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.json({ error: "missing_id" });

    const url = `https://api.mp3.zing.vn/api/streaming/audio/${id}/320`;

    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.json({ url: resp.request.res.responseUrl });

  } catch (err) {
    res.json({ error: err.toString() });
  }
});


/*==========================================
  SERVER START
==========================================*/
app.listen(3000, () => {
  console.log("Zing HTML Search API running!");
});
