# API Reference

<cite>
- [fullstack/Backend/routes/api.php](file://fullstack/Backend/routes/api.php#L56-L498)
- [fullstack/Backend/app/Http/Middleware](file://fullstack/Backend/app/Http/Middleware)
- [fullstack/Backend/docs/Conference-API-Documentation.md](file://fullstack/Backend/docs/Conference-API-Documentation.md)
</cite>

## Table of Contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
3. [Public Catalog & Content](#public-catalog--content)
4. [Trips & AI](#trips--ai)
5. [Commerce](#commerce)
6. [Social & Community](#social--community)
7. [System Services](#system-services)
8. [Admin Surfaces](#admin-surfaces)
9. [Agency Marketplace](#agency-marketplace)
10. [Rate Limits](#rate-limits)
11. [Machine-Readable Docs](#machine-readable-docs)

> Route count at HEAD `0c14fa54`: **213 api/* routes (222 total, 237 Route:: registrations before expansion)** across 499 lines of `routes/api.php`.

## Conventions

- Base URL `<host>/api`; JSON bodies; JWT via `Authorization: Bearer <token>` unless noted *public*.
- Responses wrapped by `Support/ApiResponse`; resources transformed by `app/Http/Resources/*`.
- Catalog admin mutations support soft-delete + `PATCH .../restore`.
- Legacy aliases exist deliberately (e.g. `/review/{id}` ⇄ `/ai/review/{id}`, `/orders` ⇄ `/me/orders`) to keep older frontend builds alive.

## Authentication

| Method | Path | Notes |
|---|---|---|
| POST | `/register`, `/login` | throttled (`throttle:register`, `throttle:login`) |
| POST | `/forgot-password`, `/reset-password` | token mail flow, throttled |
| GET | `/email/verify/{id}/{hash}` | signed verification link |
| GET | `/auth/google`, `/auth/facebook` (+ callbacks) | Socialite redirect flow; completion via POST `/auth/social/complete` |
| GET | `/user` · `/me` | current profile |
| POST | `/logout`, `/refresh` | refresh throttled 15/min |

Middleware chain on protected groups: `auth:api` → `verified` → `active` (custom) → permission/role.

## Public Catalog & Content

`GET /categories`, `/countries`, `/cities`, `/destinations`, `/hotels`, `/flights`, `/restaurants`, `/attractions`, `/regions`, `/stats/summary`, `/site-settings` — all public read-only, each with `{id}` detail variants and relation endpoints (`/destinations/{d}/hotels`, `/hotels/{h}/reviews`). Weather: `GET /weather` (cached + throttled). Maps: `GET /maps/destination/{destination}` public-throttled; `GET /maps/trip/{trip}` authed.

## Trips & AI

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/trips`, `/planner/*` | create/update/delete trips, itinerary items attach/detach/update, `POST /trips/{trip}/fork` community fork |
| POST | `/enhance`, `/review`, `/trips/generate-ai` (+aliases) | Groq-backed text enhance, AI review, itinerary generation — quota-metered |
| GET/POST | `/reviews/{type}/{id}`, `/me/reviews` | entity reviews + personal review management |

## Commerce

- **Plans:** `GET /plans[/id]` public; authed `POST /me/subscribe`, `/me/upgrade`, `/me/subscription/cancel`, `GET /me/subscription`.
- **Checkout:** `POST /payments/initiate` (strategy-routed); webhooks `POST /payments/webhook` + `/paymob/webhook` + versioned v1 alias (CSRF-exempt, HMAC-verified); browser `GET /callback` variants.
- **Orders:** `GET /orders` ⇄ `/me/orders`, lookup `GET /orders/lookup/{orderRef}`.

## Social & Community

Chat: `/conversations` CRUD-ish group (`index/store/show/messages/read`). Favourites: `POST /favourites/{type}/{id}` toggle. Flags: `POST /agency-assignments/{assignment}/report`.

## System Services

Surveys (`apiResource /surveys` + answer routes), contact `POST /contacts`, newsletter `POST /newsletter/subscribe`, notifications (`GET /notifications`, mark read/all-read), user dashboard (`GET /dashboard`, `/favourites`, `/orders`, `/me/ai-quota`), reports `GET /me/reports`, settings `GET|PUT /settings`, site settings public.

## Admin Surfaces

All behind `permission:*` or `role:admin|super_admin`:

| Area | Routes |
|---|---|
| Users | `/users` CRUD + `PATCH /users/{u}/active|block` |
| Catalog | admin CRUD × categories, countries, destinations, flights, hotels, attractions, restaurants (+restore) |
| Trips/Reviews | `/admin/trips`, `/admin/reviews` approve/reject/restore |
| Moderation | `/flags` approve/decline |
| Analytics | `/analytics`, `/analytics/revenue` |
| Plans | `POST /admin/set-plans` |
| Reports | `/admin/reports` index/generate/download |
| Inbox | `/admin/notifications`, `/contacts` read/resolve |
| Settings | `PUT /settings`, `PATCH /settings/{key}` |
| Agency intake | `/admin/agency-requests`, approve endpoint |

## Agency Marketplace

Authed role `agency|admin|super_admin`: assignments list, approve/decline, trip creation, earnings, profile get/update; user-side `POST /agency-requests`, `/agency-assignments/{a}/cancel`.

## Rate Limits

Named limiter usage: `register`, `login` (3/10min forgot, 5/min reset), `weather`, `maps`, `ai`, `contacts`, `newsletter`, refresh 15/min. Definitions live in a service provider/bootstrap limiter registration; abuse covered by tests (`WeatherAbuseTest`, `AiRateLimitTest`, `CheckoutAbuseTest`).

## Machine-Readable Docs

- Interactive OpenAPI (Scramble): `http://127.0.0.1:8000/docs/api`
- Hand-written reference: [`docs/Conference-API-Documentation.md`](file://fullstack/Backend/docs/Conference-API-Documentation.md) + branded PDF
- Postman collection generator: `php artisan export:postman`
- Permission audit matrix: [`docs/ROUTES-PERMISSIONS-AUDIT.md`](file://fullstack/Backend/docs/ROUTES-PERMISSIONS-AUDIT.md)
