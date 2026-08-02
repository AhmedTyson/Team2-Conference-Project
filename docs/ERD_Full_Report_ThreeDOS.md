# Smart AI Travel Planner — Full ERD & Architecture Review Report
**Project:** Case Study For ThreeDOS — Backend Development Council
**Date:** July 31, 2026
**Scope:** ERD Analysis, Case Study Alignment, API Integration Strategy, Database Recommendations

---

## Table of Contents

1. [Project Overview Summary](#1-project-overview-summary)
2. [ERD Entities & Attributes — As-Is](#2-erd-entities--attributes--as-is)
3. [ERD Relationships — As-Is](#3-erd-relationships--as-is)
4. [ERD Problems & Issues](#4-erd-problems--issues)
   - 4.1 [Missing Entities](#41-missing-entities)
   - 4.2 [Structural Problems](#42-structural-problems)
   - 4.3 [Naming & Consistency Issues](#43-naming--consistency-issues)
   - 4.4 [Attribute-Level Issues](#44-attribute-level-issues)
5. [Case Study vs ERD Gap Analysis](#5-case-study-vs-erd-gap-analysis)
6. [External API Integration Strategy](#6-external-api-integration-strategy)
   - 6.1 [Countries API](#61-countries-api)
   - 6.2 [Weather API](#62-weather-api)
   - 6.3 [Hotels & Flights API (RapidAPI)](#63-hotels--flights-api-rapidapi)
   - 6.4 [OpenAI API — AI Recommendations](#64-openai-api--ai-recommendations)
7. [AI Recommendations Feature — Store vs Generate](#7-ai-recommendations-feature--store-vs-generate)
8. [Recommended Final ERD — Full Schema](#8-recommended-final-erd--full-schema)
9. [Fix Priority Order](#9-fix-priority-order)
10. [Summary Checklist](#10-summary-checklist)

---

## 1. Project Overview Summary

**Smart AI Travel Planner** is a Laravel 12 + MySQL web platform allowing users to plan personalized travel experiences. The system:

- Accepts user inputs: destination, budget, trip duration, interests, travel style, number of travelers
- Generates: daily itinerary, hotel suggestions, restaurants, attractions, transportation tips, estimated costs
- Integrates: 4 external APIs (Countries, Weather, Hotels/Flights via RapidAPI, OpenAI)
- Provides: user dashboard (saved trips, favourites, booking history) + full admin panel

**Core Stack:** Laravel 12, PHP 8+, MySQL, Bootstrap 5, Eloquent ORM, RESTful APIs

---

## 2. ERD Entities & Attributes — As-Is

The following entities and attributes are visible in the submitted ERD diagram:

| Entity | Attributes Shown |
|---|---|
| **user** | ID, Name, email, password, role |
| **trips** | ID, no_of_travelers, Budget, estimate_cost, No_of_days |
| **destination** | ID, Name, description |
| **attraction** | ID, Name, description |
| **hotel** | ID, Name |
| **restaurant** | ID, Name, category, Rating |
| **review** | ID, Rating, comment, status |
| **notification** | ID, Name, status, title, type, body, data, description |
| **Favourite** | ID, note |
| **Survey** | ID, notes listed of, role |

---

## 3. ERD Relationships — As-Is

| From | Cardinality | To | Relationship Label |
|---|---|---|---|
| user | 1 : M | review | has |
| user | 1 : M | trips | has |
| user | 1 : M | Favourite | has |
| user | 1 : M | notification | receive |
| trips | M : M | destination | has |
| destination | 1 : M | attraction | has |
| destination | 1 : M | hotel | has |
| destination | M : M | restaurant | leads_to |
| Favourite | M : 1 | destination | has |
| Survey | ? : ? | user | has (no cardinality shown) |

---

## 4. ERD Problems & Issues

### 4.1 Missing Entities

The following entities are **explicitly required by the case study** but are **completely absent** from the ERD:

| Missing Entity | Where Required in Case Study |
|---|---|
| `roles` | "Role-Based Access (Admin & User)" — RBAC system |
| `countries` | Countries API data storage + Destinations Management |
| `categories` | Admin Categories Management (Beaches, Mountains, Museums, etc.) |
| `contact_messages` | Admin "Contact Messages" panel |
| `settings` | Admin "Website Settings" (logo, site name, social links) |
| `itinerary_items` | Smart Trip Planner generates "Daily Travel Itinerary" |
| `ai_recommendations` | OpenAI API — generated plans must be stored, not regenerated |
| `trip_destination` | M:N pivot with day_number for ordered daily itinerary |

---

### 4.2 Structural Problems

#### Problem 1 — `review` has no reviewable target

**Current state:** `review` is only connected to `user` (user has M reviews).

**Issue:** There is no relationship showing what the review is *about*. Is it a hotel review? A restaurant review? A destination review? An attraction review? This is undefined in the diagram.

If you build migrations from this ERD as-is, there is no `reviewable_id` to store.

**Fix — Laravel Polymorphic Relationship:**
```php
Schema::create('reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->morphs('reviewable'); // adds reviewable_id (BIGINT) + reviewable_type (VARCHAR)
    $table->unsignedTinyInteger('rating'); // 1-5
    $table->text('comment')->nullable();
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->timestamps();
});
```

This single table covers reviews for `Hotel`, `Restaurant`, `Attraction`, and `Destination` — all managed by the admin Reviews panel.

---

#### Problem 2 — `trips` ↔ `destination` is a bare M:N

**Current state:** Direct M:N between trips and destination, no pivot entity shown.

**Issue:** The case study requires a *daily itinerary* — meaning each trip visits destinations on specific days, in a specific order. A bare M:N relation cannot store day number, visit order, or estimated date.

**Fix — Add `trip_destination` junction entity:**
```sql
CREATE TABLE trip_destination (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id         BIGINT UNSIGNED NOT NULL,
    destination_id  BIGINT UNSIGNED NOT NULL,
    day_number      TINYINT UNSIGNED NOT NULL,
    visit_order     TINYINT UNSIGNED DEFAULT 1,
    estimated_date  DATE NULL,
    notes           TEXT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);
```

---

#### Problem 3 — `role` as a flat attribute on `user`

**Current state:** `role` is shown as an attribute oval on the `user` entity.

**Issue:** The case study explicitly states the database includes a `Roles` table. A flat string attribute cannot support RBAC properly — no permissions, no guards, no extensibility.

**Fix — Use `spatie/laravel-permission` package:**

Instead of building a custom `roles` table and `role_id` FK, delegate RBAC entirely to the Spatie package. It auto-generates `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, and `role_has_permissions` tables via its own migrations.

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

In the `User` model, add the `HasRoles` trait:
```php
use Spatie\Permission\Traits\HasRoles;
class User extends Authenticatable {
    use HasRoles;
}
```

Seed roles in `RoleSeeder`:
```php
use Spatie\Permission\Models\Role;
Role::create(['name' => 'admin']);
Role::create(['name' => 'customer']);
```

---

#### Problem 4 — `destination` is too flat — no country/city hierarchy

**Current state:** `destination` has only `ID`, `Name`, `description`.

**Issue:** The case study has three separate admin management sections: Countries, Cities, Attractions. The Countries API returns currency, languages, flag, capital. All of this cannot fit into a single flat `destination` entity.

**Fix — Split into `countries` + `destinations`:**
```sql
CREATE TABLE countries (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    iso_code    CHAR(2) NOT NULL UNIQUE,
    currency    VARCHAR(10),
    languages   JSON,
    flag_url    VARCHAR(255),
    capital     VARCHAR(100),
    cached_at   TIMESTAMP NULL  -- when API data was last fetched
);

CREATE TABLE destinations (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    country_id  BIGINT UNSIGNED NOT NULL,
    city_name   VARCHAR(100) NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    image       VARCHAR(255),
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);
```

---

#### Problem 5 — `hotel` FK to `destination` not explicit in attributes

**Current state:** The relationship line exists (destination has M hotels), but `hotel` has only `ID` and `Name`. No `destination_id` attribute is shown.

**Issue:** The attribute is implicit from the relationship line, but in Chen notation best practice, FKs should be traceable. More critically, `hotel` is severely underspecified — the case study requires prices, ratings, availability from the Hotels API.

**Fix — Expand `hotels` table:**
```sql
CREATE TABLE hotels (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    destination_id  BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    address         VARCHAR(255),
    price_per_night DECIMAL(10,2),
    rating          DECIMAL(3,1),
    stars           TINYINT UNSIGNED,
    availability    BOOLEAN DEFAULT TRUE,
    image           VARCHAR(255),
    source          ENUM('manual', 'rapidapi') DEFAULT 'manual',
    external_id     VARCHAR(100),  -- RapidAPI hotel ID for dedup
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations(id)
);
```

---

#### Problem 6 — `notification` missing `user_id` attribute

**Current state:** Relationship line connects user to notification (user receive M notifications), but `user_id` is not listed as an attribute on the `notification` entity.

**Issue:** The FK must exist in the migration. It is invisible in the diagram, which makes the schema incomplete for code generation.

**Fix — Notification table must include:**
```sql
CREATE TABLE notifications (
    id          CHAR(36) PRIMARY KEY,         -- UUID (Laravel default)
    user_id     BIGINT UNSIGNED NOT NULL,
    type        VARCHAR(255) NOT NULL,
    title       VARCHAR(255),
    body        TEXT,
    data        JSON,
    status      ENUM('unread', 'read') DEFAULT 'unread',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

Note: `description` attribute in the diagram overlaps with `body`. One of the two should be removed — `body` is the Laravel convention.

---

#### Problem 7 — `Survey` entity is undefined and disconnected

**Current state:** `Survey` has attributes `notes listed of` and `role`. No cardinality on the user relationship. Not connected to any other entity in the system.

**Issue:** An onboarding survey is highly relevant for an AI Travel Planner (to capture user interests, budget level, and travel style upfront). However, the current attributes (`role`, `notes listed of`) are incorrect. It also needs a clear 1:1 relationship with `user`.

**Fix — Redefine `surveys` table for AI onboarding:**
```sql
CREATE TABLE surveys (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT UNSIGNED NOT NULL UNIQUE,
    travel_style  VARCHAR(100),
    budget_level  VARCHAR(50),
    interests     JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
*(Additionally, we still need an independent `contact_messages` table for the public Contact Us form).*
- **Keep** only if a real survey/feedback feature is planned and defined.

---

### 4.3 Naming & Consistency Issues

| Issue | Location | Fix |
|---|---|---|
| Typo: `resturant` | Entity name | Rename to `restaurant` |
| Mixed casing: `no_of_travelers` vs `No_of_days` vs `Budget` | `trips` attributes | Standardize to `snake_case` throughout |
| Inconsistent relationship name: `leads_to` | destination → restaurant | Rename to `has` for consistency with all other relationships |
| Entity name capitalized inconsistently: `Favourite` vs `trips` | — | Standardize: either all lowercase or all PascalCase in the diagram |
| `notification` attribute `Name` — ambiguous | notification entity | Should be `title` (already present), remove `Name` or clarify |

---

### 4.4 Attribute-Level Issues

| Entity | Issue | Recommendation |
|---|---|---|
| `notification` | Has both `description` and `body` — likely duplicates | Keep `body` (Laravel standard), remove `description` |
| `trips` | Missing: `travel_style`, `interests`, `status`, `start_date`, `end_date` | Add all five |
| `hotel` | Only `ID` and `Name` — completely underspecified | See expanded schema in Problem 5 above |
| `restaurant` | Missing: `destination_id`, `cuisine`, `price_range`, `address` | Add all four |
| `attraction` | Missing: `category_id`, `image`, `latitude`, `longitude` | Add all four |
| `destination` | Missing: `country_id`, `city_name`, `latitude`, `longitude`, `image` | Split into `countries` + `destinations` |

---

## 5. Case Study vs ERD Gap Analysis

| Case Study Requirement | In ERD? | Status |
|---|---|---|
| User Authentication (register, login, email verify) | Partial — user entity exists, no email_verified_at | Fix |
| Role-Based Access (Admin / User) | Partial — role is flat attribute | Fix → use `spatie/laravel-permission` package |
| Smart Trip Planner (destination, budget, days, style, interests) | Partial — trips has budget/days/travelers but missing style/interests | Fix |
| Daily Travel Itinerary generation | Missing — no itinerary_items or trip_destination with day_number | Add |
| Tourist Attractions | Present — attraction entity exists | OK (expand attributes) |
| Suggested Restaurants | Present — restaurant exists | OK (expand attributes) |
| Hotels | Present — hotel exists | OK (expand attributes) |
| Transportation Tips | Missing — no storage for this | Add to itinerary_items or trips notes |
| Estimated Daily Expenses | Partial — estimate_cost on trips but not per-day | Add to itinerary_items |
| Countries API data storage | Missing — no countries table | Add |
| Weather API display | Missing — weather is live display, no storage needed | OK (no table needed) |
| Hotels & Flights API (RapidAPI) | Partial — hotel entity exists, no flights | Add flights or note it's display-only |
| AI Recommendations (OpenAI) | Missing — no ai_recommendations table | Add |
| Interactive Maps (Google Maps / Leaflet) | Missing — lat/lng missing from destination/attraction | Add coordinates |
| User Dashboard (saved trips, favourites, history) | Partial — trips + favourite exist | OK |
| Favourite Destinations | Present — Favourite entity is correct | OK |
| Reviews Management | Partial — review exists but no reviewable target | Fix → polymorphic |
| Admin — User Management | User entity supports this | OK |
| Admin — Destinations Management (Countries/Cities/Attractions) | Missing countries table | Fix |
| Admin — Categories Management | Missing categories entity entirely | Add |
| Admin — Hotels Management | Hotel entity present | OK (expand) |
| Admin — Restaurants Management | Restaurant present | OK (expand) |
| Admin — Contact Messages | Missing contact_messages entity | Add |
| User Profile/Onboarding | Survey entity exists but needs redesign | Redesign Survey |
| Admin — Analytics Dashboard | No analytics tables — likely computed, not stored | Acceptable |
| Admin — Website Settings | Missing settings table | Add |
| Notification System | Present | OK (fix user_id attribute) |

**Gap Score: 11 missing / 23 requirements = 48% coverage in current ERD**

---

## 6. External API Integration Strategy

### 6.1 Countries API

**URL:** `https://restcountries.com/`
**Auth:** None required — free and public
**Strategy:** Fetch once, cache in `countries` table for 7 days

```php
// app/Services/CountriesService.php
class CountriesService
{
    public function getCountry(string $name): array
    {
        return Cache::remember("country_{$name}", now()->addDays(7), function () use ($name) {
            $response = Http::get("https://restcountries.com/v3.1/name/{$name}");

            if ($response->failed()) {
                return [];
            }

            $data = $response->json()[0] ?? [];

            // Persist to DB for offline access
            Country::updateOrCreate(['iso_code' => $data['cca2']], [
                'name'      => $data['name']['common'],
                'currency'  => array_key_first($data['currencies'] ?? []),
                'languages' => json_encode(array_values($data['languages'] ?? [])),
                'flag_url'  => $data['flags']['png'] ?? null,
                'capital'   => $data['capital'][0] ?? null,
                'cached_at' => now(),
            ]);

            return $data;
        });
    }
}
```

**Key point:** Store in `countries` table so the app works even if the API is down.

---

### 6.2 Weather API

**URL:** `https://api.openweathermap.org/data/2.5`
**Auth:** API key required — free tier available at openweathermap.org
**Strategy:** Cache per city for 1 hour — no DB storage needed (display-only)

```php
// .env
OPENWEATHER_API_KEY=your_key_here
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

// config/services.php
'openweather' => [
    'key' => env('OPENWEATHER_API_KEY'),
    'url' => env('OPENWEATHER_BASE_URL'),
],

// app/Services/WeatherService.php
class WeatherService
{
    public function getCurrentWeather(string $city): array
    {
        return Cache::remember("weather_{$city}", now()->addHour(), function () use ($city) {
            return Http::get(config('services.openweather.url') . '/weather', [
                'q'     => $city,
                'appid' => config('services.openweather.key'),
                'units' => 'metric',
            ])->json();
        });
    }

    public function getForecast(string $city): array
    {
        return Cache::remember("forecast_{$city}", now()->addHour(), function () use ($city) {
            return Http::get(config('services.openweather.url') . '/forecast', [
                'q'     => $city,
                'appid' => config('services.openweather.key'),
                'units' => 'metric',
                'cnt'   => 5,
            ])->json();
        });
    }
}
```

---

### 6.3 Hotels & Flights API (RapidAPI)

**URL:** RapidAPI marketplace (e.g., `hotels4.p.rapidapi.com`)
**Auth:** RapidAPI key — paid, rate-limited
**Strategy:** Cache 1 hour, retry on failure, store results in `hotels` table

```php
// .env
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOTELS_HOST=hotels4.p.rapidapi.com

// app/Services/HotelService.php
class HotelService
{
    public function searchHotels(string $destination, string $checkin, string $checkout): array
    {
        $cacheKey = "hotels_{$destination}_{$checkin}_{$checkout}";

        return Cache::remember($cacheKey, now()->addHour(), function () use ($destination, $checkin, $checkout) {
            $response = Http::retry(3, 1000)
                ->withHeaders([
                    'X-RapidAPI-Key'  => config('services.rapidapi.key'),
                    'X-RapidAPI-Host' => config('services.rapidapi.hotels_host'),
                ])
                ->get('https://hotels4.p.rapidapi.com/locations/v3/search', [
                    'q'      => $destination,
                    'locale' => 'en_US',
                ]);

            if ($response->status() === 429) {
                // Rate limited — return cached DB data as fallback
                return $this->getFallbackFromDb($destination);
            }

            return $response->json();
        });
    }

    private function getFallbackFromDb(string $destination): array
    {
        return Hotel::whereHas('destination', fn($q) => $q->where('name', 'like', "%{$destination}%"))
            ->get()
            ->toArray();
    }
}
```

**Critical rules for RapidAPI:**
- Always use `Http::retry(3, 1000)` — RapidAPI has flaky responses
- Handle HTTP 429 (rate limit) explicitly — fall back to DB
- Store results in `hotels` table with `source = 'rapidapi'` and `external_id` for deduplication
- Never expose the RapidAPI key to the frontend

---

### 6.4 OpenAI API — AI Recommendations

**URL:** `https://api.openai.com/v1/chat/completions`
**Auth:** Bearer token — paid per token
**Strategy:** Generate once, store permanently in `ai_recommendations` — never regenerate the same trip

```php
// .env
OPENAI_API_KEY=sk-...

// app/Services/AiRecommendationService.php
class AiRecommendationService
{
    public function getRecommendation(Trip $trip): string
    {
        $params = [
            'destination'  => $trip->destinations->pluck('name')->implode(', '),
            'days'         => $trip->no_of_days,
            'budget'       => $trip->budget,
            'travelers'    => $trip->no_of_travelers,
            'style'        => $trip->travel_style,
            'interests'    => $trip->interests,
        ];

        $hash = hash('sha256', json_encode($params));

        // Check if already generated
        $existing = AiRecommendation::where('trip_id', $trip->id)
            ->where('prompt_hash', $hash)
            ->first();

        if ($existing) {
            return $existing->response_text;
        }

        // Build prompt
        $prompt = $this->buildPrompt($params);

        // Call API
        $response = Http::withToken(config('services.openai.key'))
            ->post('https://api.openai.com/v1/chat/completions', [
                'model'      => 'gpt-4o-mini',   // cheapest capable model
                'messages'   => [['role' => 'user', 'content' => $prompt]],
                'max_tokens' => 1500,
            ])->json();

        $text   = $response['choices'][0]['message']['content'] ?? '';
        $tokens = $response['usage']['total_tokens'] ?? 0;

        // Store — never generate again for same params
        AiRecommendation::create([
            'trip_id'       => $trip->id,
            'prompt_hash'   => $hash,
            'model_used'    => 'gpt-4o-mini',
            'prompt_text'   => $prompt,
            'response_text' => $text,
            'tokens_used'   => $tokens,
        ]);

        return $text;
    }

    private function buildPrompt(array $p): string
    {
        return "Generate a {$p['days']}-day travel plan for {$p['destination']} 
                with a budget of {$p['budget']} USD for {$p['travelers']} traveler(s). 
                Travel style: {$p['style']}. Interests: {$p['interests']}. 
                Include: daily itinerary, top attractions, restaurant recommendations, 
                hotel suggestions, transportation tips, and estimated daily expenses.";
    }
}
```

---

## 7. AI Recommendations Feature — Store vs Generate

### Decision: Always store. Never regenerate the same output.

| Factor | Generate Every Time | Store in DB |
|---|---|---|
| Cost | High — $$ per call | Near-zero after first call |
| Speed | 2–5 seconds per request | Instant DB read |
| User experience | Slow, inconsistent output | Fast, consistent output |
| Rate limits | Risk of hitting limits | No API calls on repeat visits |
| Reproducibility | Output changes each call | Same plan on every revisit |
| Offline resilience | Fails if API down | Works from DB always |

**Verdict:** Generate once on trip creation, store result, serve from DB forever.

The `prompt_hash` (SHA-256 of all input parameters) acts as a deduplication key — if the user changes any trip parameter, a new hash is computed and a new generation is triggered.

### `ai_recommendations` Table

```sql
CREATE TABLE ai_recommendations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    trip_id         BIGINT UNSIGNED NOT NULL,
    prompt_hash     VARCHAR(64) NOT NULL,
    model_used      VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
    prompt_text     TEXT NOT NULL,
    response_text   LONGTEXT NOT NULL,
    tokens_used     INT UNSIGNED DEFAULT 0,
    generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    UNIQUE KEY uq_trip_prompt (trip_id, prompt_hash)
);
```

---

## 8. Recommended Final ERD — Full Schema

All tables in snake_case, fully normalized, FK-complete.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ROLES & PERMISSIONS (managed by spatie/laravel-permission)          │
│   roles: id, name, guard_name, created_at                          │
│   permissions: id, name, guard_name, created_at                    │
│   model_has_roles / model_has_permissions / role_has_permissions    │
└─────────────────────────────────────────────────────────────────────┘
          │ M:N (via model_has_roles)
          │
┌─────────────────────────────────────────────────────────────────────┐
│ USERS                                                               │
│   id (PK), name, email (UNIQUE), email_verified_at,                │
│   password, profile_image, remember_token,                         │
│   blocked_at, created_at, updated_at                               │
└─────────────────────────────────────────────────────────────────────┘
    │ 1        │ 1        │ 1        │ 1
    │          │          │          │
    │ M        │ M        │ M        │ M
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐
│ TRIPS    │ │FAVS    │ │ REVIEWS  │ │NOTIFICATIONS │
│          │ │        │ │(polymor.)│ │              │
└──────────┘ └────────┘ └──────────┘ └──────────────┘

TRIPS
  id (PK), user_id (FK→users), title, travel_style,
  interests (JSON), no_of_travelers, budget,
  estimate_cost, no_of_days, start_date, end_date,
  status (draft|active|completed), created_at, updated_at

COUNTRIES
  id (PK), name, iso_code (UNIQUE), currency,
  languages (JSON), flag_url, capital, cached_at

DESTINATIONS
  id (PK), country_id (FK→countries), city_name, name,
  description, image, latitude, longitude, created_at, updated_at

TRIP_DESTINATION  [M:N pivot — trips ↔ destinations]
  id (PK), trip_id (FK→trips), destination_id (FK→destinations),
  day_number, visit_order, estimated_date, notes

CATEGORIES
  id (PK), name, type (attraction|restaurant), created_at, updated_at

ATTRACTIONS
  id (PK), destination_id (FK→destinations), category_id (FK→categories),
  name, description, image, latitude, longitude, created_at, updated_at

HOTELS
  id (PK), destination_id (FK→destinations), name, address,
  price_per_night, rating, stars, availability,
  image, source (manual|rapidapi), external_id, created_at, updated_at

RESTAURANTS
  id (PK), destination_id (FK→destinations), category_id (FK→categories),
  name, cuisine, price_range, rating, address, image, created_at, updated_at

FAVOURITES
  id (PK), user_id (FK→users), destination_id (FK→destinations),
  note, created_at, updated_at
  UNIQUE KEY (user_id, destination_id)

REVIEWS  [polymorphic]
  id (PK), user_id (FK→users),
  reviewable_id (BIGINT), reviewable_type (VARCHAR),
  rating (1–5), comment, status (pending|approved|rejected),
  created_at, updated_at
  INDEX (reviewable_type, reviewable_id)

NOTIFICATIONS
  id (CHAR 36 UUID PK), user_id (FK→users),
  type, title, body, data (JSON),
  status (unread|read), created_at, updated_at

AI_RECOMMENDATIONS
  id (PK), trip_id (FK→trips), prompt_hash (VARCHAR 64),
  model_used, prompt_text (TEXT), response_text (LONGTEXT),
  tokens_used, generated_at
  UNIQUE KEY (trip_id, prompt_hash)

ITINERARY_ITEMS
  id (PK), trip_id (FK→trips), day_number, item_order,
  type (attraction|hotel|restaurant|transport|note),
  entity_type (nullable), entity_id (nullable),
  time_slot, title, notes, estimated_cost,
  created_at, updated_at

CONTACT_MESSAGES
  id (PK), name, email, subject, message,
  status (new|read|replied), created_at, updated_at

SETTINGS
  id (PK), key (VARCHAR UNIQUE), value (TEXT),
  updated_at
```

---

## 9. Fix Priority Order

Execute fixes in this order to avoid cascading migration issues:

| Priority | Fix | Reason |
|---|---|---|
| 1 | Add `trip_destination` pivot with `day_number` | Core feature — daily itinerary breaks without this |
| 2 | Fix `review` → polymorphic (`reviewable_type` + `reviewable_id`) | Reviews are useless without a target entity |
| 3 | Install `spatie/laravel-permission`, publish migrations | RBAC — admin panel won't work without it |
| 4 | Split `destination` into `countries` + `destinations` | Countries API data needs a home |
| 5 | Add `categories` entity | Admin CRUD panel explicitly requires it |
| 6 | Add `contact_messages` and redesign `Survey` | Core features for AI and Admin |
| 7 | Add `settings` key-value table | Admin website settings panel |
| 8 | Add `ai_recommendations` table | Required before implementing OpenAI service |
| 9 | Add `itinerary_items` table | Required for daily plan storage |
| 10 | Expand `hotel`, `restaurant`, `attraction` attributes | API data will fail to persist without these columns |
| 11 | Add `user_id` attribute to `notifications` migration | FK is required even if diagram omits it |
| 12 | Fix naming consistency (`snake_case` everywhere, fix `resturant` typo) | Before generating migrations |

---

## 10. Summary Checklist

### ERD Issues Found

- [ ] `review` has no reviewable target → fix with polymorphic relation
- [ ] `trips` ↔ `destination` M:N has no pivot entity → add `trip_destination`
- [ ] `role` is a flat attribute → add `roles` table
- [ ] `destination` too flat → split into `countries` + `destinations`
- [ ] `hotel` underspecified → add 7 missing columns
- [ ] `restaurant` missing `destination_id`, `cuisine`, `price_range`, `address`
- [ ] `notification` missing `user_id` attribute
- [ ] `Survey` undefined + disconnected → replace with `contact_messages`
- [ ] `leads_to` relationship name inconsistent → rename to `has`
- [ ] Typo: `resturant` → `restaurant`
- [ ] Mixed casing in `trips` attributes → standardize to `snake_case`
- [ ] No `user_id` visible on notification entity

### Missing Tables

- [ ] `roles`
- [ ] `countries`
- [ ] `categories`
- [ ] `trip_destination` (pivot)
- [ ] `contact_messages`
- [ ] `settings`
- [ ] `ai_recommendations`
- [ ] `itinerary_items`

### API Integration

- [ ] Countries API → `CountriesService`, cache 7 days, store in `countries` table
- [ ] Weather API → `WeatherService`, cache 1 hour, display-only (no DB)
- [ ] RapidAPI Hotels → `HotelService`, cache 1 hour, retry 3x, handle 429
- [ ] OpenAI → `AiRecommendationService`, store result on first call, serve from DB after

### AI Feature Decision

- [x] **Store in DB** — use `prompt_hash` for dedup, never regenerate same trip
- [ ] Add `ai_recommendations` migration
- [ ] Implement `AiRecommendationService` with hash-check logic

---

*Report generated: July 31, 2026*
*Source: Case_Study_For_ThreeDOS.md + ERD diagram (erd_team2_drawio.png)*
*Coverage before fixes: ~48% of case study requirements met by current ERD*
