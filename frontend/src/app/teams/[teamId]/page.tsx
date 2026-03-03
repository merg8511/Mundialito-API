import Link from "next/link";
import { getTeam, listPlayersByTeam } from "@/application/use-cases";
import { teamsAdapter, playersAdapter } from "@/infrastructure/adapters";
import { ErrorMessage } from "@/ui/components/ErrorMessage";

interface PageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TeamDetailPage({ params, searchParams }: PageProps) {
  const { teamId } = await params;
  const sp = await searchParams;
  const pageNumber = Number(sp.pageNumber ?? 1);
  const pageSize = Number(sp.pageSize ?? 10);

  let team;
  let players;
  let fetchError: unknown = null;
  try {
    [team, players] = await Promise.all([
      getTeam(teamsAdapter, teamId),
      listPlayersByTeam(playersAdapter, teamId, { pageNumber, pageSize }),
    ]);
  } catch (err) {
    fetchError = err;
  }

  if (fetchError) return <ErrorMessage error={fetchError} />;
  if (!team) return null;

  const paginationBase = `/teams/${teamId}?pageSize=${pageSize}`;

  return (
    <div>
      <Link href="/teams" className="back-link">← Back to Teams</Link>

      <div className="team-header">
        <span className="team-header-icon">🛡️</span>
        <div>
          <h2 className="page-title" style={{ marginBottom: "0.25rem" }}>{team.name}</h2>
          <p className="team-meta">Founded · {new Date(team.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <h3 className="section-title">Squad</h3>

      {!players || players.data.length === 0 ? (
        <p className="empty-state">No players registered.</p>
      ) : (
        <>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Player</th>
                </tr>
              </thead>
              <tbody>
                {players.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="player-number">{p.number ?? "—"}</span>
                    </td>
                    <td className="team-name-cell">{p.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="pagination-info">
              Page {players.pageNumber} / {players.totalPages} · {players.totalRecords} players
            </span>
            <div className="pagination-controls">
              {players.pageNumber > 1 && (
                <Link href={`${paginationBase}&pageNumber=${players.pageNumber - 1}`} className="page-btn">← Prev</Link>
              )}
              {players.pageNumber < players.totalPages && (
                <Link href={`${paginationBase}&pageNumber=${players.pageNumber + 1}`} className="page-btn">Next →</Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}