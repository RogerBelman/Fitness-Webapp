# Full-Stack Workout Tracker

This repository contains a full-stack workout tracking application built with a React frontend, a Spring Boot REST API, and PostgreSQL. It supports exercise management, workout logging, workout history, and progress analytics while demonstrating a layered backend architecture and explicit API contracts.

## Features

- Create, list, filter, update, and delete exercises through the REST API.
- Create workouts and add ordered exercises and sets.
- Review workout history with set counts and total volume.
- View complete workout details, including exercise notes and individual sets.
- Edit workout dates, titles, and notes; edit exercise order and notes within a workout; correct set numbers, reps, and weights.
- Delete workouts, remove exercises from a workout, and delete individual sets with confirmation prompts.
- Edit and delete library exercises, with deletion blocked while an exercise is used in workout history.
- Track exercise personal records and workout-by-workout progress.
- Visualize maximum-weight trends with a responsive chart.
- Validate API requests and return consistent error responses.
- Run PostgreSQL locally with Docker or connect Spring Boot to Neon.
- Apply versioned schema changes automatically with Flyway.
- Test controller, service, mapper, database connection, and migration behavior with JUnit.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, Recharts |
| Backend | Java 21, Spring Boot, Spring Web MVC, Spring Data JPA |
| Database | PostgreSQL, Neon |
| Migrations | Flyway |
| Local development | Docker Compose |
| Testing | JUnit, MockMvc, Mockito, AssertJ |

## Project Structure

```text
fitness-webapp/
  backend/   Spring Boot REST API
  frontend/  React + TypeScript browser app
```

The backend and frontend are separate because they have different jobs:

- The backend owns business rules, database access, and API responses.
- The frontend owns browser UI, user interactions, and calls to the backend API.

## Frontend

Routes:

| Path | Page |
| --- | --- |
| `/` | Dashboard |
| `/exercises` | Exercise Library |
| `/workouts/new` | New Workout |
| `/workouts` | Workout History |
| `/workouts/{id}` | Workout Detail |

Frontend API files:

| File | Purpose |
| --- | --- |
| `src/api/client.ts` | Shared `fetch` wrapper with base URL and API error handling |
| `src/api/exercises.ts` | Exercise endpoint functions |
| `src/api/workouts.ts` | Workout endpoint functions |
| `src/api/progress.ts` | Personal-record and exercise-history endpoint functions |
| `src/types/exercise.ts` | Exercise request and response types |
| `src/types/progress.ts` | Personal-record and progress-history response types |
| `src/types/workout.ts` | Workout, workout exercise, and set entry types |

The frontend reads `VITE_API_BASE_URL` when provided. Without that environment variable, it defaults to:

```text
http://localhost:8080
```

## Frontend Data Flow

The Exercise Library page uses the API helper functions in `src/api/exercises.ts`.

For the page flow, read `src/pages/ExerciseLibrary.tsx` first. It coordinates the parts. `src/hooks/useExercises.ts` calls the API and owns loading, saving, and message state. The files in `src/components/exercises/` render the form, filters, and list.

Connected behavior:

| UI action | Frontend function | Backend endpoint |
| --- | --- | --- |
| Load exercises | `listExercises` | `GET /api/exercises` |
| Filter by muscle group | `listExercises` | `GET /api/exercises?muscleGroup=...` |
| Filter by category | `listExercises` | `GET /api/exercises?category=...` |
| Create exercise | `createExercise` | `POST /api/exercises` |

The workout pages use `src/api/workouts.ts` to create workouts, load history and details, add exercises, and record sets.

| UI action | Frontend function | Backend endpoint |
| --- | --- | --- |
| Create workout | `createWorkout` | `POST /api/workouts` |
| Load workout history | `listWorkouts` | `GET /api/workouts` |
| Load workout details | `getWorkout` | `GET /api/workouts/{id}` |
| Add exercise to workout | `addWorkoutExercise` | `POST /api/workouts/{id}/exercises` |
| Add set to workout exercise | `addSet` | `POST /api/workout-exercises/{id}/sets` |
| Edit workout | `updateWorkout` | `PUT /api/workouts/{id}` |
| Delete workout | `deleteWorkout` | `DELETE /api/workouts/{id}` |
| Edit exercise order and notes | `updateWorkoutExercise` | `PUT /api/workout-exercises/{id}` |
| Remove exercise and its sets | `deleteWorkoutExercise` | `DELETE /api/workout-exercises/{id}` |
| Edit logged set | `updateSet` | `PUT /api/sets/{id}` |
| Delete logged set | `deleteSet` | `DELETE /api/sets/{id}` |

The backend allows local React requests through CORS. By default, these origins are allowed:

```text
http://localhost:5173
http://127.0.0.1:5173
```

## Prerequisites

- Java 21 or newer
- Node.js 20 or newer
- Docker Desktop with Docker Compose

## Run Locally

From the repository root, start PostgreSQL first:

```powershell
docker compose up -d
```

Start the backend in a second terminal:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Install frontend dependencies and start Vite in a third terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend API runs at `http://localhost:8080`.

The checked-in defaults work without creating a local `.env` file. Docker Compose automatically reads a root `.env` file, so copy `.env.example` to `.env` when you need to customize the container settings. Spring Boot does not load that file automatically; provide custom `SPRING_DATASOURCE_*` values through the terminal or deployment environment.

Docker Compose and Spring Boot use matching defaults:

```text
Database: workout_tracker
Username: workout_user
Password: workout_password
Port: 5432
JDBC URL: jdbc:postgresql://localhost:5432/workout_tracker
```

Environment variables let each machine or deployment provide its own database settings without changing source code. Neon provides a cloud PostgreSQL connection string, and Spring Boot reads its JDBC form from `SPRING_DATASOURCE_URL`.

## Connect to Neon

Local development continues to use Docker PostgreSQL. To run the backend against Neon instead, create a Neon project and copy its direct connection details. Convert Neon's URL to JDBC format by adding the `jdbc:` prefix and keeping SSL enabled:

```text
postgresql://role:password@host/database?sslmode=require
                         becomes
jdbc:postgresql://host/database?sslmode=require
```

The username and password are supplied separately so special characters in the password do not need to be URL-encoded. In a PowerShell terminal, set the values for the current session:

```powershell
$env:SPRING_PROFILES_ACTIVE="neon"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://<neon-host>/<database>?sslmode=require"
$env:SPRING_DATASOURCE_USERNAME="<neon-role>"
$env:SPRING_DATASOURCE_PASSWORD="<neon-password>"

cd backend
.\mvnw.cmd spring-boot:run
```

The `neon` profile requires all three datasource variables. This prevents an intended cloud startup from silently falling back to the local database. When Spring Boot connects successfully, Flyway automatically applies every migration that Neon has not recorded yet.

Verify the migration in Neon's SQL Editor:

```sql
select installed_rank, version, description, success
from flyway_schema_history
order by installed_rank;
```

Never commit the real connection string or password. The root `.gitignore` excludes `.env` files while keeping `.env.example` as documentation.

Useful database commands:

```powershell
docker compose ps
docker compose down
```

Use `docker compose down -v` only when you intentionally want to delete the local PostgreSQL data volume.

Inspect tables with `psql`:

```powershell
docker compose exec postgres psql -U workout_user -d workout_tracker
```

Then inside `psql`:

```sql
\dt
select installed_rank, version, description, success from flyway_schema_history;
```

Flyway migrations live in `backend/src/main/resources/db/migration`. Spring Boot runs them automatically when the backend starts. Migration filenames use this pattern:

```text
V1__create_workout_schema.sql
```

The `V1` part is the version. Flyway records each applied migration in `flyway_schema_history`, so every developer and environment can move through the same schema changes in the same order.

## Exercise API

Base path:

```text
/api/exercises
```

Exercise request body:

```json
{
  "name": "Bench Press",
  "muscleGroup": "Chest",
  "category": "Strength"
}
```

Exercise response body:

```json
{
  "id": 1,
  "name": "Bench Press",
  "muscleGroup": "Chest",
  "category": "Strength",
  "createdAt": "2026-08-18T00:00:00Z",
  "updatedAt": "2026-08-18T00:00:00Z"
}
```

Endpoints:

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/exercises` | List exercises | `200 OK` |
| `GET` | `/api/exercises?muscleGroup=Chest` | Filter by muscle group | `200 OK` |
| `GET` | `/api/exercises?category=Strength` | Filter by category | `200 OK` |
| `GET` | `/api/exercises/{id}` | Get one exercise | `200 OK` |
| `POST` | `/api/exercises` | Create an exercise | `201 Created` |
| `PUT` | `/api/exercises/{id}` | Replace an exercise's editable fields | `200 OK` |
| `DELETE` | `/api/exercises/{id}` | Delete an exercise | `204 No Content` |

Layer flow:

```text
HTTP request
  -> ExerciseController
  -> ExerciseService
  -> ExerciseRepository
  -> PostgreSQL
```

DTOs define the API contract. The `Exercise` entity represents the database row, while `ExerciseRequest` and `ExerciseResponse` represent what the API accepts and returns.

## Workout API

Workout request body:

```json
{
  "workoutDate": "2026-08-20",
  "title": "Push Day",
  "notes": "Felt strong"
}
```

Add exercise request body:

```json
{
  "exerciseId": 1,
  "exerciseOrder": 1,
  "notes": "Controlled tempo"
}
```

`exerciseOrder` is optional. If it is missing, the backend assigns the next order number for that workout.

Add set request body:

```json
{
  "setNumber": 1,
  "reps": 8,
  "weight": 135
}
```

`setNumber` is optional. If it is missing, the backend assigns the next set number for that workout exercise.

Endpoints:

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `POST` | `/api/workouts` | Create a workout | `201 Created` |
| `GET` | `/api/workouts` | List workout summaries | `200 OK` |
| `GET` | `/api/workouts/{id}` | Get workout details with exercises and sets | `200 OK` |
| `POST` | `/api/workouts/{id}/exercises` | Add an exercise to a workout | `201 Created` |
| `POST` | `/api/workout-exercises/{id}/sets` | Add a set to a workout exercise | `201 Created` |
| `PUT` | `/api/workouts/{id}` | Update workout date, title, and notes | `200 OK` |
| `DELETE` | `/api/workouts/{id}` | Delete workout with its exercises and sets | `204 No Content` |
| `PUT` | `/api/workout-exercises/{id}` | Update exercise order and notes | `200 OK` |
| `DELETE` | `/api/workout-exercises/{id}` | Remove exercise from workout with its sets | `204 No Content` |
| `PUT` | `/api/sets/{id}` | Update set number, reps, and weight | `200 OK` |
| `DELETE` | `/api/sets/{id}` | Delete a logged set | `204 No Content` |

Updates use the same workout and set request bodies shown above. Omit `workoutDate` or `setNumber` on an update to keep its existing value. An omitted or blank title or notes clears that text. For workout exercises, send `exerciseOrder` and `notes`; omitting `exerciseOrder` keeps the existing order. The library exercise associated with logged sets stays the same.

Duplicate set numbers within an exercise and duplicate exercise orders within a workout return `409 Conflict`. Weight supports values from `0` to `99999.99`, with up to two decimal places. Deletion leaves gaps in set numbers and exercise order; new entries use the highest remaining number plus one.

Deleting a workout removes its workout exercises and sets. Removing a workout exercise removes its sets while keeping the reusable exercise in the library. Library deletion returns `409 Conflict` when an exercise is still referenced by a workout. Totals, progress history, and personal records are calculated from the remaining sets, so edits and deletions affect the next read automatically.

## Progress API

A personal record currently means the heaviest logged set for an exercise. If two sets use the
same weight, the set with more reps wins. An existing exercise with no logged sets returns
`personalRecord: null`.

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/progress/exercises/{exerciseId}/personal-record` | Get an exercise's personal record | `200 OK` |
| `GET` | `/api/progress/exercises/{exerciseId}/history` | Get progress points grouped by workout | `200 OK` |

Workout relationship model:

```text
workouts
  one-to-many workout_exercises

exercises
  one-to-many workout_exercises

workout_exercises
  one-to-many set_entries
```

`workout_exercises` is the join table with extra data. It connects one workout to one exercise, but also stores workout-specific fields like `exercise_order` and notes. `set_entries` belongs to a workout exercise because sets are performed for a specific exercise inside a specific workout.

## API Errors

Validation runs at the controller boundary with request DTO annotations. Business-rule errors still come from the service layer.

Error response body:

```json
{
  "timestamp": "2026-08-24T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed.",
  "path": "/api/workout-exercises/1/sets",
  "fieldErrors": {
    "reps": "reps must be greater than 0.",
    "weight": "weight must be greater than or equal to 0."
  }
}
```

Common status codes:

| Status | Meaning | Example |
| --- | --- | --- |
| `200 OK` | Successful read or update | Get one exercise |
| `201 Created` | New resource created | Create workout |
| `204 No Content` | Successful delete with no body | Delete exercise |
| `400 Bad Request` | Invalid request body | Negative reps |
| `404 Not Found` | Requested record does not exist | Missing exercise id |
| `409 Conflict` | Request conflicts with existing data | Duplicate exercise name |
| `500 Internal Server Error` | Unexpected backend failure | Unhandled exception |

## Backend Tests

Run the backend test suite while local PostgreSQL is available:

```powershell
cd backend
.\mvnw.cmd test
```

Controller tests call the REST API layer through `MockMvc`. They are useful when we want to verify endpoint paths, status codes, headers, and JSON response bodies.

Service tests call service classes directly with mocked repositories. They are useful when we want to verify business rules without making an HTTP request or touching the database.

Current test focus:

| Test file | Purpose |
| --- | --- |
| `ExerciseControllerTests` | Exercise API endpoint behavior |
| `WorkoutControllerTests` | Workout API endpoint behavior |
| `ExerciseServiceTests` | Exercise creation business rules |
| `WorkoutServiceTests` | Workout creation and set validation business rules |
| `WorkoutMapperTests` | Total sets and total volume calculation |
| `WorkoutEditingTests` | Updates, validation, duplicate positions, deletion cascades, library protection, and recalculated progress |
| `FlywayMigrationTests` | Database schema created by migrations |
| `DatabaseConnectionTests` | Backend can connect to PostgreSQL |

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

## Future Plans

- Add user accounts, authentication, and authorization so each user owns their workout data.
- Add reusable workout templates and planned routines.
- Expand progress analytics with additional trends, goals, and personal-record history.
- Refine the responsive UI, accessibility, and overall interaction design.
- Deploy the frontend and backend with Neon as the production database and add automated deployment checks.
