import { ensureSchema } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Visit /api/health after deploying: it creates the tables and the demo account,
// and reports which environment variables are set (never their values).
export async function GET() {
  const env = {
    database: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };
  let database = 'not checked';
  try {
    await ensureSchema();
    database = 'ok — tables ready, demo account ready';
  } catch (err) {
    database = `error: ${err.message}`;
  }
  return Response.json({ env, database });
}
