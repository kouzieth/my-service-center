// api/messages.js
// List items from Edge Config and return messages for session
export default async function handler(req, res) {
  try {
    const session = req.query.session;
    if (!session) return res.status(400).json({ error: 'session required' });

    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!edgeConfigId || !vercelToken) return res.status(500).json({ error: 'EDGE_CONFIG_ID or VERCEL_TOKEN not configured' });

    const listUrl = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`;
    const resp = await fetch(listUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${vercelToken}` } });
    const json = await resp.json();
    const items = Array.isArray(json?.items) ? json.items : [];

    const msgs = items
      .filter(it => typeof it.key === 'string' && it.key.startsWith(`chat:${session}:`))
      .map(it => { try { return JSON.parse(it.value); } catch(e){ return null; } })
      .filter(Boolean)
      .sort((a,b) => a.created_at - b.created_at);

    return res.status(200).json(msgs);
  } catch (err) {
    console.error('api/messages error', err);
    return res.status(500).json({ error: String(err) });
  }
}
