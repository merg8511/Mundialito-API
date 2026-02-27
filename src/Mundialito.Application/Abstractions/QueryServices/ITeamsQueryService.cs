using Mundialito.Application.Common;
using Mundialito.Application.DTOs.Teams;

namespace Mundialito.Application.Abstractions.QueryServices;

/// <summary>
/// Servicio de consulta de Equipos (Dapper en Infrastructure).
/// Solo Query Handlers / controladores GET deben usarlo.
/// </summary>
public interface ITeamsQueryService
{
    /// <summary>
    /// Devuelve un listado paginado de equipos con filtros y orden aplicados en DB.
    /// </summary>
    Task<PaginationResponse<TeamResponse>> ListAsync(
        PageRequest pageRequest,
        string?     search,
        CancellationToken ct = default);

    /// <summary>
    /// Devuelve un equipo por su Id, o null si no existe.
    /// </summary>
    Task<TeamResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
}
