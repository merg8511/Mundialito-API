namespace Mundialito.Application.Common;

/// <summary>
/// Modelo de petición de paginación y ordenación estandarizado.
/// Los controladores mapean query params a esta clase.
/// La validación contra listas permitidas de sortBy se realiza
/// a través de <see cref="SortByFields"/>.
/// </summary>
public sealed class PageRequest
{
    // ─── Defaults ─────────────────────────────────────────────────────────────
    public const int DefaultPageNumber = 1;
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;
    public const string DefaultSortDirection = "asc";

    // ─── Propiedades ──────────────────────────────────────────────────────────

    /// <summary>Número de página (1-based). Mínimo 1.</summary>
    public int PageNumber { get; init; } = DefaultPageNumber;

    /// <summary>Registros por página. Rango [1, 100].</summary>
    public int PageSize { get; init; } = DefaultPageSize;

    /// <summary>Campo de ordenación. Validar contra la lista permitida del endpoint.</summary>
    public string? SortBy { get; init; }

    /// <summary>"asc" o "desc". Default "asc".</summary>
    public string SortDirection { get; init; } = DefaultSortDirection;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>Offset para SQL: (PageNumber - 1) * PageSize.</summary>
    public int Offset => (PageNumber - 1) * PageSize;

    /// <summary>true si SortDirection es "desc" (case-insensitive).</summary>
    public bool IsDescending =>
        string.Equals(SortDirection, "desc", StringComparison.OrdinalIgnoreCase);
}
