import { Redis } from '@upstash/redis';

// Vercel + Upstash (Marketplace) inyectan estas variables automáticamente
// al conectar la integración. Soportamos los dos nombres posibles.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getSession(cookieStore) {
  const sid = cookieStore.get('session')?.value;
  if (!sid) return null;
  const session = await redis.get('session:' + sid);
  return session || null;
}
