import { db, ensureSchema, DEMO_EMAIL } from '@/lib/db';
import { verifyWebhook } from '@/lib/stripe';

export const runtime = 'nodejs';

// Optional backup to the success redirect: keeps is_paid in sync if a customer closes
// the tab before returning, or cancels their subscription later.
export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (!secret || !verifyWebhook(raw, req.headers.get('stripe-signature'), secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(raw);
  const obj = event.data?.object || {};

  try {
    await ensureSchema();
    const sql = db();
    if (event.type === 'checkout.session.completed') {
      const userId = parseInt(obj.client_reference_id || obj.metadata?.user_id, 10);
      if (Number.isInteger(userId) && ['paid', 'no_payment_required'].includes(obj.payment_status)) {
        await sql`UPDATE users SET is_paid = TRUE, stripe_customer_id = ${obj.customer || null} WHERE id = ${userId}`;
      }
    } else if (event.type === 'customer.subscription.deleted' && obj.customer) {
      await sql`UPDATE users SET is_paid = FALSE WHERE stripe_customer_id = ${obj.customer} AND email <> ${DEMO_EMAIL}`;
    }
  } catch (err) {
    console.error('webhook handling failed', err);
    return Response.json({ error: 'Handler failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}
