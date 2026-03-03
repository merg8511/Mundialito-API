import Link from "next/link";

const navCards = [
  { href: "/teams", icon: "🛡️", label: "Teams", description: "Browse and manage all teams" },
  { href: "/matches", icon: "⚽", label: "Matches", description: "Schedule, results and filters" },
  { href: "/standings", icon: "📊", label: "Standings", description: "Current league table" },
  { href: "/scorers", icon: "🥇", label: "Top Scorers", description: "Leading goal scorers" },
];

export default function HomePage() {
  return (
    <div className="home">
      <div className="home-hero">
        <span className="home-ball">⚽</span>
        <h1 className="home-title">Mundialito</h1>
        <p className="home-subtitle">Tournament management system</p>
      </div>

      <div className="home-grid">
        {navCards.map(({ href, icon, label, description }) => (
          <Link key={href} href={href} className="home-card">
            <span className="home-card-icon">{icon}</span>
            <span className="home-card-label">{label}</span>
            <span className="home-card-desc">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}