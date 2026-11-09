import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export const DEMO_EMAIL = 'demo@demo.com';
export const DEMO_PASSWORD = 'password123!';

let client = null;

export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL is not set. Add a Neon database in Vercel → Storage.');
    client = neon(url);
  }
  return client;
}

let ready = null;

// Creates tables if missing and guarantees the demo account exists with full paid access.
// Runs once per server instance; every route that touches the database awaits it first.
export function ensureSchema() {
  if (!ready) {
    ready = init().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

async function init() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_paid BOOLEAN NOT NULL DEFAULT FALSE,
      stripe_customer_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS kits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bar_name TEXT NOT NULL,
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS kits_user_idx ON kits(user_id)`;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await sql`
    INSERT INTO users (email, password_hash, is_paid)
    VALUES (${DEMO_EMAIL}, ${hash}, TRUE)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_paid = TRUE`;
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
