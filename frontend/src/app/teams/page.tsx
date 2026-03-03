import Link from "next/link";
import { listTeams } from "@/application/use-cases";
import { teamsAdapter } from "@/infrastructure/adapters";
import { ErrorMessage } from "@/ui/components/ErrorMessage";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Number(params.pageNumber ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const sortBy = params.sortBy;
  const sortDirection = (params.sortDirection as "asc" | "desc") ?? "asc";
  const search = params.search;

  let result;
  let fetchError: unknown = null;
  try {
    result = await listTeams(teamsAdapter, { pageNumber, pageSize, sortBy, sortDirection, search });
  } catch (err) {
    fetchError = err;
  }

  if (fetchError) return <ErrorMessage error={fetchError} />;
  if (!result) return null;

  const paginationBase = `/teams?pageSize=${pageSize}&search=${search ?? ""}&sortBy=${sortBy ?? ""}&sortDirection=${sortDirection}`;

  return (
    <div>
      <h2 className="page-title">Teams</h2>

      <form method="GET" className="filter-bar">
        <input type="hidden" name="pageNumber" value="1" />
        <input type="hidden" name="pageSize" value={pageSize} />
        <input name="search" defaultValue={search ?? ""} placeholder="Search team…" className="filter-input" />
        <select name="sortBy" defaultValue={sortBy ?? ""} className="filter-select">
          <option value="">Sort by…</option>
          <option value="name">Name</option>
          <option value="createdAt">Created</option>
        </select>
        <select name="sortDirection" defaultValue={sortDirection} className="filter-select">
          <option value="asc">ASC</option>
          <option value="desc">DESC</option>
        </select>
        <button type="submit" className="btn-primary">Apply</button>
      </form>

      {result.data.length === 0 ? (
        <p className="empty-state">No teams found.</p>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((team) => (
                <tr key={team.id}>
                  <td className="team-name-cell">{team.name}</td>
                  <td>{new Date(team.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/teams/${team.id}`} className="action-link">
                      View Detail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <span className="pagination-info">
          Page {result.pageNumber} / {result.totalPages} · {result.totalRecords} teams
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