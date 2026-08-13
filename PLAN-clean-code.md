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

## Phase 4 — Dead code removal
- **F8.9** Drop dead `??` fallbacks in `GenerateReportExcelService:247,256` (never fire; normalize callers).
- **F8.10** Remove duplicated `->unique('name')->values()` chain (OpenStreetService:120-123).
- **F8.19** Delete commented-out GroqService throws (3×).
- **F8.20** Drop dead `status` field from WebhookService return arrays (PaymobWebhookController only uses 'success' and 'message').
- **F8.21** Keep stub `TripController::fork()` + `PlanService::subscribe/upgrade` aborts (intentional deprecation shims with helpful error messages).

**Audit correction**: `activeUsers`, `returningUsersTrend`, `activeUsersTrend` appear unused but are actually used by `kpis()` and `buildReportData()`. Restored these methods.

## Phase 5 — Controller Hygiene
- **F2.10** Remove unused `AuthorizesRequests` trait from `AIController` and `MapController` (no `authorize()` calls).
- **F2.11** Constructor-promote `GroqService` and `AiUsageService` in `AIController` (remove `app()` service-locator).
- **F2.12** Inline `$request->validate()` → FormRequests in `TripController::attach`, `AIController::enhance`, `ConciergeController`.
- **F2.13** Wrap `ConciergeService::ask` with generic RuntimeException like `GroqService` (try-catch + Log::error + rethrow).

## Phase 6 — Magic strings → enums/config
- **F1.21** `CacheKeys` constant class (trip prefix, cache keys for weather, concierge, etc.).
- **F1.22** `CheckoutType` enum (pending, paid, failed, refunded).
- **F1.23** Currency codes (USD, EUR, AED, SAR) → config/enums.
- **F1.24** Budget tiers (Economy, Standard, Premium) → enum.
- **F1.25** HTTP status code constants (200, 201, 400, 401, 403, 404, 500) → `ApiResponse` class.

## Phase 7 — Naming fixes
- **F3.4** Fix typos in method names (e.g., `getTripContext` vs `get_trips_context`).
- **F3.5** Fix Arabic comments (translate to English).
- **F3.6** Normalize snake_case/PascalCase inconsistencies across services.

## Phase 8 — Dead code removal (continued)
- **F8.22** Remove Excel fallback logic (Excel is required dependency, no fallback needed).
- **F8.23** Remove duplicate `->unique()` chains (already done in F8.10).
- **F8.24** Remove `returningUsers` methods (unused).
- **F8.25** Remove commented-out throw blocks (already done in F8.19).
- **F8.26** Remove stub endpoints (already done in F8.21).
- **F8.27** Remove dead `status` field from webhook responses (already done in F8.20).

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