// api/telegram.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    // Telegram akan POST update ke sini
    if (req.method !== 'POST') return res.status(200).json({ ok: true });

    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message) return res.status(200).json({ ok: true });

    const text = (message.text || '').trim();
    const chatId = message.chat?.id;

    if (!text) return res.status(200).json({ ok: true });

    if (text.startsWith('/reply')) {
      // format: /reply <session> <pesan...>
      const parts = text.split(' ');
      const session = parts[1];
      const replyText = parts.slice(2).join(' ').trim();

      if (!session || !replyText) {
        // kirim petunjuk ke admin
        if (process.env.BOT_TOKEN && chatId) {
          await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: 'Gunakan: /reply <session_id> <pesan>' }),
          });
        }
        return res.status(200).json({ ok: false, error: 'bad_format' });
      }

      const msg = { session_id: session, sender: 'admin', text: replyText, created_at: Date.now() };

      // simpan ke Redis (sebagai message untuk session)
      await redis.lpush(`chat:${session}`, JSON.stringify(msg));

      // konfirmasi kembali ke admin
      if (process.env.BOT_TOKEN && chatId) {
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: `Pesan terkirim ke session ${session}` }),
        });
      }

      return res.status(200).json({ ok: true, stored: msg });
    }

    // Non-command messages: optional - ignore or notify
    return res.status(200).json({ ok: true, note: 'no-action' });
  } catch (err) {
    console.error('api/telegram error', err);
    return res.status(500).json({ error: String(err) });
  }
      }
