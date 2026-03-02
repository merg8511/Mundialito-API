using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Mundialito.Application.Abstractions;
using Mundialito.Application.Abstractions.QueryServices;
using Mundialito.Application.Abstractions.Repositories;
using Mundialito.Infrastructure.Dapper;
using Mundialito.Infrastructure.Persistence;
using Mundialito.Infrastructure.Persistence.Repositories;

namespace Mundialito.Infrastructure;

/// <summary>
/// Extensión de DI para registrar todos los servicios de Infrastructure.
/// Write side: EF Core (DbContext, UoW, Repositories).
/// Read side:  Dapper (IDbConnectionFactory + Query Services).
///
/// ARQUITECTURA: "Read side usa solo Dapper; EF solo write."
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── DbContext (SQL Server) — SOLO write (EF Core) ─────────────────────
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
        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<IPlayerRepository, PlayerRepository>();
        services.AddScoped<IMatchRepository, MatchRepository>();
        services.AddScoped<IMatchResultRepository, MatchResultRepository>();

        // ── Dapper: conexión (read side) ──────────────────────────────────────
        // Singleton: la factory solo guarda el connection string (inmutable).
        services.AddSingleton<IDbConnectionFactory, SqlConnectionFactory>();

        // ── Dapper: Query Services (read side) ────────────────────────────────
        services.AddScoped<ITeamsQueryService, TeamsQueryService>();
        services.AddScoped<IPlayersQueryService, PlayersQueryService>();
        services.AddScoped<IMatchesQueryService, MatchesQueryService>();
        services.AddScoped<IStandingsQueryService, StandingsQueryService>();
        services.AddScoped<IScorersQueryService, ScorersQueryService>();

        return services;
    }
}

