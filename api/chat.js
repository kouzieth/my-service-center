// api/chat.js
// Save user message to Edge Config and notify Telegram admin.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { session, text } = req.body || {};
    if (!session || !text) return res.status(400).json({ error: 'session & text required' });

    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!edgeConfigId || !vercelToken) return res.status(500).json({ error: 'EDGE_CONFIG_ID or VERCEL_TOKEN not configured' });

    const ts = Date.now();
    const key = `chat:${session}:${ts}`;
    const value = JSON.stringify({ session, sender: 'user', text, created_at: ts });

    // upsert via Vercel REST
    await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ operation: 'upsert', key, value }])
    });

    // notify admin on Telegram
    if (process.env.BOT_TOKEN && process.env.ADMIN_CHAT_ID) {
      const notif = `🆕 New chat\nSession: \`${session}\`\nMessage: ${text}\n\nReply: /reply ${session} <pesan>`;
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.ADMIN_CHAT_ID, text: notif, parse_mode: 'Markdown' })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('api/chat error', err);
    return res.status(500).json({ error: String(err) });
  }
}
