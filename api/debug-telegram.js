// api/debug-telegram.js
// Simple webhook test: when Telegram posts, we reply back with a small JSON confirmation and write to Redis.
import { Redis } from '@upstash/redis';
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).json({ ok: true, note: 'POST updates here' });
    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message) return res.status(200).json({ ok: true, note: 'no message' });

    const text = (message.text || '').trim();
    const chatId = message.chat?.id;

    // store in redis debug list
    if (redis) {
      await redis.lpush(`dbg:telegram`, JSON.stringify({ chatId, text, time: Date.now() }));
    }

    // optional auto-confirm to admin (safe)
    if (process.env.BOT_TOKEN && chatId) {
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'DEBUG: pesan diterima oleh webhook' })
      });
    }

    return res.status(200).json({ ok: true, received: { chatId, text } });
  } catch (err) {
    console.error('debug-telegram error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
