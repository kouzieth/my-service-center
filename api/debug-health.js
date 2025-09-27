// api/debug-health.js
export default async function handler(req, res) {
  const hasBot = !!process.env.BOT_TOKEN;
  const hasChatId = !!process.env.ADMIN_CHAT_ID;
  const hasUpstashUrl = !!process.env.UPSTASH_REDIS_REST_URL;
  const hasUpstashToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
  return res.status(200).json({
    ok: true,
    env: {
      BOT_TOKEN_set: hasBot,
      ADMIN_CHAT_ID_set: hasChatId,
      UPSTASH_REDIS_REST_URL_set: hasUpstashUrl,
      UPSTASH_REDIS_REST_TOKEN_set: hasUpstashToken
    }
  });
}
