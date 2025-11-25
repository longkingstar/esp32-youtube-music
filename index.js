import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const app = express();

// simple search scrape: returns first encodeId found
app.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing q' });
  try {
    const url = `https://zingmp3.vn/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`;
    const r = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(r.data);
    // find the first song item — selector may change; adjust if needed
    const item = $('div.card-body a.item').first();
    const href = item.attr('href') || '';
    // href like /bai-hat/Ten-Bai/encodeId.html
    const m = href.match(/\/bai-hat\/.*\/([A-Za-z0-9-_]+)/);
    if (!m) return res.json({ error: 'not_found' });
    const encodeId = m[1];
    const title = item.find('.title').text().trim() || '';
    const artist = item.find('.author').text().trim() || '';
    return res.json({ encodeId, title, artist });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/stream', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    // call streaming API (public endpoint used by many mirrors)
    const api = `https://api.zingmp3.vn/api/v2/song/get/streaming?type=audio&id=${id}&_api=1`;
    const r = await axios.get(api, { headers: { 'User-Agent': 'Mozilla/5.0' } , timeout: 8000});
    return res.json(r.data);
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Zing API listening'));
