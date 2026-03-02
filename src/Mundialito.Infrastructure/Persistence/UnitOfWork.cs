using Microsoft.Extensions.Logging;
using Mundialito.Application.Abstractions;
using Mundialito.Domain.SeedWork;
using Mundialito.Infrastructure.Persistence;

namespace Mundialito.Infrastructure.Persistence;

/// <summary>
/// Implementación del Unit of Work.
/// Es el ÚNICO lugar donde se llama a SaveChangesAsync.
/// Extrae y loggea Domain Events antes de persistir.
/// </summary>
public sealed class UnitOfWork : IUnitOfWork
{
    private readonly MundialitoDbContext _dbContext;
    private readonly ILogger<UnitOfWork> _logger;

    public UnitOfWork(MundialitoDbContext dbContext, ILogger<UnitOfWork> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task CommitAsync(CancellationToken ct = default)
    {
        await using var tx = await _dbContext.Database.BeginTransactionAsync(ct);
        // a) Extraer domain events (copia)
        var trackedEntities = _dbContext.ChangeTracker.Entries<Entity>().Select(e => e.Entity).ToList();

        // b) Extraer domain events de todas las entidades trackeadas
        var domainEvents = trackedEntities
            .SelectMany(e => e.DomainEvents)
            .ToList();

        // c) Persistir — único SaveChangesAsync de toda la aplicación
        await _dbContext.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);

        // d) Limpiar eventos en las entidades 
        foreach (var entity in trackedEntities)
            entity.ClearDomainEvents();

        // e) Loggear los domain events estructuradamente
        foreach (var evt in domainEvents)
        {
            _logger.LogInformation(
                "DomainEvent processed: {EventType} at {OccurredAt}",
                evt.GetType().Name,
                evt.OccurredAt);
        }
    }
}
