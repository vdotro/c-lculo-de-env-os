import { redis, getSession } from '../../../lib/redis';
import { DEFAULT_CONFIG } from '../../../lib/defaults';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getSession(cookies());
  if (!session) return new Response('No autorizado', { status: 401 });

  let config = await redis.get('config');
  if (!config) {
    config = DEFAULT_CONFIG;
    await redis.set('config', config);
  }
  return Response.json(config);
}

export async function PUT(req) {
  const session = await getSession(cookies());
  if (!session || session.role !== 'admin') {
    return new Response('No autorizado', { status: 401 });
  }
  const body = await req.json();
  await redis.set('config', body);
  return Response.json({ ok: true });
}
