// api/telegram.js
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;

const supa = createClient(SUPA_URL, SUPA_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const update = req.body;
  const msg = update.message;
  if (!msg || !msg.text) return res.status(200).end();

  const from = msg.from.username || msg.from.first_name || 'admin';
  const text = msg.text.trim();

  if (text.startsWith('/reply')) {
    // format: /reply <session> <pesan>
    const parts = text.split(' ');
    const session = parts[1];
    const replyText = parts.slice(2).join(' ');
    if (!session || !replyText) {
      // inform admin format salah
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chat_id: msg.chat.id, text: 'Gunakan: /reply <session_id> <pesan>' })
      });
      return res.status(200).end();
    }
    // simpan sebagai pesan admin ke Supabase
    await supa.from('messages').insert([{ session_id: session, sender: 'admin', text: replyText }]);
    // konfirmasi ke admin
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: msg.chat.id, text: `Pesan terkirim ke session ${session}` })
    });
  }

  return res.status(200).end();
};
