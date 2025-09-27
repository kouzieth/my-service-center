// api/chat.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { session, text } = req.body || {};
    if (!session || !text) return res.status(400).json({ error: 'session & text required' });

    const msg = { session_id: session, sender: 'user', text: String(text), created_at: Date.now() };

    // push ke Redis list (newest di index 0)
    await redis.lpush(`chat:${session}`, JSON.stringify(msg));

    // kirim notif ke Telegram admin (notifikasi berisi session id)
    if (process.env.BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
      const notif = `🆕 New chat\nSession: \`${session}\`\nMessage: ${text}\n\nBalas admin di Telegram: /reply ${session} <pesan>`;
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.ADMIN_CHAT_ID, text: notif, parse_mode: 'Markdown' }),
      });
    }

    return res.status(200).json({ ok: true, stored: msg });
  } catch (err) {
    console.error('api/chat error', err);
    return res.status(500).json({ error: String(err) });
  }
}
