# Research Report: External API Integration & Seeding in Laravel

This report outlines the strategy for fetching and managing external API data (as requested in the ThreeDOS case study) and how to effectively seed a Laravel database using these external sources.

## 1. Using External APIs in Laravel Seeders

Seeding from external APIs is a powerful way to populate your application with realistic data rather than `Faker` gibberish. Laravel’s `Http` facade makes this seamless.

### Strategy 1: Live Seeding (Best for Free/Unlimited APIs)
**Target:** RestCountries API
* **How:** In `CountrySeeder.php`, use `Http::get()` to fetch the live endpoint.
* **Code Example:**
```php
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use App\Models\Country;

class CountrySeeder extends Seeder
{
    public function run()
    {
        $response = Http::get('https://restcountries.com/v3.1/all');
        $countries = $response->json();

        foreach ($countries as $country) {
            Country::updateOrCreate(
                ['iso_code' => $country['cca2']],
                [
                    'name' => $country['name']['common'],
                    'capital' => $country['capital'][0] ?? null,
                    'flag_url' => $country['flags']['png'] ?? null,
                    'languages' => $country['languages'] ?? [],
                    // mapping other fields...
                ]
            );
        }
    }
}
```

### Strategy 2: Fixture Seeding (Best for Paid/Rate-Limited APIs)
**Targets:** RapidAPI (Hotels & Flights)
* **Problem:** RapidAPI charges per request or has strict rate limits. Running a seeder that hits RapidAPI every time a developer types `php artisan migrate:fresh --seed` will exhaust the quota and block development.
* **How:** Make *one* manual request to RapidAPI via Postman. Save the response as a JSON file (e.g., `database/seeders/fixtures/hotels.json`). In your `HotelSeeder`, read the local JSON file instead of making a live HTTP call.
* **Code Example:**
```php
public function run()
{
    $json = file_get_contents(database_path('seeders/fixtures/hotels.json'));
    $hotels = json_decode($json, true);
    
    foreach ($hotels['data'] as $hotel) {
        Hotel::create([
            'name' => $hotel['name'],
            'price_per_night' => $hotel['price'],
            // ...
        ]);
    }
}
```

### Strategy 3: Real-Time Fetching + Caching (Not Seeded)
**Targets:** OpenWeatherMap API & OpenAI
* **Why not seed?** Weather changes constantly. AI responses are generated specifically based on dynamic user input.
* **How:** Do not put these in a seeder. Instead, build a Service Class (`WeatherService`) that uses `Cache::remember()` to store the API response for 1 hour. AI responses are saved at runtime directly into the `ai_recommendations` table to prevent duplicate token costs.

### Strategy 4: Seeding Roles with Spatie
**Target:** Access Control (`spatie/laravel-permission`)
* **How:** Spatie tables are created via their package provider, not manual migrations. When writing the `RoleSeeder`, use the `Role` and `Permission` models provided by Spatie to seed the database and assign default users.
* **Code Example:**
```php
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // 1. Create standard roles
        $adminRole = Role::create(['name' => 'admin']);
        $customerRole = Role::create(['name' => 'customer']);

        // 2. Create permissions
        Permission::create(['name' => 'manage users']);
        $adminRole->givePermissionTo('manage users');

        // 3. Assign role to a seeded user
        $admin = User::firstOrCreate(['email' => 'admin@threedos.com'], [
            'name' => 'Super Admin',
            'password' => bcrypt('password')
        ]);
        
        $admin->assignRole($adminRole);
    }
}
```

---

# 20-Phase Comprehensive Project Plan

Based on the 19-entity ERD, the Laravel Models/Migrations guide, the API research, and the full case study requirements, here is a highly detailed 20-phase roadmap to build the **Smart AI Travel Planner (ThreeDOS)**.

> **How to read this plan:** Each phase lists a **Goal**, numbered **Tasks** with specific artisan commands / file paths / class names, and **Acceptance Criteria** (AC) that must pass before moving to the next phase. Phases are sequential — each depends on the ones before it.

---

## Phase 1: Project Initiation & Foundation
**Goal:** Establish the Laravel 12 project skeleton, version control, coding standards, and the BootstrapMade frontend template.

**Tasks:**
1. Create a new Laravel 12 project:
   ```bash
   composer create-project laravel/laravel threedos-travel-planner
   ```
2. Initialize Git and push to GitHub:
   ```bash
   git init && git remote add origin <repo-url>
   git add . && git commit -m "chore: initial Laravel 12 scaffold"
   git push -u origin main
   ```
3. Configure `.env` with database credentials and placeholder API keys:
   ```dotenv
   DB_DATABASE=threedos
   DB_USERNAME=root
   DB_PASSWORD=
   OPENWEATHER_API_KEY=your_key_here
   RAPIDAPI_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ```
4. Install and configure Laravel Pint for code formatting:
   ```bash
   composer require laravel/pint --dev
   ```
   Create `pint.json` with PSR-12 preset.
5. Download the chosen BootstrapMade premium template (e.g., "Starter" or "Starter-Bootstrap"). Extract into `resources/views/layouts/`.
6. Set up the Blade master layout file:
   - `resources/views/layouts/app.blade.php` — includes Bootstrap 5 CDN/compiled CSS, navbar, footer, `@yield('content')`.
   - `resources/views/layouts/admin.blade.php` — sidebar admin layout extending BootstrapMade's dashboard template.
7. Create `public/assets/` directories for images, custom CSS, and JS:
   ```
   public/assets/css/custom.css
   public/assets/js/custom.js
   public/assets/img/
   ```
8. Create the homepage view `resources/views/home.blade.php` extending `layouts.app`.
9. Define the initial route in `routes/web.php`:
   ```php
   Route::get('/', fn() => view('home'))->name('home');
   ```

**Acceptance Criteria:**
- [ ] `php artisan serve` shows the BootstrapMade homepage with navbar and footer.
- [ ] `./vendor/bin/pint` runs with zero errors.
- [ ] `.env` keys exist for all 4 external APIs.
- [ ] Git repo has initial commit on `main`.

---

## Phase 2: Core Database Architecture
**Goal:** Create all 19 database tables in the correct dependency order and scaffold all 19 Eloquent models with relationships.

**Tasks:**
1. Create the MySQL database:
   ```bash
   mysql -u root -e "CREATE DATABASE threedos;"
   ```
2. Generate migration files using artisan (one per table, in dependency order). The timestamp order must match:
   ```bash
   php artisan make:migration create_settings_table
   php artisan make:migration create_contact_messages_table
   php artisan make:migration create_countries_table
   php artisan make:migration create_categories_table
   php artisan make:migration create_users_table          # (modify existing)
   php artisan make:migration create_surveys_table
   php artisan make:migration create_destinations_table
   php artisan make:migration create_attractions_table
   php artisan make:migration create_hotels_table
   php artisan make:migration create_restaurants_table
   php artisan make:migration create_flights_table
   php artisan make:migration create_trips_table
   php artisan make:migration create_trip_destinations_table
   php artisan make:migration create_itinerary_items_table
   php artisan make:migration create_ai_recommendations_table
   php artisan make:migration create_notifications_table
   php artisan make:migration create_reviews_table
   php artisan make:migration create_favourites_table
   php artisan make:migration create_pivot_tables          # attraction_trip, hotel_trip, restaurant_trip, flight_trip
   ```
3. Populate each migration `up()` method using the exact schema from the **Laravel Models & Migrations Guide** (see `Laravel_Models_Migrations_Team2.md` Section 2).
4. Run all migrations:
   ```bash
   php artisan migrate
   ```
5. Generate all 19 Eloquent models:
   ```bash
   php artisan make:model Setting
   php artisan make:model ContactMessage
   php artisan make:model Country
   php artisan make:model Category
   php artisan make:model Survey
   php artisan make:model Destination
   php artisan make:model Attraction
   php artisan make:model Hotel
   php artisan make:model Restaurant
   php artisan make:model Flight
   php artisan make:model Trip
   php artisan make:model TripDestination
   php artisan make:model ItineraryItem
   php artisan make:model AiRecommendation
   php artisan make:model Notification
   php artisan make:model Review
   php artisan make:model Favourite
   ```
6. Populate each model with `$fillable`, `$casts`, `$hidden`, and all relationship methods exactly as defined in `Laravel_Models_Migrations_Team2.md` Section 3.
7. Make `TripDestination` extend `Illuminate\Database\Eloquent\Relations\Pivot` (not `Model`).
8. Add the derived attribute accessor on `Trip`:
   ```php
   public function getEstimateCostAttribute() {
       return $this->itineraryItems()->sum('estimated_cost');
   }
   ```
9. Verify all foreign keys and polymorphic columns exist:
   ```bash
   php artisan migrate:fresh
   ```

**Acceptance Criteria:**
- [ ] `php artisan migrate:fresh` succeeds with zero errors.
- [ ] 19 tables + 4 pivot tables exist in MySQL (23 tables total, plus Spatie tables from Phase 3).
- [ ] Every model file exists in `app/Models/` with correct relationships.
- [ ] `php artisan tinker` → `\App\Models\Trip::first()` returns null (no data yet, but no errors).

---

## Phase 3: Authentication & RBAC (Spatie)
**Goal:** Install Laravel Breeze for authentication scaffolding (register, login, forgot password, email verification, profile management) and Spatie for role-based access control.

**Tasks:**
1. Install Laravel Breeze with Blade stack:
   ```bash
   composer require laravel/breeze --dev
   php artisan breeze:install blade
   npm install && npm run build
   ```
2. Modify the Breeze-generated views (`resources/views/auth/*`) to match the BootstrapMade template design (consistent navbar, fonts, gradients).
3. Enable email verification in `app/Models/User.php`:
   ```php
   class User extends Authenticatable implements MustVerifyEmail
   ```
4. Add the `verified` middleware to protected routes in `routes/web.php`:
   ```php
   Route::middleware(['auth', 'verified'])->group(function () {
       // User dashboard routes
   });
   ```
5. Install Spatie Laravel Permission:
   ```bash
   composer require spatie/laravel-permission
   php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
   php artisan migrate
   ```
6. Add `HasRoles` trait to the User model:
   ```php
   use Spatie\Permission\Traits\HasRoles;
   class User extends Authenticatable implements MustVerifyEmail {
       use HasRoles;
       // ...
   }
   ```
7. Register Spatie's role middleware in `bootstrap/app.php` (Laravel 12 style):
   ```php
   ->withMiddleware(function (Middleware $middleware) {
       $middleware->alias([
           'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
           'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
       ]);
   })
   ```
8. Create the `RoleSeeder`:
   ```bash
   php artisan make:seeder RoleSeeder
   ```
   Content: Create `admin` and `customer` roles, create permissions (`manage users`, `manage trips`, `manage destinations`, `manage hotels`, `manage restaurants`, `manage attractions`, `manage categories`, `manage reviews`, `manage contacts`, `manage settings`), assign all permissions to admin. Create default admin user `admin@threedos.com` with role `admin`.
9. Create `UserSeeder` — seed 10 fake customer users using Laravel Factory, each assigned the `customer` role:
   ```bash
   php artisan make:seeder UserSeeder
   php artisan make:factory UserFactory  # (modify existing)
   ```
10. Register seeders in `database/seeders/DatabaseSeeder.php`:
    ```php
    $this->call([
        RoleSeeder::class,
        UserSeeder::class,
    ]);
    ```
11. Define route groups:
    ```php
    // routes/web.php
    Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
        // All admin routes here
    });

    Route::middleware(['auth', 'verified'])->prefix('dashboard')->name('user.')->group(function () {
        // All user dashboard routes here
    });
    ```
12. Build the profile management page at `resources/views/profile/edit.blade.php` — allow users to update `name`, `email`, `profile_image`, and `password`.

**Acceptance Criteria:**
- [ ] User can register, login, logout, reset password, and verify email.
- [ ] `php artisan migrate:fresh --seed` creates 2 roles (`admin`, `customer`), 10+ permissions, and 11 users (1 admin + 10 customers).
- [ ] Visiting `/admin` as a customer returns 403 Forbidden.
- [ ] Visiting `/admin` as admin shows the admin layout.
- [ ] Profile page allows uploading a `profile_image`.

---

## Phase 4: Image Upload & File Storage
**Goal:** Implement a reusable image upload system used by User (profile_image), Trip (cover_image), Destination (image), Hotel (image), Restaurant (image), Attraction (image), and Category (icon).

**Tasks:**
1. Configure the filesystem in `config/filesystems.php`:
   ```php
   'disks' => [
       'public' => [
           'driver' => 'local',
           'root' => storage_path('app/public'),
           'url' => env('APP_URL').'/storage',
           'visibility' => 'public',
       ],
   ],
   ```
2. Create the storage symlink:
   ```bash
   php artisan storage:link
   ```
3. Create a reusable helper trait `app/Traits/HasImageUpload.php`:
   ```php
   namespace App\Traits;
   use Illuminate\Http\UploadedFile;
   use Illuminate\Support\Facades\Storage;

   trait HasImageUpload {
       public function uploadImage(UploadedFile $file, string $directory): string {
           return $file->store($directory, 'public');
       }
       public function deleteImage(?string $path): void {
           if ($path) Storage::disk('public')->delete($path);
       }
   }
   ```
4. Apply the `HasImageUpload` trait to all controllers that handle image-bearing models (UserController, TripController, DestinationController, HotelController, RestaurantController, AttractionController, CategoryController).
5. In Blade forms, add enctype and file input:
   ```html
   <form method="POST" enctype="multipart/form-data">
       <input type="file" name="image" accept="image/*">
   </form>
   ```
6. Create a `StoreImageRequest` FormRequest (`app/Http/Requests/StoreImageRequest.php`) with validation:
   ```php
   'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
   ```

**Acceptance Criteria:**
- [ ] User can upload a profile image; stored in `storage/app/public/users/`.
- [ ] Images display correctly via `{{ asset('storage/' . $user->profile_image) }}`.
- [ ] Old image is deleted from disk when a new one is uploaded.

---

## Phase 5: Geographic Data Seeding (Live API)
**Goal:** Seed the `countries` table dynamically from the RestCountries API, then manually seed sample `destinations`.

**Tasks:**
1. Create `CountrySeeder`:
   ```bash
   php artisan make:seeder CountrySeeder
   ```
   Implementation — use `Http::get('https://restcountries.com/v3.1/all')` and `Country::updateOrCreate()` to populate `name`, `iso_code`, `capital`, `flag_url`, `currency`, `languages` (see Strategy 1 in API Research section above).
2. Create `DestinationSeeder`:
   ```bash
   php artisan make:seeder DestinationSeeder
   ```
   Manually seed 15–20 popular destinations (e.g., Paris, Tokyo, Dubai, Istanbul, Cairo, Rome, Barcelona, London, New York, Bali) with `country_id` FK, `city_name`, `description`, `latitude`, `longitude`, and placeholder `image` paths.
3. Register both seeders in `DatabaseSeeder.php` (after `UserSeeder`):
   ```php
   $this->call([
       RoleSeeder::class,
       UserSeeder::class,
       CountrySeeder::class,
       DestinationSeeder::class,
   ]);
   ```
4. Add error handling to `CountrySeeder` — if the API is unreachable, log a warning and skip gracefully:
   ```php
   $response = Http::timeout(15)->get('https://restcountries.com/v3.1/all');
   if ($response->failed()) {
       $this->command->warn('RestCountries API unreachable. Skipping.');
       return;
   }
   ```

**Acceptance Criteria:**
- [ ] `php artisan db:seed --class=CountrySeeder` populates 250 countries with flags, currencies, languages.
- [ ] `php artisan db:seed --class=DestinationSeeder` creates 15–20 destinations linked to valid `country_id`s.
- [ ] If the API is offline, seeder logs a warning instead of crashing.

---

## Phase 6: Places & Categories Seeding (Fixture API)
**Goal:** Seed Categories, Hotels, Restaurants, Attractions, and Flights using JSON fixture files (captured from RapidAPI) and factories.

**Tasks:**
1. Create the fixture directory: `database/seeders/fixtures/`.
2. Make one manual RapidAPI request per resource type via Postman. Save responses as:
   - `database/seeders/fixtures/hotels.json`
   - `database/seeders/fixtures/flights.json`
3. Create seeders:
   ```bash
   php artisan make:seeder CategorySeeder
   php artisan make:seeder HotelSeeder
   php artisan make:seeder RestaurantSeeder
   php artisan make:seeder AttractionSeeder
   php artisan make:seeder FlightSeeder
   ```
4. `CategorySeeder` — seed the 6 case study categories: `Beaches`, `Mountains`, `Museums`, `Historical Sites`, `Adventure`, `Shopping`. Set `type` to `destination` or `restaurant` as appropriate. Add an `icon` path for each.
5. `HotelSeeder` — read `fixtures/hotels.json`, loop through entries, create Hotel records linked to matching `destination_id` by city name. Fields: `name`, `address`, `price_per_night`, `rating`, `stars`, `availability`, `image`.
6. `RestaurantSeeder` — seed 20–30 restaurants across seeded destinations using Factory + manual data. Link `category_id` and `destination_id`.
7. `AttractionSeeder` — seed 30–40 attractions across destinations, linked to categories (Beaches, Museums, etc.) and destinations.
8. `FlightSeeder` — read `fixtures/flights.json`, create Flight records with `departure_airport`, `arrival_airport`, `departure_date`, `arrival_date`, `price`, `booking_status`.
9. Create Eloquent Factories for testing:
   ```bash
   php artisan make:factory HotelFactory
   php artisan make:factory RestaurantFactory
   php artisan make:factory AttractionFactory
   php artisan make:factory FlightFactory
   php artisan make:factory TripFactory
   ```
10. Update `DatabaseSeeder.php` call order:
    ```php
    $this->call([
        RoleSeeder::class,
        UserSeeder::class,
        CountrySeeder::class,
        DestinationSeeder::class,
        CategorySeeder::class,
        HotelSeeder::class,
        RestaurantSeeder::class,
        AttractionSeeder::class,
        FlightSeeder::class,
    ]);
    ```

**Acceptance Criteria:**
- [ ] `php artisan migrate:fresh --seed` populates all tables with realistic data.
- [ ] Every Hotel, Restaurant, and Attraction has a valid `destination_id`.
- [ ] Every Attraction and Restaurant with a category has a valid `category_id`.
- [ ] `php artisan tinker` → `Hotel::count()` returns > 0.

---

## Phase 7: External API Service Layer
**Goal:** Build dedicated Service Classes for each external API, following the Laravel Service Class pattern with dependency injection and caching.

**Tasks:**
1. Create the services directory: `app/Services/`.
2. Create `app/Services/WeatherService.php`:
   ```php
   namespace App\Services;
   use Illuminate\Support\Facades\Http;
   use Illuminate\Support\Facades\Cache;

   class WeatherService {
       public function getWeather(string $city): ?array {
           return Cache::remember("weather_{$city}", 3600, function () use ($city) {
               $response = Http::get('https://api.openweathermap.org/data/2.5/weather', [
                   'q' => $city,
                   'appid' => config('services.openweather.key'),
                   'units' => 'metric',
               ]);
               return $response->successful() ? $response->json() : null;
           });
       }
   }
   ```
3. Create `app/Services/HotelSearchService.php` — wraps RapidAPI hotel search endpoint. Accepts `city`, `checkin`, `checkout`. Returns array of hotels. Includes rate-limit handling (`retry(3, 100)`).
4. Create `app/Services/FlightSearchService.php` — wraps RapidAPI flight search. Accepts `origin`, `destination`, `date`. Returns array of flights.
5. Create `app/Services/OpenAiService.php`:
   ```php
   namespace App\Services;
   use Illuminate\Support\Facades\Http;

   class OpenAiService {
       public function generateItinerary(array $tripData, array $surveyData): array {
           $systemPrompt = "You are a travel planner. Generate a JSON itinerary...";
           $userPrompt = $this->buildPrompt($tripData, $surveyData);

           $response = Http::withToken(config('services.openai.key'))
               ->post('https://api.openai.com/v1/chat/completions', [
                   'model' => 'gpt-4o-mini',
                   'messages' => [
                       ['role' => 'system', 'content' => $systemPrompt],
                       ['role' => 'user', 'content' => $userPrompt],
                   ],
                   'response_format' => ['type' => 'json_object'],
               ]);
           return $response->json();
       }
       private function buildPrompt(array $trip, array $survey): string { /* ... */ }
   }
   ```
6. Register API keys in `config/services.php`:
   ```php
   'openweather' => ['key' => env('OPENWEATHER_API_KEY')],
   'rapidapi' => ['key' => env('RAPIDAPI_KEY')],
   'openai' => ['key' => env('OPENAI_API_KEY')],
   ```
7. Bind services in `app/Providers/AppServiceProvider.php`:
   ```php
   $this->app->singleton(WeatherService::class);
   $this->app->singleton(OpenAiService::class);
   ```

**Acceptance Criteria:**
- [ ] `WeatherService::getWeather('London')` returns temperature data (or null if key not set).
- [ ] Second call within 1 hour returns cached data (verified via `Cache::has()`).
- [ ] `OpenAiService` sends a well-formed request with `response_format: json_object`.
- [ ] All service classes are injectable via constructor type-hinting.

---

## Phase 8: User Onboarding & Survey Module
**Goal:** Build the onboarding questionnaire that saves user travel preferences to the `surveys` table immediately after registration.

**Tasks:**
1. Create `SurveyController`:
   ```bash
   php artisan make:controller SurveyController
   ```
2. Create FormRequest for validation:
   ```bash
   php artisan make:request StoreSurveyRequest
   ```
   Rules: `travel_style` → `required|in:adventure,relaxation,cultural,luxury,budget`, `budget_level` → `required|in:low,medium,high,luxury`, `interests` → `required|array|min:1`, `interests.*` → `in:beaches,mountains,museums,historical,adventure,shopping,food,nightlife`.
3. Create views:
   - `resources/views/survey/create.blade.php` — multi-step form with interactive cards (Bootstrap 5). Step 1: Travel style. Step 2: Budget level. Step 3: Interests (checkbox grid with icons from Category seeds).
4. Define routes:
   ```php
   Route::middleware(['auth', 'verified'])->group(function () {
       Route::get('/onboarding', [SurveyController::class, 'create'])->name('survey.create');
       Route::post('/onboarding', [SurveyController::class, 'store'])->name('survey.store');
   });
   ```
5. In `SurveyController@store`: Save to `Survey` model with `interests` as JSON array. Redirect to user dashboard.
6. Add middleware or redirect logic: If a user has no survey record, redirect them to `/onboarding` after login:
   ```php
   // In LoginController or via a custom middleware
   if (!auth()->user()->survey) {
       return redirect()->route('survey.create');
   }
   ```

**Acceptance Criteria:**
- [ ] New user is redirected to `/onboarding` after first login.
- [ ] Survey data saves correctly with `interests` as a JSON array in the database.
- [ ] User with existing survey skips onboarding and goes to dashboard.
- [ ] Validation rejects invalid travel styles and empty interests.

---

## Phase 9: Trip Planning Module (Core CRUD)
**Goal:** Build the "Create Trip" wizard where users select destinations, set budgets, dates, and preferences. Save to `trips` and `trip_destinations` pivot.

**Tasks:**
1. Create controller and FormRequest:
   ```bash
   php artisan make:controller TripController --resource
   php artisan make:request StoreTripRequest
   php artisan make:request UpdateTripRequest
   ```
2. `StoreTripRequest` rules: `title` → `required|string|max:255`, `destination_ids` → `required|array|min:1`, `destination_ids.*` → `exists:destinations,id`, `budget` → `required|numeric|min:0`, `no_of_days` → `required|integer|min:1|max:90`, `start_date` → `nullable|date|after_or_equal:today`, `travel_style` → `required|string`, `interests` → `nullable|array`, `no_of_travelers` → `required|integer|min:1`, `cover_image` → `nullable|image|max:2048`.
3. Create views:
   - `resources/views/trips/index.blade.php` — card grid showing user's saved trips with cover images, status badges, and pagination.
   - `resources/views/trips/create.blade.php` — multi-step wizard form. Step 1: Title, dates, travelers. Step 2: Select destinations (searchable dropdown with AJAX, see Phase 14). Step 3: Budget, travel style, interests. Step 4: Cover image upload.
   - `resources/views/trips/show.blade.php` — trip detail page with itinerary timeline, weather widget, map, and linked hotels/flights.
   - `resources/views/trips/edit.blade.php` — edit form pre-populated with existing trip data.
4. In `TripController@store`:
   - Create the `Trip` record.
   - Sync destinations via `$trip->destinations()->sync($request->destination_ids)`.
   - Handle `cover_image` upload using the `HasImageUpload` trait.
   - Redirect to `trips.show`.
5. Define resource routes:
   ```php
   Route::middleware(['auth', 'verified'])->group(function () {
       Route::resource('trips', TripController::class);
   });
   ```
6. Add **pagination** to the trips index: `Trip::where('user_id', auth()->id())->latest()->paginate(12)`.
7. Display `estimate_cost` derived attribute on the trip show page.

**Acceptance Criteria:**
- [ ] User can create a trip with multiple destinations.
- [ ] `trip_destinations` pivot records are created with correct FKs.
- [ ] Trip index shows paginated cards (12 per page).
- [ ] Trip show page displays all trip details including estimated cost.
- [ ] FormRequest validation rejects invalid data with proper error messages.

---

## Phase 10: AI Itinerary Generation (OpenAI)
**Goal:** When a user creates a trip, offer a "Generate AI Itinerary" button that sends trip + survey data to OpenAI and stores the result.

**Tasks:**
1. Add a route:
   ```php
   Route::post('/trips/{trip}/generate-itinerary', [TripController::class, 'generateItinerary'])
       ->name('trips.generate-itinerary')
       ->middleware(['auth', 'verified']);
   ```
2. In `TripController@generateItinerary`:
   - Check if an `AiRecommendation` already exists for this trip (prevent duplicate token costs).
   - If not, gather: trip data (`destinations`, `budget`, `no_of_days`, `travel_style`, `interests`, `no_of_travelers`) + user's `Survey` data.
   - Call `OpenAiService::generateItinerary($tripData, $surveyData)`.
   - Save to `ai_recommendations` table: `prompt_text`, `response_text`, `model_used` (`gpt-4o-mini`), `tokens_used` (from API response `usage.total_tokens`), `generated_at` (now).
3. Build the prompt template in `OpenAiService::buildPrompt()`:
   ```
   Plan a {no_of_days}-day trip to {destinations} for {no_of_travelers} travelers.
   Budget: ${budget}. Travel style: {travel_style}. Interests: {interests}.
   Return a JSON object with keys: "days" (array), each containing:
   "day_number", "title", "activities" (array of {time, title, type, estimated_cost, notes}).
   Include hotel suggestions, restaurant suggestions, and transportation tips.
   ```
4. Parse the returned JSON and auto-populate `itinerary_items`:
   ```php
   foreach ($aiResponse['days'] as $day) {
       foreach ($day['activities'] as $order => $activity) {
           ItineraryItem::create([
               'trip_id' => $trip->id,
               'day_number' => $day['day_number'],
               'item_order' => $order + 1,
               'type' => $activity['type'],
               'time_slot' => $activity['time'] ?? null,
               'title' => $activity['title'],
               'notes' => $activity['notes'] ?? null,
               'estimated_cost' => $activity['estimated_cost'] ?? null,
           ]);
       }
   }
   ```
5. On the trip show page, add a "Generate AI Itinerary" button (disabled if already generated). Show a loading spinner during the AJAX request.
6. Display the generated itinerary as a timeline/accordion grouped by day number.

**Acceptance Criteria:**
- [ ] Clicking "Generate AI Itinerary" sends the request and stores the AI response.
- [ ] `itinerary_items` table is populated with parsed day-by-day activities.
- [ ] Second click on same trip does NOT re-send to OpenAI (shows existing result).
- [ ] Timeline UI renders all days with activities, times, types, and costs.
- [ ] `estimate_cost` accessor on Trip returns correct sum of all itinerary item costs.

---

## Phase 11: Real-Time Weather Integration
**Goal:** Display a live weather widget on every Destination detail page and Trip show page, powered by OpenWeatherMap with 1-hour caching.

**Tasks:**
1. Create `WeatherController`:
   ```bash
   php artisan make:controller Api/WeatherController
   ```
2. Define an API route for AJAX calls:
   ```php
   // routes/web.php (or routes/api.php)
   Route::get('/api/weather/{city}', [WeatherController::class, 'show'])->name('api.weather');
   ```
3. `WeatherController@show`: Inject `WeatherService`, call `getWeather($city)`, return JSON response with `temperature`, `description`, `icon`, `wind_speed`, `humidity`, `forecast`.
4. Create a Blade component `resources/views/components/weather-widget.blade.php`:
   ```html
   <div id="weather-widget" data-city="{{ $city }}">
       <div class="weather-loading">Loading weather...</div>
   </div>
   ```
5. Write JavaScript (`public/assets/js/weather.js`) that fetches `/api/weather/{city}` on page load and renders temperature, weather icon, wind speed, and description inside the widget div.
6. Include the weather widget on:
   - `resources/views/destinations/show.blade.php`
   - `resources/views/trips/show.blade.php` (for the primary destination city)

**Acceptance Criteria:**
- [ ] Destination page shows current temperature, weather icon, and wind speed.
- [ ] Data is cached for 1 hour (verify: two rapid requests, second hits cache).
- [ ] Widget shows a graceful "Weather unavailable" message if API fails.

---

## Phase 12: Booking & Pivot Implementations (Hotels, Flights, Attractions, Restaurants)
**Goal:** Allow users to search for and attach Hotels, Flights, Attractions, and Restaurants to their trips via the M:N pivot tables.

**Tasks:**
1. Create controllers:
   ```bash
   php artisan make:controller BookingController
   ```
2. On the Trip show page, add tabs: "Hotels", "Flights", "Attractions", "Restaurants".
3. Each tab has:
   - A **search form** that queries the local database (and optionally RapidAPI live) filtered by the trip's destination(s).
   - A list of results with an "Add to Trip" button.
4. "Add to Trip" action — AJAX POST that attaches the selected record to the trip's pivot:
   ```php
   // BookingController@attachHotel
   $trip->hotels()->syncWithoutDetaching([$request->hotel_id]);
   ```
5. Display currently attached items on each tab with a "Remove" button:
   ```php
   $trip->hotels()->detach($hotelId);
   ```
6. For Flights: Show departure/arrival airports, dates, prices. Allow attaching to `flight_trip` pivot.
7. For Attractions: Filter by destination and category. Attach to `attraction_trip` pivot.
8. For Restaurants: Filter by destination, cuisine, and price range. Attach to `restaurant_trip` pivot.
9. Show a **Booking History** section on the User Dashboard (`resources/views/dashboard/index.blade.php`) summarizing all trips with their attached hotels and flights.

**Acceptance Criteria:**
- [ ] User can search, add, and remove Hotels/Flights/Attractions/Restaurants from a trip.
- [ ] Pivot tables correctly store the M:N relationships.
- [ ] Booking History page lists all trips with attached items.
- [ ] Duplicate attachments are prevented (`syncWithoutDetaching`).

---

## Phase 13: User Interaction Module (Favourites & Reviews — Polymorphic)
**Goal:** Implement the polymorphic "Add to Favourites" and "Write a Review" features targeting Destinations, Hotels, Restaurants, and Attractions.

**Tasks:**
1. Create controllers:
   ```bash
   php artisan make:controller FavouriteController
   php artisan make:controller ReviewController
   ```
2. Create FormRequest:
   ```bash
   php artisan make:request StoreReviewRequest
   ```
   Rules: `rating` → `required|integer|min:1|max:5`, `comment` → `nullable|string|max:1000`.
3. Define polymorphic routes:
   ```php
   Route::middleware(['auth', 'verified'])->group(function () {
       Route::post('/favourites/{type}/{id}', [FavouriteController::class, 'toggle'])->name('favourites.toggle');
       Route::post('/reviews/{type}/{id}', [ReviewController::class, 'store'])->name('reviews.store');
       Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy');
   });
   ```
4. `FavouriteController@toggle` — accepts `type` (destination, hotel, restaurant, attraction) and `id`. Resolves the morph model. Toggles favourite (create or delete):
   ```php
   $model = $this->resolveModel($type, $id);
   $existing = Favourite::where('user_id', auth()->id())
       ->where('favorable_type', get_class($model))
       ->where('favorable_id', $model->id)->first();
   if ($existing) { $existing->delete(); }
   else { $model->favourites()->create(['user_id' => auth()->id()]); }
   ```
5. `ReviewController@store` — creates a Review with `status: pending` (requires admin approval). Associates via `reviewable` morph.
6. Add a heart icon toggle button (AJAX) on Destination, Hotel, Restaurant, and Attraction cards. Filled heart = favourited.
7. Add a star-rating form + comment textarea on detail pages of each reviewable entity.
8. Display approved reviews (where `status = 'approved'`) with user name, rating stars, comment, and date.
9. On the User Dashboard, add a "My Favourites" section (`resources/views/dashboard/favourites.blade.php`) showing all user's favourited items with links.

**Acceptance Criteria:**
- [ ] Heart icon toggles favourite state via AJAX without page reload.
- [ ] `favourites` table stores correct `favorable_type` (e.g., `App\Models\Hotel`) and `favorable_id`.
- [ ] Reviews save with `status: pending` and only display after admin approval.
- [ ] User Dashboard shows all favourited items grouped by type.
- [ ] Star rating renders correctly (1–5 stars, visual).

---

## Phase 14: Search, Filtering & AJAX
**Goal:** Implement global search and per-module filtering with AJAX-powered results across the platform.

**Tasks:**
1. Create `SearchController`:
   ```bash
   php artisan make:controller SearchController
   ```
2. Build a global search bar in `layouts/app.blade.php` navbar. On submit, sends GET request to `/search?q={query}`.
3. `SearchController@index` — searches across multiple models using `LIKE`:
   ```php
   $destinations = Destination::where('name', 'like', "%{$q}%")->limit(10)->get();
   $hotels = Hotel::where('name', 'like', "%{$q}%")->limit(10)->get();
   $attractions = Attraction::where('name', 'like', "%{$q}%")->limit(10)->get();
   $restaurants = Restaurant::where('name', 'like', "%{$q}%")->limit(10)->get();
   $countries = Country::where('name', 'like', "%{$q}%")->limit(10)->get();
   ```
4. Create `resources/views/search/results.blade.php` — displays results grouped by type with links to detail pages.
5. Add per-page filters using AJAX:
   - **Destinations index:** Filter by country (dropdown), category (checkbox).
   - **Hotels index:** Filter by destination, price range (slider), star rating, availability.
   - **Restaurants index:** Filter by destination, cuisine, price range.
   - **Attractions index:** Filter by destination, category.
6. Implement AJAX filtering: JavaScript sends GET parameters, controller returns paginated JSON, JS re-renders the card grid without full page reload.
7. Add **pagination** (12 items per page) to every index page: Destinations, Hotels, Restaurants, Attractions, Countries.

**Acceptance Criteria:**
- [ ] Global search returns results from all entity types.
- [ ] Filters narrow results without page reload (AJAX).
- [ ] Pagination works on all index pages.
- [ ] Empty search states show "No results found" message.

---

## Phase 15: Interactive Maps (Leaflet.js)
**Goal:** Integrate Leaflet.js maps showing attraction locations, hotels, restaurants, and route directions on destination and trip pages.

**Tasks:**
1. Include Leaflet.js CDN in `layouts/app.blade.php`:
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
   ```
2. Create a Blade component `resources/views/components/map.blade.php`:
   ```html
   <div id="map" style="height: 400px;" data-lat="{{ $latitude }}" data-lng="{{ $longitude }}" data-zoom="{{ $zoom ?? 12 }}"></div>
   ```
3. On **Destination show page** — render a map centered on the destination's coordinates. Add markers for:
   - All attractions (blue markers) with popup showing name and link.
   - All hotels (green markers) with popup showing name and price.
   - All restaurants (orange markers) with popup showing name and cuisine.
4. On **Trip show page** — render a map showing all trip destinations with connecting polylines (route visualization). Each destination marker opens a popup with day number and notes.
5. On **Attraction/Hotel/Restaurant show pages** — render a small map showing the single location.
6. Write `public/assets/js/map.js` — reads `data-` attributes and JSON of markers, initializes Leaflet map, places markers with custom icons per type, and draws polylines between trip destinations.
7. Add routing via Leaflet Routing Machine plugin (optional) for route directions between destinations in a trip.

**Acceptance Criteria:**
- [ ] Destination page shows a map with all local attractions, hotels, and restaurants as markers.
- [ ] Trip page shows a map with all destinations connected by lines.
- [ ] Clicking a marker shows a popup with details and a link.
- [ ] Maps are responsive and work on mobile.

---

## Phase 16: System Settings & Contact Module
**Goal:** Build the public "Contact Us" form and a dynamic global settings system that feeds the master layout (logo, site name, social links, banner).

**Tasks:**
1. Create controllers:
   ```bash
   php artisan make:controller ContactController
   php artisan make:controller Admin/SettingController
   ```
2. Create FormRequest:
   ```bash
   php artisan make:request StoreContactRequest
   ```
   Rules: `name` → `required|string|max:255`, `email` → `required|email`, `message` → `required|string|max:2000`.
3. Create view `resources/views/contact.blade.php` — Bootstrap 5 form with name, email, message, and a submit button. Show success toast after submission.
4. `ContactController@store` — validates and saves to `contact_messages` with `status: unread`.
5. Define route:
   ```php
   Route::get('/contact', [ContactController::class, 'create'])->name('contact.create');
   Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
   ```
6. Build `SettingSeeder` — seed default settings:
   ```php
   Setting::insert([
       ['key' => 'site_name', 'value' => 'ThreeDOS Travel Planner'],
       ['key' => 'logo', 'value' => 'assets/img/logo.png'],
       ['key' => 'contact_email', 'value' => 'info@threedos.com'],
       ['key' => 'contact_phone', 'value' => '+1234567890'],
       ['key' => 'facebook_url', 'value' => '#'],
       ['key' => 'twitter_url', 'value' => '#'],
       ['key' => 'instagram_url', 'value' => '#'],
       ['key' => 'homepage_banner', 'value' => 'assets/img/banner.jpg'],
   ]);
   ```
7. Create a custom helper `app/Helpers/settings.php`:
   ```php
   function setting(string $key, $default = null) {
       return Cache::rememberForever("setting_{$key}", function () use ($key, $default) {
           return \App\Models\Setting::where('key', $key)->value('value') ?? $default;
       });
   }
   ```
   Register in `composer.json` autoload `files` array.
8. Use the helper in `layouts/app.blade.php`:
   ```html
   <img src="{{ asset(setting('logo')) }}" alt="{{ setting('site_name') }}">
   <title>{{ setting('site_name') }}</title>
   ```
9. Inject social media links into footer dynamically.

**Acceptance Criteria:**
- [ ] Contact form saves messages to `contact_messages` table.
- [ ] `setting('site_name')` returns the correct value from DB (cached).
- [ ] Logo, site name, and social links render dynamically in the layout.
- [ ] Changing a setting value in the DB and clearing cache reflects the change.

---

## Phase 17: Background Jobs & Notifications
**Goal:** Offload heavy operations (AI generation, API calls) to Laravel Queues and implement the in-app notification system.

**Tasks:**
1. Configure queue driver in `.env`:
   ```dotenv
   QUEUE_CONNECTION=database
   ```
2. Create the queue tables:
   ```bash
   php artisan queue:table
   php artisan migrate
   ```
3. Create a Job for AI itinerary generation:
   ```bash
   php artisan make:job GenerateAiItineraryJob
   ```
   Move the OpenAI API call logic from `TripController@generateItinerary` into this job. The job:
   - Calls `OpenAiService`.
   - Saves to `ai_recommendations`.
   - Parses and creates `itinerary_items`.
   - Dispatches a notification when complete.
4. Update `TripController@generateItinerary` to dispatch the job:
   ```php
   GenerateAiItineraryJob::dispatch($trip, auth()->user());
   return back()->with('info', 'Your AI itinerary is being generated. You will be notified when ready.');
   ```
5. Create a notification after job completion:
   ```php
   Notification::create([
       'user_id' => $user->id,
       'title' => 'AI Itinerary Ready!',
       'type' => 'itinerary_generated',
       'body' => "Your AI-generated itinerary for '{$trip->title}' is ready to view.",
       'data' => json_encode(['trip_id' => $trip->id]),
       'status' => 'unread',
   ]);
   ```
6. Create `NotificationController`:
   ```bash
   php artisan make:controller NotificationController
   ```
7. Build the notification bell icon in the navbar (shows unread count badge):
   ```html
   <span class="badge bg-danger">{{ auth()->user()->notifications()->where('status', 'unread')->count() }}</span>
   ```
8. Create notification dropdown or page (`resources/views/notifications/index.blade.php`) — lists all notifications, mark as read on click.
9. Define routes:
   ```php
   Route::middleware(['auth'])->group(function () {
       Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
       Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
   });
   ```
10. Start the queue worker:
    ```bash
    php artisan queue:work
    ```

**Acceptance Criteria:**
- [ ] AI generation runs in the background (user is not blocked).
- [ ] Notification appears in the bell dropdown after job completes.
- [ ] Clicking a notification marks it as read and links to the trip.
- [ ] `php artisan queue:work` processes jobs without errors.
- [ ] Failed jobs are logged in the `failed_jobs` table.

---

## Phase 18: Admin Dashboard — Full CRUD & Management
**Goal:** Build the complete admin panel with CRUD for all entities, user management with block/activate, review moderation, contact inbox, and settings management.

**Tasks:**
1. Create admin controllers (one per module):
   ```bash
   php artisan make:controller Admin/DashboardController
   php artisan make:controller Admin/UserController --resource
   php artisan make:controller Admin/TripController --resource
   php artisan make:controller Admin/CountryController --resource
   php artisan make:controller Admin/DestinationController --resource
   php artisan make:controller Admin/CategoryController --resource
   php artisan make:controller Admin/HotelController --resource
   php artisan make:controller Admin/RestaurantController --resource
   php artisan make:controller Admin/AttractionController --resource
   php artisan make:controller Admin/ReviewController
   php artisan make:controller Admin/ContactMessageController
   php artisan make:controller Admin/SettingController
   ```
2. Define admin route group:
   ```php
   Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
       Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
       Route::resource('users', UserController::class);
       Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
       Route::resource('trips', TripController::class)->only(['index', 'show', 'edit', 'update', 'destroy']);
       Route::resource('countries', CountryController::class);
       Route::resource('destinations', DestinationController::class);
       Route::resource('categories', CategoryController::class);
       Route::resource('hotels', HotelController::class);
       Route::resource('restaurants', RestaurantController::class);
       Route::resource('attractions', AttractionController::class);
       Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');
       Route::patch('reviews/{review}/approve', [ReviewController::class, 'approve'])->name('reviews.approve');
       Route::patch('reviews/{review}/reject', [ReviewController::class, 'reject'])->name('reviews.reject');
       Route::delete('reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy');
       Route::get('contacts', [ContactMessageController::class, 'index'])->name('contacts.index');
       Route::get('contacts/{contact}', [ContactMessageController::class, 'show'])->name('contacts.show');
       Route::patch('contacts/{contact}/status', [ContactMessageController::class, 'updateStatus'])->name('contacts.status');
       Route::delete('contacts/{contact}', [ContactMessageController::class, 'destroy'])->name('contacts.destroy');
       Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
       Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
   });
   ```
3. **User Management views** (`resources/views/admin/users/`):
   - `index.blade.php` — DataTable with columns: ID, Name, Email, Role, Status (Active/Blocked), Actions. Pagination + search.
   - `create.blade.php` — Form to add a user with role assignment.
   - `edit.blade.php` — Edit user details, reassign role.
   - `toggleStatus` action: Adds/removes a `blocked_at` timestamp column on the `users` table.
     ```bash
     php artisan make:migration add_blocked_at_to_users_table
     ```
     ```php
     $table->timestamp('blocked_at')->nullable();
     ```
   - Blocked users cannot log in (add check in `LoginController` or via `Auth::viaRequest`).
4. **Trips Management views** (`resources/views/admin/trips/`):
   - `index.blade.php` — List all users' trips with filters (user, status, date range). Pagination.
   - `show.blade.php` — View full trip details including itinerary and attached hotels/flights.
   - Admin can edit trip status and delete trips.
5. **Destinations Management views** (`resources/views/admin/destinations/`):
   - Full CRUD with image upload, country dropdown, latitude/longitude fields.
6. **Categories Management views** (`resources/views/admin/categories/`):
   - CRUD for the 6 case study categories (Beaches, Mountains, Museums, Historical Sites, Adventure, Shopping). Include icon upload.
7. **Hotels/Restaurants/Attractions Management** — full CRUD with image upload, destination dropdown, category dropdown (for Attractions and Restaurants).
8. **Reviews Moderation** (`resources/views/admin/reviews/`):
   - `index.blade.php` — Table showing all reviews with Status column (Pending/Approved/Rejected). Filter by status. Bulk approve/reject buttons.
   - `approve` action sets `status = 'approved'`. `reject` sets `status = 'rejected'`.
9. **Contact Messages Inbox** (`resources/views/admin/contacts/`):
   - `index.blade.php` — Table with Name, Email, Subject preview, Status (Unread/Read/Resolved), Date.
   - `show.blade.php` — Full message view. Mark as read on open. Option to mark resolved.
10. **Settings Management** (`resources/views/admin/settings/`):
    - `index.blade.php` — Form with fields for: Logo (file upload), Site Name, Contact Email, Contact Phone, Facebook URL, Twitter URL, Instagram URL, Homepage Banner (file upload).
    - On save, update `settings` table and clear the cache for each key.

**Acceptance Criteria:**
- [ ] Admin can CRUD all entity types from the dashboard.
- [ ] Block/Activate toggle works — blocked users cannot log in.
- [ ] Reviews can be approved/rejected; only approved reviews show publicly.
- [ ] Contact messages show unread count; marking as read works.
- [ ] Settings changes reflect immediately on the public site after cache clear.
- [ ] All admin pages have pagination and search/filter functionality.

---

## Phase 19: Analytics Dashboard & UI Polish
**Goal:** Build the admin analytics dashboard with Chart.js visualizations and apply final UI/UX polish including dark mode, animations, glassmorphism, and responsive refinements.

**Tasks:**
1. Include Chart.js CDN in `layouts/admin.blade.php`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   ```
2. In `Admin/DashboardController@index`, compute analytics:
   ```php
   $data = [
       'total_users' => User::count(),
       'total_trips' => Trip::count(),
       'total_destinations' => Destination::count(),
       'total_reviews' => Review::where('status', 'approved')->count(),
       'pending_reviews' => Review::where('status', 'pending')->count(),
       'unread_contacts' => ContactMessage::where('status', 'unread')->count(),
       'monthly_trips' => Trip::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
           ->whereYear('created_at', now()->year)
           ->groupByRaw('MONTH(created_at)')->pluck('count', 'month'),
       'popular_destinations' => Destination::withCount('trips')
           ->orderByDesc('trips_count')->limit(10)->get(),
       'user_growth' => User::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
           ->whereYear('created_at', now()->year)
           ->groupByRaw('MONTH(created_at)')->pluck('count', 'month'),
       'trips_by_status' => Trip::selectRaw('status, COUNT(*) as count')
           ->groupBy('status')->pluck('count', 'status'),
   ];
   ```
3. Create `resources/views/admin/dashboard.blade.php` with:
   - **Summary cards** (top row): Total Users, Total Trips, Pending Reviews, Unread Messages — each with an icon and color.
   - **Line chart**: Monthly Trips (Jan–Dec).
   - **Bar chart**: Top 10 Most Popular Destinations (by trip count).
   - **Line chart**: User Growth (monthly registrations).
   - **Doughnut chart**: Trips by Status (Planned, Active, Completed, Cancelled).
4. Pass data to charts via `@json()` in Blade:
   ```javascript
   const monthlyTripsData = @json($data['monthly_trips']);
   ```
5. **User Dashboard** (`resources/views/dashboard/index.blade.php`):
   - Summary cards: Total Trips, Active Trips, Total Favourites, Total Reviews Written.
   - **Trip Statistics**: chart showing user's trips by month.
   - Quick links: "Create New Trip", "My Favourites", "My Reviews".
6. **Dark Mode** (Optional toggle):
   - Add a toggle button in the navbar (sun/moon icon).
   - Store preference in `localStorage`.
   - Apply a `[data-theme="dark"]` attribute to `<html>`.
   - Create `public/assets/css/dark-mode.css` with inverted color variables.
7. **UI Polish** — apply across all public pages:
   - Smooth CSS transitions and hover animations on cards (scale, shadow lift).
   - Glassmorphism effect on hero sections and modal backgrounds (`backdrop-filter: blur(10px)`).
   - Gradient backgrounds on buttons and hero banners.
   - Responsive breakpoints tested at 320px, 768px, 1024px, 1440px.
8. **Custom Error Pages** — create styled error views:
   - `resources/views/errors/404.blade.php`
   - `resources/views/errors/403.blade.php`
   - `resources/views/errors/500.blade.php`

**Acceptance Criteria:**
- [ ] Admin dashboard displays 4+ charts with real data from the database.
- [ ] Most Popular Destinations chart reflects actual trip counts.
- [ ] User dashboard shows personal trip statistics.
- [ ] Dark mode toggle works and persists across page loads.
- [ ] All pages are responsive and render correctly on mobile.
- [ ] Custom error pages display with consistent branding.

---

## Phase 20: QA, Testing, Optimization & Deployment
**Goal:** Write automated tests, optimize performance, handle errors/logging, apply security best practices, and deploy to production.

**Tasks:**

### Testing (Pest/PHPUnit)
1. Install Pest:
   ```bash
   composer require pestphp/pest --dev
   php artisan pest:install
   ```
2. Write **Feature tests** (at minimum):
   - `tests/Feature/AuthTest.php` — register, login, logout, email verification, forgot password.
   - `tests/Feature/TripTest.php` — create, read, update, delete trips. Verify pivot relationships.
   - `tests/Feature/SurveyTest.php` — onboarding flow, validation, JSON interests.
   - `tests/Feature/FavouriteTest.php` — toggle favourite, polymorphic correctness.
   - `tests/Feature/ReviewTest.php` — submit review (pending), admin approve, display on public page.
   - `tests/Feature/AdminAccessTest.php` — verify role middleware (customer gets 403, admin gets 200).
   - `tests/Feature/ContactTest.php` — submit contact form, validation.
   - `tests/Feature/SearchTest.php` — global search returns correct results.
3. Write **Unit tests** for services:
   - `tests/Unit/WeatherServiceTest.php` — mock `Http::fake()` and verify caching behavior.
   - `tests/Unit/OpenAiServiceTest.php` — mock `Http::fake()` with a fixture JSON response and verify parsing.
   - `tests/Unit/TripEstimateCostTest.php` — verify the derived attribute accessor sums correctly.
4. Run the full test suite:
   ```bash
   php artisan test
   ```

### Performance Optimization
5. Fix N+1 queries — add `$with` eager loading to models or use `->with()` in controllers:
   ```php
   // Example in TripController@show
   $trip = Trip::with(['destinations', 'hotels', 'flights', 'itineraryItems', 'aiRecommendations'])->findOrFail($id);
   ```
6. Add database indexes for frequently queried columns:
   ```bash
   php artisan make:migration add_indexes_to_tables
   ```
   ```php
   $table->index('country_id');         // destinations
   $table->index('destination_id');     // hotels, restaurants, attractions
   $table->index('user_id');           // trips, notifications, reviews, favourites
   $table->index('trip_id');           // itinerary_items, ai_recommendations
   $table->index(['reviewable_type', 'reviewable_id']); // reviews
   $table->index(['favorable_type', 'favorable_id']);   // favourites
   ```
7. Enable query caching for frequently accessed data:
   ```php
   Cache::remember('all_categories', 86400, fn() => Category::all());
   ```

### Error Handling & Logging
8. Configure logging in `config/logging.php` — use `daily` channel for production.
9. Create custom exception handler logic in `bootstrap/app.php` for:
   - API failures (log + show user-friendly message).
   - Model not found (redirect to 404).
   - Rate limiting (429 response).
10. Add rate limiting to API-calling routes:
    ```php
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/trips/{trip}/generate-itinerary', ...);
    });
    ```

### Security Best Practices
11. Ensure all forms have `@csrf`.
12. Validate all inputs via FormRequests (never trust `$request->all()` directly).
13. Use `Gate` or `Policy` for authorization on user-specific resources:
    ```bash
    php artisan make:policy TripPolicy --model=Trip
    ```
    ```php
    // TripPolicy
    public function update(User $user, Trip $trip) {
        return $user->id === $trip->user_id;
    }
    ```
14. Sanitize user-generated HTML in reviews/comments (use `strip_tags()` or `htmlspecialchars()`).
15. Set secure headers in middleware (X-Frame-Options, X-Content-Type-Options, etc.).

### Deployment
16. Set up the production server (Laravel Forge, VPS, or shared hosting).
17. Configure production `.env`:
    ```dotenv
    APP_ENV=production
    APP_DEBUG=false
    CACHE_DRIVER=redis     # or file
    SESSION_DRIVER=redis   # or database
    QUEUE_CONNECTION=database
    ```
18. Run deployment commands:
    ```bash
    composer install --optimize-autoloader --no-dev
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan migrate --force
    php artisan db:seed --class=RoleSeeder --force
    php artisan db:seed --class=SettingSeeder --force
    php artisan db:seed --class=CountrySeeder --force
    php artisan storage:link
    ```
19. Set up a cron job for the Laravel scheduler and a process monitor (Supervisor) for the queue worker:
    ```bash
    # Crontab
    * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1

    # Supervisor config for queue
    [program:threedos-worker]
    command=php /path-to-project/artisan queue:work --sleep=3 --tries=3
    autostart=true
    autorestart=true
    ```
20. Run the full test suite on production:
    ```bash
    php artisan test
    ```
21. Final smoke test: Register a user, complete onboarding, create a trip, generate AI itinerary, add hotel, write a review, check admin dashboard charts.

**Acceptance Criteria:**
- [ ] `php artisan test` passes all feature and unit tests (green).
- [ ] No N+1 queries detected (use Laravel Debugbar in dev).
- [ ] All forms have CSRF protection and FormRequest validation.
- [ ] Authorization policies prevent users from accessing other users' trips.
- [ ] Production site loads with cached config/routes/views.
- [ ] Queue worker runs continuously and processes jobs.
- [ ] Full user journey (register → onboard → trip → itinerary → review) works end-to-end.

---

## Summary: Phase Dependency Map

```
Phase 1 (Foundation)
  └─► Phase 2 (Database)
       └─► Phase 3 (Auth + Spatie RBAC)
            ├─► Phase 4 (Country Seeding)
            │    └─► Phase 5 (Places Seeding)
            ├─► Phase 7 (Service Layer)
            └─► Phase 8 (Survey/Onboarding)
                 └─► Phase 9 (Trip CRUD)
                      ├─► Phase 10 (AI Generation)
                      │    └─► Phase 17 (Jobs & Notifications)
                      ├─► Phase 11 (Weather Widget)
                      ├─► Phase 12 (Bookings & Pivots)
                      └─► Phase 13 (Favourites & Reviews)

Phase 4 (Image Upload) ──► Used by Phases 5, 6, 9, 18
Phase 14 (Search & Filter) ──► Applied across all index pages
Phase 15 (Maps) ──► Applied to Destinations, Trips, Places
Phase 16 (Settings & Contact) ──► Independent (can run after Phase 3)
Phase 18 (Admin CRUD) ──► Depends on all entity phases
Phase 19 (Analytics & UI Polish) ──► Depends on Phase 18
Phase 20 (QA & Deploy) ──► Final phase, depends on all above
```