import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { db, ensureSchema } from './db';

const COOKIE = 'pp_session';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function secretKey() {
  const secret =
    process.env.SESSION_SECRET ||
    createHash('sha256')
      .update('pourprep-session:' + (process.env.DATABASE_URL || process.env.POSTGRES_URL || 'dev'))
      .digest('hex');
  return new TextEncoder().encode(secret);
}

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

// Returns the logged-in user ({ id, email, is_paid, created_at }) or null.
export async function getUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  let uid;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    uid = payload.uid;
  } catch {
    return null;
  }
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT id, email, is_paid, created_at FROM users WHERE id = ${uid}`;
  return rows[0] || null;
}
