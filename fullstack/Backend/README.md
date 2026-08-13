# Conference Platform — Team 2

Backend API for the **Conference Case Study 1 (Team 2)** project: a travel/trip-planning platform where members build itineraries (destinations, hotels, flights, restaurants, attractions), get AI-generated itinerary reviews, subscribe to plans, and pay via PayMob — with a full operator admin panel.

Built on **Laravel 12** with JWT authentication, role/permission-based authorization, and a documented API (`Scramble`/OpenAPI).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Laravel 12 (PHP 8.2+) |
| Auth | `tymon/jwt-auth` (JWT bearer tokens, refresh rotation) |
| Authorization | `spatie/laravel-permission` (roles + permission middleware) |
| Payments | PayMob checkout (hosted page, webhook + callback) |
| AI itinerary reviews | Groq (`lucianotonet/groq-laravel`) |
| Report generation | `barryvdh/laravel-dompdf` (PDF) + `openspout` (spreadsheet export) |
| API docs | `dedoc/scramble` (OpenAPI UI at `/docs/api`) |
| Queue / cache | Redis (`predis`) |
| Dev tooling | Telescope, Mail preview, Sail, Pint |

---

## Getting Started

### Prerequisites

- PHP 8.2+, Composer, Node 20+ (for Vite assets)
- MySQL (or SQLite) + Redis (jobs/queue), or Laravel Sail (Docker)

### Install & Seed

```bash
composer install
cp .env.example .env        # Windows: copy .env.example .env
```

Complete `.env` (DB connection, `JWT_SECRET`, PayMob keys, Groq key, Redis), then:

```bash
# one-shot setup (keys, storage link, migrate:fresh --seed, build assets)
composer run setup

# or step by step
php artisan key:generate
php artisan jwt:secret --force
php artisan storage:link
php artisan migrate:fresh --seed --force
npm install && npm run build
```

The seeder installs roles (`super_admin`, `admin`, `user`), all route permissions (guard `api`), the default admin account, plans, and catalog seed data.

### Run

```bash
composer run dev   # artisan serve + queue:listen + pail logs + vite
```

---

## Tests

```bash
composer test       # custom script: config:clear + php artisan test
```

Suite covers unit + feature tests for surveys, plans/subscriptions, checkout/PayMob, trips, and permission guards.

---

## Documentation

| Doc | What it is |
|---|---|
| [`docs/Conference-API-Documentation.md`](docs/Conference-API-Documentation.md) | Full endpoint reference: 120 routes grouped in 36 modules, with access level + description (markdown) |
| [`docs/Conference-API-Documentation.pdf`](docs/Conference-API-Documentation.pdf) | Same reference rendered as branded PDF (A4, confidential footer) |
| [`docs/ROUTES-PERMISSIONS-AUDIT.md`](docs/ROUTES-PERMISSIONS-AUDIT.md) | Route × permission audit of the entire API (165 routes), incl. gaps & ownership checks |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) | Deployment and environment configuration guides |
| [`docs/payment-final-audit.md`](docs/payment-final-audit.md) · [`docs/notifications-architecture-research.md`](docs/notifications-architecture-research.md) | Deep-dives on payments & notifications |
| `/docs/api` | Live interactive OpenAPI docs (Scramble) |
| `postman_collection.json` | Importable Postman collection (114 requests) |

---

## API at a Glance

- **Public:** register, login, forgot/reset password, catalog browse (categories, destinations, hotels, flights, restaurants, attractions), weather, site settings, contact form, PayMob webhook/callback, docs.
- **Member (`USER`):** profile, trips (CRUD + attach/detach + fork), AI itinerary review, favourites & reviews, surveys, plans & subscription (subscribe/upgrade/cancel), checkout `POST api/v1/checkout/initiate`, dashboard, notifications, my reports.
- **Operators (`ADMIN`):** `api/v1/admin/*` — users, trips, catalog CRUD, countries, reviews moderation, contacts inbox, settings, analytics, reports, plans, notifications broadcast.

### Authorization model

- `auth:api` middleware on every protected route (JWT bearer).
- `permission:...` middleware for operator CRUD and member plan flows (28 seeded permissions).
- `role:admin|super_admin` on reports + admin notifications.
- Owner-scoped queries (surveys, notifications, reviews, favourites, reports) — see audit doc for the full matrix.

---

## Security Notes

- Email verification via signed URLs.
- Public throttles: login, register, refresh, password reset, email resend.
- PayMob webhook validated by signature before fulfilment.
- Remaining flagged items (dead attach/detach routes, missing owner check on `/api/review/{id}` and `/api/v1/maps/trip`, contacts throttle) are tracked in `docs/ROUTES-PERMISSIONS-AUDIT.md`.

---

## License

MIT — internal case-study deliverable, Team 2.