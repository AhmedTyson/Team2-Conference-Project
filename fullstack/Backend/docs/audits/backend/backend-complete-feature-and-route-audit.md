# Backend — Complete Feature & Route Audit (Master Document)

**Verdict: BACKEND INVENTORIED WITH DOCUMENTED GAPS**

Audit type: READ-ONLY. Nothing modified. Every claim verified from code, registry, or test run (evidence noted inline).

---

## 1. Executive Summary

| Item | Value |
|---|---|
| Backend status | Fully functioning; 257/257 tests pass; migrate:fresh --seed PASS |
| Laravel | 13.25.0 |
| PHP | 8.5.8 (requirement ^8.5 per composer) |
| Composer | 2.10.2 |
| Database | sqlite (dev) — case-study target MySQL |
| Cache / Queue / Session | database / database / database |
| Mail / Broadcast | log / log |
| Auth | JWT (tymon/jwt-auth, HS256) + spatie RBAC |
| API architecture | REST JSON, `ApiResponse` envelope, typed errors |
| Test framework | PHPUnit via artisan (sqlite) |
| Route count | 145 registry objects / 122 distinct URIs (46 named) |
| Domain count | 7 groups (Account 17, Catalog 47, Trips 26, Commerce 18, System 26, Web 6, Other 5) |
| Counts | Models 36, Controllers 44, Requests 41, Resources 12, Services 36, Repositories 18, Interfaces 19, Policies 3, Events 5, Listeners 2, Jobs 2, Notifications 10, Mail 9, Commands 7, Enums 13, Migrations 36, Seeders 22, Factories 0 |

## 2. What Is Finished (verified)

1. **Auth**: register/login/logout/refresh, password reset, email verification (signed URL), profile, JWT with role claims, blocked-user middleware, throttle suite.
2. **RBAC**: spatie roles/permissions (admin, super_admin, agency, user) enforced per route.
3. **Catalog**: full admin CRUD for countries/destinations/categories/hotels/restaurants/attractions/flights with soft-delete + trash + restore; public read endpoints.
4. **Trips**: user CRUD w/ ownership policy; admin mgmt; planner attach/detach; itinerary items; reviews (submit + admin approve/reject/delete/restore); favourites (morph).
5. **AI**: Groq itinerary generation w/ daily quota, cache, trip review/enhance, concierge assistant.
6. **Maps**: destination payload (attractions + nearby hotels/restaurants w/ cache), trip directions (OSRM), geocode backfill job.
7. **Commerce**: checkout → Paymob intention → HMAC webhook → fulfillment (package/fork/subscription); orders w/ idempotency + 30-min expiry; payments append-only + encrypted payload; plans/subscriptions w/ expiry sweep; price calculator.
8. **Agency**: full assignment workflow + build-trip-for-customer.
9. **System**: contacts, weather (Open-Meteo w/ cache), surveys, flags/moderation, reports (PDF), analytics queries, settings (whitelisted keys + public cache), notifications (DB+mail).
10. **Ops**: scheduler (3 commands), queue (database), caching (maps/AI/weather/settings), maintenance mode, Scramble docs, fixture sync commands, 22 seeders.

## 3. Full Feature Inventory

See `docs/backend-feature-inventory.md` — 80 rows master matrix (79 IMPLEMENTED/PARTIAL rows + legacy items).

## 4. Extra Features (beyond case study)

See `docs/backend-extra-features.md` — 37 extras: JWT suite, blocked users, AI quota/concierge/enhance, payments (Paymob) + webhooks + idempotency, orders, plans/subscriptions, trip forking, agency workflow, flags, reports, points, budget snapshots, contributions, OSRM directions, Open-Meteo, maintenance mode, Scramble, Telescope, mail preview, fixture sync, confirmation codes, OSM caching.

## 5. Case Study Comparison

See `docs/backend-case-study-comparison.md`. Headline deltas:
- **IMPLEMENTED DIFFERENTLY**: Countries API → fixture service; OpenWeatherMap → Open-Meteo; OpenAI → Groq; cities table → destinations.city_name.
- **NOT VERIFIABLE**: RapidAPI hotels/flights (config keys only, no call site); AJAX (frontend out of scope).
- **NOT IMPLEMENTED**: Custom helpers (no app/Helpers); standalone cities table.
- **PARTIAL**: transportation tips, estimated daily expenses, booking-history endpoint, per-user trip statistics, search/filtering breadth, website-settings schema (generic key/value).

## 6. Complete Route Inventory

See `docs/backend-routes.md` (every route w/ middleware + action, grouped). Headline numbers:

| Class | Count |
|---|---|
| Total API+web routes | 145 (122 distinct URIs) |
| Authenticated (auth:api) | 115 |
| Public (no auth) | 30 |
| Admin-gated (permission/role) | 79 |
| Agency-role routes | 4 |
| Webhook/callback (HMAC) | 2 |
| Web/non-API (docs, mail-preview, storage, up, /) | 6 |

## 7. Domain Architecture

- **Layered**: Controller → FormRequest → Service → Repository(Interface) → Model. Policies for domain rules. Strategies for checkout product types. Events/Listeners for commerce side effects.
- **Direct-to-model exceptions** (documented, not assumed): `AdminTripController@restore`/`AdminReviewController@restore` use `onlyTrashed()->findOrFail()->restore()` directly (bypass service); route `POST api/review` maps straight to `GroqService@generateAi` (no controller); `MapController@destination` uses OpenStreetService directly.
- Morph map enforced (8 types) via `Relation::enforceMorphMap`.
- 3 policies: TripPolicy, AgencyAssignmentPolicy, FlagPolicy. No Gates.
- 12 API Resources (User, Trip, Hotel, Flight, Attraction, Restaurant, Category, Country, Destination, Review, Favourite, ContactMessage).

## 8. Authentication & Security

See `docs/backend-auth-security.md`. Highlights: JWT guard HS256 ttl60/refresh 20160 blacklist; EnsureUserIsActive 403 `account_blocked`; 10 named rate limiters (1 unused: api_authenticated); permission/role middleware matrix; ownership policies; webhook HMAC; encrypted payment payloads; 41 Form Requests; ApiExceptionHandler typed errors.

## 9. Business Workflows

See `docs/backend-business-workflows.md`. 9 state machines: Trip (pending→planning→booked→completed/cancelled; enum-validated, not machine-enforced; UpdateTripRequest allows `active` outside enum), Order (pending→paid→fulfilled/failed/cancelled/expired/refunded), Payment (pending→processing→paid/failed/cancelled/refunded), Subscription (pending→active→cancelled/expired; past_due/paused reserved), AgencyAssignment (requested→admin_approved→agency_approved→completed + decline/cancel, guarded), Review (pending→approved/rejected), Flag (pending→approved/declined), ContactMessage (unread→read→resolved), Experience (orphan — no table).

## 10. AI

- Provider: **Groq** (groq-laravel). Endpoints: `POST api/review` → GroqService@generateAi (permission `generate ai itineraries` + throttle:ai); concierge route.
- Capabilities: itinerary generation (prompt from destination/days/budget/interests/travelers/style), trip enhance, trip review, concierge Q&A with trip context.
- Quota: per-user daily (config 500, AiUsageService consume/restore; cache-hit does not consume).
- Cache: 60-min per-request-key.
- **Known defect**: reads `no_of_days`/`no_of_travelers`; validation + tests use `number_of_*` → prompt gets nulls, cache key near-constant.
- Not implemented: OpenAI usage (key present, no calls), retry policies, AI-leg error guards.

## 11. Commerce / Payments

Paymob-first: CheckoutService → strategy factory (TripPackage/TripFork/Subscription) → Order (EGP, idempotency_key, confirmation_code) → PaymobGateway (SDK + custom cURL client 30/5s) → webhook HMAC → lock → 24h grace → PaymentSucceeded/Failed → FulfillOrderListener. Orders expire 30min. Payments append-only, encrypted payload, no PAN. Plans + subscriptions (partial unique active, renews_at sweep, quota sync). StripeGateway = stub (LEGACY). Commission rate config (0.05) present in env; no commission write path verified.

## 12. External Integrations

See `docs/backend-integrations.md`: OSM (Nominatim/Overpass/OSRM), Groq, Open-Meteo, Paymob, Wikidata (cities sync), config-only RapidAPI/OpenAI/Stripe. No retries; timeouts on Paymob/Open-Meteo/Nominatim.

## 13. Background Processing

See `docs/backend-async-processing.md`: 2 jobs (geocode, report), 5 events + 2 queued listeners (fulfillment, payment-failed), 9 notifications + 9 mailables, scheduler: expire-stale-orders (everyMinute), expire-stale-subscriptions (everyMinute), expire-password-tokens (daily). Queue driver: database.

## 14. Database

See `docs/backend-database.md`: 36 migrations all Ran; 36 tables; morph map; soft deletes on 10 tables; partial unique subscriptions; unique idempotency/confirmation codes; 13 enum-backed columns; 22 seeders; **0 factories**. Orphan models w/o tables: Experience, ExperienceProvider, EntityView, Company. Dead relation: Payment::booking().

## 15. Enums (13)

TripStatus, FlightStatus, ReviewStatus, OrderStatus, PaymentStatus, SubscriptionStatus, NotificationStatus, FlagStatus, ExperienceStatus (orphan), ContactMessageStatus, BudgetLevel, BillingCycle, AgencyAssignmentStatus. Full cases in `docs/backend-database.md`.

## 16. Notifications / Mail

AppNotification base (database+mail, 5-min WithoutOverlapping); 9 notifications + 9 mailables; PaymentFailedNotification mail-only; mail driver log. Mail-preview route for dev.

## 17. Tests

**257 passed / 900 assertions / 0 failures / 37s** (after `migrate:fresh --seed`). Map + gaps in `docs/backend-test-coverage-map.md` (notable gaps: FlightTest, Excel report, Stripe, AI prompt content, ConciergeController, notification read flows, service-level unit tests).

## 18. Frontend Consumers

Frontend (vanilla JS) excluded from audit scope. Backend delivers JSON for: auth screens, trip planner, map views (destinations/directions), admin panels (users/catalog/trips/reviews/settings/contacts/reports), agency dashboard, checkout/subscription flows, notification list, surveys, weather. Refer to frontend data-fetching docs in `docs/frontend-data-fetching-*.md` for page↔endpoint mapping (pre-existing).

## 19. Missing / Partial Features

- RapidAPI hotels/flights integration (NOT VERIFIABLE — no call site).
- OpenAI provider (unused).
- cities table (implemented as destinations.city_name).
- Custom helpers (app/Helpers absent).
- Per-user trip statistics endpoint (analytics admin-gated).
- Dedicated booking-history endpoint (orders/payments exist; no bookings endpoint).
- Daily expense generation in AI output (budget_snapshots table only).
- Search/filtering breadth (only trashed filter verified).
- Stripe (stub).
- Experience domain (enum+models, no table/controller).

## 20. Dead / Legacy / Unused (verified)

- StripeGateway (stub w/ fake secrets).
- Sanctum personal_access_tokens migration (no guard).
- Sprint1 smoke tests + ExampleTest.
- Orphan models: Experience, ExperienceProvider, EntityView, Company.
- Payment::booking() (absent Booking class).
- AdminSetSubscriptionPlanRequest (authorize=false → always 403).
- SurveyStoreRequest (empty rules — accepts anything).
- Rate limiter `api_authenticated` (defined, unused).

## 21. Deferred / Unverified Items

- RapidAPI call sites (keys only in config).
- Scheduler actually running (needs external cron/worker; not verifiable from repo).
- Production env (DEBUG mode ENABLED on dev; .env not audited for prod values).
- Frontend consumption (out of scope).
- OpenAI usage (env key only).
- Telescope/Scramble exposure in prod (RestrictedDocsAccess on docs; telescope default off).

## 22. Final Verdict

```
BACKEND INVENTORIED WITH DOCUMENTED GAPS
```

---

## Final Summary Output

```
Backend Summary

Total API Routes: 145 (122 distinct URIs)
Total Models: 36
Total Controllers: 44
Total Services: 36
Total Repositories: 18
Total Policies: 3
Total Events: 5
Total Listeners: 2
Total Jobs: 2
Total Notifications: 10
Total Mailables: 9
Total Commands: 7
Total Migrations: 36
Total Enums: 13
Total Seeders: 22
Total Factories: 0
Total Form Requests: 41
Total API Resources: 12

Implemented Features:
auth suite (register/login/logout/refresh/reset/verify/profile), blocked users, RBAC (spatie), admin CRUD + trash/restore for countries/destinations/categories/hotels/restaurants/attractions/flights/users/trips/reviews, public catalog reads, trip CRUD + planner + itinerary, favourites, reviews moderation, AI itinerary (Groq) + quota + cache + review/enhance + concierge, maps (OSM/OSRM) + geocode job, checkout → Paymob webhook → fulfillment, orders (idempotency + expiry), plans + subscriptions + expiry sweep, agency workflow, contacts, weather, surveys, flags, reports (PDF), analytics queries, settings, notifications (DB+mail), maintenance mode, scheduler (3), rate limiting suite, Scramble docs, fixture sync + 22 seeders, mail preview, Telescope

Partially Implemented:
transportation tips (AI prompt only), estimated daily expenses (table only), booking-history endpoint, per-user trip statistics, search/filtering breadth, website settings schema (generic), RapidAPI hotels/flights, Stripe (stub), OpenAI (unused), cities table (destinations.city_name), Excel reports (untested)

Not Implemented from Case Study:
custom helpers (app/Helpers), standalone cities table

Extra Features (37):
JWT auth suite, blocked-user enforcement, AI quota, AI review/enhance, concierge, AI caching, Paymob payments, HMAC webhooks, idempotency, order lifecycle + expiry, subscription plans + renewals, trip forking, public/private trips, planner attach/detach, agency workflow, flags/moderation, PDF reports, analytics query set, user points, budget snapshots, trip contributions, OSRM directions, geocode job, Open-Meteo weather, maintenance mode, DB+mail notifications, Scramble docs, Telescope, mail preview, fixture sync, export:postman, confirmation codes, RapidAPI config surface, Stripe stub, sanctum migration leftover

Tests:
257 passed
900 assertions
0 failures
0 skipped

Fresh Migration:
PASS (migrate:fresh --seed on disposable local sqlite)

Route Verification:
PASS (php artisan route:list --json — 145 registry objects)

Overall:
COMPLETE WITH GAPS
```
