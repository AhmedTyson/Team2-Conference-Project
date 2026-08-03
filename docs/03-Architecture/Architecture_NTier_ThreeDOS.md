# N-Tier Architecture — ThreeDOS Smart AI Travel Planner

Applies a 4-tier, **API-first** architecture to the project. Grounding sources:

- `Case_Study_For_ThreeDOS.md` — functional requirements (PRD)
- `ERD_Full_Report_ThreeDOS.md` — ERD analysis + recommended final schema
- `Modules_and_Endpoints_Architecture.md` — endpoint inventory (Modules 1–9, 59 endpoints)
- `Laravel_Models_Migrations_Team2.md` — model/migration inventory

## Tier Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Tier 1  Presentation (API/JSON)   routes/api.php + Resources │
├──────────────────────────────────────────────────────────────┤
│ Tier 2  Business / Application    Controllers → Services     │
├──────────────────────────────────────────────────────────────┤
│ Tier 3  Data Access               Eloquent Models            │
├──────────────────────────────────────────────────────────────┤
│ Tier 4  Database                  MySQL migrations + seeders │
└──────────────────────────────────────────────────────────────┘
```

Dependency rule: a tier only talks to the tier directly below it. No tier 1 → tier 3 calls.

---

## Tier 1 — Presentation (JSON API)

The client contract. JSON in/out only. No Blade for data routes.

| Piece | Current | Target |
|---|---|---|
| `routes/api.php` | missing | create; `api/v1` prefix, `Route::apiResource`, Sanctum token auth |
| `routes/web.php` | welcome only | auth pages + admin dashboard (Blade, BootstrapMade) |
| Controllers | base `Controller` only | `app/Http/Controllers/Api/V1/*` returning `JsonResponse` |
| API Resources | missing | `app/Http/Resources/*Resource` shape JSON (this is "presentation") |
| Form Requests | missing | `app/Http/Requests/*` validate inbound JSON |

### Controller → Resource mapping (from Modules doc)

| Module | Endpoints | Controller | Resource |
|---|---|---|---|
| 1 Identity/Access | 1–7 | `Auth\*` + `ProfileController` | `UserResource` |
| 2 Onboarding | 8–9 | `Api\V1\SurveyController` | `SurveyResource` |
| 3 Trip Planner | 10–14 | `Api\V1\TripController`, `BookingController` | `TripResource`, `ItineraryResource` |
| 4 Explore | 15–22 | `Api\V1\DestinationController`, `HotelController`, `RestaurantController`, `AttractionController` | `DestinationResource`, `HotelResource`, `RestaurantResource`, `AttractionResource` |
| 5 Community | 23–25 | `Api\V1\InteractionController` | `FavouriteResource`, `ReviewResource` |
| 6 AI/External | 28–29 | `Api\V1\WeatherController`, `TripController@generateItinerary` | `WeatherResource` |
| 7 Maps | 30–31 | `Api\V1\MapController` | `MapResource` |
| 8 User Dashboard | 32–34 | `Api\V1\DashboardController` | — |
| 9 Admin | 35–59 | `App\Http\Controllers\Admin\*` (web, `role:admin` guard) | Blade + `Admin/*Resource` |

---

## Tier 2 — Business / Application

Thin controllers delegate logic here. Keeps controllers clean; testable; swap providers without touching routes.

### Services to build (`app/Services/`)

| Service | Responsibility | Status |
|---|---|---|
| `Fixtures\CountryFixtureService` | mledoze countries sync | done |
| `Fixtures\HotelFixtureService` | curated hotels sync | done (blocked: live RapidAPI) |
| `Fixtures\RestaurantFixtureService` | curated restaurants sync | done (blocked: live RapidAPI) |
| `Fixtures\FlightFixtureService` | OpenFlights routes sync | done |
| `TripPlannerService` | itinerary: budget/days/travelers → days + bookings | new |
| `TripPricingService` | price calc (shared by fixtures + live sync) | extract from fixtures |
| `OpenWeatherService` | weather current + cache | new |
| `RapidApiHotelService` | live hotels (key gated) | new (blocked) |
| `RapidApiFlightService` | live flights (key gated) | new (blocked) |
| `OpenAiRecommendationService` | AI itinerary (optional) | new |

### Controllers (`app/Http/Controllers/`)

- `Api/V1/` — public + authenticated user endpoints (Modules 1–8)
- `Admin/` — web admin CRUD (Module 9), `role:admin` middleware
- Base `Controller` stays abstract; add a `BaseApiController` trait/helper for `success()`/`error()` JSON envelopes.

---

## Tier 3 — Data Access (Eloquent Models)

17 models exist, 1:1 with ERD tables. Keep Eloquent direct; Repositories only if explicitly required (overkill at this scope otherwise).

| Model | Notes |
|---|---|
| `User` | Spatie roles (`super_admin`/`admin`/`user`), `api` guard |
| `Country`, `Destination`, `Attraction`, `Category` | geo hierarchy; `capital`/`currency` nullable (done) |
| `Hotel`, `Restaurant`, `Flight` | fixture-synced |
| `Trip`, `TripDestination`, `ItineraryItem` | trip engine |
| `Review`, `Favourite` | polymorphic (`type`/`id` pattern per Module 5) |
| `Notification`, `ContactMessage`, `Survey`, `Setting` | supporting |
| `AiRecommendation` | AI results |

Relations to ensure (per ERD): `User→Trip→TripDestination→Destination`, `Trip→ItineraryItem`, `Destination→Country`, polymorphic `Favourite`/`Review` (morphTo), `Trip→Hotel/Flight/Restaurant` pivot.

---

## Tier 4 — Database

- MySQL (switch `.env` from SQLite)
- Migrations exist per table; add missing FKs/indexes per ERD recommended final schema (§8)
- Seeders: `DatabaseSeeder` + fixtures JSON + `fixtures:sync` artisan command
- Verify after migration: countries=250, hotels=53, restaurants=54, flights=500, 18 tables

---

## Apply Order (dependency: top → bottom per layer)

1. `routes/api.php` + `Api/V1` thin controllers (59 endpoints wired, empty success JSON)
2. `FormRequests` + `ApiResource` formatters
3. `app/Services/` — `TripPlannerService`, `TripPricingService` (extract), `OpenWeatherService`, OpenAI + RapidAPI stubs
4. Models: `$fillable`, casts, relations per ERD
5. `.env` MySQL, `migrate:fresh --seed`, verify counts

## Blockers

- Hotels/restaurants live sync — RapidAPI key placeholder
- Weather API key — not configured
- Official RestCountries v5 — paid; mledoze used instead
