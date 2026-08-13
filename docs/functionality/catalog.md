# Functionality — Catalog Domain

Source-verified from: controllers, services, repositories, requests, resources, models, `route:list --json`, migrations, console commands, seeders. Audit date: 2026-08-13.

## Scope

Catalog = countries, destinations, categories, hotels, flights, restaurants, attractions: public listing/show + admin CRUD with soft-delete/restore, fixture seeding, external geocoding (OpenStreetMap Nominatim) and external flight lookup (RapidAPI). Dead models (EntityView, Experience, ExperienceProvider) documented in Findings.

## Models (live)

| Model | SoftDeletes | Fillable | Key relations |
| --- | --- | --- | --- |
| Country | yes | name, iso_code, capital, flag_url, currency, languages | destinations |
| Destination | yes | country_id, name, city_name, description, image, latitude, longitude | country, category, hotels, attractions, restaurants, favourites(morph), tripDestinations, trips(btm), reviews(morph) |
| Category | yes | name, type | destinations, attractions, restaurants |
| Hotel | yes | destination_id, name, address, price_per_night, rating, stars, availability, image | destination, reviews(morph), itineraryItems(morph), trips(morphToMany), favourites(morph) |
| Flight | yes | airline, flight_number, departure_airport, arrival_airport, departure_date, arrival_date, price, booking_status | trips(morphToMany), reviews(morph), itineraryItems(morph) |
| Restaurant | yes | destination_id, category_id, name, cuisine, price_range, rating, address, image | destination, category, reviews, itineraryItems, trips, favourites |
| Attraction | yes | destination_id, category_id, name, description, image, latitude, longitude | destination, category, reviews, itineraryItems, trips, favourites |

All catalog entities share the morphable `trip_items` attachment pattern (`trips(): MorphToMany(Trip::class, 'item', 'trip_items')`) and morphable `reviews`/`favourites` (drives Trip attach/detach + InteractionController).

## Public Endpoints (envelope: ApiResponse `{success,message,data}` or JsonResource collection)

| Functionality / Feature | File(s) | Route(s) | What It Does | Key Inputs | Outputs / Return Shape | Errors / Edge Cases |
| --- | --- | --- | --- | --- | --- | --- |
| List categories | `CategoryController@index` + `CategoryService@index` | `GET api/v1/categories` (api) | All categories (incl. soft-deleted? no — plain `get()`, excludes trashed by default global scope) | — | 200 `{success,message,data:[CategoryResource(id,name,created_at,updated_at)]}` | — |
| Show category | `CategoryController@show` (route-model binding) | `GET api/v1/categories/{category}` (api) | Single category | category id | 200 `{...data:CategoryResource}` | 404 unknown id |
| List destinations | `DestinationController@index` + `DestinationService@index` | `GET api/v1/destinations` (api) | All destinations with `country` eager-loaded | — | 200 `{data:[DestinationResource]}` (id,name,city_name,description,image,lat/lng float or null,country_id,country when loaded,timestamps) | — |
| Show destination | `DestinationController@show` | `GET api/v1/destinations/{id}` (api) | Destination with country | id | 200 DestinationResource | 404 (`findOrFail`) |
| List hotels | `HotelController@index` + `HotelService@index` | `GET api/v1/hotels` (api) | **Paginated** (10/page) hotels with destination | `?page` | 200 `HotelResource` paginator (id,name,address,price_per_night float,rating float,stars,availability,image,destination_id,destination,timestamps) | — |
| Show hotel | `HotelController@show` | `GET api/v1/hotels/{id}` (api) | Hotel with destination | id | 200 HotelResource | 404 |
| List flights | `FlightController@index` + `FlightService@getPublicList` | `GET api/v1/flights` (api) | All flights | — | 200 `FlightResource` collection (dates formatted `Y-m-d H:i:s`, price float, booking_status enum value) | — |
| Show flight | `FlightController@show` | `GET api/v1/flights/{id}` (api) | Single flight | id | 200 FlightResource | 404 |
| List restaurants | `RestaurantController@index` + `RestaurantService@getPublicList` | `GET api/v1/restaurants` (api) | All restaurants with destination+category | — | 200 `RestaurantResource` collection | — |
| Show restaurant | `RestaurantController@show` | `GET api/v1/restaurants/{id}` (api) | Restaurant with destination+category | id | 200 RestaurantResource | 404 |
| List attractions | `AttractionController@index` + `AttractionService@getPublicList` | `GET api/v1/attractions` (api) | All attractions with destination+category | — | 200 `AttractionResource` collection | — |
| Show attraction | `AttractionController@show` | `GET api/v1/attractions/{id}` (api) | Attraction with destination+category | id | 200 AttractionResource | 404 |
| Delete restaurant (public) | `RestaurantController@destroy` (calls global `authorize('delete', Restaurant::class)`) | **NO ROUTE** — method exists but is not registered in `route:list` | Unreachable via HTTP | — | — | UNREACHABLE code path (dead action) |

## Admin Endpoints (all `auth:api` + `permission:manage <entity>`; prefix `api/v1/admin`)

| Functionality / Feature | File(s) | Route(s) | What It Does | Key Inputs | Outputs / Return Shape | Errors / Edge Cases |
| --- | --- | --- | --- | --- | --- | --- |
| Categories CRUD + restore | `AdminCategoryController` + `CategoryService` | GET/POST `/categories`, PUT `/categories/{category}`, DELETE `/categories/{category}`, PATCH `/categories/{id}/restore` | index(trashed via `?trashed=1`), store (201 CategoryResource), update, soft-delete, restore `onlyTrashed()->findOrFail` | name, type | CategoryResource / ApiResponse | 404 on restore of non-trashed; 422 validation |
| Countries CRUD + restore | `AdminCountryController` + `CountryService` | GET/POST `/countries`, PUT `/countries/{id}`, DELETE `/countries/{id}`, PATCH `/countries/{id}/restore` | index(trashed filter), store(201), show, update, soft-delete, restore | name, iso_code, capital?, currency?, languages? (array) | JsonResource / ApiResponse | 422 (iso_code not unique-validated); 404 |
| Destinations CRUD + restore | `AdminDestinationController` (uses `OpenStreetService` directly, not DestinationService) | GET/POST `/destinations`, PUT `/destinations/{id}`, DELETE `/destinations/{id}`, PATCH `/destinations/{id}/restore` | index **paginated** (`?per_page`, capped 100, default 15, trashed filter); store/update **auto-geocode** via Nominatim when lat/lng missing and city/country changed; restore | name, city_name, country_id, description?, image? (url), latitude?(-90..90), longitude?(-180..180) | 201/200 `ApiResponse` + destination with `country` loaded | Geo fails → fields stay null (no error); country not found → potential `$country->name` null-deref in store when country_id invalid (validation requires exists, so only via race) |
| Hotels CRUD + restore | `AdminHotelController` (model-direct, no service) | GET/POST `/hotels`, PUT `/hotels/{id}`, DELETE `/hotels/{id}`, PATCH `/hotels/{id}/restore` | index paginated (15/100) with trashed filter; store 201; update; soft-delete; restore | destination_id, name, address?, price_per_night, rating?(0..5), stars(1..5), availability(boolean), image? | JsonResource / ApiResponse | 422 validation |
| Flights CRUD + restore | `AdminFlightController` + `FlightService` | GET/POST `/flights`, PUT `/flights/{id}`, DELETE `/flights/{id}`, PATCH `/flights/{id}/restore` | index(trashed filter, latest first); store supports `source=external` (RapidAPI) or `manual`; update; delete; restore | source?(external/manual), departure_airport, arrival_airport, departure_date, arrival_date(required_if manual, after departure), airline/flight_number(required_if manual), price?, booking_status?(pending/confirmed/cancelled) | ApiResponse (index/store/update return raw model JSON, not Resource) | `source=external` without `services.rapidapi.key` → **creates fake/flakey record** (random airline/flight/price) — silent fake data; RapidAPI 502 `abort_if(!successful, 502, 'RapidAPI request failed.')`; empty results → same fake record fallback |
| Restaurants CRUD + restore | `AdminRestaurantController` + `RestaurantService` | GET/POST `/restaurants`, PUT `/restaurants/{id}`, DELETE `/restaurants/{id}`, PATCH `/restaurants/{id}/restore` | index(trashed filter); store 201; show; update; delete; restore | name, cuisine, rating(1..5 int), destination_id | JsonResource / ApiResponse | 422; note `StoreRestaurantRequest` requires rating + destination_id, other fields nullable |
| Attractions CRUD + restore | `AdminAttractionController` + `AttractionService` | GET/POST `/attractions`, PUT `/attractions/{id}`, DELETE `/attractions/{id}`, PATCH `/attractions/{id}/restore` | index(trashed filter); store 201; show; update; delete; restore | name, description, destination_id, category_id | JsonResource / ApiResponse | 422 |

## External Integrations

- **OpenStreetService** (`app/Services/Catalog/Fixtures/OpenStreetService.php`): Nominatim geocoding (`getCoordinates`) + nearby-places Overpass fan-out (`getNearbyPlaces`). Timeouts 3s connect/5s, retry(2), custom UA, cache 24h/8h. Used by `AdminDestinationController` (store/update geocode) and `MapController` (Trips domain).
- **FlightService::createFromExternalApi**: RapidAPI flight create-session. Key/host from `config('services.rapidapi.*')`. Fake-record fallback when key missing or no results (documented fake-data risk).
- **Fixture services** (`Catalog/Fixtures/*`): Country/City/Flight/Hotel/Restaurant fixture loaders used by `SyncFixtures` + `SyncCities` console commands and `CountrySeeder`.

## Console Commands (catalog-adjacent)

| Command | Class | Purpose |
| --- | --- | --- |
| `sync:fixtures` (name per class `SyncFixtures`) | `app/Console/Commands/SyncFixtures.php` | Loads country/hotel/restaurant/flight fixtures from external services |
| `sync:cities` (`SyncCities`) | `app/Console/Commands/SyncCities.php` | Loads city fixtures |

## Tests (existing evidence)

`tests/Feature/Catalog/`: `AttractionTest`, `CategoryTest`, `CountryTest`, `DestinationTest`, `HotelTest`, `RestaurantTest`, `AdminTrashedRecordsTest`, `AdminRestoreTest`. Pass in Phase-0 baseline.

## Findings (verified, not fixed)

1. **DEAD MODELS** — `EntityView`, `Experience`, `ExperienceProvider` (and enum `ExperienceStatus`): zero references outside their own class files; no migrations/tables exist (dropped in migration consolidation); no routes/tests/seeders. Documented as dead/unused code. **UNUSED / DEAD CODE.**
2. **Dead request** `app/Http/Requests/Catalog/AdminAtrractionRequest.php` — declares `class n extends FormRequest` (typo filename + class name), zero references. Dead.
3. **Unreachable action** `RestaurantController@destroy` — calls `authorize('delete', Restaurant::class)` but no route registers it; also no RestaurantPolicy exists (would throw if reachable). Dead action.
4. **Fake-data fallback** in `FlightService::createFromExternalApi` — when RapidAPI key is missing or API returns no flights, admin "create external flight" silently persists randomized fake flight data (fake()->randomElement etc.). Production risk if key unset.
5. **Inconsistent response shapes**: admin flights return raw model JSON via `ApiResponse`, admin categories return `CategoryResource`, admin hotels/restaurants/attractions return generic `JsonResource` (all columns) — three different shapes for the same "admin list" concept.
6. **Inconsistent pagination**: destinations/hotels paginate (15/100 cap); categories/countries/flights/restaurants/attractions return full collections (`get()`).
7. Public listing endpoints are unauthenticated (`api` middleware only) — by design, but note destinations/hotels expose all columns incl. soft-deleted exclusion is automatic.
8. `StoreCountryRequest` does not validate `iso_code` uniqueness; `countries.iso_code` has no unique index in the migration (string(3), no unique). Duplicate ISO codes allowed by both validation and schema.
