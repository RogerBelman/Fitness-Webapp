# Full-Stack Workout Tracker

This repository contains a full-stack workout tracking application built with a React frontend, a Spring Boot REST API, and PostgreSQL. It supports exercise management, workout logging, workout history, and progress analytics while demonstrating a layered backend architecture and explicit API contracts.

## Features

- Create, list, filter, update, and delete exercises through the REST API.
- Save permanent exercise instructions for setup and technique, visible in the library and workout details.
- Create workouts and add ordered exercises and sets.
- Choose Strength or Cardio for each exercise. Log cardio duration and optional machine level, with edit/delete support.
- Review workout history with strength set counts, strength volume, separate cardio minutes, and search, training-type, and date filters.
- Browse workouts in a weekly Dashboard calendar or a compact monthly overview with workout-day counts.
- View complete workout details, including permanent exercise instructions and individual sets.
- Edit workout dates, titles, and notes; edit exercise order within a workout; correct set numbers, reps, and weights.
- Delete workouts, remove exercises from a workout, and delete individual sets with confirmation prompts.
- Edit and delete library exercises, with deletion blocked while an exercise is used in workout history.
- Track exercise personal records, maximum workout volume, and workout-by-workout progress.
- Create editable strength and cardio goals whose progress updates from logged workouts.
- Visualize maximum-weight and workout-volume trends with a responsive chart.
- Track cardio minutes, workout duration trends, and recorded machine levels with separate charts and history.
- Switch strength weights and volume between pounds and kilograms throughout the browser app.
- Export all training data to a portable JSON backup and validate imported backups before replacing current data.
- Register accounts and use server-managed login sessions with BCrypt-hashed passwords.
- Recover forgotten passwords through neutral email requests and expiring one-time reset links.
- Limit repeated login, registration, and password-recovery requests per client.
- Keep each account's exercises, workouts, templates, goals, progress, and backups separate.
- Sync weight-unit preferences with each account and manage backups, password changes, and account deletion from one Settings page.
- Validate API requests and return consistent error responses.
- Run PostgreSQL locally with Docker or connect Spring Boot to Neon.
- Apply versioned schema changes automatically with Flyway.
- Test backend behavior with JUnit and frontend utilities and interactions with Node, Vitest, Testing Library, and jsdom.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, Recharts |
| Backend | Java 21, Spring Boot, Spring Web MVC, Spring Data JPA, Spring Security |
| Database | PostgreSQL, Neon |
| Migrations | Flyway |
| Local development | Docker Compose |
| Testing | JUnit, MockMvc, Mockito, AssertJ, Vitest, Testing Library, jsdom |

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
| `/login` | Sign in or create an account |
| `/forgot-password` | Request a password reset link |
| `/reset-password?token=...` | Choose a new password from a one-time link |
| `/` | Dashboard |
| `/progress` | Exercise Progress |
| `/exercises` | Exercise Library |
| `/workouts` | Workouts: history and inline creation |
| `/workouts?new=1` | Workouts with the new-workout form open |
| `/workouts/templates` | Workout template management |
| `/workouts/{id}` | Workout Detail |
| `/settings` | Measurement preferences, password, data backup, and account management |

The Dashboard shows a Monday–Sunday calendar with previous/next week controls and a Today shortcut. Its Month Overview dialog marks days with workouts and selecting a date returns to that day on the Dashboard. Select a day to see its workouts, exercises, strength sets and volume, and cardio minutes. Add Workout opens the creation form on the combined Workouts page and preselects the chosen date for today or a past day. Workout history can be searched by workout or exercise name and filtered by Strength, Cardio, Mixed, and date range. New Workout opens the same form above workout history without leaving the Workouts page; Cancel returns to browsing. Creating a workout opens it immediately for exercise entry. Each exercise shows either sets/reps/weight or cardio duration/level according to its training type. Existing `/workouts/new` links redirect to this form and preserve the selected date. Strength charts, goals, maximum volume, and exercise history live on the separate Progress page.

The Weight units control on the Settings page switches strength entry, totals, goals, history, and charts between pounds and kilograms. PostgreSQL stores pounds as the canonical value; the frontend converts values when reading and submitting them. The selected display unit is saved to the signed-in account so it follows the user across browsers and devices.

The browser restores the signed-in account from its server session when the app loads. Signed-out visitors are sent to the Login page, and a successful login returns them to the page they originally requested. Registration creates the account and signs in immediately. The footer displays the current account alongside clearly labeled Settings and Sign Out controls, keeping the application header focused on navigation.

The Settings page manages the recovery email and downloads exercises, workouts, strength sets, cardio entries, templates, and goals as a versioned JSON snapshot. Import validates the complete snapshot first and then replaces the current dataset in one database transaction. Invalid files leave existing data unchanged. Password changes, password resets, and account deletion end every active session for the account. Account deletion removes that account and its owned training data in one transaction. Password fields include an explicit Show or Hide control.

The Workout Templates page can create a reusable routine directly or save one from an existing workout. After creating a template, add exercises from the library, arrange their order, and start a workout with empty performance entries.

On a workout, **Add From Your Library** lets you select a saved exercise and choose **Add to Workout**. A separate **Not in your library?** section explains **Create New Exercise**, which opens an inline form. **Create & Add to Workout** saves the reusable exercise and adds it to the current workout in one transaction. The form supports Strength and Cardio, instructions, and Cancel. Duplicate names keep the form open so you can correct the name or cancel and select the existing exercise.

Frontend API files:

| File | Purpose |
| --- | --- |
| `src/api/client.ts` | Shared `fetch` wrapper with credentials, CSRF protection, base URL, and API error handling |
| `src/api/auth.ts` | Registration, login, recovery, account settings, logout, and account-deletion functions |
| `src/api/exercises.ts` | Exercise endpoint functions |
| `src/api/workouts.ts` | Workout endpoint functions |
| `src/api/progress.ts` | Personal-record and exercise-history endpoint functions |
| `src/api/dataBackup.ts` | Portable JSON export and transactional import functions |
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

From the repository root, start PostgreSQL and the local Mailpit email inbox:

```powershell
docker compose up -d
```

Start the backend in a second terminal:

```powershell
$env:APP_MAIL_ENABLED="true"
cd backend
.\mvnw.cmd spring-boot:run
```

Install frontend dependencies and start Vite in a third terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend API runs at `http://localhost:8080`. Mailpit captures local recovery emails at `http://localhost:8025`; it does not deliver them to real addresses.

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

## Production Backend Profile

Activate the strict production configuration with `SPRING_PROFILES_ACTIVE=prod`. The profile requires deployment-provided database, public frontend, CORS, and email settings. Production defaults to Resend over HTTPS: configure `APP_MAIL_FROM` with a verified sender and `RESEND_API_KEY` with a sending API key. Startup fails when a required value is missing, a public URL is not HTTPS, a production service points to localhost, or secure session cookies are disabled.

Required deployment variables:

```text
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
APP_CORS_ALLOWED_ORIGINS=https://app.example.com
APP_FRONTEND_BASE_URL=https://app.example.com
APP_MAIL_FROM=no-reply@example.com
APP_MAIL_PROVIDER=resend
RESEND_API_KEY=<resend-sending-api-key>
```

The production profile trusts standard forwarded headers and always marks the session cookie Secure. Configure the hosting proxy to replace client-supplied forwarding headers and forward HTTPS requests to the backend. The database connection pool defaults to five connections and can be adjusted with `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE`.

`GET /actuator/health` is the only exposed Actuator endpoint. It returns overall health without component details and can be used by the hosting platform for health checks.

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

## Authentication API

Authentication uses server-managed HTTP sessions. The browser receives a `JSESSIONID` cookie after a successful login; the cookie is HttpOnly, expires with the session, and contains an opaque session identifier rather than user details or a password.

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Issue the CSRF token required for browser writes | `200 OK` |
| `POST` | `/api/auth/register` | Create an account | `201 Created` |
| `POST` | `/api/auth/login` | Verify credentials and create a session | `200 OK` |
| `GET` | `/api/auth/me` | Restore the current account from the session | `200 OK` |
| `POST` | `/api/auth/logout` | Invalidate the session and delete its cookie | `204 No Content` |
| `PUT` | `/api/auth/preferences` | Save account-level measurement preferences | `200 OK` |
| `PUT` | `/api/auth/email` | Confirm the current password and update the recovery email | `200 OK` |
| `POST` | `/api/auth/email/verification` | Send a verification link to the signed-in account's email | `204 No Content` |
| `POST` | `/api/auth/email/verify` | Consume a one-time email verification token | `204 No Content` |
| `PUT` | `/api/auth/password` | Verify the current password, save a new hash, and end the session | `204 No Content` |
| `POST` | `/api/auth/password/forgot` | Request a reset email without revealing whether the account exists | `204 No Content` |
| `POST` | `/api/auth/password/reset` | Consume a one-time token, change the password, and expire all sessions | `204 No Content` |
| `DELETE` | `/api/auth/account` | Verify the current password and delete the account and its owned data | `204 No Content` |

Registration includes the private recovery email:

```json
{
  "username": "learning_user",
  "email": "learner@example.com",
  "password": "a-long-private-password"
}
```

Usernames and emails are trimmed and stored in lowercase. Usernames may contain letters, numbers, and underscores. Passwords are never stored or returned as plain text. The service stores a one-way BCrypt hash. Password-reset tokens use 32 random bytes; PostgreSQL stores only each token's SHA-256 hash. Tokens expire after 30 minutes, can be used once, and are invalidated when the password or recovery email changes. Expired tokens are deleted when rejected. Invalid login attempts and recovery requests use neutral responses so callers cannot determine whether an account exists.

The login request's `username` field accepts either a username or an email, ignoring case and surrounding whitespace. Sessions always retain the canonical username so ownership and existing sessions continue to work consistently.

New accounts and changed email addresses receive a verification link after the account transaction commits. Verification is optional for signing in and using the app. User responses include `emailVerified`; existing accounts start unverified and can request a link from Settings. Verification tokens are stored as SHA-256 hashes, expire after 24 hours, and can be used once. Resending replaces the previous link and has a two-minute cooldown per account. Changing the email requires the current password, clears verification, and invalidates old verification and reset links. Delivery failures do not roll back registration or email correction; Settings provides a resend action. The public `/verify-email` page asks for confirmation before consuming the link and is marked `noindex`.

Authentication writes are rate-limited per client address. Login permits 10 requests per minute, registration permits 5 per hour, forgot-password and verification-email requests permit 5 per 15 minutes, and password reset and email verification permit 10 per 15 minutes. A blocked request returns `429 Too Many Requests` with a `Retry-After` header. The limiter is stored in one backend process; use a shared store before running multiple backend instances.

For production recovery email, set `APP_FRONTEND_BASE_URL`, `APP_MAIL_FROM`, `APP_MAIL_PROVIDER=resend`, and `RESEND_API_KEY` in the deployment environment. Verify the sending domain in Resend before sending to users. Requests use HTTPS with connection and read timeouts; provider failures do not log the reset link or provider response body. The production profile disables SMTP health probes because they do not apply to Resend.

Local development defaults to `APP_MAIL_PROVIDER=smtp` and uses Mailpit. SMTP is also available in production by setting `APP_MAIL_PROVIDER=smtp` and the `SPRING_MAIL_*` variables; set `APP_SMTP_HEALTH_ENABLED=true` if you want SMTP connectivity included in production health checks. Keep API keys and SMTP credentials out of source control.

Cross-origin browser requests use `credentials: "include"` so the browser sends the session cookie to the API. Local CORS configuration permits credentials from the configured React origins. Before each `POST`, `PUT`, or `DELETE`, the shared frontend client obtains a token from `/api/auth/csrf` and sends it in the header named by that response. Spring Security compares the token with the value stored in the browser session before allowing the request. Set `SESSION_COOKIE_SECURE=true` when the backend is served over HTTPS.

All training-data API routes require a signed-in account. Exercises, workouts, and templates store their owner directly, while goals and performance entries inherit ownership through their parent records. Every list and ID lookup includes the current account. Requesting another user's record returns the same `404 Not Found` response as a missing record, and exercise names are unique within one account rather than across the whole application.

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
| `POST` | `/api/workouts/{id}/template` | Save a workout's title, notes, and ordered exercises as a reusable template | `201 Created` |
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
| `GET` | `/api/workout-templates` | List reusable workout templates | `200 OK` |
| `POST` | `/api/workout-templates` | Create an empty reusable workout template | `201 Created` |
| `PUT` | `/api/workout-templates/{id}` | Update a template's name and notes | `200 OK` |
| `DELETE` | `/api/workout-templates/{id}` | Delete a template without deleting workout history | `204 No Content` |
| `POST` | `/api/workout-templates/{id}/workouts` | Start a dated workout from a template without logged entries | `201 Created` |
| `POST` | `/api/workout-templates/{id}/exercises` | Add a library exercise to a template | `201 Created` |
| `PUT` | `/api/workout-template-exercises/{id}` | Change an exercise's template order | `200 OK` |
| `DELETE` | `/api/workout-template-exercises/{id}` | Remove an exercise from a template | `204 No Content` |

Updates use the same workout and set request bodies shown above. Omit `workoutDate` or `setNumber` on an update to keep its existing value. An omitted or blank workout title or workout notes clears that text. For workout exercises, send `exerciseOrder`; omitting it keeps the existing order. The library exercise associated with logged sets stays the same.

Duplicate set numbers within an exercise and duplicate exercise orders within a workout return `409 Conflict`. Weight supports values from `0` to `99999.99`, with up to two decimal places. Deletion leaves gaps in set numbers and exercise order; new entries use the highest remaining number plus one.

Deleting a workout removes its workout exercises and sets. Removing a workout exercise removes its sets while keeping the reusable exercise in the library. Library deletion returns `409 Conflict` when an exercise is still referenced by a workout. Totals, progress history, and personal records are calculated from the remaining sets, so edits and deletions affect the next read automatically.

Workout templates are stored separately from workout history, so they do not affect dashboard or progress totals. Save as Template copies the workout title, workout notes, and ordered exercises. The dedicated Workout Templates page can create an empty template and supports renaming a template and editing its notes, exercises, and exercise order. Starting a template opens a short confirmation form for the required `workoutDate` and optional workout-specific title and notes, then creates a new workout with empty strength sets and cardio entries. Omitting the title or notes from the API request uses the template value. Deleting a template does not delete workouts previously created from it. Removing an exercise from a template keeps it in the exercise library; an exercise still referenced by any template cannot be deleted from the library.

Cardio create/update request:

```json
{
  "durationMinutes": 20.5,
  "level": 6
}
```

Duration is required, from `0.01` to `99999.99` minutes. Level is optional, from `0` to `999.99`; both support up to two decimal places. Omitting level on an update clears it. Multiple entries can represent intervals at different levels. Cardio entries are accepted only for Cardio exercises, and sets only for Strength exercises. Workouts can contain both kinds. Summaries return `totalCardioMinutes` separately from `totalSets` and `totalVolume`; details include `cardioEntries` on each workout exercise. Deleting a workout or workout exercise also removes its cardio entries.

Workout summaries also return `exerciseNames` and the distinct `trainingTypes` represented in the workout. The frontend uses these fields for history search and Strength, Cardio, or Mixed filtering without loading every workout detail.

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

Strength history points include the number of sets, heaviest set weight and reps, and total workout volume. The Progress page uses this ordered history for maximum-weight and workout-volume charts.

## Exercise Goal API

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/goals` | List exercise goals with current progress | `200 OK` |
| `POST` | `/api/goals` | Create an exercise goal | `201 Created` |
| `PUT` | `/api/goals/{id}` | Update an exercise goal | `200 OK` |
| `DELETE` | `/api/goals/{id}` | Delete an exercise goal | `204 No Content` |

Strength goals support maximum weight and maximum volume in one workout. Cardio goals support maximum combined duration in one workout and maximum recorded level. One goal is allowed per exercise and metric. The response includes `currentValue` and `achieved`, calculated from current workout entries each time goals are read.

## Data Backup API

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/data-backup` | Export the complete versioned JSON snapshot | `200 OK` |
| `PUT` | `/api/data-backup` | Validate and replace all data from a snapshot | `200 OK` |

The backup uses exercise names as portable references rather than database IDs. Export includes only the signed-in user's data. Import verifies unique exercises, valid references and ordering, matching Strength/Cardio entries, and compatible goal metrics before replacing that user's current records. Deletion and restoration run in the same transaction, so a database error also rolls back the replacement and never changes another account.

Workout relationship model:

```text
app_users
  one-to-many exercises
  one-to-many workouts
  one-to-many workout_templates

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
| `429 Too Many Requests` | Authentication request limit reached | Repeated login attempts |
| `500 Internal Server Error` | Unexpected backend failure | Unhandled exception |

## Backend Tests

Run the backend test suite while local PostgreSQL is available:

```powershell
cd backend
.\mvnw.cmd test
```

Tests use the dedicated `workout_tracker_test` schema by default, so running the suite does not read or change development data in the `public` schema. Override the test connection with `TEST_SPRING_DATASOURCE_URL`, `TEST_SPRING_DATASOURCE_USERNAME`, and `TEST_SPRING_DATASOURCE_PASSWORD` when needed.

Controller tests call the REST API layer through `MockMvc`. They are useful when we want to verify endpoint paths, status codes, headers, and JSON response bodies.

Service tests call service classes directly with mocked repositories. They are useful when we want to verify business rules without making an HTTP request or touching the database.

Current test focus:

| Test file | Purpose |
| --- | --- |
| `AuthControllerTests` | Registration, password hashing and changes, login sessions, current-user restoration, logout, account deletion, CSRF enforcement, and generic credential failures |
| `PasswordRecoveryTests` | Neutral recovery requests, one-time reset links, expired-token cleanup, password replacement, and active-session expiry |
| `AuthRateLimitFilterTests` | Per-client authentication request limits and retry responses |
| `HealthEndpointTests` | Unauthenticated deployment health check |
| `ProductionConfigurationValidatorTests` | Strict production URL, service, and cookie requirements |
| `ExerciseControllerTests` | Exercise API endpoint behavior |
| `ExerciseInstructionsTests` | Permanent instructions, session-note independence, clearing, and length validation |
| `CardioTrackingTests` | Mixed totals, duration/level validation, entry updates/deletes, training-type protection, and deletion cascades |
| `WorkoutControllerTests` | Workout API endpoint behavior |
| `DataBackupControllerTests` | Nested export, transactional replacement, and validation before deletion |
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

The frontend suite retains seven calendar utility tests and adds interaction coverage for workout history filtering, pounds/kilograms conversion and preference persistence, focused exercise reordering, goal creation and editing, explicit template-detail saving, immediate template exercise changes, starting a workout from a template, confirmed backup replacement, recovery-email changes, password recovery, password changes, and account-deletion confirmation.

## Local Sample Data

With Docker PostgreSQL running and the backend migrations applied, run from the repository root:

```powershell
.\scripts\refresh-sample-data.ps1 -Username roger
```

This replaces only data marked `[Sample data]`, creates 9 clearly named sample exercises, 12 workouts over the last four weeks, 3 reusable templates, and 2 progress goals, and includes 72 strength sets and 16 cardio entries. Permanent exercise instructions and workout notes demonstrate the current forms. Samples include mixed workouts, multiple cardio intervals, outdoor walks without machine levels, progressive strength loads, and goal progress. Dates use America/Chicago; pass `-SampleDate yyyy-MM-dd` for a fixed end date.

The required `-Username` must identify an existing registered account. The script backs up the local Compose database to ignored `backend/target/sample-data-backups/` before making changes and applies the refresh in one transaction. A name collision with an exercise retained in another workout stops the refresh rather than overwriting it. To replace every workout, exercise, template, and goal owned by the selected account, including unmarked entries, run `.\scripts\refresh-sample-data.ps1 -Username roger -ReplaceAll`. Other accounts are left unchanged. This script does not connect to Neon or other remote databases.

## Future Plans

- Add scheduled routines and calendar planning based on workout templates.
- Expand progress analytics with estimated one-rep max and training-frequency trends.
- Refine the responsive UI, accessibility, and overall interaction design.
- Deploy the frontend and backend with Neon as the production database and add automated deployment checks.
