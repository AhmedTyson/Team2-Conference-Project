# Implementation Plan: Trip Attach / Detach Endpoints

## Overview
Add the two missing Owner-scoped trip endpoints from the API spec:
`POST /api/v1/trips/{trip}/attach/{type}` (attach hotels/restaurants to a trip) and
`DELETE /api/v1/trips/{trip}/detach/{id}` (remove an attached item).
Polymorphic pivot `trip_items` + morph relations already exist on the Trip model — only controller methods, routes, and tests are missing.

## Architecture Decisions
- **Polymorphic pivot reused:** `trip_items` (trip_id + item_type + item_id) already exists (migration `2026_08_01_180000`). Trip model already declares `hotels()`, `restaurants()`, `attractions()`, `flights()` via `morphedByMany`. No new migration/tables.
- **`{type}` whitelist:** hotels, restaurants, attractions, flights (maps 1:1 to existing morph relations). Extensible map constant in TripController.
- **`detach/{id}` = pivot row id:** polymorphic pivot rows are unique per (trip, type, item); deleting by `trip_items.id` is unambiguous without needing a type. Alternative (item id + type query param) rejected as redundant.
- **Owner enforcement in controller:** mirror existing `TripController@show` — if `$trip->user_id !== $request->user()->id` return 404 (owner check, not policy). Keeps codebase convention.
- **TDD order:** tests first (red), then controller, then routes. De-dupe attach via `wherePivot` existence check to avoid duplicate pivot rows.

## Task List

### Phase 1: Tests (fail-first)
- [ ] Task 1: `tests/Feature/TripAttachDetachTest.php` — attach/detach happy path, owner 404, invalid type 422, missing item 404, detach id 404. Run -> red.

### Phase 2: Implementation
- [ ] Task 2: `TripController::attach()` + `TripController::detach()`
- [ ] Task 3: register both routes in `routes/api.php` with `auth:api`

### Checkpoint (after 1-3)
- [ ] `php artisan test` green
- [ ] `php artisan route:list --path=v1/trips` shows attach/detach

### Phase 3: Manual verification
- [ ] Task 4: live smoke test (owner 200 / non-owner 404 / invalid type 422)

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Await human review; branch not pushed (privacy)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate attach rows | Med | Existence check before `attach()` |
| `{id}` ambiguity in detach | High | Document as pivot-row id; test asserts correct row deleted |
| Invalid `{type}` string | Med | Whitelist map → 422 validation |
| Route conflict with `show` (`{trip}`) | Low | Register attach/detach BEFORE `/v1/trips/{trip}` catch? No — Laravel matches exact path segments; `/v1/trips/{trip}/attach/{type}` is distinct depth. Verify via route:list |
| Owner leaks data | High | 404 for non-owner (same as show), not 403 |

## Open Questions
- Confirm `detach/{id}` semantics = `trip_items.id` (pivot), not the item's own id. If item id intended, detach needs `{type}` too or lookup.
- Should attach accept `{type}`-matched body (`{"id": N}`) — confirm request body shape with frontend team.

