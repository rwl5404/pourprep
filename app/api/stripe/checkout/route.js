import { getUser } from '@/lib/auth';
import { stripe, priceCents } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Log in first.' }, { status: 401 });
  if (user.is_paid) return Response.json({ error: 'You already have PourPrep Pro.' }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  try {
    const session = await stripe('checkout/sessions', {
      method: 'POST',
      params: {
        mode: 'subscription',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': String(priceCents()),
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][price_data][product_data][name]': 'PourPrep Pro',
        'line_items[0][price_data][product_data][description]': 'Unlimited AI training kits, flashcards, and quizzes for your bar',
        client_reference_id: String(user.id),
        customer_email: user.email,
        'metadata[user_id]': String(user.id),
        'subscription_data[metadata][user_id]': String(user.id),
        success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard?canceled=1`,
      },
    });
    return Response.json({ url: session.url });
  } catch (err) {
    console.error('checkout failed', err);
    return Response.json({ error: err.message || 'Could not start checkout.' }, { status: 500 });
  }
}
