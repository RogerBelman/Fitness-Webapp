# Production workflow

## Everyday workflow

1. Create a feature branch and make changes locally.
2. Push the branch and open a pull request against `main`.
3. Review the diff and wait for the **CI** checks to pass.
4. Merge the reviewed pull request.
5. After CI passes for the push to `main`, the **Publish images** workflow builds and stores the frontend and backend images in GitHub Container Registry.
6. Deploy an approved release and verify the live site. Connecting deployment to the VPS is the next setup phase; publishing alone does not update the live website.

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

## Phase 2: publish versioned images

The [Publish images workflow](../.github/workflows/publish-images.yml) starts after the **CI** workflow completes successfully for a push to this repository's `main` branch. Pull request checks do not publish images. The workflow checks out the exact commit that passed CI rather than whichever commit happens to be latest when publishing begins.

The workflow builds two Linux AMD64 images for the current VPS:

```text
ghcr.io/<lowercase-github-owner>/workout-tracker-frontend:sha-<full-commit-id>
ghcr.io/<lowercase-github-owner>/workout-tracker-backend:sha-<full-commit-id>
```

It uses GitHub's automatically supplied `GITHUB_TOKEN` with `packages: write` permission. Do not create a personal access token or add database, email, or SSH secrets for publishing. Third-party actions in this workflow are pinned to specific commits.

### First publication - GitHub

1. Push this feature branch, open a pull request, and wait for CI to pass.
2. Merge the pull request into `main`.
3. Open **Actions**, then watch **CI** for the new merge commit.
4. Once it passes, open **Publish images** and confirm both component jobs succeed.
5. Read the workflow summary for the tags and exact digest references. Find the packages under your GitHub profile's **Packages** section; the source labels also associate them with this repository.

The new workflow must be merged before it can receive the completed CI event on the default branch. Manually starting CI using **Run workflow** does not publish images; the publishing gate accepts push events only. To retry a failed publication, re-run its failed jobs. If publication never started, re-run the original CI run for the push to `main`.

New container packages are private by default. Leave them private for now; VPS read access will be configured in the next phase. If an existing package with the same name rejects publishing, inspect its **Manage Actions access** settings and grant this repository write access.

There is no moving `latest` tag. A commit tag identifies the source version; the summary's `@sha256:...` digest identifies the exact built image. Rebuilding the same commit can produce different bytes when base images or build dependencies change, so the later deployment workflow should record both image digests as a release pair. If one component fails to publish, that pair is incomplete and must not be deployed.

## Phase 3: prepare the production runtime

The [production Compose file](../docker-compose.production.yml) runs published image references supplied through `BACKEND_IMAGE` and `FRONTEND_IMAGE`. Use the exact `@sha256:...` references from a successful publication, not a moving tag. Both references must belong to the same approved release.

It contains only the application containers. Neon remains the database, and production email continues through Resend. The backend reads the existing root-owned `/etc/workout-tracker/workout-tracker.env` on the VPS. Its container binding overrides the old `127.0.0.1` server address with `0.0.0.0` inside the container; Docker exposes that port only on the VPS loopback interface.

| VPS loopback port | Service |
| --- | --- |
| `127.0.0.1:18080` | Frontend container |
| `127.0.0.1:18081` | Backend container |

The backend keeps a 256 MB Java heap within a 512 MB container memory limit. The frontend limit is 96 MB. Both containers drop Linux capabilities, prevent gaining privileges, rotate logs, and restart unless explicitly stopped. These limits need monitoring once real traffic is running.

Install Docker Engine and the Compose plugin using [Docker's Ubuntu installation instructions](https://docs.docker.com/engine/install/ubuntu/). Do not add the deployment account to the Docker group: Docker control effectively gives host administrator access. The next phase will install a narrow deployment command instead.

Installing Docker does not migrate the app. Keep the current systemd service enabled until the first container release has been verified. Do not run the production Compose file by hand before the registry authentication, backup, proxy cutover, and rollback steps have been prepared.

### GitHub production environment

Before adding deployment credentials:

1. Open the repository's **Settings → Environments → New environment**.
2. Name it exactly `production`.
3. Under **Deployment branches and tags**, select **Selected branches and tags**, and allow the branch `main` only.
4. Under **Required reviewers**, add your GitHub account. Leave **Prevent self-review** off while working alone, so you can approve your own deployment.
5. Save the rules. Do not add your personal SSH private key, database password, or Resend API key.

GitHub's required-reviewer availability depends on repository visibility and plan; see [Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments). If that option is unavailable, the later workflow can still require a manual start, but that is a different control from a separate approval gate.

## Phase 4: dedicated deployment connection

Use a separate Ed25519 key for GitHub Actions. The private key stays in your local SSH folder and GitHub environment secrets. Only its public key belongs on the VPS. Never reuse your personal SSH key or paste either private key into chat, source files, or pull requests.

The `workout-deploy` account currently has a root-owned forced command, [workout-deploy-access.sh](../scripts/workout-deploy-access.sh). Its SSH key is restricted: no shell, port forwarding, uploads, or arbitrary commands. Only `status` is accepted. The account is not a sudoer or a Docker-group member. Granting actual release permissions is a separate checkpoint.

### GitHub - environment secrets

Under **Settings → Environments → production → Environment secrets**, add:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | The VPS address used by the existing `Projects` SSH alias, without a username or URL scheme |
| `DEPLOY_USER` | `workout-deploy` |
| `DEPLOY_SSH_KEY` | Complete contents of the dedicated `workout_actions_ed25519` private key, including its first and last lines |
| `DEPLOY_KNOWN_HOSTS` | Complete contents of `workout_actions_known_hosts`, containing the server host key verified over the existing trusted SSH connection |

### Local - PowerShell

Copy the private key to the clipboard for `DEPLOY_SSH_KEY` without displaying it:

```powershell
Get-Content -Raw "$env:USERPROFILE/.ssh/workout_actions_ed25519" | Set-Clipboard
```

After saving that secret, copy the verified public host-key entry for `DEPLOY_KNOWN_HOSTS`:

```powershell
Get-Content -Raw "$env:USERPROFILE/.ssh/workout_actions_known_hosts" | Set-Clipboard
```

After saving the secrets, clear the clipboard:

```powershell
Set-Clipboard -Value ''
```

Host-key checking stays enabled. Do not replace the verified entry with an unchecked `ssh-keyscan` result or disable `StrictHostKeyChecking` to get around a mismatch.

### GitHub - verify the connection

After this feature branch passes CI and is merged, open **Actions → Check deployment access → Run workflow** and select `main`. Approve the pending `production` environment job. It should print `Deployment SSH connection: OK` and report the current workout service as `active`.

The [connection workflow](../.github/workflows/check-deployment-access.yml) uses only a manual trigger, rejects branches other than `main`, writes the key to a temporary runner directory with restrictive permissions, and removes that directory afterward. It does not upload files, restart services, or deploy images.

If GitHub refuses to start the job, confirm that the `production` environment allows the branch `main`. If it waits for approval, use **Review deployments**. A public Git repository does not make environment secrets public.

## Next checkpoint: release permissions and deployment

Configure a restricted deployment identity and the GitHub production environment. Add a manually approved deployment workflow that selects a successfully published image pair, transfers only deployment configuration, and tells the VPS to pull those images.

Production will keep its existing host Nginx and HTTPS certificates. The host proxy must replace forwarded headers and route `/api/` directly to the backend's loopback port, preserving the original HTTPS scheme. The frontend container's API proxy is for the local HTTP rehearsal; do not put it between the HTTPS proxy and backend without configuring trusted forwarding correctly.

Before switching traffic, back up the current frontend, backend JAR, proxy configuration, and confirm a Neon restore option. Keep the existing systemd deployment available for the first rollback. The connection workflow only checks SSH access; no workflow deploys a release yet.

Flyway runs pending migrations when the backend starts. Use new versioned migrations and prefer changes compatible with the previous application version. Returning to an old image does not undo a database migration. Backend restarts also end the current in-memory login sessions.
