# Backend Consolidated Audit & Remediation Status

**Repository:** `Team2-Conference-Project`
**Branch:** `main`
**Audit baseline commit:** `38b18c4`
**Remediation plan:** `docs/final/OpenCode — Backend Audit Remediation, Hardening & Verification Execution Plan.md`
**Historical audits preserved:** `docs/audits/BACKEND_AUDIT.md`, `docs/audits/frontend-backend-integration-audit.md`

> This document consolidates the remediation findings and their resolution status.
> Historical audit conclusions are preserved in the documents listed above and are not rewritten here.
> Every finding below records: original state → current state → fix → files → tests → verification → status.

---

## Repository State vs Baseline

| Item | Value |
|---|---|
| Baseline commit | `38b18c4` |
| HEAD at execution | `30b2460` (post-baseline frontend merges: Wikidata cities, theme toggler, design polish) |
| Working tree at audit time | dirty — remediation changes staged as working-tree edits, committed at end of execution |
| Dev DB | local SQLite `database/database.sqlite` |
| Production/Railway | **NOT verifiable locally** — all env-dependent verification remains open |

---

## Findings & Remediation Status

### F-1: Trip attach/detach endpoints broken (Phase 1)

- **Original state:** `POST /v1/trips/{trip}/attach/{type}` / `DELETE /v1/trips/{trip}/detach/{id}` misbehaved (invalid/duplicate/nonexistent item handling, unauthorized access).
- **Current state:** Endpoints enforce ownership via policy/ownership checks; invalid types, duplicate attaches, missing and nonexistent items return controlled responses.
- **Fix:** `app/Http/Controllers/Trips/TripController.php`.
- **Tests:** `tests/Feature/Trips/TripAttachDetachTest.php` — attach/detach success, unauthorized, invalid type, missing item, nonexistent item, duplicate attach, nonexistent relation detach.
- **Verification:** 8 tests green.
- **Status:** RESOLVED

### F-2: Trip fork route versioning (Phase 2)

- **Original state:** `/v1/trips/{trip}/fork` route ordering conflicted with literal `/v1/trips/create`; direct forking existed.
- **Current state:** Direct forking disabled by contract; deprecated shim kept at `POST /v1/trips/{trip}/fork` returning guidance; literal route wins over wildcard.
- **Fix:** `routes/api.php` (route order + shim), `app/Http/Controllers/Trips/TripController.php`.
- **Status:** RESOLVED

### F-3: Disabled fork endpoint not documented (Phase 3)

- **Original state:** Fork behavior unclear to API consumers.
- **Current state:** Route-level comment documents the deprecation and the `/v1/checkout/initiate` replacement.
- **Fix:** `routes/api.php`.
- **Status:** RESOLVED

### F-4: Agency assignment state transitions unenforced (Phase 4)

- **Original state:** Assignment could change state illegally.
- **Current state:** Service `AgencyAssignmentService` enforces legal transitions; invalid transitions rejected.
- **Fix:** `app/Services/Commerce/AgencyAssignmentService.php`, `app/Models/Commerce/AgencyAssignment.php` (enum/status usage), `app/Policies/Commerce/AgencyAssignmentPolicy.php`.
- **Tests:** `tests/Feature/Commerce/AgencyAssignmentCompletionTest.php` (9), `tests/Feature/Commerce/AgencyTest.php` (14), state-transition suite (4).
- **Verification:** all green.
- **Status:** RESOLVED

### F-5: Hotel input validation gaps (Phase 5)

- **Original state:** Hotel store/update lacked hard validation.
- **Current state:** `StoreHotelRequest` / `UpdateHotelRequest` validate fields, prices, enums, relationships.
- **Fix:** `app/Http/Requests/Catalog/StoreHotelRequest.php`, `UpdateHotelRequest.php`.
- **Tests:** `tests/Feature/Catalog/HotelTest.php` extended (+26 lines).
- **Status:** RESOLVED

### F-6: Survey input validation gaps (Phase 6)

- **Original state:** `SurveyController` validated inline; `travel_style` free text; `budget_level` unvalidated against `BudgetLevel` enum; `interests` unconstrained; stale factory values (`7000/14000/21000`).
- **Current state:** `StoreSurveyRequest`/`UpdateSurveyRequest` enforce `travel_style` max:255, `budget_level` `Rule::enum(BudgetLevel::class)`, `interests` array max:50 items max:255; controller uses `validated()`; `store()` forces `user_id = auth()->id()`; update no longer unsets `user_id`; factory uses enum values.
- **Fix:** `app/Http/Requests/System/StoreSurveyRequest.php`, `UpdateSurveyRequest.php`, `app/Http/Controllers/System/SurveyController.php`, `database/factories/System/SurveyFactory.php`.
- **Tests:** `tests/Feature/System/SurveyValidationTest.php` (10).
- **Regression:** ContactAndSettings (4), Report (6), Sprint1Integration (7).
- **Status:** RESOLVED

### F-7: Trip authorization consolidation (Phase 7)

- **Original state:** Owner/visibility checks scattered.
- **Current state:** Ownership checks centralized in `app/Models/Trips/Trip.php` + controller flows.
- **Fix:** `app/Http/Controllers/Trips/TripController.php`, `app/Models/Trips/Trip.php` (`agency_assignment_id` added to fillable for agency flow).
- **Status:** RESOLVED

### F-8: Unbounded AI generation (Phase 8)

- **Original state:** AI endpoints callable without limit.
- **Current state:** `RateLimiter::for('ai')` keyed by user id (IP fallback); default 500 requests/day/user (`AI_RATE_LIMIT_PER_DAY`); `throttle:ai` applied to `POST /v1/trips/{trip}/concierge`, `POST /enhance`, `POST /review`, `GET /review/{id}` (shared budget); 429 uses app error shape.
- **Fix:** `config/ai.php`, `app/Providers/AppServiceProvider.php`, `routes/api.php`.
- **Tests:** `tests/Feature/Trips/AiRateLimitTest.php` (4: limit enforcement, 429 shape, per-user isolation, cross-endpoint sharing); `AiFeatureTest` regression (4).
- **Status:** RESOLVED (tunable via env)

### F-9: Role model mass-assignment exposed (Phase 9)

- **Original state:** Spatie `Role` parent uses `guarded = []`; app Role inherited unprotected.
- **Current state:** `app/Models/Account/Role.php` declares `protected $fillable = ['name', 'guard_name'];`.
- **Tests:** `tests/Feature/Account/RoleMassAssignmentTest.php` (4); `UserTest` regression (4).
- **Status:** RESOLVED

### F-10: Agency endpoints incomplete (Phase 10)

- **Original state:** No admin pending list, no customer assignment list, no cancel flow.
- **Current state:** `GET /v1/admin/agency-requests` (role admin|super_admin, `getPending()` eager customer+agency); `GET /v1/agency-assignments` (own records); `POST /v1/agency-assignments/{assignment}/cancel` (owner policy; REQUESTED|ADMIN_APPROVED only, else 409); repository `getPending()`/`getForCustomer()`.
- **Fix:** `app/Http/Controllers/Commerce/AdminAgencyController.php`, `AgencyAssignmentController.php`, `app/Services/Commerce/AgencyAssignmentService.php`, `app/Repositories/Commerce/AgencyAssignmentRepository.php`, interface, routes.
- **Tests:** `tests/Feature/Commerce/AgencyAssignmentCompletionTest.php` (9) + AgencyTest (14) + StateTransition (4) regression.
- **Status:** RESOLVED

### F-11: Soft-delete migration strategy broken (Phase 11)

- **Original state:** Create migrations edited in place (commit `4fd3095`) adding `$table->softDeletes()`; 10 tables claimed soft-deletable but `ai_recommendations` lacked `deleted_at` and `AiRecommendation` lacked `SoftDeletes` — audit list stale. Existing databases could not apply migrations without duplicate-column failures.
- **Current state:** Create migrations restored to historical schema intent (`softDeletes()` stripped from all 10); new additive migration `2026_08_10_000000_add_deleted_at_to_soft_delete_tables.php` with `Schema::hasTable`/`hasColumn` guards; plural table names (`flights`, `attractions`) used; `down()` intentionally empty with docblock explaining manual remediation.
- **Fix:** 10 create migrations + 1 new migration.
- **Verification:** Scenario A/B on fresh DB — all 10 tables have `deleted_at`, `ai_recommendations` does not; Scenario C on disposable DB — re-run heals only missing columns; dev DB migrated in place without failure.
- **Status:** RESOLVED

### F-12: Migration path verification (Phase 12)

- **Original state:** Fresh vs existing DB migration behavior unverified.
- **Current state:** Both paths verified (see F-11 verification) on SQLite.
- **Status:** RESOLVED (SQLite; production DB engine NOT verified)

### F-13: No admin visibility into trashed records (Phase 13)

- **Original state:** 7 repository/service-driven admin resources had no trashed view; Hotel/Destination admin controllers used inline pagination without trashed support.
- **Current state:** `?trashed=1` supported on admin indexes for Category, Country, Destination, Hotel, Restaurant, Attraction, Flight, Trip, Review; default hides trashed; `onlyTrashed()` only on admin routes; public endpoints never expose trashed rows.
- **Fix:** 7 repo interfaces + repos (`getForAdmin(bool $trashed = false)` / `getAll(bool $trashed = false)`), 7 services, 7 controllers, Hotel/Destination inline.
- **Tests:** `tests/Feature/Catalog/AdminTrashedRecordsTest.php` (12: default hide, trashed show, per-resource, non-admin 403, public leak check, destroy soft-delete semantics, unrelated records unaffected).
- **Status:** RESOLVED

### F-14: No restore endpoints (Phase 14)

- **Original state:** Soft-deleted records unrecoverable via API.
- **Current state:** `PATCH /v1/admin/{resource}/{id}/restore` for all 9 resources (Category, Country, Destination, Hotel, Restaurant, Attraction, Flight, Trip, Review), same permission middleware as destroy; `onlyTrashed()->findOrFail()->restore()`; 404 for active/nonexistent ids.
- **Fix:** 9 admin controllers + `routes/api.php`.
- **Tests:** `tests/Feature/Catalog/AdminRestoreTest.php` (8: authorized restore, trashed-list update, all resources, trips+reviews, unauthorized 403, active 404, nonexistent 404, public re-listing).
- **Status:** RESOLVED

### F-15: Soft delete vs unique constraints (Phase 15, investigation)

- **Original state:** Unknown whether soft-deleted rows occupy unique values.
- **Finding:** No unique constraints exist on any of the 10 soft-deletable tables (`surveys.user_id` is a plain FK, not unique). Unique fields exist only on non-soft-deletable tables (`users.email`, `plans.name`, `paymob_order_id`, `paymob_transaction_id`, tokens, jobs).
- **Decision:** No constraint changes made — no unique-value conflict exists.
- **Status:** CLOSED — no change needed

### F-16: Soft delete vs cascade behavior (Phase 16, investigation)

- **Original state:** Unverified semantics of parent soft-delete on children.
- **Finding:** Soft delete = `UPDATE`, never triggers DB `ON DELETE CASCADE`. Children (hotels/restaurants/attractions) of a soft-deleted destination remain in normal listings; `Destination::find` (SoftDeletes) hides the parent while children still reference it. Force-deleting a parent DOES hard-delete children via DB cascade (`destination_id` cascadeOnDelete; `category_id` nullOnDelete).
- **Decision:** Behavior documented; no code change in this phase per plan (do not silently expand scope). Tracked in risk register.
- **Status:** OPEN — documented risk; candidate follow-up

### F-17: Soft delete feature tests (Phase 17)

- **Original state:** No soft-delete behavior coverage beyond core CRUD tests.
- **Current state:** Covered: destroy() soft-deletes, normal index excludes, `?trashed=1` admin-only, restore works, restored returns to normal listings, unauthorized restore fails, repeated operations (restore active → 404), unrelated records unaffected, public endpoints never expose trashed.
- **Tests:** `AdminTrashedRecordsTest.php` (12) + `AdminRestoreTest.php` (8).
- **Status:** RESOLVED

---

## Newly Discovered Findings During Remediation

### F-18: Broken Review model namespace import (found Phase 13)

- **Original state:** `App\Models\Trips\Trips\Review` (double `Trips` segment) imported in `app/Repositories/Trips/ReviewRepository.php`, `app/Interfaces/Trips/ReviewRepositoryInterface.php`, `app/Models/Account/User.php`, `app/Http/Controllers/Trips/InteractionController.php`, `database/factories/Trips/ReviewFactory.php`. Class-load-time fatal only when repository resolved (admin review routes); latent in the rest.
- **Current state:** All imports corrected to `App\Models\Trips\Review`.
- **Fix:** 5 files.
- **Verification:** `php -l` clean; admin review routes now resolve.
- **Status:** RESOLVED

### F-19: Hotel/Destination admin controllers bypassed service layer

- **Original state:** Hotel and Destination admin indexes used inline `Model::paginate(...)` instead of repository/service; no `?trashed=1`.
- **Current state:** Inline pagination retained (project convention), trashed support added at controller level via `onlyTrashed()`.
- **Status:** RESOLVED (documented deviation)

---

## Open / Remaining Risk

| Risk | Severity | Notes |
|---|---|---|
| Production (Railway) migration not executed | Medium | Additive migration + stripped create migrations must be validated on non-SQLite prod DB before deploy |
| Trashed parent vs live children (F-16) | Low | Public listings can reference soft-deleted destinations; candidate for scoped follow-up |
| `down()` of additive soft-delete migration is empty | Info | Intentional; manual remediation documented in migration docblock |
| Baseline vs HEAD drift | Info | Post-baseline frontend merges did not touch remediated backend areas (verified by diff scope) |

---

## Verification Summary

| Check | Result |
|---|---|
| `php artisan test` (full suite) | **181 passed, 552 assertions, 0 failures** |
| Fresh DB migration (Scenario A/B) | 10/10 `deleted_at` present; `ai_recommendations` untouched |
| Existing DB migration (Scenario C) | heals only missing columns |
| Dev DB migrated in place | no duplicate-column failure |
