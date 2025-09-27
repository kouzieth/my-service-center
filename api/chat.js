// api/chat.js (Node)
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID;

const supa = createClient(SUPA_URL, SUPA_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { session, text } = req.body || {};
  if (!session || !text) return res.status(400).json({ error: 'session & text required' });

  // 1) simpan pesan user
  await supa.from('messages').insert([{ session_id: session, sender: 'user', text }]);

  // 2) generate reply via OpenAI (simple)
  let aiReply = 'Maaf, terjadi error pada auto-responder.';
  try {
    const openResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // atau model yang tersedia; ganti sesuai plan
        messages: [
          { role:'system', content:'Kamu adalah CS yang ramah dan ringkas.' },
          { role:'user', content: text }
        ],
        max_tokens: 300
      })
    });
    const jr = await openResp.json();
    aiReply = jr?.choices?.[0]?.message?.content?.trim() || 'Terima kasih, kami akan menghubungi Anda segera.';
  } catch(err){ console.error('openai err', err); }

  // 3) simpan jawaban AI
  await supa.from('messages').insert([{ session_id: session, sender: 'bot', text: aiReply }]);

  // 4) kirim notifikasi ke Telegram admin (sertakan session id)
  try {
    const notif = `🆕 *New chat*\nSession: \`${session}\`\nMessage: ${text}\n\nReply with:\n/reply ${session} <pesan>`;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text: notif, parse_mode: 'Markdown' })
    });
  } catch(e){ console.error('tg err', e); }

  return res.status(200).json({ ok:true, bot: aiReply });
};
