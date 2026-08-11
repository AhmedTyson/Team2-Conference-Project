# Backend Audit Findings — Validation Report

Date: 2026-08-11
Scope: independent validation of the 19-finding register from `docs/final/OpenCode — Backend Audit Findings Validation & Remediation Planning.md` against the CURRENT codebase (read-only).
Source of truth order: current code > current tests > current config > current migrations > prior audit report > framework knowledge.

---

## 1. Baseline Reconstruction

```
Current branch:  main
Current commit:  af2597d (feat: complete backend audit remediation phases 0-20)
Working tree:    CLEAN (3 untracked docs only: two plan files + 2026-08-11-deep-backend-audit.md)
Laravel version: 13.24.0
PHP version:     8.5.8
Composer version: 2.10.2
Environment:     local
Database:        sqlite (dev); pgsql configured for production but NOT VERIFIABLE here
Authentication:  tymon/jwt-auth (HS256, ttl 60m, refresh_ttl 20160m, blacklist enabled, grace 0)
Authorization:   spatie/laravel-permission 8.3.0 (role + permission middleware aliases)
Payment:         Paymob unified checkout (PaymobGateway + WebhookService HMAC)
AI integration:  Groq (itineraries/review/enhance) + OpenAI gpt-4.1-mini (map attractions)
Queue driver:    database
Cache driver:    database
Session driver:  database
Mail driver:     log
composer audit:  No security vulnerability advisories found
Test suite:      181 passed / 552 assertions (re-run 2026-08-11, green)
Debug mode:      ENABLED (local .env)
```

Verification commands executed: `git status/branch/log/diff`, `php artisan about`, `composer audit`, `php artisan test`, route-list JSON dump, full-file reads of all 44 controllers, key services, migrations, models, policies, requests, configs.

---

## 2. Finding Validation Register

Status legend: CONFIRMED / PARTIALLY CONFIRMED / NOT REPRODUCED / FALSE POSITIVE / UNKNOWN / BUSINESS DECISION REQUIRED.
ID mapping: plan ID ↔ prior audit report ID (`docs/audits/2026-08-11-deep-backend-audit.md`).

### SEC-01 — Blocked users can authenticate
```
Audit claim:   users.is_active=false does not prevent authentication or existing-token use.
Prior report:  SEC-01, HIGH
Validation:
  Login:       AuthController::login (app/Http/Controllers/Account/AuthController.php:59) attempts JWT with any valid
               credentials. No is_active check. CONFIRMED — blocked users can log in.
  Existing tokens: JWT guard (tymon) validates signature/expiry/blacklist only. No middleware or guard checks
               is_active. CONFIRMED — existing tokens keep working.
  is_active checked anywhere? No. grep over app/ shows only User model fillable/cast (app/Models/Account/User.php:39,64).
  Token revocation on block: none. AdminUserController::setBlock (app/Http/Controllers/Account/AdminUserController.php:41)
               only updates the flag. No JWT blacklist call.
  Middleware/policy enforcing account status: none exists.
Status:        CONFIRMED
Severity:      HIGH (prev HIGH, unchanged) — moderation control is a no-op; abusive accounts persist.
Exploitability: trivial (login with blocked account); Impact: high (moderation ineffective, account-takeover-after-block persists).
```

### SEC-02 — Trip IDOR (AI review / maps trip)
```
Audit claim:   Any authenticated user can read any trip via AI review and trip-map endpoints.
Prior report:  SEC-02, HIGH
Validation (endpoint by endpoint):
  AI review:   AIController::review (app/Http/Controllers/Trips/AIController.php:40) — Trip::find($id), no user_id check.
               CONFIRMED.
  Maps trip:   MapController::trip (app/Http/Controllers/Trips/MapController.php:76) — route-model-bound Trip, no
               ownership check. CONFIRMED.
  Trip show:   TripController::show — checks user_id, returns 404. Correct.
  Attach/detach: TripController::attach/detach — checks user_id, 404. Correct.
  Concierge:   ConciergeController::ask — checks user_id, 404. Correct.
  Fork:        disabled shim (TripController::fork aborts 400); real path is checkout (SEC-04).
  Policies:    only AgencyAssignmentPolicy + FlagPolicy exist. No TripPolicy.
  Route binding: no scoped binding (no user scope on trip routes).
Status:        CONFIRMED (BOLA, OWASP API1)
Severity:      HIGH (prev HIGH, unchanged) — every private trip enumerable by any account.
```

### SEC-03 — Public expensive external calls
```
Audit claim:   Unauthenticated weather/maps endpoints trigger expensive external calls.
Prior report:  SEC-03, HIGH
Validation table:
| Endpoint | Auth | Throttle | Ext calls/req | Timeout | Cache | DB write | Risk |
|---|---|---:|---|---|---|---|---|
| GET /api/weather | none | none | 1 (Open-Meteo) | NONE set | 30m per 0.0001° key | none | MEDIUM |
| GET /api/v1/maps/destination/{id} | none | none | up to 4 (Nominatim + 2× Overpass + OpenAI) | Nominatim NONE, Overpass 3/5s, OpenAI 5/15s + retry | coords 24h, places 8h, AI 24h | YES (lat/lng) | HIGH |
| GET /api/v1/maps/trip/{trip} | auth | none | 1 (OSRM) | NONE set | 60m | none | LOW (authed) |

  Worker hold: MapController::destination calls set_time_limit(90).
  Cost vector: OpenAI gpt-4.1-mini per unique city cache-miss — unauth attacker can enumerate destination ids.
  Mitigation noted: per-city/per-coordinate caches cap repeated cost; cache miss still triggers full chain.
  Realistic exhaustion: yes — distinct destination ids → OpenAI spend + worker occupancy. Not unlimited (cache),
  but attacker controls cadence via new ids.
Status:        CONFIRMED (OWASP API4)
Severity:      HIGH (prev HIGH, unchanged) — cost + availability.
```

### SEC-04 — Trip fork authorization
```
Audit claim:   Checkout type=trip_fork accepts any trip_id → paid copy of private trips.
Prior report:  SEC-04, MEDIUM
Validation:
  Checkout:    InitiateCheckoutRequest validates only exists:trips,id. CheckoutStrategyFactory → TripForkStrategy::resolveProduct
               (app/Strategies/Checkout/TripForkStrategy.php:14) = Trip::findOrFail($productId). No ownership/visibility filter.
  Fulfillment: FulfillOrderListener::fulfillTripFork → TripForkService::fulfillFork (app/Services/Trips/TripForkService.php:19)
               copies full trip (title, dates, budget, destinations, hotels/attractions/restaurants, notes) to buyer.
               No user_id check. CONFIRMED.
  Contrast:    fulfillTripPackage filters Trip by user_id — fork path does NOT (asymmetry).
  Auth before payment: none beyond auth:api. Auth during fulfillment: none.
  Trip becomes inaccessible after payment: fork still executes (no re-check) — by design of queue flow.
  Self-fork:   user can fork own trip (legitimate use).
Status:        CONFIRMED — but the intended policy is not defined in code.
Severity:      MEDIUM (prev MEDIUM, unchanged) — requires payment; exfiltrates private trip content.
               Classified also as BUSINESS DECISION REQUIRED (see business register, fork policy).
```

### SEC-05 — Sensitive payment/card data storage
```
Audit claim:   Card PAN + full webhook payload persisted.
Prior report:  SEC-05, MEDIUM (LIKELY)
Validation:
  Schema:      payments.card_pan varchar(20) nullable; payments.raw_payload JSON NOT NULL
               (database/migrations/2026_08_06_052920_create_payments_table.php).
  Ingestion:   WebhookService::processWebhook passes obj.source_data.pan verbatim →
               PaymentRepository::updatePaymentStatus stores 'card_pan' (app/Repositories/Commerce/PaymentRepository.php:30-38).
               Full webhook payload stored in raw_payload. CONFIRMED persistence of whatever arrives.
  What actually arrives: Paymob source_data.pan content cannot be verified from this repository (no recorded
               webhook fixtures). Paymob documents masked PAN in most checkout responses, full PAN in some legacy
               transaction responses. UNKNOWN which applies.
  Logging:     no PAN logged; payment model is append-only (UPDATED_AT = null). Good hygiene.
  CVV:         never transmitted/stored (Paymob holds it). Good.
Status:        PARTIALLY CONFIRMED — raw payload + PAN field persisted unmasked/unencrypted (confirmed);
               whether full PAN vs masked arrives (uncertain — gateway-dependent).
Severity:      MEDIUM (prev MEDIUM, unchanged) — PCI scope; at-rest exposure if DB compromised.
               Marked BUSINESS DECISION REQUIRED (retention policy).
```

### SEC-06 — CORS
```
Audit claim:   CORS may be too permissive.
Prior report:  SEC-06, MEDIUM
Validation:
  config/cors.php: ABSENT. Illuminate\Http\Middleware\HandleCors falls back to its static defaults:
               paths [api/*, graphql], allowed_methods [*], allowed_origins [*], allowed_headers [*],
               supports_credentials = false. HandleCors is in the default global middleware stack. CONFIRMED wildcard.
  Actual impact given auth model: JWT bearer tokens travel in Authorization header (not cookies); no ambient
  credentials → wildcard CORS does not enable CSRF-style attacks. Exposure is limited to: unauthenticated reads
  of public endpoints from any origin (already public) and clients willingly storing tokens.
Status:        CONFIRMED (misconfiguration) — but severity downgraded.
Severity:      LOW (prev MEDIUM). Reason: bearer-token auth model eliminates the cookie-credential attack path;
               wildcard is a hardening gap, not an exploitable boundary. Still must be pinned before launch.
```

### SEC-07 — External API timeouts
```
Audit claim:   External calls lack explicit timeouts.
Prior report:  SEC-07, MEDIUM
Validation — every outbound HTTP call:
| Call | File | Connect timeout | Request timeout | Retry | Fallback |
|---|---|---|---|---|---|
| Open-Meteo | OpenMeteoService.php:28 | none | none | none | null (502) |
| Nominatim geocode | OpenStreetService.php:16 | none | none | none | null |
| Overpass ×2 | OpenStreetService.php:60 | 3s | 5s | none | [] |
| OSRM directions | OpenStreetService.php:139 | none | none | none | [] |
| OpenAI attractions | OpenStreetService.php:180 | 5s | 15s | 2/1s | [] |
| Groq SDK | GroqService.php (create calls) | SDK default | SDK default | none | exception→RuntimeException |
| Paymob SDK | PaymobGateway.php:96 | SDK default | SDK default | none | success=false |
  Global HTTP client policy: none (no config/http-client.php, no HttpClientFactory).
Status:        CONFIRMED — 4 of 7 call paths unprotected; internal inconsistency (Overpass/OpenAI protected).
Severity:      MEDIUM (prev MEDIUM, unchanged) — hung upstreams stall workers and the database queue.
```

### SEC-08 — Checkout abuse (throttling/idempotency)
```
Audit claim:   Checkout may lack throttling.
Prior report:  SEC-09, LOW (checkout throttle) + SEC-08 (contacts throttle, LOW)
Validation:
  Throttle:    POST /api/v1/checkout/initiate → [api|auth:api] only. No throttle. CONFIRMED.
  Idempotency: none — every call creates a new Order + Payment row and calls Paymob createIntention (external).
  Duplicate handling: no client idempotency key; retries = duplicate orders + duplicate gateway intentions.
  Amount:      server-recomputed via strategies (no client price accepted). GOOD.
  Payment duplication: gateway intention duplication possible (same user spamming → many intentions);
               webhook fulfillment is idempotent per transaction id (Cache::lock + status guard). GOOD.
  Resource exhaustion: DB row inflation + gateway spam. CONFIRMED.
Status:        CONFIRMED
Severity:      MEDIUM (raised from LOW) — combines external gateway cost, DB inflation, and no idempotency key.
               Contacts endpoint (not in plan register, validated anyway): CONFIRMED, LOW (spam vector only).
```

### SEC-09 — Pending order expiry
```
Audit claim:   Pending orders may never expire.
Prior report:  BIZ-01 (part), LOW
Validation:
  Pending state: orders.status default 'pending'; no expires_at column; no created_at cleanup logic.
  Cleanup job:  none. Scheduler: none registered (routes/console.php = inspire only).
  Gateway timeout: no server-side expiry of Paymob intentions.
  Webhook after expiry: would still match payments.paymob_transaction_id and fulfill. No expiry gate.
  Answer: pending orders can remain indefinitely.
Status:        CONFIRMED
Severity:      MEDIUM (raised from LOW) — unbounded accumulation of pending orders+payments; stale intents
               fulfillable far after creation. Requires business decision on expiry window (register item).
```

### SEC-10 — Subscription semantics / renewal
```
Audit claim:   Subscription renewal behavior incomplete.
Prior report:  BIZ-01, MEDIUM
Validation:
  Current behavior: one-time Paymob intention purchase; Subscription created status=active, renews_at = now+1m/+1y
               (FulfillOrderListener::fulfillSubscription, app/Listeners/FulfillOrderListener.php:141).
  Renewal:      NO scheduler, NO job, NO gateway recurring token — renews_at is decorative.
  Expiry:       NO job expires subscriptions when renews_at passes; status stays 'active' forever.
  Quota:        AiUsageService::consumeQuota checks subscriptions where status=active; ai_reset_at resets count monthly.
               Because subscriptions never auto-expire, quota resets monthly indefinitely after ONE payment.
  Cancel:       PlanService::cancel flips status + nulls renews_at (status-only; no gateway action, no proration).
  Payment failure: no recurring-charge flow exists, so no failure path.
Status:        CONFIRMED as implemented behavior — the defect versus intended model is BUSINESS DECISION REQUIRED.
Severity:      MEDIUM (prev MEDIUM, unchanged) — revenue impact if "recurring" was intended; contract mismatch
               (customers told recurring, system charges once and grants perpetual quota resets).
```

### SEC-11 — AI cached responses consume quota
```
Audit claim:   Cached AI results consume quota.
Prior report:  BIZ-04, LOW
Validation:
  generateAi:  GroqService::generateAi consumes quota INSIDE the Cache::remember closure (cache miss only). CORRECT.
  review:      AIController::review consumes quota BEFORE GroqService::review's Cache::remember → cache hits charge
               quota; cache key is global (no user scope), so repeat reviews (or cross-user same-trip reviews) burn quota.
Status:        CONFIRMED (review path only)
Severity:      LOW (prev LOW, unchanged) — quota accounting inconsistency; user-visible annoyance; minor cost risk.
```

### SEC-12 — Maps GET side effect
```
Audit claim:   GET /maps/... writes to DB.
Prior report:  BIZ-03, LOW
Validation:
  MapController::destination (app/Http/Controllers/Trips/MapController.php:24-30): when destination lacks lat/lng,
  GET triggers Nominatim lookup and $destination->update(lat/lng). CONFIRMED — business-state write on GET.
  Repeated GETs: after coordinates cached, no write; concurrent first-requests can both geocode and both update.
  Unauthenticated: route has NO auth → unauthenticated write vector (coordinate overwrite with wrong geocode).
Status:        CONFIRMED
Severity:      LOW (prev LOW, unchanged) — minor; overlaps SEC-03 mitigation (move backfill to job/POST).
```

### DB-01 — Order reference uniqueness
```
Audit claim:   Order reference uniqueness may require stronger DB enforcement.
Prior report:  DB-01, LOW
Validation:
  There is NO reference_id column on orders. The gateway reference ('ORDER_{id}_{time}') is stored as
  payments.paymob_transaction_id, which HAS a UNIQUE constraint (migration line: string(100)->unique()).
  Webhook lookup findByTransactionId → unique column → replay-safe.
Status:        FALSE POSITIVE — the uniqueness concern is already enforced at the payments layer (the only place
               the reference is persisted and looked up).
Severity:       n/a (removed from register).
```

### DB-02 — Subscription concurrency / uniqueness
```
Audit claim:   Subscription overlap may need DB-level protection.
Prior report:  DB-01 (subscription part), LIKELY/LOW
Validation:
  App-level:   webhook idempotency (Cache::lock 15s per merchant order + provider_ref guard) prevents double
               fulfillment of the SAME payment; listener cancels existing active subs before creating a new one
               (inside DB transaction). Protection is real for same-payment replays.
  DB-level:    no partial unique index on (user_id, status='active'); index is plain (user_id, status).
  Residual:    two DISTINCT payments completing near-simultaneously → both create subs; cancel-then-create runs
               serially inside transactions, so the second cancels the first → no overlap in practice. Residual
               risk is negligible; constraint is optional hardening.
Status:        PARTIALLY CONFIRMED — overlap is prevented by app logic; no DB-level guarantee (defense-in-depth gap only).
Severity:      LOW (prev LOW, unchanged).
```

### DB-03 — Production PostgreSQL verification
```
Audit claim:   PostgreSQL compatibility unverified.
Prior report:  DB-02, INFO/NOT VERIFIED
Validation:    config/database.php defines pgsql connection; analytics intentionally groupBy in PHP "for database
               safety" (AdminAnalyticsController comment). No CI matrix against Postgres. SQLite-specific paths exist.
Status:        UNKNOWN — cannot be verified from this repository (no prod access, no PG test pipeline).
Severity:      INFO (unchanged).
```

### PERF-01 — Analytics aggregation in PHP
```
Audit claim:   Analytics may aggregate too much data in PHP.
Prior report:  PERF-01, MEDIUM
Validation:    AdminAnalyticsController::revenue loads ALL booked/completed trips (select budget,start_date -> get())
               and groupBy in PHP; monthlyRevenue recomputes full-table materialization per request; endpoint is
               permission-gated (view analytics), admin-only, and NOT cached.
  Expected volume: unknown (dev DB small); admin-triggered, not attacker-reachable.
Status:        CONFIRMED as a scaling issue; severity tempered by admin-only access.
Severity:      LOW (prev MEDIUM). Reason: unauthenticated/attacker-unreachable, volume unknown, no availability impact
               to end users. Still worth fixing via SQL aggregation + cache.
```

### PERF-02 — Agency listing pagination
```
Audit claim:   Agency listing may need pagination.
Prior report:  PERF-02, LOW
Validation:    AgencyAssignmentController::index → AgencyAssignment::where(agency_user_id)->with(customer, trips)->get()
               — no pagination, no limit. Per-agency row counts expected small; N+1 avoided (eager loads).
Status:        CONFIRMED (minor)
Severity:      LOW (unchanged).
```

### API-01 — Response envelope inconsistency
```
Audit claim:   API response envelope inconsistent.
Prior report:  API-01, MEDIUM
Validation:    Inventory of actual shapes:
               - {success,message,data}: TripController, CheckoutController, ContactController, SiteSettingsController…
               - {message,data}: NotificationController, SurveyController, ConciergeController…
               - {data}: AgencyRequestController, AgencyAssignmentController, AdminAgencyController…
               - raw resource: AdminUserController (UserResource), AdminHotelController (JsonResource)…
               - error: unified ApiExceptionHandler shape, but controller-level ownership errors mix 403/404/200
               (e.g. TripController 404 vs MapController 200 with data vs policies 403).
Status:        CONFIRMED (contract friction; no security impact)
Severity:      LOW (prev MEDIUM). Reason: no exploit impact; consumer-side integration cost only.
```

### PROD-01 — Production readiness items
```
| Item | Validation | Status |
|---|---|---|
| APP_DEBUG | .env APP_DEBUG=true; local env — prod value not verifiable | NOT VERIFIED (must be false in prod) |
| CORS | wildcard default (SEC-06) | NOT READY |
| Queue | QUEUE_CONNECTION=database; worker deployment not verifiable | UNKNOWN (worker mandatory for fulfillment) |
| Scheduler | none registered | NOT READY |
| Telescope | config default enabled=true; TELESCOPE_ENABLED unset; gate = empty email list | NOT READY (disable outside local) |
| Cache | database store; tag-based paths inert | UNKNOWN (Redis recommended for locks at scale) |
| Storage | local/public disk; no S3 config | NOT VERIFIED |
| HTTPS | not verifiable from repo | UNKNOWN |
| Health checks | /up route registered | VERIFIED READY |
| External timeouts | SEC-07 | NOT READY |
| Logging | log stack; sensitive fields excluded from Telescope | VERIFIED READY (local) |
Status: NOT READY overall (debug mode, CORS, scheduler, Telescope, queue worker evidence missing).
```

### Supplementary validated findings (in prior report, not in plan register)
```
S-EXT-1  AI enhance() prompt injection surface (GroqService::enhance) — CONFIRMED, INFO (output discarded; no
         downstream action). Prompt hardening only.
S-EXT-2  Fork version column = updated_at string (TripForkService 'source_version_id') — CONFIRMED, LOW (lineage
         misreporting; snapshot hash recommended).
S-EXT-3  AI review cache key global (no user scope) — CONFIRMED, LOW (compounds SEC-02/SEC-11; fix with ownership).
```

---

## 3. Severity Reassessment Summary

| ID | Prev | New | Reason |
|---|---|---|---|
| SEC-01 | HIGH | HIGH | unchanged |
| SEC-02 | HIGH | HIGH | unchanged |
| SEC-03 | HIGH | HIGH | unchanged |
| SEC-04 | MED | MED | unchanged (+ business decision) |
| SEC-05 | MED | MED | unchanged (gateway-payload uncertainty noted) |
| SEC-06 | MED | LOW | bearer-token auth eliminates cookie-CSRF path; wildcard = hardening gap only |
| SEC-07 | MED | MED | unchanged |
| SEC-08 (checkout) | LOW | MED | adds external gateway cost + idempotency gap, not just DB spam |
| SEC-09 | LOW | MED | unbounded accumulation + late-fulfillable intents |
| SEC-10 | MED | MED | unchanged (+ business decision) |
| SEC-11 | LOW | LOW | unchanged |
| SEC-12 | LOW | LOW | unchanged |
| DB-01 | LOW | FALSE POSITIVE | uniqueness enforced via payments.paymob_transaction_id UNIQUE |
| DB-02 | LOW | LOW | app-level protection exists; DB constraint = optional hardening |
| DB-03 | INFO | INFO/UNKNOWN | unverifiable from repo |
| PERF-01 | MED | LOW | admin-only, unauthenticated-unreachable, volume unknown |
| PERF-02 | LOW | LOW | unchanged |
| API-01 | MED | LOW | contract friction only, no exploit impact |
| PROD-01 | — | NOT READY | multi-item |

Net: 0 CRITICAL, 3 HIGH, 5 MEDIUM, 7 LOW, 1 INFO, 1 FALSE POSITIVE (DB-01), 1 UNKNOWN (DB-03),
1 cross-cutting NOT READY (PROD-01), 3 supplementary LOW/INFO.

---

## 4. False Positive Log

- **DB-01 — Order reference uniqueness**: reference is persisted only as payments.paymob_transaction_id with a UNIQUE constraint; webhook lookups hit that column. No DB change needed. (The prior report's suggestion of a `reference_id` column did not match the actual schema.)

---

## 5. Dependency Analysis

```
SEC-01 (block enforcement)              — independent; blocks nothing
SEC-02 (IDOR guards)                   — independent; prerequisites: none; blocks SEC-04 UX clarity
SEC-03 (public endpoint abuse)         — independent; overlaps SEC-12 (map backfill); blocks PROD-01 cost risk
SEC-04 (fork authz)                    — DEPENDS ON business decision #1 (fork policy) → blocks fork tests + fulfillment re-check
SEC-05 (payment data)                  — DEPENDS ON business decision #4 (retention) + gateway payload fixture from prod
SEC-06 (CORS config)                   — independent; prerequisite for PROD-01 launch
SEC-07 (timeouts)                      — independent; small; can parallel with everything
SEC-08 (checkout throttle+idempotency) — independent; partial overlap with SEC-09 (expiry job)
SEC-09 (order expiry)                  — DEPENDS ON business decision #3 (expiry window) + scheduler infra (PROD-01)
SEC-10 (subscription model)            — DEPENDS ON business decision #2 → blocks DB-02 and quota-logic changes
SEC-11 (quota on cache hit)            — independent; interacts with SEC-02 (ownership) — do after SEC-02
SEC-12 (map GET side effect)           — independent; do together with SEC-03 mitigation
DB-02 (subscription constraint)        — DEPENDS ON SEC-10 decision; requires migration
DB-03 (Postgres CI)                    — independent; infra; requires CI environment
PERF-01/PERF-02                        — independent
API-01 (envelope standard)             — independent; contract decision; touch-all — LAST
PROD-01 (debug/telescope/queue/sched)  — independent items; launch gate
```

Graph backbone:
```
business decisions (1-6)
  ├─ SEC-04 ─► fork tests ─► fork fulfillment re-check
  ├─ SEC-10 ─► DB-02 ─► quota logic
  ├─ SEC-05 ─► payment retention tests
  ├─ SEC-09 ─► scheduler (PROD-01)
  └─ SEC-12 ─► SEC-03 mitigation
independent track: SEC-01 → SEC-02 → SEC-11 → SEC-06 → SEC-07 → SEC-08 → PERF-* → API-01
launch gate: PROD-01
```

---

## 6. Validated Finding Summary (for final risk register)

| Plan ID | Prior ID | Status | New Severity |
|---|---|---|---|
| SEC-01 | SEC-01 | CONFIRMED | HIGH |
| SEC-02 | SEC-02 | CONFIRMED | HIGH |
| SEC-03 | SEC-03 | CONFIRMED | HIGH |
| SEC-04 | SEC-04 | CONFIRMED + BUSINESS DECISION | MEDIUM |
| SEC-05 | SEC-05 | PARTIALLY CONFIRMED + BUSINESS DECISION | MEDIUM |
| SEC-06 | SEC-06 | CONFIRMED | LOW |
| SEC-07 | SEC-07 | CONFIRMED | MEDIUM |
| SEC-08 | SEC-08/SEC-09 | CONFIRMED (+ contacts LOW) | MEDIUM (checkout) |
| SEC-09 | BIZ-01 part | CONFIRMED + BUSINESS DECISION | MEDIUM |
| SEC-10 | BIZ-01 | CONFIRMED + BUSINESS DECISION | MEDIUM |
| SEC-11 | BIZ-04 | CONFIRMED | LOW |
| SEC-12 | BIZ-03 | CONFIRMED | LOW |
| DB-01 | DB-01 | FALSE POSITIVE | — |
| DB-02 | DB-01 part | PARTIALLY CONFIRMED | LOW |
| DB-03 | DB-02 | UNKNOWN | INFO |
| PERF-01 | PERF-01 | CONFIRMED | LOW |
| PERF-02 | PERF-02 | CONFIRMED | LOW |
| API-01 | API-01 | CONFIRMED | LOW |
| PROD-01 | production | NOT READY (multi-item) | — |
| S-EXT-1..3 | SEC-10/BIZ-02/BIZ-04 | CONFIRMED | INFO/LOW |

See `remediation-roadmap.md`, `business-decision-register.md`, `security-regression-test-plan.md` for the implementation plan, decision register, and test requirements.
