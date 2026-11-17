import { redirect } from 'next/navigation';
import Header from '../../components/Header';
import JoinForm from './JoinForm';
import { getUser } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';
import { barNameFor } from '@/lib/team';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Join your bar on PourPrep' };

export default async function JoinPage({ params }) {
  const user = await getUser().catch(() => null);
  if (user) redirect('/dashboard');

  const { code } = await params;
  await ensureSchema();
  const sql = db();
  const owners = await sql`SELECT id FROM users WHERE invite_code = ${code} AND role = 'owner'`;
  const bar = owners.length ? await barNameFor(owners[0].id) : null;

  return (
    <div className="wrap">
      <Header user={null} />
      <div className="auth">
        {bar ? (
          <>
            <h1>Join {bar}</h1>
            <p className="sub">Create your staff account to study the menu and take your training quizzes. Your manager will see your scores.</p>
            <JoinForm code={code} />
          </>
        ) : (
          <>
            <h1>Invite link not found</h1>
            <p className="sub">This invite link isn&apos;t valid anymore. Ask your manager to send you a new one.</p>
          </>
        )}
      </div>
    </div>
  );
}
