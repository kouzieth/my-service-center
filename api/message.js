// api/messages.js
const { createClient } = require('@supabase/supabase-js');
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;
const supa = createClient(SUPA_URL, SUPA_KEY);

module.exports = async (req, res) => {
  const session = req.query.session;
  if (!session) return res.status(400).json({ error: 'session required' });
  const { data } = await supa.from('messages').select('session_id,sender,text,created_at').eq('session_id', session).order('created_at', { ascending: true }).limit(200);
  res.status(200).json(data || []);
};
