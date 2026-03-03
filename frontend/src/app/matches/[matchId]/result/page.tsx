import Link from "next/link";
import { getMatch, listPlayersByTeam } from "@/application/use-cases";
import { matchesAdapter, playersAdapter } from "@/infrastructure/adapters";
import { ErrorMessage } from "@/ui/components/ErrorMessage";
import { RecordResultForm } from "./RecordResultForm";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export default async function RecordResultPage({ params }: PageProps) {
  const { matchId } = await params;

  let match;
  let fetchError: unknown = null;

  try {
    match = await getMatch(matchesAdapter, matchId);
  } catch (err) {
    fetchError = err;
  }

  if (fetchError) {
    return (
      <div>
        <Link href="/matches" className="back-link">← Back to Matches</Link>
        <ErrorMessage error={fetchError} />
      </div>
    );
  }

  if (!match) return null;

  if (match.status !== "Scheduled") {
    return (
      <div>
        <Link href="/matches" className="back-link">← Back to Matches</Link>
        <p>
          Result already recorded for this match ({match.homeTeamName}{" "}
          {match.homeGoals} – {match.awayGoals} {match.awayTeamName}).
        </p>
      </div>
    );
  }

  // Fetch rosters for both teams — backend max pageSize is 100
  const [homePlayersResult, awayPlayersResult] = await Promise.all([
    listPlayersByTeam(playersAdapter, match.homeTeamId, { pageSize: 10 }),
    listPlayersByTeam(playersAdapter, match.awayTeamId, { pageSize: 10 }),
  ]);

  return (
    <div>
      <Link href="/matches" className="back-link">← Back to Matches</Link>
      <h2 className="page-title">Record Result</h2>
      <p style={{ marginBottom: "1.5rem", color: "var(--gray-500)", fontSize: "0.9rem" }}>
        <strong style={{ color: "var(--text)" }}>{match.homeTeamName}</strong>
        {" vs "}
        <strong style={{ color: "var(--text)" }}>{match.awayTeamName}</strong>
        {" — "}
        {new Date(match.scheduledAt).toLocaleDateString(undefined, { timeZone: "UTC" })}
      </p>
      <RecordResultForm
        matchId={matchId}
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
        homePlayers={homePlayersResult.data}
        awayPlayers={awayPlayersResult.data}
      />
    </div>
  );
}
