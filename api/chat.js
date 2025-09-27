export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    const telegram = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.ADMIN_CHAT_ID,
          text: `User: ${text}`,
        }),
      }
    );

    const result = await telegram.json();
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}    if (!BOT_TOKEN || !ADMIN_CHAT) {
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
