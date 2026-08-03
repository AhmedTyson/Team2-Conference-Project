# Sprint 1 Task List: User Interactions (Community)

## Scope & Preconditions
This sprint covers **Task Cards 26–28** from the core PRD requirements. 
It implements polymorphic favorites and reviews against **real, already-seeded local rows** (Hotels, Restaurants, Flights, Attractions) using standard auto-increment IDs. 

**Out of Scope for Sprint 1:**
- NO External APIs (RapidAPI / OpenFlights).
- NO Shadow Modeling logic.
- NO `external_id` or `source` columns.
These are deferred to Sprint 2.

## Phase 1: Verify Database Foundation

### Task 1: Verify Polymorphic Schemas
**Description:** Verify that the existing database migrations correctly support polymorphic relations for favorites and reviews without introducing new columns or naming conflicts.
**Acceptance criteria:**
- [x] Confirm `favourites` table exists with `favorable_type` and `favorable_id`.
- [x] Confirm `reviews` table exists with `reviewable_type` and `reviewable_id`.
- [x] Confirm `Hotel`, `Restaurant`, `Attraction`, and `Destination` models have existing `morphMany` relationships for `favourites()` and `reviews()`.
- [x] **Add** `reviews()` relation to the `Flight` model (it does not exist yet). *Product Decision: Flights are reviewable but NOT favouritable (they are snapshots, not catalog items).*
**Files likely touched:**
- `database/migrations/*_create_favourites_table.php` (Read-only check)
- `database/migrations/*_create_reviews_table.php` (Read-only check)
- `app/Models/Flight.php` (Add `reviews()` method)
**Estimated scope:** Extra Small

## Phase 2: API Endpoints (Controllers & Requests)

### Task 2: Implement InteractionController
**Description:** Consolidate the endpoints for adding/removing favorites and reviews into a single controller for simplicity.
**Acceptance criteria:**
- [x] Create `InteractionController`.
- [x] Add `POST /api/v1/favourites/{type}/{id}` mapped to controller method (e.g., `toggleFavourite`).
- [x] Add `POST /api/v1/reviews/{type}/{id}` mapped to controller method (e.g., `storeReview`).
- [x] Add `DELETE /api/v1/reviews/{id}` mapped to controller method (e.g., `destroyReview`).
- [x] Apply `auth:api` middleware to these routes.
- [x] Ensure interaction logic targets local DB row IDs (e.g., `Hotel::findOrFail($id)`).
- [x] **Store endpoint returns `201 Created`.**
- [x] **New review defaults to `status = pending`.**
- [x] **Delete endpoint checks `$review->user_id === auth()->id()`, returns `403 Forbidden` otherwise.**
**Files likely touched:**
- `routes/api.php`
- `app/Http/Controllers/Api/V1/InteractionController.php`
**Estimated scope:** Small

### Task 3: Validation & API Resources
**Description:** Ensure incoming data is valid and outgoing data is properly formatted.
**Acceptance criteria:**
- [x] Create `StoreReviewRequest` to validate `rating` (1-5) and `comment` (string, max 1000).
- [x] **Register explicit morph map** via `Relation::enforceMorphMap()` in `AppServiceProvider::boot()` with keys: `'hotel'`, `'restaurant'`, `'attraction'`, `'destination'`, and `'flight'` (reviews only).
- [x] Ensure `{type}` route parameter is validated strictly against the registered morph map keys.
- [x] Create `ReviewResource` and `FavouriteResource` for JSON responses.
**Files likely touched:**
- `app/Http/Requests/StoreReviewRequest.php`
- `app/Providers/AppServiceProvider.php`
- `app/Http/Resources/ReviewResource.php`
- `app/Http/Resources/FavouriteResource.php`
**Estimated scope:** Small

---

## Checkpoint: End of Sprint 1
- [ ] End-to-end test of adding a local seeded hotel to favorites.
- [ ] Validation correctly rejects invalid `{type}` parameters or out-of-bounds ratings.
- [ ] Tests written for `InteractionController` endpoints targeting local models.
- [ ] Run `php artisan test`.
- [ ] Postman testing of all 3 endpoints.
