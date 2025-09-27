// api/telegram.js
// Webhook handler: utk menerima pesan dari Telegram (admin)
// Format reply yang didukung: /reply <session_id> <pesan>

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).json({ ok: true });

    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message) return res.status(200).json({ ok: true });

    const text = (message.text || '').trim();
    const fromChatId = message.chat && message.chat.id;

    // ensure global storage exists
    globalThis.CHAT_MESSAGES = globalThis.CHAT_MESSAGES || [];

    if (text.startsWith('/reply')) {
      // parse: /reply <session_id> <pesan...>
      const parts = text.split(' ');
      const session = parts[1];
      const replyText = parts.slice(2).join(' ').trim();

      if (!session || !replyText) {
        // inform admin about usage
        const usage = 'Penggunaan: /reply <session_id> <pesan>';
        if (fromChatId && process.env.BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: fromChatId, text: usage })
          });
        }
        return res.status(200).json({ ok: false, error: 'bad_format' });
      }

      const msg = {
        session_id: session,
        sender: 'admin',
        text: replyText,
        created_at: new Date().toISOString()
      };

      globalThis.CHAT_MESSAGES.push(msg);

      // confirm to admin
      if (fromChatId && process.env.BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: fromChatId, text: `Pesan terkirim ke session ${session}` })
        });
      }

      return res.status(200).json({ ok: true, stored: msg });
    }

    // jika bukan /reply, kita ignore atau kirim pesan petunjuk
    return res.status(200).json({ ok: true, note: 'no-action' });
  } catch (err) {
    console.error('telegram webhook error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
                                  }
