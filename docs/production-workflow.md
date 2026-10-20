# Production workflow

## Everyday workflow

1. Create a feature branch and make changes locally.
2. Push the branch and open a pull request against `main`.
3. Review the diff and wait for the **CI** checks to pass.
4. Merge the reviewed pull request.
5. Deploy an approved release and verify the live site. Production deployment is the next setup phase; the current workflow only tests the application.

## Phase 1: application images and CI

The first checkpoint adds Docker packaging and automatic checks without changing the running VPS. The existing `docker-compose.yml` still provides the usual development database and Mailpit.

| File | Responsibility |
| --- | --- |
| [Backend Dockerfile](../backend/Dockerfile) | Build with Java 21, then run only the JAR and Java runtime as an unprivileged user |
| [Frontend Dockerfile](../frontend/Dockerfile) | Build with Node 24, then serve the output with an unprivileged Nginx server |
| [Frontend Nginx configuration](../frontend/nginx.conf) | Serve browser routes, proxy API requests, and keep private routes out of search results |
| [Preview Compose file](../docker-compose.preview.yml) | Run both application images with an isolated PostgreSQL database and Mailpit |
| [CI workflow](../.github/workflows/ci.yml) | Run frontend checks, backend verification, and a complete container rehearsal |

CI runs on pull requests and pushes to `main`, and can also be started manually. Its database is created on the GitHub runner and removed after the job. It needs no production secrets. The Dockerfiles exclude local environment files, logs, build output, and dependencies from their build contexts.

The frontend image uses an empty `VITE_API_BASE_URL`, so requests go to `/api/` on the same origin. The development app outside Docker retains its existing localhost API default.

### Local - PowerShell

From the repository root, with Docker Desktop running:

```powershell
docker compose -f docker-compose.preview.yml up --build --detach --wait --wait-timeout 240
python scripts/check-container-preview.py
```

Open the app at <http://localhost:18080> and its test email inbox at <http://localhost:18025>. The backend health endpoint is available locally at <http://localhost:18081/actuator/health>. These ports are bound only to the local machine.

This is a fresh test environment: accounts from the usual local app will not exist here. Register a test account to try the workflow. Preview database values are disposable local credentials, not production credentials.

Stop the rehearsal while preserving its test data:

```powershell
docker compose -f docker-compose.preview.yml down
```

To explicitly discard only the preview database:

```powershell
docker compose -f docker-compose.preview.yml down --volumes
```

The CI job uses the latter command to clean up its disposable data. Neither command targets the normal development database or Neon.

## Next checkpoint: publish images and connect production

After the first pull request passes CI, configure GitHub Container Registry, a restricted deployment identity, and the production environment. Add a manual release workflow that publishes images tagged with the tested commit, transfers only deployment configuration, and tells the VPS to pull those images.

Production will keep its existing host Nginx and HTTPS certificates. The host proxy must replace forwarded headers and route `/api/` directly to the backend's loopback port, preserving the original HTTPS scheme. The frontend container's API proxy is for the local HTTP rehearsal; do not put it between the HTTPS proxy and backend without configuring trusted forwarding correctly.

Before switching traffic, back up the current frontend, backend JAR, proxy configuration, and confirm a Neon restore option. Keep the existing systemd deployment available for the first rollback. The current CI workflow does not publish images, change GitHub settings, connect to the VPS, or deploy anything.

Flyway runs pending migrations when the backend starts. Use new versioned migrations and prefer changes compatible with the previous application version. Returning to an old image does not undo a database migration. Backend restarts also end the current in-memory login sessions.
