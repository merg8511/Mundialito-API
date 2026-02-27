using Microsoft.OpenApi.Models;

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
        Title       = "Mundialito de Fútbol Corporativo — API",
        Version     = "v1",
        Description = "Backend REST para la gestión del torneo corporativo de fútbol."
    });

    // Soporte para el header Idempotency-Key en Swagger UI
    c.AddSecurityDefinition("IdempotencyKey", new OpenApiSecurityScheme
    {
        Name        = "Idempotency-Key",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.ApiKey,
        Description = "Clave de idempotencia requerida en todos los POST."
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Aquí se registrarán en sprints siguientes:
//   builder.Services.AddApplication();       // Application layer
//   builder.Services.AddInfrastructure();    // Infrastructure layer (EF Core, Dapper, etc.)
// ─────────────────────────────────────────────────────────────────────────────

var app = builder.Build();

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline HTTP
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

// Aquí se añadirán en sprints siguientes:
//   app.UseMiddleware<ObservabilityMiddleware>();
//   app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
