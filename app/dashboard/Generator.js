'use client';

import { useState } from 'react';
import UpgradeButton from './UpgradeButton';

const MAX_PDF_BYTES = 3 * 1024 * 1024;

const SAMPLE_BAR = 'The Salt Line (sample)';
const SAMPLE = `THE SALT LINE — SUMMER COCKTAIL MENU & SPECS

Salt Line Margarita — $14
2 oz blanco tequila, 1 oz fresh lime, 0.75 oz Cointreau, 0.25 oz agave. Shake, strain over fresh ice. Rocks glass, half salt rim, lime wheel.

Harbor Mule — $13
2 oz Tito's vodka, 0.5 oz fresh lime, top with 4 oz ginger beer. Build in copper mug over ice. Lime wedge + mint sprig.

Cape Codder Smash — $13
1.5 oz vodka, 3 oz cranberry juice, 0.5 oz lime, 4 muddled blueberries. Shake, dump into highball. Lime wheel.

Dark & Stormy — $13
2 oz Gosling's Black Seal, 4 oz ginger beer, lime wedge. Build in highball: ginger beer first, float the rum on top.

Frozen Painkiller — $15
2 oz Pusser's rum, 4 oz pineapple, 1 oz orange juice, 1 oz cream of coconut. Blend with 1.5 cups ice. Hurricane glass, grated nutmeg on top, pineapple wedge.

Espresso Martini — $15
1.5 oz vodka, 1 oz Mr. Black coffee liqueur, 1 oz fresh espresso, 0.25 oz simple. Hard shake 15 seconds, double strain. Coupe, 3 coffee beans.

POURS & DRAFT
- Standard spirit pour: 1.5 oz. Doubles: 3 oz. Always jigger — no free pouring.
- Wine: 6 oz glass, 9 oz large pour. Bottles get presented and opened at the table.
- Draft: 16 oz pint. Cape Cod Beer Red, Whale's Tale Pale Ale, Bud Light, Guinness (two-part pour, let settle).

HOUSE POLICIES
- Card every guest who looks under 35. Acceptable ID: driver's license, state ID, passport, military ID. No expired IDs.
- Comp drinks only with a manager's approval — log every comp on the comp sheet.
- Last call is 12:40 a.m.; all drinks off the bar by 1:00 a.m.
- Cut off any guest showing signs of intoxication and tell a manager right away. Offer water and food, call a cab if needed.
- Barbacks restock ice, glassware, and garnish trays before 6 p.m. rush. Fresh lime juice gets made daily — never older than 24 hours.
- Tabs require a card held at the bar.`;

export default function Generator({ locked }) {
  const [barName, setBarName] = useState('');
  const [material, setMaterial] = useState('');
  const [error, setError] = useState('');
  const [needsUpgrade, setNeedsUpgrade] = useState(locked);
  const [busy, setBusy] = useState(false);
  const [pdf, setPdf] = useState(null); // { name, data (base64) }
  const [fileKey, setFileKey] = useState(0); // remounts the input so the same file can be re-picked

  function clearPdf() {
    setPdf(null);
    setFileKey((k) => k + 1);
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      clearPdf();
      setError('Only PDF files work for upload. For a photo or Word doc, paste the text instead.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      clearPdf();
      setError('That PDF is too big. Keep it under 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setPdf({ name: file.name, data: result.slice(result.indexOf(',') + 1) });
    };
    reader.onerror = () => {
      clearPdf();
      setError("Couldn't read that file. Try again.");
    };
    reader.readAsDataURL(file);
  }

  function loadSample() {
    setBarName(SAMPLE_BAR);
    setMaterial(SAMPLE);
    clearPdf();
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barName, material, pdf: pdf?.data || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) setNeedsUpgrade(true);
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
      window.location.href = `/kit/${data.id}`;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (needsUpgrade) {
    return (
      <div>
        <p style={{ marginBottom: 16 }}>
          You&apos;ve used your free training kit. Upgrade to PourPrep Pro to build unlimited kits for your bar.
        </p>
        <UpgradeButton />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="error" role="alert">{error}</div>}
      <label className="field">
        <span>Bar name</span>
        <input className="input" value={barName} onChange={(e) => setBarName(e.target.value)} placeholder="e.g. The Port" maxLength={120} required />
      </label>
      <div className="field">
        <span>Upload your menu (PDF)</span>
        <input
          key={fileKey}
          className="input"
          type="file"
          accept="application/pdf,.pdf"
          onChange={onPickFile}
          aria-label="Upload menu PDF"
        />
        {pdf && (
          <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
            <span>📄 {pdf.name}</span>
            <button type="button" className="btn ghost" onClick={clearPdf}>
              Remove
            </button>
          </div>
        )}
      </div>
      <label className="field">
        <span>{pdf ? 'Anything else? (optional: specs or house rules not in the PDF)' : 'Or paste your menu, specs & policies'}</span>
        <textarea
          className="input"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Paste cocktail specs (ingredients, pours, glass, garnish), your draft list, pour sizes, and house rules…"
          required={!pdf}
        />
      </label>
      <div className="row">
        <button className="btn" type="submit" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Building your kit (30–60 sec)…' : 'Build training kit'}
        </button>
        {!busy && (
          <button type="button" className="btn ghost" onClick={loadSample}>
            Use sample menu
          </button>
        )}
      </div>
    </form>
  );
}
