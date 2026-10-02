import { redis } from '../../../lib/redis';
import { DEFAULT_CONFIG } from '../../../lib/defaults';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req) {
  const { legajo, pin } = await req.json();
  let config = await redis.get('config');
  if (!config) {
    config = DEFAULT_CONFIG;
    await redis.set('config', config);
  }
  const admins = config.admins || [];
  const match = admins.find((a) => a.legajo === legajo && a.pin === pin);

  if (!match) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const sid = crypto.randomUUID();
  await redis.set(
    'session:' + sid,
    { legajo: match.legajo, name: match.name, role: match.role },
    { ex: 60 * 60 * 24 * 7 } // 7 días
  );

  cookies().set('session', sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return Response.json({ ok: true, name: match.name, role: match.role });
}
