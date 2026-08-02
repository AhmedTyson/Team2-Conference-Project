# 🗄️ Phase 2: Database Schema & Models

<callout icon="🏗️" color="purple_bg">
**Phase 2 Goal:** Translate the ThreeDOS ERD into 19 Laravel Migrations and Eloquent Models with fully defined relationships.
</callout>

---

## 📜 Migration Execution Order
<callout icon="⚠️" color="red_bg">
**Critical:** Migrations must be created and executed in the exact order below to prevent Foreign Key constraint violations.
</callout>

1. <span color="blue">**Independent Tables:**</span> `settings`, `contact_messages`, `countries`, `categories`
2. <span color="blue">**User Profiles:**</span> `users` (Breeze default + `profile_image`), `surveys`
3. <span color="blue">**Geography:**</span> `destinations`
4. <span color="blue">**Places:**</span> `attractions`, `hotels`, `restaurants`, `flights`
5. <span color="blue">**Trip Core:**</span> `trips`, `trip_destinations` (pivot), `itinerary_items`, `ai_recommendations`
6. <span color="blue">**Polymorphics:**</span> `notifications`, `reviews`, `favourites`
7. <span color="blue">**M:N Pivots:**</span> `attraction_trip`, `hotel_trip`, `restaurant_trip`, `flight_trip`

---

## 🧩 Eloquent Model Assignments

| Model | Required Relationships | Special Casts |
| :--- | :--- | :--- |
| `User` | `hasOne(Survey)`, `hasMany(Trip)`, `HasRoles` trait | `password` (hashed) |
| `Survey` | `belongsTo(User)` | `interests` (array) |
| `Country` | `hasMany(Destination)` | `languages` (array) |
| `Destination`| `belongsTo(Country)`, `morphMany(Review)`, `morphMany(Favourite)` | None |
| `Trip` | `belongsToMany(Hotel, Flight, Destination, etc.)` | `interests` (array) |
| `AiRecommendation`| `belongsTo(Trip)` | `generated_at` (datetime) |
| `Review` | `morphTo(reviewable)` | None |

---

## 🛑 Definition of Done
<callout icon="✅" color="green_bg">
* `php artisan migrate:fresh` runs entirely without throwing constraint errors.
* 19 Models exist in `app/Models/` with their `$fillable` arrays populated.
* The `spatie` tables (`roles`, `permissions`, `model_has_roles`) exist in the database.
</callout>