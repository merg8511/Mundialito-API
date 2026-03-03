import { listStandings } from "@/application/use-cases";
import { standingsAdapter } from "@/infrastructure/adapters";
import { ErrorMessage } from "@/ui/components/ErrorMessage";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  let result;
  let fetchError: unknown = null;
  try {
    result = await listStandings(standingsAdapter);
  } catch (err) {
    fetchError = err;
  }

  if (fetchError) return <ErrorMessage error={fetchError} />;
  if (!result) return null;

  return (
    <div>
      <h2 className="page-title">Standings</h2>

      {result.data.length === 0 ? (
        <p className="empty-state">No standings available yet.</p>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th title="Played">P</th>
                <th title="Wins">W</th>
                <th title="Draws">D</th>
                <th title="Losses">L</th>
                <th title="Goals For">GF</th>
                <th title="Goals Against">GA</th>
                <th title="Goal Difference">GD</th>
                <th title="Points">Pts</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row, idx) => (
                <tr key={row.teamId} className={idx === 0 ? "row-leader" : ""}>
                  <td>
                    <span className={`rank-badge ${idx < 3 ? `rank-${idx + 1}` : ""}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="team-name-cell">{row.teamName}</td>
                  <td>{row.played}</td>
                  <td>{row.wins}</td>
                  <td>{row.draws}</td>
                  <td>{row.losses}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td className={row.goalDifference > 0 ? "positive" : row.goalDifference < 0 ? "negative" : ""}>
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="points-cell">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}