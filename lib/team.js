import { randomBytes } from 'crypto';
import { db } from './db';

export const isStaff = (user) => user?.role === 'staff';

// Owners get one invite code; anyone who signs up through /join/<code> joins their bar as staff.
export async function getInviteCode(owner) {
  if (owner.invite_code) return owner.invite_code;
  const sql = db();
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(6).toString('base64url');
    const rows = await sql`
      UPDATE users SET invite_code = ${code}
      WHERE id = ${owner.id} AND invite_code IS NULL
      RETURNING invite_code`.catch(() => []);
    if (rows.length) return rows[0].invite_code;
    const existing = await sql`SELECT invite_code FROM users WHERE id = ${owner.id}`;
    if (existing[0]?.invite_code) return existing[0].invite_code;
  }
  throw new Error('Could not create an invite link. Refresh and try again.');
}

// The bar's display name: the most recent kit's bar name, falling back to the owner's email.
export async function barNameFor(ownerId) {
  const sql = db();
  const rows = await sql`
    SELECT u.email, (SELECT bar_name FROM kits WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS bar_name
    FROM users u WHERE u.id = ${ownerId}`;
  return rows[0]?.bar_name || rows[0]?.email || 'your bar';
}

export function pct(score, total) {
  return total ? Math.round((score / total) * 100) : 0;
}
