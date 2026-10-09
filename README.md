# Full-Stack Workout Tracker

This repository contains a full-stack workout tracking application built with a React frontend, a Spring Boot REST API, and PostgreSQL. It supports exercise management, workout logging, workout history, and progress analytics while demonstrating a layered backend architecture and explicit API contracts.

## Features

- Create, list, filter, update, and delete exercises through the REST API.
- Save permanent exercise instructions for setup and technique, visible in the library, workout details, and Dashboard exercise summaries.
- Create workouts and add ordered exercises and sets.
- Choose Strength or Cardio for each exercise. Log cardio duration and optional machine level, with edit/delete support.
- Review workout history with strength set counts, strength volume, and separate cardio minutes.
- Browse workouts in a weekly Dashboard calendar with day selection, workout counts, and exercise summaries.
- View complete workout details, including permanent exercise instructions and individual sets.
- Edit workout dates, titles, and notes; edit exercise order within a workout; correct set numbers, reps, and weights.
- Delete workouts, remove exercises from a workout, and delete individual sets with confirmation prompts.
- Edit and delete library exercises, with deletion blocked while an exercise is used in workout history.
- Track exercise personal records and workout-by-workout progress.
- Visualize maximum-weight trends with a responsive chart.
- Track cardio minutes, workout duration trends, and recorded machine levels with separate charts and history.
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
| `/progress` | Exercise Progress |
| `/exercises` | Exercise Library |
| `/workouts` | Workouts: history and inline creation |
| `/workouts?new=1` | Workouts with the new-workout form open |
| `/workouts/{id}` | Workout Detail |

The Dashboard shows a Monday–Sunday calendar with previous/next week controls and a Today shortcut. Select a day to see its workouts, exercises, strength sets and volume, and cardio minutes. Add Workout opens the creation form on the combined Workouts page and preselects the chosen date for today or a past day. New Workout opens the same form above workout history without leaving the Workouts page; Cancel returns to browsing. Creating a workout opens it immediately for exercise entry. Each exercise shows either sets/reps/weight or cardio duration/level according to its training type. Existing `/workouts/new` links redirect to this form and preserve the selected date. Strength charts, personal records, and exercise history live on the separate Progress page.

On a workout, **Add From Your Library** lets you select a saved exercise and choose **Add to Workout**. A separate **Not in your library?** section explains **Create New Exercise**, which opens an inline form. **Create & Add to Workout** saves the reusable exercise and adds it to the current workout in one transaction. The form supports Strength and Cardio, instructions, and Cancel. Duplicate names keep the form open so you can correct the name or cancel and select the existing exercise.

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

The Progress page accepts both Strength and Cardio exercises. Cardio shows workout count, total minutes, longest combined duration in one workout, and highest recorded level. Switch the chart between duration and level, and open a workout from the history table. Levels are compared within the same exercise and machine; missing levels remain blank rather than becoming zero.

The Exercise Library page uses the API helper functions in `src/api/exercises.ts`.

For the page flow, read `src/pages/ExerciseLibrary.tsx` first. It coordinates the parts. `src/hooks/useExercises.ts` calls the API and owns loading, saving, and message state. The files in `src/components/exercises/` render the form, filters, and list.

Available API operations:

| UI action | Frontend function | Backend endpoint |
| --- | --- | --- |
| Load exercises | `listExercises` | `GET /api/exercises` |
| Filter by muscle group | `listExercises` | `GET /api/exercises?muscleGroup=...` |
| Filter by training type | `listExercises` | `GET /api/exercises?trainingType=...` |
| Create exercise | `createExercise` | `POST /api/exercises` |

The workout pages use `src/api/workouts.ts` to create workouts, load history and details, add exercises, and record sets.

| UI action | Frontend function | Backend endpoint |
| --- | --- | --- |
| Create workout | `createWorkout` | `POST /api/workouts` |
| Load workout history | `listWorkouts` | `GET /api/workouts` |
| Load workout details | `getWorkout` | `GET /api/workouts/{id}` |
| Add exercise to workout | `addWorkoutExercise` | `POST /api/workouts/{id}/exercises` |
| Create exercise and add it to workout | `createAndAddWorkoutExercise` | `POST /api/workouts/{id}/exercises/new` |
| Add set to workout exercise | `addSet` | `POST /api/workout-exercises/{id}/sets` |
| Edit workout | `updateWorkout` | `PUT /api/workouts/{id}` |
| Delete workout | `deleteWorkout` | `DELETE /api/workouts/{id}` |
| Edit exercise order | `updateWorkoutExercise` | `PUT /api/workout-exercises/{id}` |
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
  "trainingType": "STRENGTH",
  "instructions": "Use your preferred grip and record technique cues here."
}
```

Exercise response body:

```json
{
  "id": 1,
  "name": "Bench Press",
  "muscleGroup": "Chest",
  "category": "None",
  "trainingType": "STRENGTH",
  "instructions": "Use your preferred grip and record technique cues here.",
  "createdAt": "2026-08-18T00:00:00Z",
  "updatedAt": "2026-08-18T00:00:00Z"
}
```

Endpoints:

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/exercises` | List exercises | `200 OK` |
| `GET` | `/api/exercises?muscleGroup=Chest` | Filter by muscle group | `200 OK` |
| `GET` | `/api/exercises?category=Barbell` | Filter by legacy category | `200 OK` |
| `GET` | `/api/exercises?trainingType=CARDIO` | Filter by training type | `200 OK` |
| `GET` | `/api/exercises/{id}` | Get one exercise | `200 OK` |
| `POST` | `/api/exercises` | Create an exercise | `201 Created` |
| `PUT` | `/api/exercises/{id}` | Replace an exercise's editable fields | `200 OK` |
| `DELETE` | `/api/exercises/{id}` | Delete an exercise | `204 No Content` |

`instructions` is optional and supports up to 500 characters. The Exercise Library create/edit form lets you save it, and clearing the text removes it. Blank, null, or omitted instructions are stored as null. Instructions belong to the reusable exercise and appear everywhere that exercise is used. Session-wide comments belong in the workout's `notes` field. Existing exercises start without instructions after the `V2__add_exercise_instructions.sql` migration runs.

`trainingType` is `STRENGTH` or `CARDIO`. Omitted types default to Strength on creation and preserve the current type on update. Muscle group is required for Strength and optional for Cardio. Equipment details belong in the exercise name or instructions; there is no separate equipment field or filter in the UI. The API still accepts the optional legacy `category` field, defaulting to `None` when omitted. The frontend preserves existing category values during edits. Changing training type returns `409 Conflict` while that exercise has any logged sets or cardio entries, so existing history keeps its meaning.

The forward-only `V3__add_cardio_tracking.sql` migration adds the training type and cardio table. Existing exercises default to Strength. Legacy exercises whose category is Cardio are classified as Cardio only when they have no logged sets. Exercises with existing sets keep their Strength type and all their history; category text and permanent instructions are preserved. Restart the backend to apply pending migrations.

Layer flow:

```text
HTTP request
  -> ExerciseController
  -> ExerciseService
  -> ExerciseRepository
  -> PostgreSQL
```

DTOs define the API contract. The `Exercise` entity represents the database row, while `ExerciseRequest` and `ExerciseResponse` represent what the API accepts and returns.

Exercise names and workout titles are formatted before saving on both creation and editing: each word starts with a capital letter and the remaining letters are lowercase (`dUMBBELL bench PRESS` becomes `Dumbbell Bench Press`). Leading/trailing whitespace is removed and repeated whitespace in names and titles becomes a single space. Workout notes and exercise instructions keep their entered capitalization and internal line breaks. Existing names are formatted when edited and saved.

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
  "exerciseOrder": 1
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
| `POST` | `/api/workouts/{id}/exercises/new` | Create a library exercise and add it to this workout atomically | `201 Created` |
| `POST` | `/api/workout-exercises/{id}/sets` | Add a set to a workout exercise | `201 Created` |
| `PUT` | `/api/workouts/{id}` | Update workout date, title, and notes | `200 OK` |
| `DELETE` | `/api/workouts/{id}` | Delete workout with its exercises and sets | `204 No Content` |
| `PUT` | `/api/workout-exercises/{id}` | Update exercise order | `200 OK` |
| `DELETE` | `/api/workout-exercises/{id}` | Remove exercise from workout with its sets | `204 No Content` |
| `PUT` | `/api/sets/{id}` | Update set number, reps, and weight | `200 OK` |
| `DELETE` | `/api/sets/{id}` | Delete a logged set | `204 No Content` |
| `POST` | `/api/workout-exercises/{id}/cardio-entries` | Log cardio duration and level | `201 Created` |
| `PUT` | `/api/cardio-entries/{id}` | Edit a cardio entry | `200 OK` |
| `DELETE` | `/api/cardio-entries/{id}` | Delete a cardio entry | `204 No Content` |

Updates use the same workout and set request bodies shown above. Omit `workoutDate` or `setNumber` on an update to keep its existing value. An omitted or blank workout title or workout notes clears that text. For workout exercises, send `exerciseOrder`; omitting it keeps the existing order. The library exercise associated with logged sets stays the same.

Duplicate set numbers within an exercise and duplicate exercise orders within a workout return `409 Conflict`. Weight supports values from `0` to `99999.99`, with up to two decimal places. Deletion leaves gaps in set numbers and exercise order; new entries use the highest remaining number plus one.

Deleting a workout removes its workout exercises and sets. Removing a workout exercise removes its sets while keeping the reusable exercise in the library. Library deletion returns `409 Conflict` when an exercise is still referenced by a workout. Totals, progress history, and personal records are calculated from the remaining sets, so edits and deletions affect the next read automatically.

Cardio create/update request:

```json
{
  "durationMinutes": 20.5,
  "level": 6
}
```

Duration is required, from `0.01` to `99999.99` minutes. Level is optional, from `0` to `999.99`; both support up to two decimal places. Omitting level on an update clears it. Multiple entries can represent intervals at different levels. Cardio entries are accepted only for Cardio exercises, and sets only for Strength exercises. Workouts can contain both kinds. Summaries return `totalCardioMinutes` separately from `totalSets` and `totalVolume`; details include `cardioEntries` on each workout exercise. Deleting a workout or workout exercise also removes its cardio entries.

## Progress API

A personal record currently means the heaviest logged set for an exercise. If two sets use the
same weight, the set with more reps wins. An existing exercise with no logged sets returns
`personalRecord: null`.

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/progress/exercises/{exerciseId}/personal-record` | Get an exercise's personal record | `200 OK` |
| `GET` | `/api/progress/exercises/{exerciseId}/history` | Get progress points grouped by workout | `200 OK` |
| `GET` | `/api/progress/exercises/{exerciseId}/cardio-history` | Get cardio duration and level history grouped by workout | `200 OK` |

Cardio history returns `exerciseId`, `exerciseName`, and `history`, ordered by date then workout ID. Each point includes `workoutId`, `workoutDate`, `totalEntries`, `totalDurationMinutes`, and `maxLevel` (null when no level was recorded). Repeated appearances of the same exercise in a workout are combined. Workouts without logged cardio entries are omitted. Missing exercises return `404`; requesting cardio history for a Strength exercise returns `400`. Edits and deletions are reflected on the next read.

Workout relationship model:

```text
workouts
  one-to-many workout_exercises

exercises
  one-to-many workout_exercises

workout_exercises
  one-to-many set_entries
  one-to-many cardio_entries
```

`workout_exercises` is the join table with extra data. It connects one workout to one exercise and stores its `exercise_order`. `set_entries` belongs to a workout exercise because sets are performed for a specific exercise inside a specific workout. `V4__remove_session_exercise_notes.sql` removes per-workout exercise and cardio-entry comments; reusable guidance lives in exercise instructions and session comments live in workout notes.

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
| `ExerciseInstructionsTests` | Permanent instructions, session-note independence, clearing, and length validation |
| `CardioTrackingTests` | Mixed totals, duration/level validation, entry updates/deletes, training-type protection, and deletion cascades |
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
npm run test
npm run lint
npm run build
```

## Local Sample Data

With Docker PostgreSQL running and the backend migrations applied, run from the repository root:

```powershell
.\scripts\refresh-sample-data.ps1
```

This replaces only data marked `[Sample data]`, creates 9 clearly named sample exercises and 12 workouts over the last four weeks, and includes 72 strength sets and 16 cardio entries. Permanent exercise instructions and workout notes demonstrate the current forms. Samples include multiple cardio intervals and outdoor walks without machine levels. Dates use America/Chicago; pass `-SampleDate yyyy-MM-dd` for a fixed end date.

The script backs up the local Compose database to ignored `backend/target/sample-data-backups/` before making changes and applies the refresh in one transaction. A name collision with an exercise retained in another workout stops the refresh rather than overwriting it. To explicitly replace **all** existing workouts and exercises, including unmarked older samples and personal entries, run `.\scripts\refresh-sample-data.ps1 -ReplaceAll`. This script does not connect to Neon or other remote databases.

## Future Plans

- Add user accounts, authentication, and authorization so each user owns their workout data.
- Add reusable workout templates and planned routines.
- Expand progress analytics with additional trends, goals, and personal-record history.
- Refine the responsive UI, accessibility, and overall interaction design.
- Deploy the frontend and backend with Neon as the production database and add automated deployment checks.
