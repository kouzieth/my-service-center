// api/chat.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session, text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });

    // build notification text
    const botToken = process.env.BOT_TOKEN;
    const adminChat = process.env.ADMIN_CHAT_ID;

    if (!botToken || !adminChat) {
      return res.status(500).json({ error: 'BOT_TOKEN or ADMIN_CHAT_ID not configured' });
    }

    const notif = `🆕 New chat\nSession: \`${session || 'no-session'}\`\nMessage: ${text}\n\nBalas di Telegram (manual).`;

    const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChat,
        text: notif,
        parse_mode: 'Markdown'
      })
    });

    const tgJson = await tgResp.json();

    if (!tgJson.ok) {
      console.error('Telegram API error', tgJson);
      return res.status(500).json({ error: 'Telegram API error', details: tgJson });
    }

    return res.status(200).json({ ok: true, telegram: tgJson });
  } catch (err) {
    console.error('chat handler error', err);
    return res.status(500).json({ error: String(err) });
  }
}
