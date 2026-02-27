using Mundialito.Application.Common;
using Mundialito.Application.DTOs.Scorers;

namespace Mundialito.Application.Abstractions.QueryServices;

/// <summary>
/// Servicio de consulta de Goleadores (Dapper en Infrastructure).
/// Solo Query Handlers / controladores GET deben usarlo.
/// </summary>
public interface IScorersQueryService
{
    /// <summary>
    /// Devuelve un listado paginado de goleadores con filtros y orden aplicados en DB.
    /// </summary>
    Task<PaginationResponse<ScorerItemResponse>> ListAsync(
        PageRequest pageRequest,
        Guid?       teamId,
        string?     search,
        CancellationToken ct = default);
}
