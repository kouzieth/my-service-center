// api/telegram.js
// Telegram webhook: accept /reply <session> <pesan> and write to Edge Config.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message || !message.text) return res.status(200).json({ ok: true });

    const text = message.text.trim();
    const chatId = message.chat?.id;

    if (!text.startsWith('/reply')) return res.status(200).json({ ok: true, note: 'ignored' });

    const parts = text.split(' ');
    const session = parts[1];
    const replyText = parts.slice(2).join(' ').trim();
    if (!session || !replyText) {
      if (process.env.BOT_TOKEN && chatId) {
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ chat_id: chatId, text: 'Gunakan: /reply <session_id> <pesan>' })
        });
      }
      return res.status(200).json({ ok: false, error: 'bad_format' });
    }

    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!edgeConfigId || !vercelToken) return res.status(500).json({ error: 'EDGE_CONFIG_ID or VERCEL_TOKEN not configured' });

    const ts = Date.now();
    const key = `chat:${session}:${ts}`;
    const value = JSON.stringify({ session, sender: 'admin', text: replyText, created_at: ts, from_chat: chatId });

    await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ operation: 'upsert', key, value }])
    });

    // confirm to admin
    if (process.env.BOT_TOKEN && chatId) {
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chat_id: chatId, text: `Pesan terkirim ke session ${session}` })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('api/telegram error', err);
    return res.status(500).json({ error: String(err) });
  }
}
