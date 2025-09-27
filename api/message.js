// api/messages.js
// Mengembalikan pesan untuk session tertentu
export default async function handler(req, res) {
  try {
    const session = req.query.session || (req.body && req.body.session);
    if (!session) return res.status(400).json({ error: 'session required' });

    globalThis.CHAT_MESSAGES = globalThis.CHAT_MESSAGES || [];
    // ambil pesan untuk session dan urutkan
    const msgs = globalThis.CHAT_MESSAGES
      .filter(m => m.session_id === session)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.status(200).json(msgs);
  } catch (err) {
    console.error('messages error', err);
    return res.status(500).json({ error: String(err) });
  }
}
