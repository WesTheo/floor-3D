import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();
const HF = 'https://api-inference.huggingface.co/models';
const TOKEN = process.env.HF_TOKEN!;

router.post('/api/segment', async (req, res) => {
  const img = Buffer.from(await req.arrayBuffer());
  const r = await fetch(`${HF}/nvidia/segformer-b0-finetuned-ade-512-512`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: img
  });
  const out = await r.json(); // [{label, score, mask(base64 PNG)}...]
  res.json(out);
});

export default router;
