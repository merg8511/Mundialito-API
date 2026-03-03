import Link from "next/link";
import { listMatches } from "@/application/use-cases";
import { matchesAdapter } from "@/infrastructure/adapters";
import { ErrorMessage } from "@/ui/components/ErrorMessage";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function MatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Number(params.pageNumber ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const sortBy = params.sortBy;
  const sortDirection = (params.sortDirection as "asc" | "desc") ?? "asc";
  const status = params.status;
  const teamId = params.teamId;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;

  let result;
  let fetchError: unknown = null;
  try {
    result = await listMatches(matchesAdapter, {
      pageNumber, pageSize, sortBy, sortDirection, status, teamId, dateFrom, dateTo,
    });
  } catch (err) {
    fetchError = err;
  }

  if (fetchError) return <ErrorMessage error={fetchError} />;
  if (!result) return null;

  const paginationBase = `/matches?pageSize=${pageSize}&status=${status ?? ""}&sortBy=${sortBy ?? ""}&sortDirection=${sortDirection}&dateFrom=${dateFrom ?? ""}&dateTo=${dateTo ?? ""}`;

  return (
    <div>
      <h2 className="page-title">Matches</h2>

      <form method="GET" className="filter-bar">
        <input type="hidden" name="pageNumber" value="1" />
        <input type="hidden" name="pageSize" value={pageSize} />
        <select name="status" defaultValue={status ?? ""} className="filter-select">
          <option value="">All statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Played">Played</option>
        </select>
        <input type="date" name="dateFrom" defaultValue={dateFrom ?? ""} className="filter-input" />
        <input type="date" name="dateTo" defaultValue={dateTo ?? ""} className="filter-input" />
        <select name="sortBy" defaultValue={sortBy ?? ""} className="filter-select">
          <option value="">Sort by…</option>
          <option value="scheduledAt">Date</option>
        </select>
        <select name="sortDirection" defaultValue={sortDirection} className="filter-select">
          <option value="asc">ASC</option>
          <option value="desc">DESC</option>
        </select>
        <button type="submit" className="btn-primary">Apply</button>
      </form>

      {result.data.length === 0 ? (
        <p className="empty-state">No matches found.</p>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Home</th>
                <th>Away</th>
                <th>Date</th>
                <th>Status</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((m) => (
                <tr key={m.id}>
                  <td>{m.homeTeamName}</td>
                  <td>{m.awayTeamName}</td>
                  <td>{new Date(m.scheduledAt).toLocaleDateString(undefined, { timeZone: "UTC" })}</td>
                  <td>
                    <span className={`status-badge status-${m.status.toLowerCase()}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="score-cell">
                    {m.homeGoals !== null && m.awayGoals !== null
                      ? `${m.homeGoals} – ${m.awayGoals}`
                      : "—"}
                  </td>
                  <td>
                    {m.status === "Scheduled" && (
                      <Link href={`/matches/${m.id}/result`} className="action-link">
                        Record Result →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span className="pagination-info">
          Page {result.pageNumber} / {result.totalPages} · {result.totalRecords} matches
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