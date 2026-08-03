# Sprint 2 Task List: External APIs & Shadow Modeling

## ⚠️ Precondition (BLOCKER)
**Do not start this document** until `RAPIDAPI_KEY` (and `OPENFLIGHTS_KEY`) are real, working credentials in `.env`. 
This entire document is blocked until then.

## Architectural Decision: Handling External APIs & Polymorphic Relations

**The Challenge:**
Standard Laravel polymorphic relationships (`favorable`, `reviewable`) rely on linking to a local database ID. However, searching for Hotels (RapidAPI) or Flights (OpenFlights) returns external entities that do not naturally exist in our local database.

**The Solution: "Shadow Modeling" (Hybrid Approach)**
Instead of mirroring entire global databases (ETL syncing, which is slow and bloated) or fetching on-the-fly for every relation (which causes N+1 HTTP calls and slow reads), we will use **Shadow Modeling**.

1.  **Search/List:** Handled via External APIs, heavily cached using Laravel's Cache store.
2.  **Interaction (Favorite/Review/Book):** When a user interacts with an external entity (e.g., `POST /api/v1/favourites/hotel/ext_12345`), the system intercepts the request inside `InteractionController`.
3.  **Shadow Creation:** The domain service (e.g., `HotelService`) checks if `ext_12345` exists locally. If not, it fetches the details from the External API once, and persists a "Shadow Record" in the local `hotels` table.
4.  **Local Relation:** The Favorite or Review is then attached to this local Shadow Record using the standard Eloquent Polymorphic relationships implemented in Sprint 1.

**Benefits:**
*   Standard Laravel Eloquent relationships (`morphMany`, `morphedByMany`) work perfectly.
*   Zero N+1 HTTP calls when retrieving a user's profile, favorites, or reviews.
*   Database stays lean (only interacted-with entities are stored).
*   Highly resilient (if external API goes down, users can still see their favorites/reviews).

---

## Phase 1: Database Foundation

### Task 1: Update Domain Schemas for Shadow Modeling
**Description:** Update the `hotels`, `restaurants`, and `flights` migrations to support storing external API entities locally.
**Acceptance criteria:**
- [ ] Add `external_id` (string, indexed) to `hotels`, `restaurants`, `flights`.
- [ ] Add `source` (ENUM('manual', 'rapidapi', 'openflights')) to `hotels`, `restaurants`, `flights`.
- [ ] Make non-essential columns nullable, as shadow models only need essential data for display.
- [ ] Add unique constraints to the combination of `(source, external_id)`.
**Files likely touched:**
- `database/migrations/*_create_hotels_table.php`
- `database/migrations/*_create_restaurants_table.php`
- `database/migrations/*_create_flights_table.php`
**Estimated scope:** Small

## Phase 2: External API Clients (Infrastructure)

### Task 2: Implement External API Clients
**Description:** Create robust HTTP clients for RapidAPI (Hotels/Restaurants) and OpenFlights. *(Note: OpenFlightsClient is explicitly in-scope for Phase B to handle live flight searches and shadow-model resolution, augmenting the existing local Fixtures).*
**Acceptance criteria:**
- [ ] Create `RapidApiHotelClient` with `getById($externalId)` method.
- [ ] Create `RapidApiRestaurantClient` with `getById($externalId)` method.
- [ ] Create `OpenFlightsClient` with `getById($externalId)` method.
- [ ] Use Laravel `Http::withHeaders()` to inject API keys from `.env`.
- [ ] Implement timeout and retry logic (e.g., `Http::timeout(10)->retry(3, 100)`).
- [ ] Throw custom exceptions on API failures.
**Files likely touched:**
- `app/Infrastructure/External/RapidApiHotelClient.php`
- `app/Infrastructure/External/RapidApiRestaurantClient.php`
- `app/Infrastructure/External/OpenFlightsClient.php`
**Estimated scope:** Medium

## Phase 3: Shadow Modeling & Business Logic

### Task 3: Implement Shadow Resolution in Services
**Description:** Create the logic that checks the local DB for an entity by external ID, and if not found, fetches it from the API and saves it locally. This logic will be called *before* the `InteractionController` methods execute their standard attachment.
**Acceptance criteria:**
- [ ] Update `HotelService` with `resolveEntity($externalId, $source = 'rapidapi')`: `Hotel::where('external_id', $externalId)->where('source', $source)->first()`.
- [ ] If not found, use `RapidApiHotelClient->getById()`, map the response, and run `Hotel::create()`.
- [ ] Repeat pattern for `RestaurantService`.
- [ ] Repeat pattern for `FlightService`.
- [ ] Update `InteractionController` to optionally detect external ID payloads (e.g., passing a `source` query param or payload field) and route through the `resolveEntity` service before attaching.
**Files likely touched:**
- `app/Services/HotelService.php`
- `app/Services/RestaurantService.php`
- `app/Services/FlightService.php`
- `app/Http/Controllers/Api/V1/InteractionController.php`
**Estimated scope:** Medium

---

## Checkpoint: End of Sprint 2
- [ ] External API keys configured and working in `.env`.
- [ ] Tests written for `HotelService::resolveEntity` mocking the External API clients.
- [ ] End-to-end test of adding a *new* hotel from RapidAPI to favorites (verifies shadow model creation).
- [ ] Run `php artisan test`.
- [ ] Postman testing of all endpoints passing with external ID payloads.
