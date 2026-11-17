'use client';

import { useState } from 'react';

export default function CopyLink({ url }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this invite link:', url);
    }
  }
  return (
    <div className="invite">
      <input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Staff invite link" />
      <button type="button" className="btn small" onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>
    </div>
  );
}
