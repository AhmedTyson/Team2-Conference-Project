# Clean-Code Remediation Plan — 10 Phases

Source: tech-lead audit (40 findings) + earlier security/architecture audits.
Goal: ship clean-code updates without breaking the API contract or the 266-test suite.

## Phase 1 — P0 Safety (production breakers)
- **F1.32** DB-driver-dependent SQL in `AdminAnalyticsController` (`strftime` SQLite-only vs `DATE()` MySQL-only — breaks prod MySQL). Adopt `ReportQuery::monthExpr`-style driver match.
- **F1.28** Raw `response()->json()` bypassing envelope: `WeatherController:34`, `PaymobWebhookController:25` (AIController generate is contract-fixed — leave).
- **F1.23** Explicit `use Illuminate\Support\Facades\Storage;` imports (works via global alias, but make deliberate).

## Phase 2 — Mechanical return types
- **F2.40** Add return types to 238 public methods (mechanical pass): `: JsonResponse` on controllers/handlers, `: array|int|string|null` on services/repos/queries. Grouped per directory, suite after each group.

## Phase 3 — Trip domain dedup
- **F3.5** `ConciergeController:20` raw `user_id` compare → `Gate::denies('view', $trip)` (completes TripPolicy reuse).
- **F3.6** Shared `TripBuilder` for the 3 duplicated create paths (`TripService::store`, `TripForkService:37`, `AgencyAssignmentService:107`).
- **F3.34** Replace `'pending'` literals with `TripStatus::PENDING->value` (TripController:35, TripForkService:48, ReportController:31,87, DashboardController:31-35).
- **F3.25** Rename `TripController::create()` → `creationData()` + route update.

## Phase 4 — Controller hygiene
- **F4.22** Drop unused `AuthorizesRequests` trait (AIController, MapController).
- **F4.16** Constructor-promote `GroqService` + `AiUsageService`; remove `app()` service-locator wiring.
- **F4.30** Inline `$request->validate()` → FormRequests: `TripController::attach` (item_id), `AIController::enhance` (content), `ConciergeController:24`.
- **F4.31** Wrap `ConciergeService::ask` like GroqService (generic RuntimeException + throwable rethrow).

## Phase 5 — Response & payload consistency
- **F5.11** Extract `AuthController::userPayload()` — kills 4 hand-built `['id','name','email','roles',...]` arrays.
- **F5.29** Unify `InteractionController` shapes (`{status}` vs `{data,status}`) + `abort(403)` → `ApiResponse::fail`.

## Phase 6 — Magic strings → enums/config
- **F6.35** `CacheKeys` consts + config TTLs (ai generate/review, osm, admin analytics, webhook locks).
- **F6.36** `CheckoutType` enum (`trip_fork`/`trip_package`), fake-phone/gateway fallbacks to config.
- **F6.33** Currency → `config('commerce.currency')` (default stays USD — no behavior change).
- **F6.37** Budget tiers → config map in `AgencyAssignmentService::budgetForLevel()`.

## Phase 7 — Naming & comments
- **F7.24** Typos: `$responce`, `$resturants`, "travel planer", "beginneing", "verfication notifaction", "Passwrod reset", "restu".
- **F7.27** Arabic comments → English (MapController:80,91, OpenStreetService).

## Phase 8 — Dead code removal
- **F8.9** Drop dead `??` fallbacks in `GenerateReportExcelService:247,256` (never fire; normalize callers).
- **F8.10** Remove duplicated `->unique('name')->values()` chain (OpenStreetService:120-123).
- **F8.18** Delete `ReportQuery::returningUsers()` (zero callers).
- **F8.19** Delete commented-out GroqService throws (3×).
- **F8.21** Remove stub `TripController::fork()` + `PlanService::subscribe/upgrade` aborts with routes together.
- **F8.20** Either map `WebhookService result['status']` to HTTP code or drop field — drop field (controller always 200 by design).

## Phase 9 — Reporting domain (contained refactors)
- **F9.1** `ReportQuery`: extract date-range `->when($from)->when($to)` into private helper (kills 6 dup chains).
- **F9.3** `GenerateReportExcelService`: `writeTable(writer, header, rows)` helper replacing 8 identical loops.
- **F9.2** `GenerateReportService::buildReportData` — split per-section builder methods (no new service).
- **F9.15** `AdminAnalyticsController` analytics SQL → `AdminAnalyticsQuery` (drivers handled in Phase 1).

## Phase 10 — Service/SRP divisions (batched, verify each)
- **F10.12** `GroqService::generateAi(AiTripRequest)` → params + `User` (controller adapts).
- **F10.13** Split `OpenStreetService` AI part → `AiAttractionService`.
- **F10.14** Domain exceptions (`InvalidStateTransitionException` → 409) for `AgencyAssignmentService::assertStatus`, `PlanService` aborts (only where routes remain).
- **F10.17** `TripController::attach` → `TripAttachService`.
- **F10.39** Split `AuthController` → `ProfileController` (me/updateProfile).
- **F10.8** Morph-map-driven type→relation resolver (TripController/AgencyAssignmentService/InteractionController).
- **F10.26** Canonical revenue definition (one, alias the other) — needs user product decision.

## Gate (every phase)
- `vendor/bin/pint` on touched files → clean.
- `php artisan test` full suite green (266 baseline).
- Commit per phase with conventional message; push batch at end.