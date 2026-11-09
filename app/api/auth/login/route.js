import bcrypt from 'bcryptjs';
import { db, ensureSchema, normalizeEmail } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) return Response.json({ error: 'Enter your email and password.' }, { status: 400 });

  try {
    await ensureSchema();
    const sql = db();
    const rows = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
    const user = rows[0];
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) return Response.json({ error: 'Wrong email or password.' }, { status: 401 });
    await createSession(user.id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('login failed', err);
    return Response.json({ error: 'Could not log you in. Try again in a moment.' }, { status: 500 });
  }
}
