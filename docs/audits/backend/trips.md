# Trips Domain — Guide

Laravel backend module for trip planning, AI itinerary generation, maps, reviews, favourites and trip forking. JWT-authenticated API. Vanilla-JS frontend is out of scope.

---

## 1. Endpoints

| Method | URI | Controller @ Action | Notes |
|---|---|---|---|
| GET | `api/trips` | `TripController@index` | Own trips, with user + destinations |
| POST | `api/trips` | `TripController@store` | — |
| GET | `api/trips/{trip}` | `TripController@show` | Policy `view`; loads user, destinations, itinerary items |
| PATCH | `api/trips/{trip}` | `TripController@update` | Policy `update` |
| DELETE | `api/trips/{trip}` | `TripController@destroy` | Policy `delete`; still exposes `user` relation |
| GET | `api/trips/{trip}/fork` | `TripController@fork` (via `TripController`) | — |
| POST | `api/trips/generate` | `AiTripController@generate` | Rate-limited: 10/min/user, 60/min/IP+user (`AppServiceProvider`) |
| GET | `api/trips/recommendations` | `TripController@recommendations` | — |
| GET | `api/maps/{type}/{id}` | `MapController@destination` / `trip` | Direct OSM lookup; type-limited via `utilities` guarded by `Relation::enforceMorphMap` |
| POST | `api/maps/{flightId}/directions` | `MapController`? | Flight directions (see §5) |
| GET | `api/admin/trips` | `AdminTripController@index` | `?trashed=1` for soft-deleted view |
| GET | `api/admin/trips?trashed=1` | `AdminTripController@index` | — |
| POST | `api/admin/trips` | `AdminTripController@store` | `StoreTripRequest` |
| PATCH | `api/admin/trips/{trip}` | `AdminTripController@update` | `UpdateTripRequest` |
| DELETE | `api/admin/trips/{trip}` | `AdminTripController@destroy` | Service `destroy` → repository `delete` |
| POST | `api/admin/trips/{id}/restore` | `AdminTripController@restore` | `Trip::onlyTrashed()->findOrFail($id)->restore()` |
| GET | `api/admin/reviews` | `AdminReviewController@index` | `?trashed=1` |
| POST | `api/admin/reviews/{id}/approve` | `AdminReviewController@approve` | Sets `APPROVED` |
| POST | `api/admin/reviews/{id}/reject` | `AdminReviewController@reject` | Sets `REJECTED` |
| DELETE | `api/admin/reviews/{id}` | `AdminReviewController@destroy` | — |
| POST | `api/admin/reviews/{id}/restore` | `AdminReviewController@restore` | — |
| POST | `api/reviews` | `ReviewController@store` | public, validated `rating` 1–5, `comment` ≤1000 |
| GET | `api/reviews` | `ReviewController@index` | public listing |
| DELETE | `api/reviews/{id}` | `ReviewController@destroy` | owner-only: abort 403 if `user_id !== auth id` |
| POST | `api/favourites` | `FavouriteController@store` | — |
| DELETE | `api/favourites/{favourite}` | `FavouriteController@destroy` | policy `delete` |
| GET | `api/favourites` | `FavouriteController@index` | — |
| POST | `api/attractions/{attractionId}/reviews` | fallback? | morph-type endpoints below |

Roles: user (personal trips), admin (`api/admin/*`). JWT middleware group (`auth:api`). Generate + maps endpoints are rate-limited.

## 2. Relations & Schema

- `Trip` hasMany `itineraryItems` (variant `itinerary_items`, soft-deletes), `reviews`; belongsTo `user`; belongsToMany `destinations`.
- `Review` belongsTo `User`, morphs via `reviewable` to Hotel/Restaurant/Attraction/Flight (`AppServiceProvider` morph map).
- `Favourite` morphs `favouritable` (Hotels, Restaurants, Attractions, Destinations, Flights, Users, Trips, Plans per map).
- `Enums\TripStatus`: `pending|planning|booked|completed|cancelled`.
- `Enums\ReviewStatus`: `pending|approved|rejected` (`ReviewStatus::PENDING` on create).

## 3. Flow

1. **Create trip**: `StoreTripRequest` validates; `TripService->store` → `TripRepository->create` (title, destination, dates, budget).
2. **Generate AI itinerary**: `AiTripRequest` validates `destination_country_id`, days, budget, interests[], travelers, style → `GroqService->generateAi` builds prompt, hits Groq API, caches per `get-itinerary` key.
3. **Fork**: `TripForkService->fork` duplicates trip + itinerary items, notifies original owner via `TripForkedNotification`.
4. **Maps**: `MapController->destination` GETs coordinates (or dispatches `GeocodeDestinationJob` backfill), pulls attractions via OSM; `trip` action authorizes `view`, snapshots item coordinates, requires ≥2 points, fetches OSRM directions.
5. **Interactive maps**: `InteractionController->toggleFavourite` (type-based toggle, `abort 400` flights), `storeReview` (status PENDING), `destroyReview` (owner check).

## 4. Gotchas (fixes)

- **Field-name mismatch (AI)**: `AiTripRequest` validates `number_of_days` / `number_of_travelers` but `GroqService` reads `no_of_days` / `no_of_travelers` (lines 97–106) and tests send `number_of_days` (AiFeatureTest:74). Prompt receives `null` → empty "Days:"/"Travelers:" sections; cache key built from `no_of_*` becomes near-constant. **Fix**: rename reads to `number_of_*` (or update validation/tests). HIGH.
- **Policy-visible relations** omitted on show (user, destinations, items) — `TripController@show` returns only `TripResource`.
- **blank authorization**: `ApiResponse`, requests like `AiTripRequest`, `UpdateTripRequest`, `StoreReviewRequest` all `authorize() true` — JWT middleware handles auth at route level, not per-method.
- **Add `import Plan`** if using `plan` type in morph map already mapped.
- OSM queries are direct to live provider — no local caching on the API side; `GeocodeDestinationJob` is the only backfill.
- `MapController->getAttractionsWithAI` lives on OpenStreetService; maps endpoints lack catch for OSM outage → 500.

## 5. Dependencies

- `OpenStreetService` (Heart): directions via OSRM, coordinates via Nominatim, attractions via Overpass.
- `GroqService`: AI provider, cache via `Illuminate\Support\Facades\Cache`.
- `TripService`, `TripForkService`, `ReviewService`, `TripRepository`, `ReviewRepository`, `InteractionController`.

## 6. Testing

`tests/Feature/Trips/*` — `AiFeatureTest`, `AiQuotaCacheHitTest` (rate-limiter/quota), coverage around JWT-auth flows. Run: `php artisan test --filter=Trips`.

## 7. Maintenance

- Restore endpoints (`POST .../{id}/restore`) are boot-only — trip/review soft-deletes are permanent otherwise.
- Future `plan`-type favourites should reuse morph string `plan`.