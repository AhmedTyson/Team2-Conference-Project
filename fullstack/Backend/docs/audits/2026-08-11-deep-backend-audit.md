# Deep Backend Audit — 2026-08-11

Scope: full-stack discovery audit per `docs/final/OpenCode — Deep Laravel Backend Audit.md` (read-only).
Baseline: branch `main`, HEAD `af2597d` (remediation complete). Working tree clean.
Stack: Laravel 13.24.0, PHP 8.5.8, JWT (tymon, HS256, ttl 60 min, refresh 20160 min, blacklist on), SQLite dev, cache + queue driver = database, 189 routes, 35 models, 44 controllers, 33 services, 41 request classes, 2 policies, 12 resources, 53 migrations.
Test suite: 181 passed / 552 assertions (green at audit time).

---

## Executive Summary

- Is the backend secure? **PARTIALLY.** Payment/webhook integrity is strong (HMAC, atomic quota, locks, unique transaction id). The remaining exposure is concentrated in object-level authorization (IDOR) on AI/map endpoints, an unenforced account-block flag, and unauthenticated external-call endpoints.
- Is authorization consistent? **NO.** Owner checks exist on TripController (show/attach/detach), ConciergeController, policies for agency/flag. Missing on `AIController::review` and `MapController::trip`, and `is_active` is never enforced anywhere.
- Are business rules enforced? **MOSTLY, with gaps.** Checkout price integrity is server-side and recomputed. Subscription lifecycle (`renews_at`) is decorative — no scheduler, no recurring billing, no order expiry.
- Is the database safe? **MOSTLY.** Unique `paymob_transaction_id`, atomic quota updates. Weakness: card PAN + full webhook payload persisted unmasked/unencrypted.
- Is the API production-ready? **NO.** `APP_DEBUG=true` in .env, default wildcard CORS (no `config/cors.php`), Telescope enabled by default, queue worker/scheduler deployment unverified.

---

## Architecture Overview

Single Laravel API (JWT auth, Spatie roles/permissions) with layered services/repositories, strategy-based checkout (`CheckoutStrategyFactory`: subscription / trip_package / trip_fork), Paymob unified-checkout payment flow (intention → webhook HMAC → `Cache::lock` idempotency → `FulfillOrderListener` on queue), external integrations: Groq (AI), Open-Meteo (weather), Nominatim/Overpass (maps), Wikidata fixtures. Exceptions centralized in `ApiExceptionHandler` (single renderable). No scheduled tasks defined.

---

## Backend Inventory

- Middleware: only aliases for Spatie (`role`, `permission`, `role_or_permission`). No custom middleware (no `is_active` check, no auth-middleware for external endpoints).
- Rate limits (AppServiceProvider): login 5/min per `ip|email`, register 5/min per IP, ai 500/day per user/IP. Routes: `/register`, `/login` throttle; `/forgot-password` 3/10m; `/reset-password` 5/1m; `/refresh` 15/1m; `/trips/{trip}/concierge` throttle:ai.
- **No throttle:** `/checkout/initiate`, `/contacts`, `/weather`, `/maps/destination/{destination}`.
- Jobs: `GenerateReportJob` (timeout 300). Listeners: `FulfillOrderListener` (ShouldQueue), `PaymentFailedListener`. No scheduler registered (`routes/console.php` only `inspire`).

---

## Security Findings

### SEC-01 — Account block flag never enforced — blocked users retain full access
```
Finding ID: SEC-01
Severity: HIGH
Category: Security / Broken Function-Level Authorization (OWASP API5)
Component: Authentication / Account
File: app/Http/Controllers/Account/AuthController.php:59 (login); app/Http/Controllers/Account/AdminUserController.php:41 (block); app/Models/Account/User.php:39
Line / Method: login() / setBlock(); no middleware reads is_active
Current Behavior: AdminUserController::block sets users.is_active=0. AuthController::login authenticates any valid credential; no middleware, guard, or query filters is_active anywhere (grep: only the model column).
Expected Behavior: Blocked users must not authenticate, must not receive new JWTs, and existing tokens must be invalidated.
Evidence: `rg -n "is_active" app/` → only User model fillable/cast; no login/middleware reference. JWT attempt succeeds regardless of flag. No JWT custom-claim or guard check.
Impact: Administrative moderation (block) has zero effect. Abusive/compromised accounts keep full API access indefinitely (JWT refresh window 14 days).
Exploit Scenario: Admin blocks a spammer → spammer continues via existing token and can re-login; block is cosmetic.
Affected Users: All users; moderation tooling is ineffective.
Recommended Direction: Enforce is_active in login (401), add middleware/guard check for authenticated requests, and blacklist the user's tokens on block (JWTAuth::invalidate per refresh or blacklist claim).
Test Needed: Feature test: blocked user cannot login and blocked user's existing token is rejected.
Confidence: CONFIRMED
```

### SEC-02 — Trip IDOR: AI review + trip map leak other users' private trip data
```
Finding ID: SEC-02
Severity: HIGH
Category: Security / Broken Object Level Authorization (OWASP API1)
Component: Trips / AI / Maps
File: app/Http/Controllers/Trips/AIController.php:40 (review); app/Http/Controllers/Trips/MapController.php:76 (trip)
Line / Method: review($request, $id) / trip(Trip $trip)
Current Behavior: AIController::review($id) loads any Trip by id (find + itineraryItems.itemable + destinations) with no ownership check, sends full itinerary to Groq, returns review. MapController::trip(Trip $trip) returns all itinerary item coordinates for any trip id. Both routes are auth:api only — no user_id comparison.
Expected Behavior: Both endpoints must reject trips where user_id !== auth()->id() (consistent with TripController::show:404, ConciergeController:404).
Evidence: TripController::show/attach/detach and ConciergeController::ask all perform `$trip->user_id !== $request->user()->id` checks; AIController::review and MapController::trip do not. Routes: POST /api/v1/trips/{trip}/concierge (checked) vs GET /api/v1/maps/trip/{trip} + AI review (unchecked).
Impact: Any authenticated user enumerates trip ids and retrieves another user's private itinerary (title, day/order, item names, notes, dates, coordinates) directly or via AI-generated review.
Exploit Scenario: Script over ids 1..N calling /api/v1/maps/trip/N and the AI review endpoint harvests every user's trip plan.
Affected Users: All users with private trips.
Recommended Direction: Ownership guard in both controllers (404 like TripController::show); test both endpoints for cross-user access.
Test Needed: Feature test: user B cannot read map/AI-review of user A's trip.
Confidence: CONFIRMED
```

### SEC-03 — Unauthenticated external-call endpoints enable DoS / cost abuse
```
Finding ID: SEC-03
Severity: HIGH
Category: Security / Unrestricted Resource Consumption (OWASP API4)
Component: System / Maps / Weather
File: app/Http/Controllers/System/WeatherController.php:17; app/Http/Controllers/Trips/MapController.php:20
Line / Method: show() / destination()
Current Behavior: GET /api/weather has no auth and no throttle → external Open-Meteo call per cache miss (cache 30 min, key rounded to 0.0001 deg → many distinct keys). GET /api/v1/maps/destination/{destination} has no auth, executes `set_time_limit(90)`, fires 3 external calls (Nominatim geocode, 2× Overpass, plus AI-powered getAttractionsWithAI) and mutates the destination row (lat/lng write on GET).
Expected Behavior: Authenticated + throttled access (or at minimum shared throttle), bounded work per request, no side-effect writes on GET.
Evidence: route:list — `GET api/v1/maps/destination/{destination} => [api]`, `GET api/weather => [api]`; no throttle entries. MapController uses set_time_limit(90) + OpenStreetService HTTP calls; WeatherController → OpenMeteoService::getWeather.
Impact: Unauthenticated request flood fans out to third-party APIs (cost/rate-limit exhaustion) and holds PHP-FPM workers up to 90 s each (worker exhaustion DoS).
Exploit Scenario: Bot loops distinct destination ids → constant OSM/Overpass/AI load; parallel requests tie up all workers.
Affected Users: Platform availability for all users.
Recommended Direction: Add auth or a strict anonymous throttle (e.g. 10/min/IP), drop set_time_limit (remove/queue heavy work), and make geocode persistence explicit (POST or job) rather than a GET side effect.
Test Needed: Throttle/denial test for unauthenticated weather + map requests; assert no DB write on GET.
Confidence: CONFIRMED
```

### SEC-04 — trip_fork checkout accepts any trip id — paid exfiltration of private trips
```
Finding ID: SEC-04
Severity: MEDIUM
Category: Security / Sensitive Business Flow + BOLA (OWASP API6/API1)
Component: Commerce / Checkout / Trips
File: app/Strategies/Checkout/TripForkStrategy.php:14 (resolveProduct); app/Services/Trips/TripForkService.php:19 (fulfillFork); app/Http/Requests/Commerce/InitiateCheckoutRequest.php (trip_id exists:trips,id)
Line / Method: resolveProduct(int $productId) / fulfillFork(int $userId, int $sourceTripId)
Current Behavior: POST /api/v1/checkout/initiate with type=trip_fork validates only `exists:trips,id`. TripForkStrategy::resolveProduct returns any Trip. After payment, FulfillOrderListener → TripForkService::fulfillFork copies the full source trip (title, dates, budget, destinations, hotels/attractions/restaurants, notes) into the buyer's account. No check that the source trip belongs to the buyer or is marked shareable.
Expected Behavior: Fork purchase must only be possible for the buyer's own trips or trips explicitly published/shared; private trips must 404 at checkout.
Evidence: TripForkStrategy::resolveProduct = `Trip::findOrFail($productId)`; TripForkService::fulfillFork has no user_id/visibility guard; TripPackageStrategy likewise resolves any trip (though fulfillment no-ops for non-owners via fulfillTripPackage's user filter — fork does NOT).
Impact: Attacker pays the fork fee (default 50000 cents) to copy any user's private itinerary, then owns an exact copy including costs and notes.
Exploit Scenario: Victim's trip id discovered (e.g. via SEC-02); attacker initiates fork checkout, pays, receives full private copy.
Affected Users: All users with private trips.
Recommended Direction: In resolveProduct or checkout service, require Trip.user_id === buyer OR a published/shared flag; reject otherwise (404). Mirror the ownership filter used by fulfillTripPackage.
Test Needed: Checkout feature test: fork initiation for another user's trip is rejected.
Confidence: CONFIRMED
```

### SEC-05 — Card PAN and full webhook payload persisted unmasked / unencrypted
```
Finding ID: SEC-05
Severity: MEDIUM
Category: Security / Unsafe Data Handling + PCI (OWASP API10)
Component: Commerce / Payments
File: app/Repositories/Commerce/PaymentRepository.php:30-38; app/Services/Commerce/WebhookService.php:60
Line / Method: updatePaymentStatus() stores 'card_pan' => $cardPan and full payload
Current Behavior: Paymob webhook `obj.source_data.pan` is written verbatim into payments.card_pan; the complete raw webhook payload (billing, card data, order data) is stored in the payments payload column. No masking, no encryption at rest (dev DB is SQLite; production DB unknown).
Expected Behavior: Store only masked PAN (last4) or token; encrypt payload or persist only whitelisted fields.
Evidence: updatePaymentStatus signature (payload, cardType, cardSubType, cardPan) → card_pan column; WebhookService extracts pan from source_data and passes it through.
Impact: If DB is compromised, card data (even if Paymob masks partially) and full billing payload leak; PCI-DSS scope risk.
Exploit Scenario: DB dump / backup leak exposes PAN-ish data and personal billing info of all payers.
Affected Users: All paying customers.
Recommended Direction: Mask PAN to last4 at ingestion; store payload selectively; encrypt at rest (or move to a vault); document PCI scope.
Test Needed: Webhook processing test asserting stored pan is masked (e.g. only last4) and payload whitelisted.
Confidence: LIKELY (depends on whether Paymob returns masked or full PAN; persistence of whatever arrives is certain)
```

### SEC-06 — Missing CORS config — default wildcard origins
```
Finding ID: SEC-06
Severity: MEDIUM
Category: Security / Security Misconfiguration (OWASP API8)
Component: HTTP / Middleware
File: config/cors.php (absent)
Line / Method: —
Current Behavior: No config/cors.php in the project; Laravel defaults apply: paths api/*, graphql; allowed_origins ['*']; supports_credentials=false.
Expected Behavior: Explicit CORS policy listing the real frontend origin(s); credentials decision made deliberately.
Evidence: `Get-Content config/cors.php` → file not found; route middleware shows only api group.
Impact: Any website can issue credentialed-state-free reads from a browser; with wildcard origins the API is directly callable cross-origin without restriction, and any future supports_credentials=true change would create CSRF-style exposure.
Exploit Scenario: Malicious page scripts calls to API endpoints that rely on ambient auth absent cookie flows (JWT bearer — limited), but wildcard CORS still violates least-privilege and blocks nothing.
Affected Users: Platform.
Recommended Direction: Publish config/cors.php with explicit origins before deployment.
Test Needed: Manual/config assertion; CORS preflight test with foreign origin.
Confidence: LIKELY (Laravel default applied since file absent)
```

### SEC-07 — External HTTP calls lack timeouts (Open-Meteo, Groq, Paymob)
```
Finding ID: SEC-07
Severity: MEDIUM
Category: Security / Unsafe Consumption of APIs + Availability (OWASP API10)
Component: Integrations
File: app/Services/OpenMeteoService.php:28; app/Services/GroqService.php:65; app/Services/Commerce/PaymobGateway.php:96
Line / Method: getWeather() Http::get / generateAi() Groq::chat / createIntention() Paymob SDK
Current Behavior: Open-Meteo request uses Http::get with no ->timeout()/->connectTimeout(). Groq and Paymob calls rely on SDK defaults. OpenStreetService (same codebase) sets connectTimeout(3)/timeout(5) — internal inconsistency.
Expected Behavior: Every outbound call bounded (connect + total timeout) with failure fallback already present in most call sites.
Evidence: OpenMeteoService::getWeather has try/catch but no timeout options; OpenStreetService::getNearbyPlaces sets both timeouts.
Impact: A hung upstream hangs PHP workers up to platform limits; on queued jobs (FulfillOrderListener → SDK) blocked workers stall the whole queue (queue driver = database, one worker per job).
Exploit Scenario: Upstream degradation or slow-loris-style behavior stalls request workers and the fulfillment queue.
Affected Users: All users during upstream incidents.
Recommended Direction: Add explicit timeouts (e.g. 5-10 s) to Open-Meteo, Groq, and Paymob calls; centralize HTTP client factory.
Test Needed: Unit test with mocked slow client asserting timeout application.
Confidence: CONFIRMED
```

### SEC-08 — Public contact endpoint unthrottled
```
Finding ID: SEC-08
Severity: LOW
Category: Security / Resource Consumption (OWASP API4)
Component: System / Contact
File: routes/api.php:300; app/Http/Controllers/System/ContactController.php
Line / Method: POST /v1/contacts
Current Behavior: Public (no auth) POST /v1/contacts → ContactMessageService::store (persists + notifies admins). No throttle.
Expected Behavior: Rate limit (e.g. 5/min/IP) to bound storage + notification volume.
Evidence: route:list shows POST api/v1/contacts with no throttle middleware.
Impact: Spam floods admin notification channel and DB.
Exploit Scenario: Script submits thousands of contact messages.
Affected Users: Admins.
Recommended Direction: throttle:contacts on the route.
Test Needed: Throttle test.
Confidence: CONFIRMED
```

### SEC-09 — Checkout initiation unthrottled
```
Finding ID: SEC-09
Severity: LOW
Category: Security / Resource Consumption (OWASP API4)
Component: Commerce / Checkout
File: routes/api.php (checkout group); app/Http/Controllers/Commerce/CheckoutController.php
Line / Method: POST /api/v1/checkout/initiate
Current Behavior: Authenticated but unthrottled; each call creates Order + Payment rows and invokes Paymob createIntention (external call).
Expected Behavior: Per-user throttle (e.g. 5-10/min) to bound DB growth and gateway spam.
Evidence: route:list shows api/v1/checkout/initiate with middleware [api|auth:api] only.
Impact: DB row inflation (unpaid pending orders) + Paymob intention spam.
Exploit Scenario: Script creates thousands of pending orders.
Affected Users: Platform + payment provider.
Recommended Direction: throttle:checkout per user; add pending-order expiry job (see BIZ-01).
Test Needed: Throttle test.
Confidence: CONFIRMED
```

### SEC-10 — AI enhance() accepts unfiltered user text (prompt injection)
```
Finding ID: SEC-10
Severity: INFO
Category: Security / AI boundary hygiene
Component: AI
File: app/Services/GroqService.php:39; app/Http/Controllers/Trips/AIController.php:14
Line / Method: enhance(string $content)
Current Behavior: User content interpolated into the LLM prompt ("Enhance the following content: {$content}"); output returned to caller; not persisted and no downstream action taken on output.
Expected Behavior: System-prompt boundaries enforced (delimiter instructions), output never used in privileged operations.
Evidence: Prompt string concatenation; no role/system hardening.
Impact: Users can override the enhancer system instruction; benign since output is discarded after display.
Exploit Scenario: Crafted content makes the model behave as an arbitrary chatbot — no platform impact.
Affected Users: None material.
Recommended Direction: Prompt hardening (delimiters, instruction to ignore embedded commands); optional output filtering.
Test Needed: None critical.
Confidence: CONFIRMED (impact low)
```

---

## Business Logic Findings

### BIZ-01 — Subscription lifecycle is decorative: no recurring billing, no scheduler, no expiry cleanup
```
Finding ID: BIZ-01
Severity: MEDIUM
Category: Business Logic / Billing integrity
Component: Commerce / Subscriptions
File: app/Services/Commerce/PlanService.php:47 (cancel); app/Listeners/FulfillOrderListener.php:141 (fulfillSubscription); routes/console.php
Line / Method: cancel() / fulfillSubscription() / no schedule defined
Current Behavior: "Subscription" = one-time Paymob intention; renews_at is set (month/year) but no scheduler, job, or gateway recurring-token flow exists to charge or renew. Cancel() flips status to cancelled and nulls renews_at — no gateway interaction, no proration, no refund. Unpaid orders (SEC-09) are never expired/cleaned.
Expected Behavior: Either implement real recurring billing (Paymob card token + scheduler) or relabel as "plan access valid until date"; order expiry/cleanup job required regardless.
Evidence: routes/console.php contains only `inspire`; no Laravel Scheduler registered in bootstrap/app.php; cancel() only updates status; fulfillSubscription computes renews_at from billing_cycle.
Impact: Revenue leakage (expired subscriptions keep AI quota until reset logic re-checks), misleading contract (customers charged once, told recurring), stale pending-order accumulation.
Exploit Scenario: Customer exploits: after one payment, quota resets every month (ai_reset_at) with no further charge — free perpetual access if reset logic grants quota.
Affected Users: All subscribers; platform revenue.
Recommended Direction: Choose a real billing model; add scheduler + renewal/expiry jobs; align AI-quota grants with payment status, not calendar resets.
Test Needed: Scheduler/renewal unit test; cancel semantics test.
Confidence: CONFIRMED
```

### BIZ-02 — Fork lineage "version" is a timestamp string, not a snapshot
```
Finding ID: BIZ-02
Severity: LOW
Category: Business Logic / Data lineage
Component: Trips / Fork
File: app/Services/Trips/TripForkService.php:52
Line / Method: fulfillFork() — 'source_version_id' => $sourceTrip->updated_at->toDateTimeString()
Current Behavior: Fork records source version as the source trip's updated_at string; fork content is copied once at purchase but no content snapshot/version table exists. If the source trip is later edited, the fork's recorded version no longer matches actual content.
Expected Behavior: Either store a content hash/snapshot of the source at fork time, or drop the misleading version column.
Evidence: Column populated with timestamp; no version table or hash anywhere in TripForkService.
Impact: Lineage/attribution reporting (original_trip_id tree) claims versions that don't exist.
Exploit Scenario: None security; support/forensics ambiguity only.
Affected Users: Platform operations.
Recommended Direction: Store content hash (md5 of item set) or snapshot JSON.
Test Needed: Fork test asserting version field reflects source content hash.
Confidence: CONFIRMED
```

### BIZ-03 — GET /maps/destination performs DB writes (side effect on read)
```
Finding ID: BIZ-03
Severity: LOW
Category: Business Logic / REST semantics + Concurrency
Component: Maps
File: app/Http/Controllers/Trips/MapController.php:24-30
Line / Method: destination() — `$destination->update(['latitude' => ..., 'longitude' => ...])`
Current Behavior: A GET request persists geocode results; concurrent requests can both run Nominatim lookups and both update (last-write-wins, no lock).
Expected Behavior: Reads should not mutate; geocoding backfill should be a POST/job with locking, or accept eventual single-writer.
Evidence: update() inside destination() when lat/lng missing.
Impact: Duplicate upstream calls, race on coordinates, GET semantics violation; combined with SEC-03 it is an unauthenticated write vector (coordinate tampering).
Exploit Scenario: Unauthenticated caller forces re-geocoding to overwrite destination coordinates with wrong values (DoS of map quality).
Affected Users: All users viewing maps.
Recommended Direction: Move persistence to job or POST; add Cache::lock on backfill.
Test Needed: Test asserting GET does not write coordinates.
Confidence: CONFIRMED
```

### BIZ-04 — AI review quota charged on cache hits; inconsistent with generateAi
```
Finding ID: BIZ-04
Severity: LOW
Category: Business Logic / Quota accounting
Component: AI / Quota
File: app/Http/Controllers/Trips/AIController.php:42; app/Services/GroqService.php:110
Line / Method: review() — consumeQuota before GroqService::review (cached)
Current Behavior: AIController::review consumes quota before the cache lookup; GroqService::review caches responses 60 min (key includes trip content). Repeat reviews of the same trip charge quota each time. generateAi (GroqService:97) correctly consumes only on cache miss. Also `trip_review_` cache is global (no user scope) — any user requesting the same trip reads the cached review (compounds SEC-02).
Expected Behavior: Consistent quota accounting (consume only on actual generation); user-scoped review cache once SEC-02 ownership is fixed.
Evidence: consumeQuota call site before Cache::remember; comment in generateAi explicitly notes miss-only consumption.
Impact: Users burn quota on cached identical responses; support complaints.
Exploit Scenario: Minor quota manipulation — attacker repeats cached reviews to drain own quota (self-inflicted) — low.
Affected Users: Subscribers with AI quota.
Recommended Direction: Move consumeQuota into the cache-miss closure in review(); scope cache key by user.
Test Needed: Quota test asserting cache-hit does not decrement.
Confidence: CONFIRMED
```

---

## Database Findings

### DB-01 — No DB-level integrity for order reference / subscription overlap
```
Finding ID: DB-01
Severity: LOW
Category: Database / Integrity
Component: Commerce
File: database/migrations/2026_08_07_235716_create_orders_table.php; 2026_08_06_060001_create_subscriptions_table.php
Line / Method: schema definitions
Current Behavior: Order reference_id is generated as 'ORDER_{id}_{time}' (app-level uniqueness only). Subscription overlap is prevented only by application logic (FulfillOrderListener cancels existing active rows before create); no partial unique index on (user_id, status='active').
Expected Behavior: Unique constraint on reference_id; optional enforced single-active-subscription (DB check/unique functional index on Postgres).
Evidence: CheckoutService referenceId construction; listener cancel-then-create sequence; no unique index in migrations.
Impact: Concurrent webhook replays guarded by Cache::lock (15 s) — residual race only if lock expires mid-flight; low probability.
Exploit Scenario: Two near-simultaneous payments could yield overlapping active subscriptions (quota bypass ×2) if lock misses.
Affected Users: Platform.
Recommended Direction: Unique on reference_id; add guard in subscribe path.
Test Needed: Concurrency test (ConcurrencyTest exists — extend with subscription overlap).
Confidence: LIKELY
```

### DB-02 — Dev/prod database posture
```
Finding ID: DB-02
Severity: INFO
Category: Database / Environment
Component: Infrastructure
File: .env (DB_CONNECTION=sqlite), config/database.php
Line / Method: —
Current Behavior: Local uses SQLite; SQLite-specific code paths present (tagged-cache branches, groupBy fallbacks in AdminAnalyticsController). Production DB (Railway) not verifiable from this environment.
Expected Behavior: Postgres-specific hardening (functional indexes, upsert semantics) verified in prod.
Evidence: .env sqlite; analytics comment "Grouped by start date month in-memory for database safety".
Impact: Prod-only failures possible (e.g. MySQL/Postgres reserved words, group-by strictness).
Exploit Scenario: None.
Affected Users: Platform.
Recommended Direction: Run test suite against Postgres in CI before Railway deploy.
Test Needed: CI matrix with Postgres.
Confidence: NOT VERIFIED
```

---

## Performance Findings

### PERF-01 — Admin analytics loads entire trips table into memory
```
Finding ID: PERF-01
Severity: MEDIUM
Category: Performance / Query efficiency
Component: Commerce / Analytics
File: app/Http/Controllers/Commerce/AdminAnalyticsController.php:28-39
Line / Method: revenue()
Current Behavior: `Trip::whereIn('status', booked)->select('budget','start_date')->get()` materializes every booked trip, then groupBy in PHP. Unbounded — degrades linearly with trip count.
Expected Behavior: Aggregate in SQL (GROUP BY strftime/date_trunc) or chunked streaming; route is permission-gated but admin-facing and cached nowhere.
Evidence: Full-table get() + in-memory groupBy; monthlyRevenue build.
Impact: Admin dashboard request latency + memory spikes at scale.
Exploit Scenario: Admin triggers repeatedly; no security impact.
Affected Users: Admins.
Recommended Direction: SQL aggregation (date_trunc on Postgres), add response cache.
Test Needed: Test with many trips asserting bounded query count / time.
Confidence: CONFIRMED
```

### PERF-02 — Unbounded list queries
```
Finding ID: PERF-02
Severity: LOW
Category: Performance / Pagination
Component: Commerce / Agency
File: app/Http/Controllers/Commerce/AgencyAssignmentController.php:21 (index)
Line / Method: index()
Current Behavior: AgencyAssignment::where('agency_user_id', ...)->with(['customer','trips'])->get() — no pagination.
Expected Behavior: Paginate (agencies accumulate assignments/trips).
Evidence: get() without limit/paginate.
Impact: Slow agency dashboard at scale; minor.
Exploit Scenario: None.
Affected Users: Agency users.
Recommended Direction: paginate().
Test Needed: None critical.
Confidence: CONFIRMED
```

---

## API Contract Findings

### API-01 — Inconsistent response envelope and error semantics
```
Finding ID: API-01
Severity: MEDIUM
Category: API Contract / Consistency
Component: All controllers
File: multiple — e.g. AgencyRequestController (data only), AuthController ({message,user}), AdminUserController (UserResource direct), TripController ({success,message,data})
Line / Method: —
Current Behavior: Mix of {success,message,data}, {message,data}, {data}, raw resource collections; ownership violations return 404 (TripController::show), 403 (policies), or 200 with data (MapController). ApiExceptionHandler standardizes errors, but controller-level error paths use ApiResponse::fail inconsistently; HttpException passthrough exposes raw abort() messages and class-basename error types.
Expected Behavior: One envelope (success + data + meta), one ownership-error convention (404 for BOLA to avoid enumeration, per existing style), sanitized error types.
Evidence: Route-by-route response inspection (44 controllers); e.g. AgencyRequestController returns {'data'}; AuthController returns {'message','user'} without success flag.
Impact: Client integration friction; inconsistent error handling; automated clients break.
Exploit Scenario: None security.
Affected Users: All API consumers.
Recommended Direction: Adopt single envelope via a base response helper; normalize ownership errors; review after SEC-02 fixes.
Test Needed: Contract test asserting envelope across representative endpoints.
Confidence: CONFIRMED
```

### API-02 — Dev tooling posture (Telescope)
```
Finding ID: API-02
Severity: INFO
Category: API Contract / Inventory management (OWASP API9)
Component: Dev tools
File: config/telescope.php:16 (enabled default true); app/Providers/TelescopeServiceProvider.php:42 (gate email list empty)
Line / Method: —
Current Behavior: TELESCOPE_ENABLED not set in .env → Telescope watchers active in all environments (non-local filtered to failures/failed jobs). Gate lists no emails → no one (including local dev) can view the UI; if an email is later added and APP_ENV flips, exposure risk.
Expected Behavior: TELESCOPE_ENABLED=false outside local; gate pinned to real admin emails; data cleanup job.
Evidence: config default true; empty gate list; .env has no TELESCOPE key.
Impact: Telescope tables accumulate request/query data (incl. failed-request payloads) in prod; UI lockout for devs.
Exploit Scenario: None currently (deny-all gate); future misconfiguration risk.
Affected Users: Developers.
Recommended Direction: Set TELESCOPE_ENABLED=false in prod env; populate gate.
Test Needed: None.
Confidence: CONFIRMED
```

---

## Test Coverage Gaps

Highest-value missing tests (none of these are covered by the 181-test suite):

| Gap | Related Finding | Suggested Test |
|---|---|---|
| is_active block enforcement (login + existing token) | SEC-01 | Blocked user login rejected; token invalidated |
| Cross-user trip map + AI review access | SEC-02 | User B requests user A's trip map/review → 404 |
| Unauthenticated weather/maps destination abuse | SEC-03 | Throttle applied; no DB write on GET |
| Fork checkout with foreign trip id | SEC-04 | Initiate rejected 404 |
| PAN masking on webhook ingestion | SEC-05 | Stored pan = masked value |
| Subscription lifecycle (renewal/cancel/expiry) | BIZ-01 | Renewal job semantics; cancel proration |
| AI quota on cached review | BIZ-04 | Cache hit does not decrement |
| Order expiry cleanup job | BIZ-01/SEC-09 | Pending orders purged after window |

---

## Production Readiness

| Area | Status | Evidence | Risk |
|---|---|---|---|
| Secrets hygiene | READY (local) | .env gitignored; .env.example placeholders only; local keys are test keys | Low |
| Debug mode | NOT READY | APP_DEBUG=true in .env | High if deployed as-is |
| Config caching | NOT VERIFIED | config/routes not cached locally | Medium |
| CORS | NOT READY | config/cors.php absent → wildcard default | Medium |
| Queue processing | NOT VERIFIED | QUEUE_CONNECTION=database; worker deployment unknown | High (fulfillment depends on worker) |
| Scheduler | NOT READY | No scheduler registered | Medium (renewal/expiry absent) |
| External timeouts | NOT READY | SEC-07 | Medium |
| Telescope | NOT READY | enabled default true | Low |
| Database | NOT VERIFIED | SQLite local; Postgres (Railway) unverified | Medium |
| Storage | NOT VERIFIED | local/public disk; S3 not configured | Medium |

---

## Final Risk Register

| ID | Severity | Category | Finding | Impact | Evidence | Recommended Action |
|---|---|---|---|---|---|---|
| SEC-01 | HIGH | Authz | is_active block not enforced | Blocked users keep access | AuthController login + no middleware check | Enforce at login + guard + token blacklist |
| SEC-02 | HIGH | IDOR | AI review + map leak private trips | All private trips exposed | Missing ownership checks vs TripController | Ownership guards both endpoints |
| SEC-03 | HIGH | API4 | Unauth external-call endpoints | DoS/cost/worker exhaustion | weather + maps/destination route middleware | Auth/throttle; drop set_time_limit; job-ify geocode |
| SEC-04 | MEDIUM | API6 | Fork checkout accepts foreign trip id | Paid copy of private trips | TripForkStrategy resolveProduct | Ownership/public check at resolve |
| SEC-05 | MEDIUM | PCI | PAN + payload persisted raw | Card data at rest | PaymentRepository card_pan | Mask last4; encrypt/whitelist payload |
| SEC-06 | MEDIUM | API8 | CORS wildcard default | Unrestricted cross-origin | Missing config/cors.php | Explicit CORS config |
| SEC-07 | MEDIUM | API10 | External calls no timeouts | Worker/queue stalls | OpenMeteoService vs OpenStreetService | Timeouts + client factory |
| BIZ-01 | MEDIUM | Billing | Subscription lifecycle decorative | Revenue leak; stale orders | No scheduler; cancel() status-only | Real billing model + scheduler |
| PERF-01 | MEDIUM | Perf | Analytics full-table in memory | Admin latency/memory | revenue() get()+groupBy | SQL aggregation |
| API-01 | MEDIUM | Contract | Inconsistent envelope/status | Client friction | 44-controller inspection | Single envelope convention |
| SEC-08 | LOW | API4 | Contacts unthrottled | Spam flood | Route list | throttle |
| SEC-09 | LOW | API4 | Checkout unthrottled | Order spam | Route list | throttle + expiry job |
| BIZ-02 | LOW | Logic | Fork version = timestamp | Lineage drift | TripForkService | Content hash |
| BIZ-03 | LOW | Logic | GET writes DB coords | Race + semantics | MapController update() | Job/POST + lock |
| BIZ-04 | LOW | Logic | Quota on cached AI review | Quota misaccounting | AIController consumeQuota | Miss-only consumption |
| DB-01 | LOW | DB | No reference/subscription constraints | Residual race | Migrations | Unique ref + overlap guard |
| PERF-02 | LOW | Perf | Agency index unbounded | Latency at scale | get() | paginate |
| SEC-10 | INFO | AI | Prompt injection surface | Negligible | GroqService enhance | Prompt hardening |
| DB-02 | INFO | DB | Prod DB unverified | Prod-only failures | SQLite local | Postgres CI run |
| API-02 | INFO | Devtools | Telescope defaults | Data capture | config/telescope.php | Disable outside local |

---

## Top 10 Priorities

```
#1
Problem: Blocked accounts keep full access (is_active ignored).
Why it matters: Moderation is a no-op; abusive accounts persist.
Evidence: SEC-01; only model column, no login/middleware check.
Recommended fix: login 401 on is_active=0; guard middleware; invalidate tokens.
Estimated complexity: Small.

#2
Problem: Trip IDOR on AI review + map endpoints.
Why it matters: Every private itinerary enumerable by any user.
Evidence: SEC-02; ownership checks missing vs TripController/Concierge.
Recommended fix: user_id guard → 404, mirroring existing convention.
Estimated complexity: Small.

#3
Problem: Unauthenticated weather/maps endpoints fan out to external APIs (90 s work).
Why it matters: DoS + third-party cost + worker exhaustion.
Evidence: SEC-03; route middleware [api] only; set_time_limit(90).
Recommended fix: throttle + auth; remove set_time_limit; queue geocode.
Estimated complexity: Small-Medium.

#4
Problem: Fork purchase accepts any trip id → paid private-trip copy.
Why it matters: Data exfiltration for the fork fee.
Evidence: SEC-04; resolveProduct has no ownership filter.
Recommended fix: own-or-public check at resolveProduct/checkout.
Estimated complexity: Small.

#5
Problem: Card PAN + full webhook payload stored raw.
Why it matters: PCI scope; breach exposure of card data.
Evidence: SEC-05; card_pan column populated from source_data.pan.
Recommended fix: mask last4; whitelist payload fields; encrypt at rest.
Estimated complexity: Small.

#6
Problem: No CORS policy (wildcard default).
Why it matters: Zero cross-origin restriction; future credential risk.
Evidence: SEC-06; config/cors.php missing.
Recommended fix: publish explicit origin config.
Estimated complexity: Trivial.

#7
Problem: External HTTP without timeouts.
Why it matters: Upstream hangs stall workers and the queue.
Evidence: SEC-07; OpenMeteo/Groq/Paymob vs OpenStreetService timeouts.
Recommended fix: explicit timeouts; HTTP client factory.
Estimated complexity: Small.

#8
Problem: Subscription is one-time purchase with fake renewal date; no scheduler.
Why it matters: Revenue leak; contract mismatch; stale pending orders.
Evidence: BIZ-01; routes/console.php has no schedule.
Recommended fix: implement renewal/expiry scheduler or relabel; add order expiry.
Estimated complexity: Medium-Large.

#9
Problem: Admin analytics loads all trips into memory.
Why it matters: Admin dashboard degrades at scale.
Evidence: PERF-01; full get() + PHP groupBy.
Recommended fix: SQL aggregation; response cache.
Estimated complexity: Medium.

#10
Problem: API envelope/status inconsistency.
Why it matters: Integration churn; broken clients.
Evidence: API-01; 4+ response shapes across controllers.
Recommended fix: single envelope + ownership-error convention.
Estimated complexity: Medium.
```

---

## Remediation Roadmap

Phase 1 — Critical Security: SEC-01 (block enforcement), SEC-02 (IDOR guards), SEC-03 (gate unauth external endpoints).
Phase 2 — Payment & Data Protection: SEC-04 (fork ownership), SEC-05 (PAN masking), SEC-09 (checkout throttle + expiry).
Phase 3 — Hardening: SEC-06 (CORS), SEC-07 (timeouts), SEC-08 (contacts throttle), API-02 (Telescope).
Phase 4 — Business Logic: BIZ-01 (subscription lifecycle + scheduler), BIZ-02/BIZ-03/BIZ-04.
Phase 5 — Database Integrity: DB-01 (constraints), DB-02 (Postgres CI).
Phase 6 — Performance: PERF-01 (analytics SQL), PERF-02 (pagination).
Phase 7 — API Contracts: API-01 (envelope), test-gap matrix above.
Phase 8 — Production Readiness: APP_DEBUG=false, config cache, queue worker + scheduler deployment, storage backend.

---

## Final Verdict

- REMEDIATION (prior work): COMPLETED — 20 phases committed at `af2597d`; 181 tests green; webhook HMAC, idempotency locks, atomic AI quota, restore endpoints, review import bug fixed.
- DEEP AUDIT: COMPLETED — read-only discovery of all 44 controllers, 33 services, key migrations/configs, full route→middleware mapping, live test run.
- SECURITY: PARTIAL — payment integrity strong; object-level authorization gaps remain (SEC-01..04) and external endpoint hardening pending.
- BUSINESS LOGIC: PARTIAL — pricing/checkout integrity good; subscription lifecycle and quota accounting gaps.
- DATABASE: MOSTLY SAFE — unique transaction id + atomic updates; PAN-at-rest and constraint gaps remain.
- PRODUCTION READINESS: NOT READY — debug mode, CORS, queue worker/scheduler deployment, and Telescope posture must be resolved before Railway deploy.
