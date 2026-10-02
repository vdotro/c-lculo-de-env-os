import { getSession } from '../../../lib/redis';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getSession(cookies());
  if (!session) return Response.json({ ok: false });
  return Response.json({ ok: true, ...session });
}
