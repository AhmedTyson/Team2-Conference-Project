# Backend Audit — Remediation Roadmap (Dependency-Aware)

Date: 2026-08-11
Companion: `findings-validation-report.md` (evidence), `business-decision-register.md` (decisions), `security-regression-test-plan.md` (tests).
Read-only artifact — NOT executable as-is. Every phase requires the listed business decisions to be resolved first and must be implemented in a later, code-writing phase.

Design principles:
1. Fix authorization once, in one place (guard + middleware), not per-endpoint.
2. Do not build infrastructure that already exists (WebhookService idempotency, ApiExceptionHandler, permission system, existing policies).
3. Keep fixes minimal and safe — no schema re-architecture.
4. Every phase ships with its tests from `security-regression-test-plan.md`.
5. Business-logic phases are blocked by decisions, not by code.

---

## Phase 1 — Security Blockers (HIGH)

```
Phase:              1 — Security Blockers
Objective:          Close the three HIGH authorization/abuse gaps: blocked-user enforcement, trip BOLA, public expensive-endpoint abuse.
Findings addressed: SEC-01, SEC-02, SEC-03, SEC-12 (map backfill), S-EXT-3 (AI review cache scoping)
Dependencies:       none (independent of all decisions)
Files/components affected:
  - app/Http/Controllers/Account/AuthController.php (login/refresh guards)
  - app/Http/Middleware/ (new AccountStatus middleware OR extension of JWT guard)
  - app/Http/Controllers/Trips/AIController.php (review ownership)
  - app/Http/Controllers/Trips/MapController.php (trip ownership; destination backfill)
  - app/Services/Catalog/Fixtures/OpenStreetService.php (Nominatim timeout)
  - config/auth.php / config/jwt.php (guard-level account status hook)
  - app/Http/Kernel.php or bootstrap/app.php (middleware registration)
  - routes/api.php (auth+throttle on maps/destination; ownership scope)
  - app/Http/Controllers/Trips/TripController.php (show/attach/detach — already correct; keep as reference pattern)
Database changes:   none
Configuration changes: none (middleware registration only)
Security impact:    HIGH→closed (blocked accounts neutralized; private trips stop leaking; public abuse surface capped)
Business impact:    none negative — enforces rules already implied by admin block UI and trip privacy
Tests required:     R1, R2, R3, R4, R5, R8 (from test plan)
Regression risks:   none (guards only tighten access; no data shape change)
Implementation order:
  1. AccountStatus middleware + login/refresh guard (SEC-01)
  2. Trip ownership guard on review/trip-map + AI cache scoped by user (SEC-02, S-EXT-3)
  3. Throttle + auth decisions on maps/destination; move geocode backfill out of GET (SEC-03, SEC-12)
  4. Nominatim timeout (SEC-07 partial, cheap while touching service)
  5. Tests R1-R5, R8
Verification criteria: all Phase-1 tests green; blocked user login returns 403; cross-user trip access returns 404; maps/destination limited
Definition of Done:   3 HIGH findings closed with regression tests passing
```

## Phase 2 — Payment & Sensitive Data (MEDIUM)

```
Phase:              2 — Payment & Sensitive Data
Objective:          Harden checkout + payment data handling: throttle, idempotency, PAN handling decision, order expiry.
Findings addressed: SEC-05, SEC-08, SEC-09
Dependencies:       Business decisions D1 (fork policy — adjacent), D4 (payment data retention), D5 (expiry window)
Files/components affected:
  - app/Http/Controllers/Commerce/CheckoutController.php (throttle middleware)
  - app/Http/Requests/Commerce/InitiateCheckoutRequest.php (optional client idempotency key)
  - app/Models/Commerce/Order.php (+expires_at fillable/cast)
  - database/migrations/ (add expires_at to orders; data-retention fields per D4)
  - app/Services/Commerce/WebhookService.php (retention/truncation of card_pan per D4)
  - app/Services/Commerce/CheckoutService.php (expiry validation before payment lookup)
  - new scheduled command per D5 (or Phase 3 scheduler slot)
Database changes:   orders.expires_at (nullable); retention fields per D4
Configuration changes: expiry window in config; throttle limits in route definition
Security impact:    MEDIUM→closed (payment abuse capped; stale intents unreachable; PAN retention per policy)
Business impact:    expiry window must match payment UX (decision D5); throttle must not block legitimate UX
Tests required:     R9, R10, R11 (from test plan)
Regression risks:   throttle 429s on legit retries; expiry job deleting/archiving wrong orders — validate on sandbox webhooks
Implementation order:
  1. Checkout throttle + idempotency key (SEC-08)
  2. D4 decision → PAN/payload handling change + tests
  3. D5 decision → expires_at + expiry job + late-webhook gate (SEC-09)
  4. Payment regression tests R9-R11
Verification criteria: webhook idempotency tests green; throttle enforced; expired order webhook rejected
Definition of Done:   MEDIUM payment findings closed; sandbox webhook fixture tests pass
```

## Phase 3 — Production Hardening (launch gate)

```
Phase:              3 — Production Hardening
Objective:          Make the app safe to launch: debug off, CORS pinned, Telescope gated, scheduler + queue documented, timeouts global.
Findings addressed: SEC-06, SEC-07, PROD-01 (debug, telescope, queue, scheduler, storage, https)
Dependencies:       D5 (expiry job needs scheduler); Phase 2 job introduction
Files/components affected:
  - .env.example / .env.production (APP_DEBUG=false, TELESCOPE_ENABLED=false)
  - config/cors.php (NEW — explicit allowed_origins from env)
  - config/telescope.php (gate: env-driven enable)
  - config/http-client.php (NEW — global timeout/connect_timeout/retry policy) or per-service timeouts
  - routes/console.php (scheduler registrations per D5)
  - .env.example (QUEUE_CONNECTION=redis guidance, SESSION_DRIVER, CACHE_DRIVER notes)
  - deployment docs (worker command, scheduler cron, storage disk, https termination)
Database changes:   none (config/env only)
Configuration changes: cors.php, http-client.php, telescope gate, .env.*
Security impact:    LOW hardening items closed; launch gate satisfied
Business impact:    none (no behavior change visible to users)
Tests required:     R12 (external timeouts), R13 (CORS policy)
Regression risks:   405/403 CORS errors on existing origins — verify all first-party origins are listed
Implementation order:
  1. CORS config + test (SEC-06)
  2. HTTP client global timeouts (SEC-07) + tests
  3. Debug/Telescope env gates + .env.example updates
  4. Scheduler registration (D5 jobs) + worker deployment doc
  5. Storage/HTTPS/queue verification checklist (DB-03 adjacent)
Verification criteria: production checklist green; CORS preflight for allowed origins passes, others rejected; no request exceeds global timeout
Definition of Done:   PROD-01 items closed; launch checklist documented
```

## Phase 4 — Business Logic (decision-gated)

```
Phase:              4 — Business Logic
Objective:          Align subscription, quota, and fork semantics with resolved business decisions.
Findings addressed: SEC-04, SEC-10, SEC-11
Dependencies:       Business decisions D1 (fork policy), D2 (subscription model)
Files/components affected:
  - app/Strategies/Checkout/TripForkStrategy.php + app/Services/Trips/TripForkService.php (fork policy per D1)
  - app/Listeners/FulfillOrderListener.php (subscription renew/expire behavior per D2)
  - app/Services/Commerce/PlanService.php (cancel semantics per D2)
  - app/Services/Commerce/AiUsageService.php (quota consumption on cache hit — SEC-11)
  - app/Services/Trips/GroqService.php (quota hook placement)
  - app/Http/Controllers/Trips/AIController.php (review quota/cache order — tied to SEC-02)
Database changes:   per D2 (renewal tracking fields, e.g. subscription.next_billing_at)
Configuration changes: per D1/D2 (fork visibility flag; subscription product config)
Security impact:    SEC-04 closed (fork authorization matches policy); SEC-11 quota accounting corrected
Business impact:    DIRECT — subscription revenue model, fork sharing model (primary intent of register)
Tests required:     R6, R7, R14, R15, R16
Regression risks:    quota counters change → existing user quotas may shift; fork policy change may break agency workflows — snapshot current behavior first
Implementation order:
  1. D2 resolution → subscription model change + tests
  2. D1 resolution → fork policy + tests
  3. SEC-11 quota placement + tests
Verification criteria: subscription tests green; fork policy tests green; quota metrics match plan
Definition of Done:   business findings closed per register decisions
```

## Phase 5 — Database Integrity

```
Phase:              5 — Database Integrity
Objective:          Optional defense-in-depth: subscription uniqueness constraint, PostgreSQL verification.
Findings addressed: DB-02 (optional), DB-03
Dependencies:       D2 (subscription model determines constraint shape)
Files/components affected:
  - database/migrations/ (partial unique index on subscriptions (user_id) WHERE status='active' — per D2)
  - CI workflow (Postgres job) or docs (manual PG verification)
Database changes:   optional index per D2
Configuration changes: CI matrix addition
Security impact:    none (integrity hardening)
Business impact:    none
Tests required:     R17 (subscription uniqueness), R18 (PG migration suite)
Regression risks:    index creation on existing duplicates — clean duplicates first
Implementation order:
  1. Per D2: index + migration
  2. PG CI job or documented verification
Verification criteria: index tests green; PG suite green
Definition of Done:   DB-02 closed; DB-03 resolved (verified or explicitly deferred)
```

## Phase 6 — Performance

```
Phase:              6 — Performance
Objective:          Fix the two confirmed performance findings with minimal queries.
Findings addressed: PERF-01, PERF-02
Dependencies:       none
Files/components affected:
  - app/Http/Controllers/Commerce/AdminAnalyticsController.php (SQL aggregation + caching)
  - app/Http/Controllers/Account/AgencyAssignmentController.php (pagination)
Database changes:   none
Configuration changes: none
Security impact:    none
Business impact:    none (admin-only surfaces)
Tests required:     R19 (analytics aggregation correctness), R20 (pagination)
Regression risks:   analytics numbers drift between PHP-grouping and SQL-grouping — cross-check before/after
Implementation order:
  1. SQL aggregation + response cache
  2. Agency pagination
  3. Tests
Verification criteria: analytics totals unchanged vs old method on same data; pagination returns limit+meta
Definition of Done:   PERF-01/PERF-02 closed
```

## Phase 7 — API Contract

```
Phase:              7 — API Contract
Objective:          Standardize response envelopes and error structure (consumer contract).
Findings addressed: API-01
Dependencies:       Phase 6 (touches controllers last minimizes churn)
Files/components affected:
  - app/Http/Controllers/ (envelope normalization across 44 controllers)
  - app/Exceptions/ApiExceptionHandler.php (error envelope standard)
  - app/Support/ApiResponse.php (NEW shared helper if none exists — check first)
  - API docs (if present)
Database changes:   none
Configuration changes: none
Security impact:    none
Business impact:    contract change — coordinate with frontend team; version or migrate incrementally
Tests required:     R21 (envelope schema conformance)
Regression risks:    breaking existing consumers — ship as additive field (e.g. always include success/message/data), deprecate old shape
Implementation order:
  1. Define envelope contract in one doc
  2. Shared helper
  3. Migrate controllers by surface area, test each
Verification criteria: contract conformance test green over all routes
Definition of Done:   API-01 closed
```

## Phase 8 — Final Verification

```
Phase:              8 — Final Verification
Objective:          Prove the whole suite + security posture before release.
Findings addressed: all
Dependencies:       all prior phases
Files/components affected: none (verification only)
Database changes:   none
Configuration changes: none
Security impact:    confirmation pass
Business impact:    release gate
Tests required:     full suite (181+new), all security regression tests R1-R21, route audit, production checklist
Regression risks:   n/a
Implementation order:
  1. Full suite
  2. Security regression suite
  3. Route/middleware audit re-dump
  4. Production checklist walkthrough
  5. Final risk register update
Verification criteria: all green; zero HIGH/CRITICAL open; decisions recorded
Definition of Done:   release-ready state with documented evidence
```

---

## Finding → Phase Mapping

| Finding | Status | Severity | Phase | Dependencies | Business Decision | Test Required |
|---|---|---|---|---|---|---|
| SEC-01 blocked users | CONFIRMED | HIGH | 1 | — | D6 (token behavior) | R1, R2 |
| SEC-02 trip IDOR | CONFIRMED | HIGH | 1 | — | — | R3, R4, R5 |
| SEC-03 public external abuse | CONFIRMED | HIGH | 1 | SEC-12 | — | R8 |
| SEC-04 fork authorization | CONFIRMED | MEDIUM | 4 | D1 | D1 | R6, R7 |
| SEC-05 payment data storage | PARTIALLY CONFIRMED | MEDIUM | 2 | D4 | D4 | R11 |
| SEC-06 CORS | CONFIRMED | LOW | 3 | — | — | R13 |
| SEC-07 external timeouts | CONFIRMED | MEDIUM | 1 (partial) / 3 | — | — | R12 |
| SEC-08 checkout abuse | CONFIRMED | MEDIUM | 2 | — | — | R9, R10 |
| SEC-09 pending order expiry | CONFIRMED | MEDIUM | 2 | D5 | D5 | R10 |
| SEC-10 subscription semantics | CONFIRMED | MEDIUM | 4 | D2 | D2 | R14, R15, R16 |
| SEC-11 AI quota on cache hit | CONFIRMED | LOW | 4 | SEC-02 | — | R15 |
| SEC-12 map GET side effect | CONFIRMED | LOW | 1 | — | D3 (write semantics) | R8 |
| DB-01 order reference | FALSE POSITIVE | — | none | — | — | — |
| DB-02 subscription uniqueness | PARTIALLY CONFIRMED | LOW | 5 | D2 | D2 | R17 |
| DB-03 PostgreSQL | UNKNOWN | INFO | 5 | infra | — | R18 |
| PERF-01 analytics PHP aggregation | CONFIRMED | LOW | 6 | — | — | R19 |
| PERF-02 agency pagination | CONFIRMED | LOW | 6 | — | — | R20 |
| API-01 envelope inconsistency | CONFIRMED | LOW | 7 | Phase 6 | — | R21 |
| PROD-01 production readiness | NOT READY | — | 3 | Phase 2 (jobs) | — | R12, R13 |
| S-EXT-1 AI enhance injection surface | CONFIRMED | INFO | 4 | — | — | R16 |
| S-EXT-2 fork version misreporting | CONFIRMED | LOW | 4 | D1 | D1 | R6 |
| S-EXT-3 AI review cache global key | CONFIRMED | LOW | 1 | — | — | R4 |

---

## Top 10 Validated Priorities

```
Priority: 1
Finding: SEC-01 — blocked users can authenticate and keep tokens
Why:      moderation control is a no-op; blocked abusive accounts stay active
Evidence: AuthController::login (no is_active check); no middleware/policy; setBlock only flips flag
Severity: HIGH
Business decision: D6 (token behavior on block: immediate kill vs next-request kill)
Dependency: none
Recommended phase: 1
```

```
Priority: 2
Finding: SEC-02 — trip IDOR via AI review + trip map
Why:      every private trip readable by any account; OWASP API1
Evidence: AIController::review Trip::find($id); MapController::trip route-model-bound without ownership; TripController::show correct (pattern exists)
Severity: HIGH
Business decision: none
Dependency: none
Recommended phase: 1
```

```
Priority: 3
Finding: SEC-03 — unauthenticated maps/destination triggers Nominatim+2×Overpass+OpenAI per request
Why:      cost + availability abuse; worker held 90s
Evidence: routes/api.php (no auth on /api/v1/maps/destination/{id}); OpenStreetService chain; set_time_limit(90)
Severity: HIGH
Business decision: none (auth+throttle is a security call, not business)
Dependency: SEC-12 (same file)
Recommended phase: 1
```

```
Priority: 4
Finding: SEC-08 — checkout lacks throttle and idempotency
Why:      gateway spam + DB inflation + duplicate intentions
Evidence: InitiateCheckoutRequest (exists:trips only); route [api|auth:api]; new Order/Payment per call
Severity: MEDIUM
Business decision: none (limits configurable at deployment)
Dependency: none
Recommended phase: 2
```

```
Priority: 5
Finding: SEC-10 — subscription renewal is decorative
Why:      renews_at set but never enforced; single payment grants perpetual quota resets
Evidence: FulfillOrderListener::fulfillSubscription; no scheduler/job; PlanService::cancel status-only
Severity: MEDIUM
Business decision: D2 (recurring vs one-time vs quota pack) — primary revenue decision
Dependency: D2 → blocks DB-02
Recommended phase: 4
```

```
Priority: 6
Finding: SEC-09 — pending orders never expire
Why:      unbounded accumulation; stale webhooks fulfillable forever
Evidence: no expires_at; no scheduler; webhook matches by transaction id without age gate
Severity: MEDIUM
Business decision: D5 (expiry window + late-webhook policy)
Dependency: scheduler infra (Phase 3)
Recommended phase: 2
```

```
Priority: 7
Finding: SEC-04 — fork authorization undefined
Why:      checkout accepts any trip_id; fulfillment copies private trips without ownership check; asymmetry vs package path
Evidence: TripForkStrategy::resolveProduct Trip::findOrFail; TripForkService::fulfillFork full copy
Severity: MEDIUM
Business decision: D1 (fork policy: owner-only vs public/shared) — needed before any code
Dependency: D1
Recommended phase: 4
```

```
Priority: 8
Finding: PROD-01 — debug enabled, CORS wildcard, Telescope open, no scheduler/queue evidence
Why:      launch gate; environment posture
Evidence: artisan about (Debug Mode ENABLED); config/cors.php absent (wildcard default); telescope gate empty list; routes/console.php inspire-only
Severity: HIGH (as a group, at launch time)
Business decision: none (ops)
Dependency: Phase 2 jobs (scheduler), D5
Recommended phase: 3
```

```
Priority: 9
Finding: SEC-05 — card PAN + raw webhook payload persisted unmasked
Why:      PCI scope; at-rest exposure on DB compromise
Evidence: payments.card_pan varchar(20); raw_payload json; WebhookService stores source_data.pan verbatim; payload content unverifiable locally
Severity: MEDIUM
Business decision: D4 (retention: store-masked vs drop vs encrypt) + prod webhook fixture to confirm payload
Dependency: D4
Recommended phase: 2
```

```
Priority: 10
Finding: SEC-07 — 4 of 7 external calls lack timeouts
Why:      hung upstreams stall DB queue workers
Evidence: OpenMeteo/Nominatim/OSRM no timeout; Groq/Paymob SDK defaults; no global http-client policy
Severity: MEDIUM
Business decision: none
Dependency: none
Recommended phase: 1 (partial) / 3 (global policy)
```

---

## Final Verdict

```
Previous Remediation: 20 phases completed, commit af2597d — tested green (181 tests) but left the app NOT production ready (debug on, wildcard CORS, no scheduler).
Deep Audit: 20 findings in docs/audits/2026-08-11-deep-backend-audit.md.
Validated Findings: 20 re-validated + 3 supplementary (23 total); plan register had 19 entries (DB-01a/DB-01b merged into DB-01/DB-02).
Confirmed Security Issues: 12 (3 HIGH, 5 MEDIUM, 4 LOW) + 1 false positive (DB-01) + 1 unknown (DB-03).
Confirmed Business Issues: 4 decision-required (fork policy D1, subscription model D2, map write semantics D3, payment retention D4, expiry window D5, token behavior D6 — six decisions, four of which block implementation).
Database Issues: 1 false positive (DB-01), 1 optional hardening (DB-02), 1 unverifiable (DB-03).
Performance Issues: 2 confirmed (PERF-01 analytics PHP aggregation, PERF-02 pagination), both LOW.
Production Readiness: NOT READY — debug enabled, CORS wildcard, Telescope ungated, scheduler absent, queue worker unverified.
Business Decisions Required: D1-D6 (register file) — SEC-04, SEC-09, SEC-10, SEC-05, SEC-12 implementation blocked until resolved.
Implementation Readiness: planning complete; NOT safe to start coding until D1-D6 recorded in business-decision-register.md.
```
