// api/messages.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    const session = req.query.session;
    if (!session) return res.status(400).json({ error: 'session required' });

    // ambil semua pesan untuk session (lrange 0..-1)
    const raw = await redis.lrange(`chat:${session}`, 0, -1);
    // Upstash returns newest-first because we used lpush, jadi balik urutannya ascending by created_at
    const msgs = raw.map(r => JSON.parse(r)).sort((a, b) => a.created_at - b.created_at);

    return res.status(200).json(msgs);
  } catch (err) {
    console.error('api/messages error', err);
    return res.status(500).json({ error: String(err) });
  }
}
