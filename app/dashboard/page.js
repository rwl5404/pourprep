import Link from 'next/link';
import { redirect } from 'next/navigation';
import Header from '../components/Header';
import Generator from './Generator';
import UpgradeButton from './UpgradeButton';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/stripe';
import { barNameFor, isStaff, pct } from '@/lib/team';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard — PourPrep' };

export default async function Dashboard({ searchParams }) {
  const user = await getUser();
  if (!user) redirect('/login');

  if (isStaff(user)) return <StaffDashboard user={user} />;

  const params = (await searchParams) || {};
  const sql = db();
  const [{ staff_count }] = await sql`SELECT COUNT(*)::int AS staff_count FROM users WHERE owner_id = ${user.id} AND role = 'staff'`;
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

          <div className="card" style={{ marginTop: 18 }}>
            <div className="panel-title">Your team</div>
            <p className="panel-sub" style={{ marginBottom: 14 }}>
              {staff_count
                ? `${staff_count} staff member${staff_count === 1 ? '' : 's'} joined. See their quiz scores and the questions they keep missing.`
                : 'Invite your staff with one link. They take the quizzes, and you see every score and weak spot.'}
            </p>
            <Link href="/team" className="btn ghost small">{staff_count ? 'View team progress' : 'Invite staff'}</Link>
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

async function StaffDashboard({ user }) {
  const sql = db();
  const [bar, kits, attempts] = await Promise.all([
    barNameFor(user.owner_id),
    sql`
      SELECT id, bar_name, created_at, jsonb_array_length(content->'quiz') AS questions
      FROM kits WHERE user_id = ${user.owner_id} ORDER BY created_at DESC`,
    sql`SELECT kit_id, score, total, created_at FROM quiz_attempts WHERE user_id = ${user.id} ORDER BY created_at DESC`,
  ]);

  const best = new Map();
  for (const a of attempts) {
    const b = best.get(a.kit_id);
    if (!b || pct(a.score, a.total) > pct(b.score, b.total)) best.set(a.kit_id, a);
  }
  const kitName = new Map(kits.map((k) => [k.id, k.bar_name]));
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="wrap">
      <Header user={user} />
      <div className="dash-head">
        <div>
          <span className="badge">Staff · {bar}</span>
          <h1>Your training</h1>
          <p className="fine">{user.name || user.email}</p>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="panel-title">Training kits</div>
          {kits.length === 0 ? (
            <p className="panel-sub">Your manager hasn&apos;t built a training kit yet. Check back soon.</p>
          ) : (
            <ul className="kit-list">
              {kits.map((k) => {
                const b = best.get(k.id);
                return (
                  <li key={k.id}>
                    <Link href={`/kit/${k.id}`}>
                      <strong>{k.bar_name}</strong>
                      <small>
                        {k.questions || 0} quiz questions ·{' '}
                        {b ? `Best score ${b.score}/${b.total} (${pct(b.score, b.total)}%)` : 'Quiz not taken yet'}
                      </small>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="panel-title">Your quiz history</div>
          {attempts.length === 0 ? (
            <p className="panel-sub">Open a kit, study the guide and flashcards, then take the quiz. Your scores show up here.</p>
          ) : (
            <ul className="kit-list">
              {attempts.slice(0, 10).map((a, i) => (
                <li key={i} style={{ padding: '10px 0' }}>
                  <strong>{kitName.get(a.kit_id) || 'Training kit'}</strong>
                  <small>{a.score}/{a.total} ({pct(a.score, a.total)}%) · {fmt(a.created_at)}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
