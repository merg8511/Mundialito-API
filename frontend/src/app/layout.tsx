import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mundialito",
  description: "Tournament management frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand">
              <span className="brand-icon">⚽</span>
              <span className="brand-name">Mundialito</span>
            </Link>
            <nav className="nav">
              <Link href="/teams" className="nav-link">Teams</Link>
              <Link href="/matches" className="nav-link">Matches</Link>
              <Link href="/standings" className="nav-link">Standings</Link>
              <Link href="/scorers" className="nav-link">Scorers</Link>
            </nav>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}