# Task List: Community Interactions & External APIs

## Phase 1: Database Foundation

### Task 1: Update Domain Schemas for Shadow Modeling
**Description:** Update the `hotels`, `restaurants`, and `flights` migrations to support storing external API entities locally.
**Acceptance criteria:**
- [ ] Add `external_id` (string, indexed) to `hotels`, `restaurants`, `flights`.
- [ ] Add `provider` (string) to `hotels`, `restaurants`, `flights` (e.g., 'rapidapi', 'openflights').
- [ ] Make non-essential columns nullable, as shadow models only need essential data for display.
- [ ] Add unique constraints to combination of `(provider, external_id)`.
**Files likely touched:**
- `database/migrations/xxxx_create_hotels_table.php`
- `database/migrations/xxxx_create_restaurants_table.php`
- `database/migrations/xxxx_create_flights_table.php`
**Estimated scope:** Small

### Task 2: Create Favourites & Reviews Schemas
**Description:** Create polymorphic tables for user favorites and user reviews.
**Acceptance criteria:**
- [ ] Create `favourites` table with `user_id`, `favouritable_type`, `favouritable_id`.
- [ ] Create `reviews` table with `user_id`, `reviewable_type`, `reviewable_id`, `rating`, `comment`, `status` (pending/approved).
- [ ] Add foreign key constraint for `user_id`.
**Files likely touched:**
- `database/migrations/xxxx_create_favourites_table.php`
- `database/migrations/xxxx_create_reviews_table.php`
- `app/Models/Favourite.php`
- `app/Models/Review.php`
- `app/Models/User.php` (Add HasMany relationships)
**Estimated scope:** Small

## Phase 2: External API Clients (Infrastructure)

### Task 3: Implement External API Clients
**Description:** Create robust HTTP clients for RapidAPI (Hotels/Restaurants) and OpenFlights.
**Acceptance criteria:**
- [ ] Create `RapidApiHotelClient` with `getById($externalId)` method.
- [ ] Create `RapidApiRestaurantClient` with `getById($externalId)` method.
- [ ] Use Laravel `Http::withHeaders()` to inject API keys from `.env`.
- [ ] Implement timeout and retry logic (e.g., `Http::timeout(10)->retry(3, 100)`).
- [ ] Throw custom exceptions on API failures.
**Files likely touched:**
- `app/Infrastructure/External/RapidApiHotelClient.php`
- `app/Infrastructure/External/RapidApiRestaurantClient.php`
**Estimated scope:** Medium

## Phase 3: Shadow Modeling & Business Logic

### Task 4: Implement Shadow Resolution in Services
**Description:** Create the logic that checks the local DB for an entity, and if not found, fetches it from the API and saves it locally.
**Acceptance criteria:**
- [ ] Update `HotelService` with `resolveEntity($externalId)`: `Hotel::where('external_id', $externalId)->first()`.
- [ ] If not found, use `RapidApiHotelClient->getById()`, map the response, and run `Hotel::create()`.
- [ ] Repeat pattern for `RestaurantService`.
**Files likely touched:**
- `app/Services/HotelService.php`
- `app/Services/RestaurantService.php`
**Estimated scope:** Medium

### Task 5: Implement Interaction Services
**Description:** Create the core business logic for handling favorites and reviews.
**Acceptance criteria:**
- [ ] Create `InteractionService` (or `FavouriteService`/`ReviewService`).
- [ ] Method `toggleFavourite(User $user, string $type, string $externalId)`: Resolves the shadow model, then toggles the polymorphic relation.
- [ ] Method `addReview(User $user, string $type, string $externalId, array $data)`: Resolves shadow model, creates a pending review.
- [ ] Method `deleteReview(User $user, int $reviewId)`: Ensures ownership before deleting.
**Files likely touched:**
- `app/Services/InteractionService.php`
**Estimated scope:** Medium

## Phase 4: API Endpoints (Controllers)

### Task 6: Implement Interaction Controllers
**Description:** Wire up the API endpoints for favorites and reviews.
**Acceptance criteria:**
- [ ] Create `InteractionController`.
- [ ] Add `POST /api/v1/favourites/{type}/{id}` mapped to controller method.
- [ ] Add `POST /api/v1/reviews/{type}/{id}` mapped to controller method.
- [ ] Add `DELETE /api/v1/reviews/{id}` mapped to controller method.
- [ ] Apply `auth:api` middleware to these routes.
**Files likely touched:**
- `routes/api.php`
- `app/Http/Controllers/Api/V1/InteractionController.php`
**Estimated scope:** Small

### Task 7: Validation & API Resources
**Description:** Ensure incoming data is valid and outgoing data is properly formatted.
**Acceptance criteria:**
- [ ] Create `StoreReviewRequest` to validate `rating` (1-5) and `comment` (string, max 1000).
- [ ] Ensure `{type}` route parameter is validated (must be 'hotel', 'restaurant', 'flight', etc.).
- [ ] Create `ReviewResource` and `FavouriteResource` for JSON responses.
**Files likely touched:**
- `app/Http/Requests/StoreReviewRequest.php`
- `app/Http/Resources/ReviewResource.php`
**Estimated scope:** Small

---

## Checkpoint: End of Phase 4
- [ ] External API keys configured in `.env`.
- [ ] Tests written for `InteractionService` mocking the External API clients.
- [ ] End-to-end test of adding a hotel from RapidAPI to favorites (verifies shadow model creation).
- [ ] Run `php artisan test`.
- [ ] Postman testing of all 3 endpoints.
