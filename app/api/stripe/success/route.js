import { NextResponse } from 'next/server';
import { db, ensureSchema } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

// Stripe sends the customer here after checkout. We confirm the payment with Stripe
// server-side (never trusting the URL alone) and unlock Pro for that user.
export async function GET(req) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) return NextResponse.redirect(new URL('/dashboard', req.url), 303);

  try {
    const session = await stripe(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    const paid = session.status === 'complete' && ['paid', 'no_payment_required'].includes(session.payment_status);
    const userId = parseInt(session.client_reference_id, 10);
    if (paid && Number.isInteger(userId)) {
      await ensureSchema();
      const sql = db();
      await sql`UPDATE users SET is_paid = TRUE, stripe_customer_id = ${session.customer || null} WHERE id = ${userId}`;
      return NextResponse.redirect(new URL('/dashboard?upgraded=1', req.url), 303);
    }
  } catch (err) {
    console.error('checkout confirmation failed', err);
  }
  return NextResponse.redirect(new URL('/dashboard?payment=pending', req.url), 303);
}
