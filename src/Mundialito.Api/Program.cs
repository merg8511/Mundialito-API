using Microsoft.OpenApi.Models;
using Mundialito.Api.Middlewares;
using Mundialito.Application.Features.Matches;
using Mundialito.Application.Features.Players;
using Mundialito.Application.Features.Teams;
using Mundialito.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// ─────────────────────────────────────────────────────────────────────────────
// MVC / Controllers
// ─────────────────────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ─────────────────────────────────────────────────────────────────────────────
// Swagger — solo en Development
// ─────────────────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Mundialito de Fútbol Corporativo — API",
        Version = "v1",
        Description = "Backend REST para la gestión del torneo corporativo de fútbol."
    });

    // Soporte para el header Idempotency-Key en Swagger UI
    c.AddSecurityDefinition("IdempotencyKey", new OpenApiSecurityScheme
    {
        Name = "Idempotency-Key",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Description = "Clave de idempotencia requerida en todos los POST."
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Infrastructure layer (EF Core write + Dapper read + repositories + UoW)
// ─────────────────────────────────────────────────────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ─────────────────────────────────────────────────────────────────────────────
// Application layer — Use Cases (write side)
// Registrar como Scoped porque dependen de UoW/repos que también son Scoped.
// ─────────────────────────────────────────────────────────────────────────────

// Teams
builder.Services.AddScoped<CreateTeamUseCase>();
builder.Services.AddScoped<UpdateTeamUseCase>();
builder.Services.AddScoped<DeleteTeamUseCase>();

// Players
builder.Services.AddScoped<CreatePlayerUseCase>();
builder.Services.AddScoped<UpdatePlayerUseCase>();
builder.Services.AddScoped<DeletePlayerUseCase>();

// Matches & Results
builder.Services.AddScoped<CreateMatchUseCase>();
builder.Services.AddScoped<RecordMatchResultUseCase>();

// ─────────────────────────────────────────────────────────────────────────────
// Build the app
// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware pipeline — ORDEN IMPORTA:
// 1) ExceptionHandling (más externo posible para capturar todo)
// 2) Observability (traceId/correlationId/elapsedMs — debe ir antes de routing)
// ─────────────────────────────────────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<ObservabilityMiddleware>();

// ─────────────────────────────────────────────────────────────────────────────
// Swagger — solo en Development
// ─────────────────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Mundialito API v1");
        c.RoutePrefix = string.Empty; // Swagger en la raíz
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
