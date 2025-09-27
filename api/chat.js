// api/chat.js (debug-friendly)
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID;

const supa = (SUPA_URL && SUPA_KEY) ? createClient(SUPA_URL, SUPA_KEY) : null;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { session, text } = req.body || {};
  if (!session || !text) return res.status(400).json({ error: 'session & text required' });

  try {
    // save user message (optional)
    if (supa) {
      await supa.from('messages').insert([{ session_id: session, sender: 'user', text }]);
    }

    // quick AI reply (optional) — you can skip if not using OpenAI
    let aiReply = 'Terima kasih, CS akan segera menanggapi.';
    // (Omitted: call to OpenAI to simplify debug)

    // save bot reply
    if (supa) {
      await supa.from('messages').insert([{ session_id: session, sender: 'bot', text: aiReply }]);
    }

    // Build notification text
    const notif = `🆕 New chat\nSession: \`${session}\`\nMessage: ${text}\n\nBalas: /reply ${session} <pesan>`;

    if (!BOT_TOKEN || !ADMIN_CHAT) {
      return res.status(500).json({ error: 'BOT_TOKEN or ADMIN_CHAT missing in env', BOT_TOKEN_set: !!BOT_TOKEN, ADMIN_CHAT: ADMIN_CHAT });
    }

    // send to Telegram and capture response
    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text: notif, parse_mode: 'Markdown' })
    });

    const tgJson = await tgResp.json();

    // If Telegram API returned not ok, include details
    if (!tgJson.ok) {
      console.error('Telegram error', tgJson);
      return res.status(500).json({ error: 'Telegram API error', tg: tgJson });
    }

    // success
    return res.status(200).json({ ok: true, botReply: aiReply, telegram: tgJson });

  } catch (err) {
    console.error('chat error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
