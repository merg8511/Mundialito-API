using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Mundialito.Application.Abstractions;
using Mundialito.Application.Abstractions.Repositories;
using Mundialito.Infrastructure.Persistence;
using Mundialito.Infrastructure.Persistence.Repositories;

namespace Mundialito.Infrastructure;

/// <summary>
/// Extensión de DI para registrar todos los servicios de Infrastructure.
/// Solo registra la capa de escritura EF Core (Sprint 3).
/// Dapper (read side) se registra en Sprint 4.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── DbContext (SQL Server) ────────────────────────────────────────────
        services.AddDbContext<MundialitoDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly(
                        typeof(MundialitoDbContext).Assembly.FullName);
                }));

        // ── Unit of Work ─────────────────────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // ── Repositorios EF (write) ───────────────────────────────────────────
        services.AddScoped<ITeamRepository,        TeamRepository>();
        services.AddScoped<IPlayerRepository,      PlayerRepository>();
        services.AddScoped<IMatchRepository,       MatchRepository>();
        services.AddScoped<IMatchResultRepository, MatchResultRepository>();

        return services;
    }
}
