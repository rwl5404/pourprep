import bcrypt from 'bcryptjs';
import { db, ensureSchema, normalizeEmail, isValidEmail } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!isValidEmail(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  try {
    await ensureSchema();
    const sql = db();
    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash) VALUES (${email}, ${hash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    if (!rows.length) {
      return Response.json({ error: 'An account with that email already exists. Log in instead.' }, { status: 409 });
    }
    await createSession(rows[0].id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('signup failed', err);
    return Response.json({ error: 'Could not create your account. Try again in a moment.' }, { status: 500 });
  }
}
