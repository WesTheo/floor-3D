import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();
const HF = 'https://api-inference.huggingface.co/models';
const TOKEN = process.env.HF_TOKEN!;

router.post('/api/depth', async (req, res) => {
  const img = Buffer.from(await req.arrayBuffer());
  const r = await fetch(`${HF}/Intel/dpt-hybrid-midas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: img
  });
  const ab = await r.arrayBuffer(); // returns depth image (PNG)
  res.setHeader('Content-Type', 'image/png');
  res.send(Buffer.from(ab));
});

export default router;
