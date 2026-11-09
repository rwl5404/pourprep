import Link from 'next/link';

export default function Header({ user }) {
  return (
    <header className="site-header">
      <Link href="/" className="logo">
        Pour<span>Prep</span>
      </Link>
      <nav className="nav">
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <form action="/api/auth/logout" method="post">
              <button className="linkbtn" type="submit">Log out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn small">Start free</Link>
          </>
        )}
      </nav>
    </header>
  );
}
