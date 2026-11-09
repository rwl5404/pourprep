import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '../components/Header';
import Generator from './Generator';
import UpgradeButton from './UpgradeButton';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard — PourPrep' };

export default async function Dashboard({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');

  const params = (await searchParams) || {};
  const sql = db();
  const kits = await sql`
    SELECT id, bar_name, created_at,
      jsonb_array_length(content->'flashcards') AS cards,
      jsonb_array_length(content->'quiz') AS questions
    FROM kits WHERE user_id = ${user.id}
    ORDER BY created_at DESC`;

  const freeLeft = user.is_paid ? null : Math.max(0, 1 - kits.length);

  return (
    <div className="wrap">
      <Header user={user} />

      <div className="dash-head">
        <div>
          <span className={`badge ${user.is_paid ? 'pro' : ''}`}>{user.is_paid ? 'Pro plan' : 'Free plan'}</span>
          <h1>Your training kits</h1>
          <p className="fine">{user.email}</p>
        </div>
      </div>

      {params.upgraded && <div className="notice">Payment confirmed — you&apos;re on PourPrep Pro. Unlimited kits unlocked.</div>}
      {params.payment === 'pending' && (
        <div className="error">We couldn&apos;t confirm that payment yet. If you completed checkout, refresh in a minute.</div>
      )}
      {params.canceled && <div className="error">Checkout canceled — you weren&apos;t charged.</div>}

      <div className="grid2">
        <div className="card">
          <div className="panel-title">Build a new training kit</div>
          <p className="panel-sub">
            Paste your menu, cocktail specs, and house policies. The AI writes a training guide, flashcards, and a graded quiz specific to
            your bar.
          </p>
          <Generator locked={freeLeft === 0} />
        </div>

        <div>
          <div className="card">
            <div className="panel-title">Saved kits</div>
            {kits.length === 0 ? (
              <p className="panel-sub">No kits yet. Build your first one — try the sample menu if you just want to see it work.</p>
            ) : (
              <ul className="kit-list">
                {kits.map((k) => (
                  <li key={k.id}>
                    <Link href={`/kit/${k.id}`}>
                      <strong>{k.bar_name}</strong>
                      <small>
                        {k.cards || 0} flashcards · {k.questions || 0} quiz questions ·{' '}
                        {new Date(k.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!user.is_paid && (
            <div className="card upsell">
              <h3>Upgrade to PourPrep Pro</h3>
              <p style={{ margin: '6px 0 16px' }}>
                {freeLeft > 0 ? 'Your first kit is free. ' : 'You’ve used your free kit. '}
                Pro is {formatPrice()}/month per bar for unlimited kits — rebuild whenever the menu changes or a new crew starts.
              </p>
              <UpgradeButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
