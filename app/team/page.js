import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Header from '../components/Header';
import CopyLink from './CopyLink';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getInviteCode, isStaff, pct } from '@/lib/team';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your team — PourPrep' };

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default async function TeamPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (isStaff(user)) redirect('/dashboard');

  const code = await getInviteCode(user);
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const inviteUrl = `${origin}/join/${code}`;

  const sql = db();
  const [staff, kits, attempts] = await Promise.all([
    sql`SELECT id, name, email, created_at FROM users WHERE owner_id = ${user.id} AND role = 'staff' ORDER BY created_at`,
    sql`SELECT id, bar_name, content->'quiz' AS quiz, created_at FROM kits WHERE user_id = ${user.id} ORDER BY created_at DESC`,
    sql`
      SELECT a.user_id, a.kit_id, a.score, a.total, a.missed, a.created_at
      FROM quiz_attempts a JOIN users u ON u.id = a.user_id
      WHERE u.owner_id = ${user.id}
      ORDER BY a.created_at`,
  ]);

  // Per employee: attempts, latest and best score, last active.
  const byUser = new Map(staff.map((s) => [s.id, []]));
  for (const a of attempts) byUser.get(a.user_id)?.push(a);
  const rows = staff.map((s) => {
    const list = byUser.get(s.id) || [];
    const latest = list[list.length - 1];
    const best = list.reduce((b, a) => (!b || pct(a.score, a.total) > pct(b.score, b.total) ? a : b), null);
    return { ...s, count: list.length, latest, best };
  });

  // Per kit: which questions the team misses most (share of attempts that missed each one).
  const weakSpots = kits
    .map((k) => {
      const quiz = Array.isArray(k.quiz) ? k.quiz : [];
      const ka = attempts.filter((a) => a.kit_id === k.id);
      const misses = new Map();
      for (const a of ka) for (const i of a.missed || []) misses.set(i, (misses.get(i) || 0) + 1);
      const top = [...misses.entries()]
        .filter(([i]) => quiz[i])
        .sort((x, y) => y[1] - x[1])
        .slice(0, 3)
        .map(([i, n]) => ({ q: quiz[i], rate: Math.round((n / ka.length) * 100) }));
      return { kit: k, attempts: ka.length, top };
    })
    .filter((w) => w.attempts > 0);

  return (
    <div className="wrap">
      <Header user={user} />
      <div className="dash-head">
        <div>
          <span className={`badge ${user.is_paid ? 'pro' : ''}`}>Owner</span>
          <h1>Your team</h1>
          <p className="fine">See who&apos;s studied, how they scored, and what they keep missing.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="panel-title">Invite your staff</div>
        <p className="panel-sub">
          Text this link to new hires. They create their own login, study your kits, and take the quizzes. They can&apos;t edit kits or see anyone
          else&apos;s scores.
        </p>
        <CopyLink url={inviteUrl} />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="panel-title">Staff progress</div>
        {rows.length === 0 ? (
          <p className="panel-sub">No staff yet. Send the invite link above. Scores show up here as soon as someone takes a quiz.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Quizzes taken</th><th>Latest score</th><th>Best score</th><th>Last active</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name || r.email}</strong><br /><small className="fine">{r.email}</small></td>
                    <td>{r.count}</td>
                    <td>{r.latest ? <ScorePill a={r.latest} /> : <span className="fine">Not started</span>}</td>
                    <td>{r.best ? <ScorePill a={r.best} /> : '—'}</td>
                    <td>{r.latest ? fmtDate(r.latest.created_at) : `Joined ${fmtDate(r.created_at)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 64 }}>
        <div className="panel-title">Weak spots</div>
        {weakSpots.length === 0 ? (
          <p className="panel-sub">Once your staff take quizzes, the questions they miss most show up here so you know what to drill before a shift.</p>
        ) : (
          weakSpots.map((w) => (
            <div key={w.kit.id} className="weak">
              <h3>{w.kit.bar_name} <small className="fine">· {w.attempts} attempt{w.attempts === 1 ? '' : 's'}</small></h3>
              {w.top.length === 0 ? (
                <p className="fine">No missed questions yet. Everyone&apos;s acing it.</p>
              ) : (
                <ul>
                  {w.top.map((t, i) => (
                    <li key={i}>
                      <span className="miss-rate">{t.rate}% missed</span> {t.q.question}
                      <br /><small className="fine">Answer: {t.q.options?.[t.q.answer]}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ScorePill({ a }) {
  const p = pct(a.score, a.total);
  return <span className={`pill ${p >= 80 ? 'good' : 'bad'}`}>{a.score}/{a.total} · {p}%</span>;
}
