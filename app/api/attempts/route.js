import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isStaff } from '@/lib/team';

export const runtime = 'nodejs';

// Saves a staff member's quiz attempt. Graded on the server against the stored kit,
// so the score the owner sees can't be faked from the browser.
export async function POST(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 });
  if (!isStaff(user)) return Response.json({ saved: false });

  const body = await req.json().catch(() => ({}));
  const kitId = parseInt(body.kitId, 10);
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  if (!Number.isInteger(kitId)) return Response.json({ error: 'Missing kit.' }, { status: 400 });

  const sql = db();
  const rows = await sql`SELECT content FROM kits WHERE id = ${kitId} AND user_id = ${user.owner_id}`;
  if (!rows.length) return Response.json({ error: 'Kit not found.' }, { status: 404 });

  const quiz = rows[0].content?.quiz || [];
  const missed = [];
  quiz.forEach((q, i) => {
    if (Number(answers[i]) !== q.answer) missed.push(i);
  });
  const score = quiz.length - missed.length;

  await sql`
    INSERT INTO quiz_attempts (user_id, kit_id, score, total, missed)
    VALUES (${user.id}, ${kitId}, ${score}, ${quiz.length}, ${JSON.stringify(missed)}::jsonb)`;
  return Response.json({ saved: true, score, total: quiz.length });
}
