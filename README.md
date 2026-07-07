# A10 Practical

Mini proyecto full-stack para cubrir los ejercicios A, B y C del caso tecnico A10 de Anagram.

Stack:

- Backend: Node.js, Express, TypeScript, Prisma, SQLite y JWT.
- Frontend: React, TypeScript y Vite.
- Docker: `docker-compose` con API en `4000` y web en `5173`.
- SQL PostgreSQL equivalente: `database.sql`.

## Estructura

```txt
a10-practical/
  apps/
    api/
    web/
  database.sql
  docker-compose.yml
  package.json
  README.md
```

## Requisitos

- Node.js 20+ recomendado.
- npm.
- Docker opcional.

## Correr Local

Desde la raiz del monorepo:

```bash
npm install
```

Crear `.env` para la API:

```bash
cp apps/api/.env.example apps/api/.env
```

Preparar SQLite y seed:

```bash
npm run db:migrate
npm run db:seed
```

Levantar API:

```bash
npm run dev:api
```

Levantar web en otra terminal:

```bash
npm run dev:web
```

URLs:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

En el navegador puedes probar el flujo completo:

1. Abrir `http://localhost:5173`.
2. Iniciar sesion con `ana@demo.com` y `demo123`.
3. Ver issues reales cargados desde `GET /api/issues` usando JWT.
4. Probar filtros por `status`, `priority` y `week_number`.
5. Crear un issue con el boton `Nuevo issue`.
6. Revisar el componente `KPIScorecard` debajo de la tabla de issues.

## Correr Con Docker

```bash
docker compose up --build
```

El contenedor de API ejecuta migraciones, seed y luego levanta Express.

## Usuario Demo

- Email: `ana@demo.com`
- Password: `demo123`

## Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@demo.com","password":"demo123"}'
```

Respuesta esperada:

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": "...",
    "name": "Ana Lopez",
    "email": "ana@demo.com",
    "role": "ADMIN"
  }
}
```

## GET /api/issues

Endpoint protegido con JWT:

```bash
curl http://localhost:4000/api/issues \
  -H "Authorization: Bearer JWT_TOKEN"
```

Campos devueltos:

- `id`
- `title`
- `description`
- `priority`
- `status`
- `due_date`
- `created_at`
- `owner_name`
- `meeting_week_number`
- `todos_total`
- `todos_completed`
- `days_delayed`

Filtros disponibles:

```bash
curl "http://localhost:4000/api/issues?status=UNDISCUSSED" \
  -H "Authorization: Bearer JWT_TOKEN"

curl "http://localhost:4000/api/issues?priority=HIGH" \
  -H "Authorization: Bearer JWT_TOKEN"

curl "http://localhost:4000/api/issues?owner_id=USER_ID" \
  -H "Authorization: Bearer JWT_TOKEN"

curl "http://localhost:4000/api/issues?week_number=27" \
  -H "Authorization: Bearer JWT_TOKEN"
```

Crear issue desde frontend o API:

```bash
curl -X POST http://localhost:4000/api/issues \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Nuevo issue","description":"Descripcion corta","priority":"HIGH","dueDate":"2026-07-15","meetingWeekNumber":27}'
```

Para mantener la demo simple, el issue nuevo queda asignado al usuario autenticado y el backend busca la reunion por `meetingWeekNumber`.

Orden aplicado:

- Primero issues cuyo `status` no es `RESOLVED`.
- Luego `created_at` ascendente, es decir, los mas antiguos primero.

`days_delayed`:

- Si `due_date` es anterior a hoy y el issue no esta `RESOLVED`, devuelve los dias de atraso.
- Si no esta vencido o ya esta resuelto, devuelve `0`.

## KPIScorecard

La web tiene dos bloques:

- Parte A: login real contra la API, tabla de issues desde SQLite, filtros y creacion simple de issues.
- Parte B: `KPIScorecard` con mock data local para demostrar las reglas de KPI.

El frontend renderiza:

```tsx
<KPIScorecard kpis={kpis} selectedWeek={selectedWeek} currentUser={currentUser} />
```

La tabla muestra:

```txt
Responsable | Unidad | KPI | Meta | S-4 | S-3 | S-2 | S-1 | S-actual | % Cumplimiento
```

Reglas implementadas:

- Semanas visibles: `selectedWeek - 4` hasta `selectedWeek`.
- Celda gris con `Sin dato` si falta valor.
- Celda verde si cumple meta semanal.
- Celda roja si no cumple meta semanal.
- Meta semanal: `annualGoal / 52`.
- `greater_equal`: cumple si `value >= annualGoal / 52`.
- `less_equal`: cumple si `value <= annualGoal / 52`.
- Si falta dato de la semana actual, aparece `+ Actualizar`.
- El modal guarda el valor solo en estado local para la demo.

## Ejercicio C: SQL PostgreSQL

El archivo `database.sql` incluye:

- `CREATE EXTENSION pgcrypto`.
- ENUMS: `user_role`, `issue_status`, `priority`, `kpi_nature` y `kpi_operator`.
- Tablas: `users`, `issues`, `todos`, `kpis`, `kpi_values`.
- FKs con `ON DELETE RESTRICT`, `ON DELETE SET NULL` y `ON DELETE CASCADE` segun corresponda.
- Indices solicitados.
- Trigger automatico de `updated_at`.
- Justificacion breve al final del archivo.

## Comandos Utiles

```bash
npm run build:api
npm run build:web
npm run db:migrate
npm run db:seed
```
