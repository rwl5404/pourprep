'use client';

import { useState } from 'react';

export default function UpgradeButton({ label = 'Upgrade with Stripe', className = 'btn' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button type="button" className={className} onClick={go} disabled={busy}>
        {busy ? 'Opening checkout…' : label}
      </button>
    </div>
  );
}
