// api/contact.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' });
  const { name, contact, message } = req.body || {};
  if (!name || !message) return res.status(400).send({ error: 'name & message are required' });

  const botToken = process.env.BOT_TOKEN;
  const adminChat = process.env.ADMIN_CHAT_ID;
  if (!botToken || !adminChat) return res.status(500).send({ error: 'Bot token or admin chat ID not configured' });

  const text = `📩 *Service Center New Request*\n\n*Nama:* ${escapeMarkdown(name)}\n*Kontak:* ${escapeMarkdown(contact || '-')}\n*Pesan:*\n${escapeMarkdown(message)}`;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: adminChat, text, parse_mode: 'Markdown' })
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API error');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

function escapeMarkdown(s='') {
  return String(s).replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
