import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { generateKit } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 120;

const FREE_KITS = 1;
const MAX_MATERIAL = 30000;
const MAX_PDF_BASE64 = Math.ceil((3 * 1024 * 1024 * 4) / 3) + 4;

export async function POST(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Log in to build a training kit.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const barName = String(body.barName || '').trim().slice(0, 120);
  const material = String(body.material || '').trim();
  const pdf = typeof body.pdf === 'string' && body.pdf ? body.pdf : null;

  if (!barName) return Response.json({ error: 'Add your bar name.' }, { status: 400 });
  if (pdf) {
    // base64 is ~4/3 the file size; Vercel caps request bodies at 4.5 MB.
    if (pdf.length > MAX_PDF_BASE64) {
      return Response.json({ error: 'That PDF is too big. Keep it under 3 MB.' }, { status: 400 });
    }
    if (!Buffer.from(pdf.slice(0, 8), 'base64').toString('latin1').startsWith('%PDF')) {
      return Response.json({ error: "That file isn't a valid PDF. Try another file or paste your menu as text." }, { status: 400 });
    }
  } else if (material.length < 80) {
    return Response.json({ error: 'Upload a PDF menu or paste more of your menu, specs, or policies (at least a few lines).' }, { status: 400 });
  }
  if (material.length > MAX_MATERIAL) {
    return Response.json({ error: `That's a lot of text. Keep it under ${MAX_MATERIAL.toLocaleString()} characters.` }, { status: 400 });
  }

  const sql = db();
  if (!user.is_paid) {
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM kits WHERE user_id = ${user.id}`;
    if (count >= FREE_KITS) {
      return Response.json(
        { error: 'Your free training kit is used. Upgrade to PourPrep Pro for unlimited kits.', upgrade: true },
        { status: 402 }
      );
    }
  }

  try {
    const kit = await generateKit({ barName, material, pdf });
    const rows = await sql`
      INSERT INTO kits (user_id, bar_name, content)
      VALUES (${user.id}, ${barName}, ${JSON.stringify(kit)}::jsonb)
      RETURNING id`;
    return Response.json({ id: rows[0].id });
  } catch (err) {
    console.error('kit generation failed', err);
    return Response.json({ error: err.message || 'Could not build the kit. Try again.' }, { status: 500 });
  }
}
