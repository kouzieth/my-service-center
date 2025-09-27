// api/debug-chat.js
// Debug endpoint to test sending to Telegram and writing to Upstash.
// Do NOT paste BOT_TOKEN or tokens publicly.
import { Redis } from '@upstash/redis';
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).json({ ok: true, note: 'send POST with {session,text}' });

    const { session, text } = req.body || {};
    if (!session || !text) return res.status(400).json({ error: 'session & text required' });

    // test Redis write
    let redisResult = null;
    if (redis) {
      await redis.lpush(`dbg:chat:${session}`, JSON.stringify({ session, text, time: Date.now() }));
      const list = await redis.lrange(`dbg:chat:${session}`, 0, -1);
      redisResult = { stored: list.length };
    } else {
      redisResult = { stored: 0, note: 'redis not configured' };
    }

    // test Telegram sendMessage (returns Telegram JSON or error)
    let tgRes = null;
    if (process.env.BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
      const resp = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.ADMIN_CHAT_ID, text: `DEBUG send from session ${session}: ${text}` })
      });
      tgRes = await resp.json();
    } else {
      tgRes = { ok: false, error: 'BOT_TOKEN or ADMIN_CHAT_ID missing' };
    }

    return res.status(200).json({ ok: true, redis: redisResult, telegram: tgRes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
      }
