using Mundialito.Application.Common;
using Mundialito.Application.DTOs.Matches;

namespace Mundialito.Application.Abstractions.QueryServices;

/// <summary>
/// Servicio de consulta de Partidos (Dapper en Infrastructure).
/// Solo Query Handlers / controladores GET deben usarlo.
/// </summary>
public interface IMatchesQueryService
{
    /// <summary>
    /// Devuelve un listado paginado de partidos con filtros y orden aplicados en DB.
    /// </summary>
    Task<PaginationResponse<MatchListItemResponse>> ListAsync(
        PageRequest  pageRequest,
        DateTime?    dateFrom,
        DateTime?    dateTo,
        Guid?        teamId,
        string?      status,
        CancellationToken ct = default);

    /// <summary>
    /// Devuelve el detalle de un partido por su Id, o null si no existe.
    /// </summary>
    Task<MatchDetailResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
}
