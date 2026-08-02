# Seeder-First Execution Plan

Per the specific project rule, this plan outlines how we will construct the Seeder logic for 7 core entities **before** the database or foundational migrations/models are actively deployed. 

We will write the raw `Database\Seeders\...` PHP classes. These classes will assume the Eloquent models exist and will focus purely on data fetching, parsing, and formatting.

---

## Group 1: Live API Seeding
### 1. `CountrySeeder`
* **Data Source:** Live HTTP call to `https://restcountries.com/v3.1/all`.
* **Strategy:** Use Laravel's `Http::get()`. 
* **Logic:**
  1. Fetch JSON array of ~250 countries.
  2. Loop through the array.
  3. Extract nested data: 
     - Name: `$country['name']['common']`
     - ISO: `$country['cca2']`
     - Capital: `$country['capital'][0] ?? null`
     - Flag: `$country['flags']['png'] ?? null`
     - Currency: Extract first key from `$country['currencies']`
     - Languages: `json_encode($country['languages'] ?? [])`
  4. Build the array for `Country::insert()` or `Country::updateOrCreate()`.

---

## Group 2: JSON Fixture Seeding (RapidAPI / Static Data)
Because RapidAPI has rate limits, we cannot hit it dynamically during every `db:seed`. We will assume the existence of local JSON files (`database/seeders/fixtures/*.json`) that represent cached RapidAPI responses.

### 2. `HotelSeeder`
* **Data Source:** `database/seeders/fixtures/hotels.json` (RapidAPI mockup).
* **Strategy:** `file_get_contents()` and `json_decode()`.
* **Logic:**
  1. Read local JSON containing hotel data (e.g., matching Paris, Tokyo, etc.).
  2. Map fields: `name`, `price_per_night`, `rating`, `stars`, `image_url`.
  3. **Dependency Mocking:** Assign to random `destination_id` (e.g., `rand(1, 15)`) since we are ignoring DB existence for now.

### 3. `RestaurantSeeder`
* **Data Source:** `database/seeders/fixtures/restaurants.json` OR `Faker`.
* **Strategy:** Read JSON array of popular restaurants or generate via Faker.
* **Logic:**
  1. Map fields: `name`, `cuisine` (e.g., 'Italian', 'Japanese'), `price_range` ('$$', '$$$'), `rating`, `address`, `image`.
  2. **Dependency Mocking:** Assign random `destination_id` and `category_id`.

### 4. `FlightSeeder`
* **Data Source:** `database/seeders/fixtures/flights.json` (RapidAPI mockup).
* **Strategy:** Parse local JSON representing flight schedules.
* **Logic:**
  1. Map fields: `departure_airport` (e.g., 'JFK'), `arrival_airport` (e.g., 'LHR'), `departure_date`, `arrival_date`, `price`.
  2. **Note:** Flights are independent entities (linked later via pivot to trips), so no strict foreign keys are needed during creation.

---

## Group 3: Relational & Polymorphic Seeding
These seeders require relationships (Users, Destinations, Hotels). We will construct them using Faker to simulate realistic user engagement.

### 5. `NotificationSeeder`
* **Data Source:** Faker / Hardcoded templates.
* **Strategy:** Loop through assumed user IDs.
* **Logic:**
  1. Assume User IDs `1` to `10` exist.
  2. Loop and generate 3-5 notifications per user.
  3. Map fields: `title` ("Welcome!", "Trip Updated"), `type` ('system', 'alert'), `body`, `status` ('unread', 'read').

### 6. `ReviewSeeder` (Polymorphic)
* **Data Source:** Faker.
* **Strategy:** Polymorphic seeding targeting different models.
* **Logic:**
  1. Define target classes: `[Destination::class, Hotel::class, Restaurant::class, Attraction::class]`.
  2. Loop X times. For each iteration:
     - Pick a random User ID.
     - Pick a random target class.
     - Pick a random Target ID (e.g., `1-10`).
  3. Map fields: `reviewable_type` (the class), `reviewable_id` (the ID), `rating` (1-5), `comment`, `status` ('approved').

### 7. `FavouriteSeeder` (Polymorphic)
* **Data Source:** Faker.
* **Strategy:** Same polymorphic strategy as Reviews.
* **Logic:**
  1. Pick random User ID.
  2. Pick random target class (e.g., `Hotel::class`).
  3. Pick random Target ID.
  4. Map fields: `favorable_type`, `favorable_id`, `note` (optional).
  5. Ensure uniqueness (a user shouldn't favourite the exact same hotel twice in the seeder logic).

---

## Execution Next Steps
If this plan is approved, I will generate the **7 Seeder PHP files** (and the required JSON fixtures for Group 2) and output them directly to you, independent of any database setup.