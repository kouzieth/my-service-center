import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { user, message } = req.body

    // simpan chat
    await redis.lpush("chat_messages", JSON.stringify({ user, message }))

    return res.status(200).json({ success: true })
  }

  if (req.method === 'GET') {
    // ambil semua chat
    const messages = await redis.lrange("chat_messages", 0, -1)
    const parsed = messages.map(m => JSON.parse(m))
    return res.status(200).json(parsed)
  }

  res.status(405).json({ error: "Method not allowed" })
}
