# Security Regression Test Plan

Date: 2026-08-11
Purpose: define the tests that MUST exist after remediation. Test definition only — nothing here is created now (read-only phase). Tests map to `security-regression-test-plan.md` IDs referenced from `findings-validation-report.md` and `remediation-roadmap.md`.

Test stack in repo: PHPUnit via `php artisan test`; existing suite = 181 tests / 552 assertions. New tests follow existing conventions (features/ dir, RefreshDatabase where schema-dependent).

---

## R1 — Blocked user cannot authenticate
- Given: user with is_active=false.
- When: POST /api/auth/login with valid credentials.
- Then: 401/403, no token issued.
- Covers: SEC-01.
- Phase: 1.

## R2 — Blocked existing JWT rejected
- Given: active user obtains JWT, then admin sets is_active=false.
- When: blocked user calls any authenticated endpoint with existing token (fresh + refresh-token path).
- Then: 401 (blacklist) or 403 (middleware) on every protected route.
- Covers: SEC-01, D6.
- Phase: 1.

## R3 — User cannot access another user's trip (show/attach/detach)
- Given: two users, user A owns trip T.
- When: user B requests GET /api/v1/trips/{T}, attach, detach.
- Then: 404 for all (matches existing correct behavior — regression lock).
- Covers: SEC-02 (control path).
- Phase: 1.

## R4 — User cannot review another user's trip (AI review)
- Given: user A owns trip T; user B authed.
- When: POST /api/v1/trips/{T}/ai-review (or route as implemented) as user B.
- Then: 404 (or 403 per policy); no Groq call; no quota deduction for B.
- Covers: SEC-02, S-EXT-3 (cache key scoping), SEC-11.
- Phase: 1.

## R5 — User cannot map another user's private trip
- Given: user A owns trip T; user B authed.
- When: GET /api/v1/maps/trip/{T} as user B.
- Then: 404; no OSRM call.
- Covers: SEC-02.
- Phase: 1.

## R6 — Fork authorization follows resolved policy (D1)
- Given: per D1 resolution (recommended: owner-only).
- When: user B initiates checkout type=trip_fork product=T (T owned by A); also: fulfillment job for the same scenario.
- Then: checkout rejected; fulfillment (queued, processed in test) does NOT copy T to B; no new trip created; no payment gateway call for invalid fork.
- Covers: SEC-04, S-EXT-2.
- Phase: 4 (blocked until D1 resolved).

## R7 — Public/shared fork follows explicit policy (D1)
- Only if D1 resolves to B/C: fork of a public/shared trip succeeds; fulfillment copies only the public scope (no hidden/private sections leak — assert notes/destinations subset per policy).
- Covers: SEC-04.
- Phase: 4.

## R8 — Maps endpoint cannot be abused without limits
- Given: unauth client.
- When: GET /api/v1/maps/destination/{id} repeated across distinct ids beyond throttle limit; also per-IP concurrency.
- Then: 429 after limit; no OpenAI call when throttled; destination GET performs no DB write (SEC-12); timeout on Nominatim enforced (no indefinite hang).
- Covers: SEC-03, SEC-12, SEC-07 (partial).
- Phase: 1.

## R9 — Checkout cannot be spammed
- Given: authed user.
- When: POST /api/v1/checkout/initiate beyond throttle limit.
- Then: 429; no additional Order/Payment rows beyond limit; no Paymob intention call beyond limit.
- Covers: SEC-08.
- Phase: 2.

## R10 — Checkout idempotency + payment webhook idempotency
- Given: client idempotency key K.
- When: POST checkout twice with K; webhook for same paymob_transaction_id delivered twice.
- Then: one Order/Payment pair per key; webhook processed once (second delivery no-op); status transitions guarded (paid → completed not overwritten to pending).
- Covers: SEC-08, SEC-09 (late-webhook gate), existing webhook idempotency (regression lock).
- Phase: 2.

## R11 — Sensitive payment data is not persisted in plaintext (per D4)
- Given: D4 resolution (recommended: encrypt raw_payload, mask PAN, retention purge).
- When: webhook processed; DB inspected.
- Then: no unmasked card_pan in DB (only masked/last4); raw_payload encrypted at rest (cast); purge job removes rows older than retention window.
- Covers: SEC-05.
- Phase: 2.

## R12 — External calls have explicit timeouts
- Given: timeouts configured (global http-client policy or per-service).
- When: unit tests assert client config: Open-Meteo, Nominatim, Overpass, OSRM, OpenAI, Groq, Paymob all have connect_timeout + timeout + retry policy defined.
- Then: every external call path config-carrying; no default-unbounded Http::get remains.
- Covers: SEC-07.
- Phase: 1 (partial) / 3 (global).

## R13 — CORS policy pinned
- Given: config/cors.php with explicit allowed origins.
- When: preflight from allowed origin vs disallowed origin.
- Then: allowed origin gets ACAO header; disallowed rejected; no wildcard origin in any env.
- Covers: SEC-06.
- Phase: 3.

## R14 — Subscription expires at renews_at (per D2)
- Given: D2 resolution (recommended: fixed-term quota pack).
- When: renews_at passes; scheduler job runs (dispatch in test).
- Then: subscription status → expired; quota consumption blocked; re-purchase path creates fresh subscription.
- Covers: SEC-10.
- Phase: 4.

## R15 — AI quota not consumed on cache hit
- Given: user with quota; same review request twice.
- When: second identical request served from cache.
- Then: quota decremented exactly once across both calls.
- Covers: SEC-11, S-EXT-3.
- Phase: 4 (after Phase 1 cache-scoping).

## R16 — AI prompt-injection output has no downstream effect (S-EXT-1)
- Given: GroqService::enhance response containing attacker-injected instruction text.
- When: response processed.
- Then: output treated as data only; no new trip/persistence side effects; stored as-is with provenance.
- Covers: S-EXT-1.
- Phase: 4.

## R17 — Subscription uniqueness (DB-02, optional)
- Given: partial unique index on subscriptions (user_id) where status='active'.
- When: second active subscription created for same user (two distinct payments).
- Then: second insert fails or listener transitions first to expired atomically — no overlapping active rows.
- Covers: DB-02.
- Phase: 5.

## R18 — PostgreSQL migration suite
- Given: CI or local PG instance.
- When: `php artisan migrate --database=pgsql` + full test suite on pgsql.
- Then: all migrations run; suite green on PG; analytics queries return identical results.
- Covers: DB-03.
- Phase: 5.

## R19 — Analytics aggregation correctness
- Given: known order fixtures.
- When: GET admin analytics (permission-gated).
- Then: totals match SQL-aggregated expectations; response cached; no full-table PHP grouping.
- Covers: PERF-01.
- Phase: 6.

## R20 — Agency listing pagination
- Given: agency with > N assignments.
- When: GET agency assignments.
- Then: returns limit rows + pagination meta; default limit sane.
- Covers: PERF-02.
- Phase: 6.

## R21 — Response envelope conformance
- Given: envelope contract doc.
- When: contract test iterates all API routes with a happy-path call (or route-level reflection where calls impractical).
- Then: every response matches {success,message,data} (or documented exception set); errors match ApiExceptionHandler shape.
- Covers: API-01.
- Phase: 7.

---

## Execution rules
1. Tests are added in the same phase as their fix — never later.
2. Existing green behavior gets regression locks (R3, R10 already-correct paths) so future refactors cannot silently reopen the gap.
3. Webhook tests use recorded Paymob fixtures (must be captured from sandbox before Phase 2 — currently missing; add fixture capture to Phase 2 setup).
4. No test below asserts on environment-dependent values (tokens, dates) — freeze time where needed.
