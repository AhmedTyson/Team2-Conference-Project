# Getting Started Guide

<cite>
- [README.md](file://README.md#L47-L112)
- [fullstack/Backend/composer.json](file://fullstack/Backend/composer.json#L44-L62)
- [fullstack/Frontend/js/common.js](file://fullstack/Frontend/js/common.js#L10-L16)
- [fullstack/Backend/.env.example](file://fullstack/Backend/.env.example#L139-L142)
- [.github/workflows/ci.yml](file://.github/workflows/ci.yml#L42-L48)
</cite>

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Default Credentials](#default-credentials)
5. [Environment Variables That Matter](#environment-variables-that-matter)
6. [Running The Test Suite](#running-the-test-suite)
7. [One-Command Alternatives](#one-command-alternatives)
8. [Troubleshooting Quick Hits](#troubleshooting-quick-hits)

## Prerequisites

- PHP ≥ 8.2 runtime (composer requires `^8.5`; CI runs on 8.2 — see note below), Composer 2
- MySQL 8 (or SQLite for quick local runs) and Redis (optional locally; `predis` is pure-PHP so no ext-redis needed)
- Node.js + npm (Vite asset build for the backend package)
- Python or PHP CLI to serve the static frontend

> **Version note:** `composer.json` declares `"php": "^8.5"` while CI installs PHP 8.2 and the Docker backend image is `php:8.5-fpm-alpine`. For local dev, match your environment to whichever target you deploy to.

**Section sources:** [composer.json](file://fullstack/Backend/composer.json#L9-L31), [ci.yml](file://.github/workflows/ci.yml#L18-L21), [Dockerfile](file://Dockerfile#L29)

## Backend Setup

```bash
cd fullstack/Backend
composer install
copy .env.example .env          # Windows (cp on Linux/macOS)
php artisan key:generate
php artisan jwt:secret --force
php artisan storage:link
php artisan migrate:fresh --seed
npm install && npm run build    # Vite frontend assets for the API package
php artisan serve               # http://127.0.0.1:8000
```

- Base API URL: `http://127.0.0.1:8000/api`
- Interactive OpenAPI docs (Scramble): `http://127.0.0.1:8000/docs/api`

**Section sources:** [README.md](file://README.md#L49-L78)

## Frontend Setup

```bash
cd fullstack/Frontend
python -m http.server 8080      # or: php -S 127.0.0.1:8080
```

- Landing page: `http://localhost:8080/index.html`
- Admin suite: `http://localhost:8080/admin/index.html`

The shared core resolves its API base in [`js/common.js`](file://fullstack/Frontend/js/common.js#L13-L16): `window.TP_CONFIG.apiBase` overrides, otherwise it defaults to `http://127.0.0.1:8000/api`. If you serve the API on another port, set `TP_CONFIG` before `common.js` loads.

**Section sources:** [README.md](file://README.md#L82-L96), [common.js](file://fullstack/Frontend/js/common.js#L7-L16)

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@threedos.com` | `password` |

Additional seeded users exist via `User5Seeder`; roles are provisioned by `RoleAndPermissionSeeder` (`super_admin`, `admin`, `user`, `agency`).

**Section sources:** [README.md](file://README.md#L96), [database/seeders](file://fullstack/Backend/database/seeders/DatabaseSeeder.php)

## Environment Variables That Matter

| Variable group | Keys | Purpose |
|---|---|---|
| Auth | `JWT_SECRET` | tymon/jwt-auth token signing |
| Payments | `PAYMOB_PUBLIC_KEY`, `PAYMOB_SECRET_KEY`, `PAYMOB_HMAC`, `PAYMOB_INTEGRATION_IDS` | Hosted checkout + webhook HMAC verification |
| AI | `GROQ_API_KEY`, `GROQ_MODEL` (default `llama-3.1-8b-instant`) | Groq LLM calls ([config/services.php#L59-L62](file://fullstack/Backend/config/services.php#L59-L62)) |
| Social login | Google/Facebook client IDs + secrets | Socialite redirect flow |
| Mail / queue / cache | standard Laravel keys | Notifications, report jobs, Redis cache |

**Section sources:** [.env.example](file://fullstack/Backend/.env.example#L139-L142), [services config](file://fullstack/Backend/config/services.php#L59-L62)

## Running The Test Suite

```bash
cd fullstack/Backend
php artisan test                      # everything
php artisan test --filter=ReportTest  # targeted suite
```

CI mirrors this: Pint style check then full PHPUnit run on ubuntu-latest with PHP 8.2 ([ci.yml](file://.github/workflows/ci.yml#L10-L48)).

**Section sources:** [README.md](file://README.md#L100-L112), [ci.yml](file://.github/workflows/ci.yml#L27-L48)

## One-Command Alternatives

- `composer setup` — install, copy env, generate keys, storage link, sqlite touch, npm build ([composer.json scripts](file://fullstack/Backend/composer.json#L45-L53))
- `composer dev` — concurrent `artisan serve` + `queue:listen` + Pail logs + Vite dev server
- `php artisan seed:fresh` / `sync:fixtures` / `sync:cities` — custom console commands for reseeding and fixture sync ([Console/Commands](file://fullstack/Backend/app/Console/Commands))

## Troubleshooting Quick Hits

- **401 everywhere after reseed** — old JWTs signed with previous `JWT_SECRET`; log in again.
- **Webhook rejected** — `PAYMOB_HMAC` mismatch or route not excluded from CSRF (`paymob/webhook`).
- **Weather 429s** — `throttle:weather` limiter; responses are Redis-cached, check `CACHE_DRIVER=redis`.
- **Reports empty PDF** — queue worker must run (`queue:listen`) since generation is a queued job.
