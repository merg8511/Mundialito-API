# Mundialito de Fútbol — API

Backend REST para la gestión de torneos de fútbol, construido con **.NET 9** y **Clean Architecture**.

---

## Arquitectura

```
Mundialito.sln
└── src/
    ├── Mundialito.Domain          # Entidades, Value Objects, Domain Events, interfaces de repositorio
    ├── Mundialito.Application     # CQRS (Commands/Queries), Result Pattern, contratos (UoW, repositorios)
    ├── Mundialito.Infrastructure  # EF Core (write), Dapper (read), seed, idempotencia, observabilidad
    └── Mundialito.Api             # Controllers, middlewares, Swagger, DI composition root
```

**Sentido de dependencias (Clean Architecture):**
```
Api → Infrastructure → Application → Domain
                     → Domain
```
> El Domain **no depende** de ninguna otra capa.

---

## Reglas NO NEGOCIABLES

### 1. CQRS Estricto
| Operación | Tecnología |
|-----------|-----------|
| Commands (write) | **EF Core ÚNICAMENTE** |
| Queries (read)   | **Dapper ÚNICAMENTE** |

Prohibido usar EF Core en lecturas. Prohibido usar Dapper en escrituras.

### 2. Unit of Work (UoW)
- UoW **obligatorio** para **todos** los Commands.
- Prohibido llamar a `SaveChanges()` directamente fuera del UoW.

### 3. DELETE idempotente puro
- Siempre devuelve **204 No Content**, exista o no el recurso.

### 4. Error Envelope único
Cualquier error (400 / 404 / 409 / 500) devuelve **exclusivamente**:
```json
{
  "errorCode": "TEAM_NOT_FOUND",
  "message": "The requested team does not exist.",
  "traceId": "<trace-id>"
}
```

### 5. Idempotencia en POST (header `Idempotency-Key`)
| Situación | Respuesta |
|-----------|-----------|
| Mismo key + mismo payload | **200** con el body original (replay) |
| Mismo key + payload distinto | **409** `IDEMPOTENCY_KEY_CONFLICT` |
| Header ausente | **400** `IDEMPOTENCY_KEY_REQUIRED` |

### 6. Paginación / Filtros / Sort
- **Siempre en base de datos** (nunca en memoria).
- Respuesta con envelope estándar:
```json
{ "data": [], "pageNumber": 1, "pageSize": 10, "totalRecords": 50, "totalPages": 5 }
```

### 7. Observabilidad
- Middleware genera/propaga `traceId` y `correlationId` en cada request.
- Logging estructurado con **duración** de request.
- `traceId` incluido en todas las respuestas de error.

### 8. Domain Events (obligatorios y loggeados)
- `TeamCreated`
- `MatchResultRecorded`

### 9. Seed (obligatorio al iniciar con BD vacía)
- **4 Teams**, **5 Players/team**, **6 Matches**, **3 Matches con resultado + goals consistentes**.

### 10. Status Codes cerrados
| Acción | Código |
|--------|--------|
| POST (create) | **201 Created** |
| GET / PUT | **200 OK** |
| DELETE | **204 No Content** (siempre) |
| Validación | **400 Bad Request** |
| No encontrado | **404 Not Found** |
| Conflicto | **409 Conflict** |
| Error interno | **500** (solo desde middleware global) |

---

## Compilar el proyecto

### Requisitos
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9) (`9.0.310` o superior 9.x)
- (Opcional) Docker para la base de datos SQL Server

### Clonar y compilar
```bash
git clone <repo-url>
cd football-tournament-api

# Restaurar dependencias y compilar toda la solución
dotnet build Mundialito.sln
```

### Ejecutar la API
```bash
dotnet run --project src/Mundialito.Api/Mundialito.Api.csproj
```

Con la variable de entorno `ASPNETCORE_ENVIRONMENT=Development`, Swagger UI estará disponible en `http://localhost:<puerto>/`.

### Ejecutar tests
```bash
dotnet test Mundialito.sln
```

---

## Supuestos del Torneo

### Formato
- **Round-robin**: cada equipo juega contra los demás una vez.
- **Puntuación**: Victoria = **3 pts** · Empate = **1 pt** · Derrota = **0 pts**.
- **Desempate** (en ese orden): `points` desc → `goalDifference` desc → `goalsFor` desc.

### Estados de un partido
| Estado | Descripción |
|--------|-------------|
| `Scheduled` | Partido programado, sin resultado. `homeGoals`/`awayGoals` son **null** en la respuesta. |
| `Played`    | Resultado registrado. No puede cambiar de estado de vuelta a Scheduled. |

### Tabla de posiciones (standings)
Calculada en tiempo real por Dapper desde las tablas `MatchResults` y `Matches`.
No existe tabla desnormalizada; los puntos se derivan de los resultados.

---

## Invariantes de Dominio (validadas en Application)

> Las invariantes del **dominio puro** están en las entities.
> Las que requieren consulta a la BD se validan en los **Command Handlers**.

### Team
| Invariante | Error Code |
|------------|-----------|
| Nombre no nulo/vacío | `VALIDATION_ERROR` |
| Nombre único en el sistema | `TEAM_NAME_CONFLICT` |
| No se puede eliminar si tiene Players o Matches | `TEAM_HAS_DEPENDENCIES` |

### Player
| Invariante | Error Code |
|------------|-----------|
| FullName no nulo/vacío | `VALIDATION_ERROR` |
| Number > 0 (si se proporciona) | `VALIDATION_ERROR` |
| TeamId debe existir | `TEAM_NOT_FOUND` |

### Match
| Invariante | Error Code |
|------------|-----------|
| HomeTeamId ≠ AwayTeamId | `VALIDATION_ERROR` |
| Ambos equipos deben existir | `TEAM_NOT_FOUND` |
| No se puede crear si ya existe el mismo enfrentamiento pendiente | `RESOURCE_CONFLICT` |
| Solo puede registrarse resultado si status = `Scheduled` | `MATCH_ALREADY_PLAYED` |

### MatchResult / MatchGoals
| Invariante | Error Code |
|------------|-----------|
| Match debe existir | `MATCH_NOT_FOUND` |
| Match aún en estado Scheduled | `MATCH_ALREADY_PLAYED` |
| Cada PlayerId debe existir | `PLAYER_NOT_FOUND` |
| PlayerId debe pertenecer a homeTeam o awayTeam del match | `PLAYER_NOT_IN_MATCH` |
| Suma de goles de jugadores home == homeGoals **y** suma away == awayGoals | `MATCH_RESULT_INCONSISTENT` |
| HomeGoals ≥ 0 y AwayGoals ≥ 0 | `VALIDATION_ERROR` |
| Goals por jugador > 0 | `VALIDATION_ERROR` |

---

## Catálogo de Error Codes

| Código HTTP | errorCode |
|-------------|-----------|
| 400 | `VALIDATION_ERROR` |
| 400 | `PAGINATION_INVALID` |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` |
| 400 | `MATCH_RESULT_INCONSISTENT` |
| 400 | `PLAYER_NOT_IN_MATCH` |
| 404 | `TEAM_NOT_FOUND` |
| 404 | `PLAYER_NOT_FOUND` |
| 404 | `MATCH_NOT_FOUND` |
| 409 | `TEAM_NAME_CONFLICT` |
| 409 | `MATCH_ALREADY_PLAYED` |
| 409 | `TEAM_HAS_DEPENDENCIES` |
| 409 | `IDEMPOTENCY_KEY_CONFLICT` |
| 409 | `RESOURCE_CONFLICT` |
| 500 | `INTERNAL_ERROR` |
