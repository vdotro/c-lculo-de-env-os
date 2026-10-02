import { redis } from '../../../lib/redis';
import { cookies } from 'next/headers';

export async function POST() {
  const sid = cookies().get('session')?.value;
  if (sid) await redis.del('session:' + sid);
  cookies().delete('session');
  return Response.json({ ok: true });
}
