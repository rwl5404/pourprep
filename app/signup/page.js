import { redirect } from 'next/navigation';
import Header from '../components/Header';
import AuthForm from '../components/AuthForm';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create your account — PourPrep' };

export default async function SignupPage() {
  const user = await getUser().catch(() => null);
  if (user) redirect('/dashboard');
  return (
    <div className="wrap">
      <Header user={null} />
      <div className="auth">
        <h1>Start free</h1>
        <p className="sub">Your first AI training kit is on us. No card needed.</p>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
