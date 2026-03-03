import Link from "next/link";
import { listScorers } from "@/application/use-cases";
import { scorersAdapter } from "@/infrastructure/adapters";
import { ErrorMessage } from "@/ui/components/ErrorMessage";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ScorersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Number(params.pageNumber ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const sortBy = params.sortBy;
  const sortDirection = (params.sortDirection as "asc" | "desc") ?? "desc";
  const search = params.search;

  let result;
  let fetchError: unknown = null;
  try {
    result = await listScorers(scorersAdapter, {
      pageNumber, pageSize, sortBy: sortBy ?? "goals", sortDirection, search,
    });
  } catch (err) {
    fetchError = err;
  }

  if (fetchError) return <ErrorMessage error={fetchError} />;
  if (!result) return null;

  const paginationBase = `/scorers?pageSize=${pageSize}&search=${search ?? ""}&sortDirection=${sortDirection}`;

  return (
    <div>
      <h2 className="page-title">Top Scorers</h2>

      <form method="GET" className="filter-bar">
        <input name="search" defaultValue={search ?? ""} placeholder="Search player…" className="filter-input" />
        <select name="sortDirection" defaultValue={sortDirection} className="filter-select">
          <option value="desc">Most goals first</option>
          <option value="asc">Least goals first</option>
        </select>
        <button type="submit" className="btn-primary">Apply</button>
      </form>

      {result.data.length === 0 ? (
        <p className="empty-state">No scorers yet.</p>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Team</th>
                <th>⚽ Goals</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((s, idx) => {
                const rank = (pageNumber - 1) * pageSize + idx + 1;
                return (
                  <tr key={s.playerId}>
                    <td>
                      <span className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ""}`}>
                        {rank}
                      </span>
                    </td>
                    <td>{s.playerName}</td>
                    <td>{s.teamName}</td>
                    <td className="goals-cell">{s.goals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span className="pagination-info">
          Page {result.pageNumber} / {result.totalPages} · {result.totalRecords} players
        </span>
        <div className="pagination-controls">
          {result.pageNumber > 1 && (
            <Link href={`${paginationBase}&pageNumber=${result.pageNumber - 1}`} className="page-btn">← Prev</Link>
          )}
          {result.pageNumber < result.totalPages && (
            <Link href={`${paginationBase}&pageNumber=${result.pageNumber + 1}`} className="page-btn">Next →</Link>
          )}
        </div>
      </div>
    </div>
  );
}