import bcrypt from 'bcryptjs';
import { db, ensureSchema, normalizeEmail, isValidEmail } from '@/lib/db';
import { createSession } from '@/lib/auth';

export const runtime = 'nodejs';

// Staff signup through an owner's invite link.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  const name = String(body.name || '').trim().slice(0, 80);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!name) return Response.json({ error: 'Add your name so your manager knows who you are.' }, { status: 400 });
  if (!isValidEmail(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  try {
    await ensureSchema();
    const sql = db();
    const owners = await sql`SELECT id FROM users WHERE invite_code = ${code} AND role = 'owner'`;
    if (!owners.length) {
      return Response.json({ error: 'That invite link is no longer valid. Ask your manager for a new one.' }, { status: 404 });
    }
    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash, name, role, owner_id)
      VALUES (${email}, ${hash}, ${name}, 'staff', ${owners[0].id})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    if (!rows.length) {
      return Response.json({ error: 'An account with that email already exists. Use a different email or log in.' }, { status: 409 });
    }
    await createSession(rows[0].id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('join failed', err);
    return Response.json({ error: 'Could not create your account. Try again in a moment.' }, { status: 500 });
  }
}
