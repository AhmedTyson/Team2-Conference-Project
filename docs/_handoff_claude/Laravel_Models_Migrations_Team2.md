# Full Laravel Implementation Guide (Team 2 ERD)
**Project:** ThreeDOS — Smart AI Travel Planner

This document provides the **complete** Laravel migration schema and Eloquent model definitions for **all 19 entities** (including `Flight` and `TripDestination`) and their relationships. 

---

## 1. Migration Order (Crucial for Foreign Keys)
To prevent foreign key constraint errors, migrations must run in this exact order:

1. Independent tables & Parents (`settings`, `contact_messages`, `countries`, `categories`)
2. Users & User profiles (`users`, `surveys`)
3. Destinations (`destinations`)
4. Places & Travel (`attractions`, `hotels`, `restaurants`, `flights`)
5. Trip Planning (`trips`, `trip_destinations`, `itinerary_items`, `ai_recommendations`)
6. Interactions (`notifications`, `reviews`, `favourites`)
7. Pivot Tables (`attraction_trip`, `hotel_trip`, `restaurant_trip`, `flight_trip`)

---

## 2. Complete Migrations (19 Tables)

```php
// Note: Roles and Permissions are handled dynamically by the 'spatie/laravel-permission' package.
// Run `php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"` to generate those tables.

// 1. settings table
Schema::create('settings', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique();
    $table->text('value')->nullable();
    $table->timestamps();
});

// 3. contact_messages table
Schema::create('contact_messages', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email');
    $table->text('message');
    $table->enum('status', ['unread', 'read', 'resolved'])->default('unread');
    $table->timestamps();
});

// 4. countries table
Schema::create('countries', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('iso_code', 2);
    $table->string('capital')->nullable();
    $table->string('flag_url')->nullable();
    $table->string('currency')->nullable();
    $table->json('languages')->nullable(); // Multivalued
    $table->timestamps();
});

// 5. categories table
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('type');
    $table->string('icon')->nullable(); // Visual icon for UI
    $table->timestamps();
});

// 5. users table (Role handling moved to Spatie)
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->string('profile_image')->nullable(); // Personalization
    $table->rememberToken();
    $table->timestamps();
});

// 7. surveys table
Schema::create('surveys', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('travel_style')->nullable();
    $table->string('budget_level')->nullable();
    $table->json('interests')->nullable(); // Multivalued
    $table->timestamps();
});

// 8. destinations table
Schema::create('destinations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('country_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('city_name')->nullable();
    $table->text('description')->nullable();
    $table->string('image')->nullable();
    $table->decimal('latitude', 10, 8)->nullable();
    $table->decimal('longitude', 11, 8)->nullable();
    $table->timestamps();
});

// 9. attractions table
Schema::create('attractions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('image')->nullable();
    $table->decimal('latitude', 10, 8)->nullable();
    $table->decimal('longitude', 11, 8)->nullable();
    $table->timestamps();
});

// 10. hotels table
Schema::create('hotels', function (Blueprint $table) {
    $table->id();
    $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('address')->nullable();
    $table->decimal('price_per_night', 8, 2)->nullable();
    $table->decimal('rating', 3, 2)->nullable();
    $table->integer('stars')->nullable();
    $table->boolean('availability')->default(true);
    $table->string('image')->nullable();
    $table->timestamps();
});

// 11. restaurants table
Schema::create('restaurants', function (Blueprint $table) {
    $table->id();
    $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
    $table->string('name');
    $table->string('cuisine')->nullable();
    $table->string('price_range')->nullable();
    $table->decimal('rating', 3, 2)->nullable();
    $table->string('address')->nullable();
    $table->string('image')->nullable();
    $table->timestamps();
});

// 12. flights table
Schema::create('flights', function (Blueprint $table) {
    $table->id();
    $table->string('departure_airport');
    $table->string('arrival_airport');
    $table->dateTime('departure_date');
    $table->dateTime('arrival_date');
    $table->decimal('price', 8, 2)->nullable();
    $table->string('booking_status')->default('pending');
    $table->timestamps();
});

// 13. trips table
Schema::create('trips', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('travel_style')->nullable();
    $table->json('interests')->nullable(); // Multivalued
    $table->integer('no_of_travelers')->default(1);
    $table->decimal('budget', 10, 2);
    $table->integer('no_of_days');
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();
    $table->string('status')->default('planned');
    $table->string('cover_image')->nullable(); // Dashboard image
    $table->timestamps();
});

// 14. trip_destinations table (Associative Entity)
Schema::create('trip_destinations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->foreignId('destination_id')->constrained()->cascadeOnDelete();
    $table->integer('day_number')->nullable();
    $table->integer('visit_order')->nullable();
    $table->date('estimated_date')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});

// 15. itinerary_items table
Schema::create('itinerary_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->integer('day_number');
    $table->integer('item_order');
    $table->string('type'); // 'hotel', 'flight', 'activity'
    $table->time('time_slot')->nullable();
    $table->string('title');
    $table->text('notes')->nullable();
    $table->decimal('estimated_cost', 8, 2)->nullable();
    $table->timestamps();
});

// 16. ai_recommendations table
Schema::create('ai_recommendations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->text('prompt_text');
    $table->longText('response_text');
    $table->string('model_used');
    $table->integer('tokens_used');
    $table->timestamp('generated_at');
    $table->timestamps();
});

// 17. notifications table
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->string('type');
    $table->text('body');
    $table->json('data')->nullable();
    $table->string('status')->default('unread');
    $table->timestamps();
});

// 18. reviews table (Polymorphic)
Schema::create('reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->morphs('reviewable'); // Adds reviewable_id & reviewable_type
    $table->tinyInteger('rating');
    $table->text('comment')->nullable();
    $table->string('status')->default('pending');
    $table->timestamps();
});

// 19. favourites table (Polymorphic)
Schema::create('favourites', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->morphs('favorable'); // Adds favorable_id & favorable_type
    $table->text('note')->nullable();
    $table->timestamps();
});

// M:N Pivot Tables
Schema::create('attraction_trip', function (Blueprint $table) {
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->foreignId('attraction_id')->constrained()->cascadeOnDelete();
});
Schema::create('hotel_trip', function (Blueprint $table) {
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->foreignId('hotel_id')->constrained()->cascadeOnDelete();
});
Schema::create('restaurant_trip', function (Blueprint $table) {
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
});
Schema::create('flight_trip', function (Blueprint $table) {
    $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
    $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
});
```

---

## 3. Complete Eloquent Models (19 Models)

### Independent Models
```php
class Setting extends Model {
    protected $fillable = ['key', 'value'];
}

class ContactMessage extends Model {
    protected $fillable = ['name', 'email', 'message', 'status'];
}
```

### Identity Models
```php
use Spatie\Permission\Traits\HasRoles;

class User extends Model {
    use HasRoles; // Injects Spatie's role and permission methods

    protected $fillable = ['name', 'email', 'password', 'profile_image'];
    protected $hidden = ['password', 'remember_token'];
    
    public function survey() { return $this->hasOne(Survey::class); }
    public function trips() { return $this->hasMany(Trip::class); }
    public function notifications() { return $this->hasMany(Notification::class); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function favourites() { return $this->hasMany(Favourite::class); }
}

class Survey extends Model {
    protected $fillable = ['user_id', 'travel_style', 'budget_level', 'interests'];
    protected $casts = ['interests' => 'array'];
    public function user() { return $this->belongsTo(User::class); }
}
```

### Geography Models
```php
class Country extends Model {
    protected $fillable = ['name', 'iso_code', 'capital', 'flag_url', 'currency', 'languages'];
    protected $casts = ['languages' => 'array'];
    public function destinations() { return $this->hasMany(Destination::class); }
}

class Destination extends Model {
    protected $fillable = ['country_id', 'name', 'city_name', 'description', 'image', 'latitude', 'longitude'];
    
    public function country() { return $this->belongsTo(Country::class); }
    public function attractions() { return $this->hasMany(Attraction::class); }
    public function hotels() { return $this->hasMany(Hotel::class); }
    public function restaurants() { return $this->hasMany(Restaurant::class); }
    
    // Associative Entity
    public function trips() { return $this->belongsToMany(Trip::class, 'trip_destinations')->using(TripDestination::class)->withPivot('day_number', 'visit_order', 'estimated_date', 'notes'); }
    
    // Polymorphics
    public function reviews() { return $this->morphMany(Review::class, 'reviewable'); }
    public function favourites() { return $this->morphMany(Favourite::class, 'favorable'); }
}
```

### Places & Travel Models
```php
class Category extends Model {
    protected $fillable = ['name', 'type', 'icon'];
    public function attractions() { return $this->hasMany(Attraction::class); }
    public function restaurants() { return $this->hasMany(Restaurant::class); }
}

class Attraction extends Model {
    protected $fillable = ['destination_id', 'category_id', 'name', 'description', 'image', 'latitude', 'longitude'];
    public function destination() { return $this->belongsTo(Destination::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function trips() { return $this->belongsToMany(Trip::class); }
    public function reviews() { return $this->morphMany(Review::class, 'reviewable'); }
    public function favourites() { return $this->morphMany(Favourite::class, 'favorable'); }
}

class Hotel extends Model {
    protected $fillable = ['destination_id', 'name', 'address', 'price_per_night', 'rating', 'stars', 'availability', 'image'];
    public function destination() { return $this->belongsTo(Destination::class); }
    public function trips() { return $this->belongsToMany(Trip::class); }
    public function reviews() { return $this->morphMany(Review::class, 'reviewable'); }
    public function favourites() { return $this->morphMany(Favourite::class, 'favorable'); }
}

class Restaurant extends Model {
    protected $fillable = ['destination_id', 'category_id', 'name', 'cuisine', 'price_range', 'rating', 'address', 'image'];
    public function destination() { return $this->belongsTo(Destination::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function trips() { return $this->belongsToMany(Trip::class); }
    public function reviews() { return $this->morphMany(Review::class, 'reviewable'); }
    public function favourites() { return $this->morphMany(Favourite::class, 'favorable'); }
}

class Flight extends Model {
    protected $fillable = ['departure_airport', 'arrival_airport', 'departure_date', 'arrival_date', 'price', 'booking_status'];
    protected $casts = ['departure_date' => 'datetime', 'arrival_date' => 'datetime'];
    public function trips() { return $this->belongsToMany(Trip::class); }
}
```

### Trip Planning Models
```php
class Trip extends Model {
    protected $fillable = ['user_id', 'title', 'travel_style', 'interests', 'no_of_travelers', 'budget', 'no_of_days', 'start_date', 'end_date', 'status', 'cover_image'];
    protected $casts = ['interests' => 'array'];
    
    // Derived attribute accessor for "estimate_cost"
    public function getEstimateCostAttribute() { return $this->itineraryItems()->sum('estimated_cost'); }

    public function user() { return $this->belongsTo(User::class); }
    public function itineraryItems() { return $this->hasMany(ItineraryItem::class); }
    public function aiRecommendations() { return $this->hasMany(AiRecommendation::class); }
    
    // M:N Relationships
    public function destinations() { return $this->belongsToMany(Destination::class, 'trip_destinations')->using(TripDestination::class)->withPivot('day_number', 'visit_order', 'estimated_date', 'notes'); }
    public function hotels() { return $this->belongsToMany(Hotel::class); }
    public function restaurants() { return $this->belongsToMany(Restaurant::class); }
    public function attractions() { return $this->belongsToMany(Attraction::class); }
    public function flights() { return $this->belongsToMany(Flight::class); }
}

use Illuminate\Database\Eloquent\Relations\Pivot;
class TripDestination extends Pivot {
    protected $table = 'trip_destinations';
    // Pivot models allow us to treat the Associative Entity as a real Eloquent Object
}

class ItineraryItem extends Model {
    protected $fillable = ['trip_id', 'day_number', 'item_order', 'type', 'time_slot', 'title', 'notes', 'estimated_cost'];
    public function trip() { return $this->belongsTo(Trip::class); }
}

class AiRecommendation extends Model {
    protected $fillable = ['trip_id', 'prompt_text', 'response_text', 'model_used', 'tokens_used', 'generated_at'];
    protected $casts = ['generated_at' => 'datetime'];
    public function trip() { return $this->belongsTo(Trip::class); }
}
```

### Interaction Models (Polymorphics)
```php
class Notification extends Model {
    protected $fillable = ['user_id', 'title', 'type', 'body', 'data', 'status'];
    protected $casts = ['data' => 'array'];
    public function user() { return $this->belongsTo(User::class); }
}

class Review extends Model {
    protected $fillable = ['user_id', 'rating', 'comment', 'status'];
    public function user() { return $this->belongsTo(User::class); }
    // Polymorphic Parent
    public function reviewable() { return $this->morphTo(); }
}

class Favourite extends Model {
    protected $fillable = ['user_id', 'note'];
    public function user() { return $this->belongsTo(User::class); }
    // Polymorphic Parent
    public function favorable() { return $this->morphTo(); }
}
```