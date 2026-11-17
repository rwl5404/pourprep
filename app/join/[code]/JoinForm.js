'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function JoinForm({ code }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && <div className="error" role="alert">{error}</div>}
      <label className="field">
        <span>Your name</span>
        <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
      </label>
      <label className="field">
        <span>Email</span>
        <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="field">
        <span>Password</span>
        <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      </label>
      <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
        {busy ? 'One sec…' : 'Join the team'}
      </button>
      <p className="switch">Already have an account? <Link href="/login">Log in</Link></p>
    </form>
  );
}
