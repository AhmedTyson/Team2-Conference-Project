# Task List: Trip Attach / Detach Endpoints

Spec: POST /api/v1/trips/{trip}/attach/{type} + DELETE /api/v1/trips/{trip}/detach/{id} (Owner)

## Task 0: Private branch [DONE]
- [x] Create `feature/trip-attach-detach` out of main, local-only (not pushed = hidden from collaborators)
- [x] Confirm current branch: `feature/trip-attach-detach`

## Task 1: Write failing feature tests (TDD)
**Description:** Tests for attach/detach behavior before implementation. Polymorphic pivot `trip_items` already exists; no underlying code yet, so these fail.
**Acceptance criteria:**
- [x] Owner attaches valid item (hotel/restaurant/attraction) → 200, pivot row in `trip_items`
- [x] Attach with non-owner trip → 404 (verified)
- [x] Attach with invalid `{type}` → 422
- [x] Attach with nonexistent item id → 404 (verified)
- [x] Detach removes pivot row → 200
- [x] Detach non-attached id → 404 (verified)
**Verification:**
- [x] `php artisan test --filter=TripAttachDetachTest` FAILS (red) — 6 failed / 3 passed ✓
**Files likely touched:**
- `tests/Feature/TripAttachDetachTest.php` (new)
**Estimated scope:** S (1 file)

## Task 2: Implement attach() + detach() in TripController
**Files:**
- `app\Http\Controllers\TripController.php`
**Acceptance criteria:**
- [x] `attach`: owner check (mirror `show()` 404 pattern), whitelist `{type}` ∈ hotels/restaurants/attractions/flights, attach by `{id}` from request body, de-dupe (already-attached → no duplicate)
- [x] `detach`: owner check, delete `trip_items` pivot row by `{id}` (pivot id — unambiguous for polymorphic), 404 if not found
- [x] Both return standard envelope: `{success, message, data}` + TripResource
**Verification:**
- [x] App boots: lint + tests run clean
**Dependencies:** Task 1
**Estimated scope:** M (1-2 files)

## Task 3: Register routes
**Files:**
- `routes/api.php`
**Acceptance criteria:**
- [x] `POST /api/v1/trips/{trip}/attach/{type}` → TripController@attach, `auth:api`
- [x] `DELETE /api/v1/trips/{trip}/detach/{id}` → TripController@detach, `auth:api`
**Verification:**
- [x] `php artisan route:list --path=v1/trips` shows both routes
**Dependencies:** Task 2
**Estimated scope:** S (1 file)

## Task 4: Verify (Checkpoint after 1-3)
- [x] `php artisan test` — full suite green (34 passed)
- [x] `php artisan route:list` confirms attach/detach + auth middleware
- [x] Verified via feature tests: owner 200 / non-owner 404 / invalid type 422
**Dependencies:** Tasks 1-3

## Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Branch still local-only (not pushed) ready for human review
- [ ] Human reviews before any push (pushing makes it visible to collaborators)


