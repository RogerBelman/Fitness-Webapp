# Full-Stack Workout Tracker

This project is a step-by-step workout tracking web app built to practice full-stack development with a production-style structure.

## Goal

Build a resume-worthy workout tracker while learning how a React frontend talks to a Java Spring Boot REST API backed by PostgreSQL.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Java, Spring Boot
- Database: PostgreSQL
- Cloud database later: Neon
- Migrations: Flyway
- Local development: Docker Compose
- Testing: JUnit

## Current Phase

Phase 8 adds the React frontend foundation: routes, page shells, shared layout, API client functions, and TypeScript API types.

Completed so far:

- Created one parent repository with separate `backend` and `frontend` apps.
- Scaffolded the Spring Boot backend.
- Scaffolded the React + TypeScript frontend.
- Added root project documentation.
- Initialized Git for source control.
- Added Docker Compose for local PostgreSQL.
- Configured Spring Boot to connect to PostgreSQL.
- Added Flyway migrations.
- Created the initial workout tracker tables.
- Added the Exercise entity, repository, service, controller, DTOs, and mapper.
- Added CRUD endpoints for the exercise library.
- Added Workout, WorkoutExercise, and SetEntry entities.
- Added endpoints to create workouts, add exercises to workouts, add sets, and view workout details.
- Added request validation for exercise, workout, workout exercise, and set request bodies.
- Added a global exception handler for consistent API error responses.
- Added service-level JUnit tests for exercise creation, workout creation, invalid set data, and total workout volume.
- Added React Router and the first frontend page structure.
- Added frontend API helper functions for the current exercise and workout endpoints.
- Added TypeScript types matching the backend request and response DTOs.

Not added yet:

- Frontend forms connected to live backend data
- Authentication

## Project Structure

```text
fitness-webapp/
  backend/   Spring Boot REST API
  frontend/  React + TypeScript browser app
```

The backend and frontend are separate because they have different jobs:

- The backend owns business rules, database access, and API responses.
- The frontend owns browser UI, user interactions, and calls to the backend API.

## Frontend Foundation

Phase 8 creates the browser app structure without wiring every screen to live data yet.

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
| `src/types/exercise.ts` | Exercise request and response types |
| `src/types/workout.ts` | Workout, workout exercise, and set entry types |

The frontend reads `VITE_API_BASE_URL` when provided. Without that environment variable, it defaults to:

```text
http://localhost:8080
```

## Run Locally

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Database:

```powershell
docker compose up -d
```

The checked-in defaults work without creating a local `.env` file. If you want to customize them, copy `.env.example` to `.env` and edit the values.

Docker Compose and Spring Boot both use these defaults:

```text
Database: workout_tracker
Username: workout_user
Password: workout_password
Port: 5432
JDBC URL: jdbc:postgresql://localhost:5432/workout_tracker
```

Environment variables let each machine or deployment provide its own database settings without changing source code. For example, later Neon will provide a cloud PostgreSQL connection string, and Spring Boot can read it from `SPRING_DATASOURCE_URL`.

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
| `FlywayMigrationTests` | Database schema created by migrations |
| `DatabaseConnectionTests` | Backend can connect to PostgreSQL |
## Phase Roadmap

1. Project setup
2. Local PostgreSQL with Docker
3. Flyway migrations
4. Basic exercise REST API
5. Workout REST API
6. Validation and error handling
7. JUnit tests
8. React frontend foundation
9. Connect frontend to backend
10. Progress tracking
11. Neon cloud database
12. Polish and resume readiness
