// api/telegram.js
export default async function handler(req, res) {
  // placeholder webhook handler
  // Nanti kalau mau implement /reply langsung dari Telegram ke user via DB, kita tambahkan logic di sini.
  return res.status(200).json({ ok: true, note: 'telegram webhook placeholder' });
}
