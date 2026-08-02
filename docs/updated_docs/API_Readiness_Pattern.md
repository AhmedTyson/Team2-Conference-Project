# API Readiness Pattern — Voyago / ThreeDOS

Goal: when the OpenWeather, OpenAI, and RapidAPI keys land, flipping them
on should touch **only** `app/Services/` and `.env`. Zero changes to
routes, controllers, Resources, or the frontend contract. This document
is the concrete pattern that guarantees that, plus one schema gap to
close now before it becomes a data-integrity problem.

---

## 1. The core rule: controllers depend on interfaces, never concrete services

Today only one implementation of each external-data service exists (a
fixture-backed or "unconfigured" one). That's fine — the point isn't to
build the real integration early, it's to make sure **only one file
changes** when you do.

```php
// app/Contracts/WeatherProviderContract.php
interface WeatherProviderContract
{
    public function current(string $city): array;
}

// app/Services/NullWeatherService.php   (active today)
class NullWeatherService implements WeatherProviderContract
{
    public function current(string $city): array
    {
        return ['status' => 'unconfigured', 'message' => 'Weather provider not configured yet.'];
    }
}

// app/Services/OpenWeatherService.php   (written now, activated later — see §3)
class OpenWeatherService implements WeatherProviderContract
{
    public function current(string $city): array
    {
        // real HTTP call — build this file today too, just don't bind it yet
    }
}
```

`WeatherController` type-hints `WeatherProviderContract` in its
constructor, never a concrete class. Same pattern for:

| Interface | Implementation today | Implementation later |
|---|---|---|
| `WeatherProviderContract` | `NullWeatherService` | `OpenWeatherService` |
| `AiRecommendationContract` | `NullAiService` | `OpenAiRecommendationService` |
| `HotelProviderContract` | `FixtureHotelService` (reads local DB, already populated by `fixtures:sync`) | `RapidApiHotelService` |
| `RestaurantProviderContract` | `FixtureRestaurantService` | `RapidApiRestaurantService` |
| `FlightProviderContract` | `FixtureFlightService` (already live via OpenFlights — see §4) | `RapidApiFlightService` |

Write both classes for each row now if you want, but only the left-hand
one needs to actually work today.

---

## 2. One place to swap: the service container binding

```php
// app/Providers/AppServiceProvider.php (or a dedicated ExternalApiServiceProvider)

$this->app->bind(WeatherProviderContract::class, fn () =>
    config('services.openweather.key')
        ? new OpenWeatherService()
        : new NullWeatherService()
);

$this->app->bind(AiRecommendationContract::class, fn () =>
    config('services.openai.key')
        ? new OpenAiRecommendationService()
        : new NullAiService()
);

$this->app->bind(HotelProviderContract::class, fn () =>
    config('services.rapidapi.hotels_live')
        ? new RapidApiHotelService()
        : new FixtureHotelService()
);
// same pattern for RestaurantProviderContract, FlightProviderContract
```

Turning a feature on later is: add the key to `.env`, done. No controller,
route, or migration touched. This binding logic is the **only** place in
the whole app that knows whether a given API is live or not.

---

## 3. `.env.example` — declare every key now, even unused ones

```env
OPENWEATHER_API_KEY=
OPENAI_API_KEY=
RAPIDAPI_KEY=
RAPIDAPI_HOTELS_HOST=
RAPIDAPI_FLIGHTS_HOST=
RAPIDAPI_RESTAURANTS_HOST=
RAPIDAPI_HOTELS_LIVE=false
```

Every teammate cloning the repo sees exactly which providers exist and
which are currently off — self-documenting readiness.

---

## 4. Schema gap to close now (this is the one real blocker to "ready")

Checked `Laravel_Models_Migrations_Team2.md`: **none** of `hotels`,
`restaurants`, or `flights` have a `source` or `external_id` column.

Why this matters for readiness: when `RapidApiHotelService` eventually
writes real hotels into the same `hotels` table, it needs a stable key to
know "have I already inserted this exact hotel before?" Without one,
every re-sync (or every future `fixtures:sync` run) will **duplicate**
rows instead of updating them — and this isn't even a future problem:
`FlightFixtureService` is *already* pulling live from OpenFlights today,
so this exact duplication risk exists right now, not just after RapidAPI
unblocks.

**Fix — one additive migration, safe to run today:**

```php
Schema::table('hotels', function (Blueprint $table) {
    $table->string('source')->default('manual')->after('image');       // manual|rapidapi
    $table->string('external_id')->nullable()->after('source');
    $table->unique(['source', 'external_id']);
});
// identical addition to restaurants and flights
```

Then every fixture/live service writes with:

```php
Hotel::updateOrCreate(
    ['source' => 'rapidapi', 'external_id' => $apiHotel['id']],
    ['name' => ..., 'price_per_night' => ..., /* ... */]
);
```

`updateOrCreate` on a real unique key makes every sync — fixture or live,
today or after the keys land — idempotent by construction. This is the
single schema change that actually determines whether "ready for future
API implementation" is true or just aspirational.

---

## 5. Resources stay identical either way

`HotelResource` shapes its JSON from the `Hotel` model's attributes only —
it has no idea whether that row came from `hotels.json` or a live
RapidAPI call. As long as both service implementations write to the same
columns (guaranteed by §1's shared interface + §4's shared schema), the
frontend/Stitch UI contract never changes when the switch flips.

---

## 6. Tests never accidentally hit a real API

Because everything is bound through an interface, tests bind fakes:

```php
$this->app->bind(WeatherProviderContract::class, fn () => new class implements WeatherProviderContract {
    public function current(string $city): array { return ['temp' => 24, 'condition' => 'clear']; }
});
```

Even after real keys exist in production `.env`, CI/test runs stay
offline and deterministic unless a test explicitly opts into hitting the
real service.

---

## Checklist — "ready" means all of these are true, independent of key status

- [ ] Every external-data concern has an interface (`*Contract`) — controllers never see a concrete class
- [ ] The container binding is the single switch point (config-driven, §2)
- [ ] `.env.example` lists every key, even ones nobody has yet
- [ ] `hotels`, `restaurants`, `flights` have `source` + `external_id` with a unique index (§4) — **do this one now, it's cheap and already relevant to the live Flights sync**
- [ ] All writes go through `updateOrCreate()` on that unique key, not `create()`
- [ ] API Resources are keyed off model attributes only, never off "which service populated this"
