import Link from 'next/link';
import Header from './components/Header';
import { getUser } from '@/lib/auth';
import { formatPrice } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUser().catch(() => null);
  const price = formatPrice();

  return (
    <div className="wrap">
      <Header user={user} />

      <div className="hero">
        <div className="tag">AI training for bar staff</div>
        <h1>Train every new bartender like they&apos;ve worked your bar for years.</h1>
        <p className="lede">
          Paste in your menu, cocktail specs, and house policies. PourPrep&apos;s AI turns them into a custom training guide, spec
          flashcards, and a graded quiz for every new hire — so they show up to their first shift knowing your bar.
        </p>
        <div className="hero-ctas">
          <Link className="btn" href={user ? '/dashboard' : '/signup'}>
            {user ? 'Go to your dashboard' : 'Build your first kit free'}
          </Link>
          <a className="btn ghost" href="#how">See how it works</a>
        </div>
      </div>

      <section className="band" id="how">
        <h2>How it works</h2>
        <div className="steps">
          <div className="card">
            <div className="num">1</div>
            <h3>Paste in your bar</h3>
            <p>Your menu, cocktail specs, pour sizes, and house rules — straight from the binder or a doc.</p>
          </div>
          <div className="card">
            <div className="num">2</div>
            <h3>AI builds the training</h3>
            <p>A training guide, spec flashcards, and a quiz written for your drinks, your pours, and your rules. Takes under a minute.</p>
          </div>
          <div className="card">
            <div className="num">3</div>
            <h3>Staff study on their phones</h3>
            <p>New hires flip flashcards and take the quiz. Every wrong answer comes with the right spec and why.</p>
          </div>
          <div className="card">
            <div className="num">4</div>
            <h3>Reuse it every season</h3>
            <p>Your kits stay saved. When the menu changes or the next crew starts, build a fresh kit in a minute.</p>
          </div>
        </div>
      </section>

      <section className="band">
        <h2>Why it&apos;s worth paying for</h2>
        <div className="value">
          <div className="card">
            <h3>Get managers back on the floor</h3>
            <p>Stop re-explaining the same specs to every new hire during opening weeks. PourPrep does the first round of teaching.</p>
          </div>
          <div className="card">
            <h3>Consistent pours, less waste</h3>
            <p>When everyone learns the same specs, drinks come out the same and over-pours stop eating your margins.</p>
          </div>
          <div className="card">
            <h3>Know who&apos;s ready</h3>
            <p>A graded quiz tells you whether a new hire actually knows your menu before you put them behind a packed bar.</p>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="who">
          <div>
            <h2>Built for bars that rehire every season</h2>
            <p>
              Cape Cod bars rebuild most of their staff every spring. Managers spend opening weeks re-explaining the same specs to a new
              crew, and inconsistent pours cost money all summer.
            </p>
            <p>
              PourPrep is for owners and managers of seasonal and high-turnover bars — beach towns, college towns, and busy restaurants —
              who need new staff trained fast and consistently without pulling a manager off the floor.
            </p>
          </div>
          <div className="price">
            <div>PourPrep Pro</div>
            <div className="amt">
              {price}
              <small> / month per bar</small>
            </div>
            <ul>
              <li>Unlimited AI training kits</li>
              <li>Training guides, spec flashcards &amp; quizzes</li>
              <li>Graded answers with explanations</li>
              <li>Kits saved for every season</li>
            </ul>
            <Link className="btn" href={user ? '/dashboard' : '/signup'}>
              {user ? 'Open dashboard' : 'Start free — first kit on us'}
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        Built by <strong>Ryan Long</strong> · Penn State · Three summers bartending on Cape Cod
      </footer>
    </div>
  );
}
