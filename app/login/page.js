import { redirect } from 'next/navigation';
import Header from '../components/Header';
import AuthForm from '../components/AuthForm';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Log in — PourPrep' };

export default async function LoginPage() {
  const user = await getUser().catch(() => null);
  if (user) redirect('/dashboard');
  return (
    <div className="wrap">
      <Header user={null} />
      <div className="auth">
        <h1>Welcome back</h1>
        <p className="sub">Log in to your bar's training kits.</p>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
