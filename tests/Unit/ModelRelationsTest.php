<?php

namespace Tests\Unit;

use App\Enums\BudgetLevel;
use App\Enums\ReviewStatus;
use App\Enums\TripStatus;
use App\Models\Attraction;
use App\Models\Category;
use App\Models\Country;
use App\Models\Destination;
use App\Models\Favourite;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Survey;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Guard;
use Tests\TestCase;
use Tymon\JWTAuth\Contracts\JWTSubject;

class ModelRelationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_one_survey(): void
    {
        $user = User::factory()->create();
        $survey = Survey::factory()->create([
            'user_id' => $user->id,
            'budget_level' => BudgetLevel::MEDIUM->value,
        ]);

        $this->assertInstanceOf(HasOne::class, $user->survey());
        $this->assertTrue($user->survey->is($survey));
        $this->assertSame($user->id, $survey->user_id);
    }

    public function test_user_has_many_trips(): void
    {
        $user = User::factory()->create();
        $tripA = Trip::factory()->create(['user_id' => $user->id]);
        $tripB = Trip::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(HasMany::class, $user->trips());
        $this->assertSame(2, $user->trips()->count());
        $this->assertTrue($user->trips->contains($tripA));
        $this->assertTrue($user->trips->contains($tripB));
    }

    public function test_user_has_many_favourites(): void
    {
        $user = User::factory()->create();
        $hotel = Hotel::factory()->create();
        $user->favourites()->create([
            'favorable_id' => $hotel->id,
            'favorable_type' => 'hotel',
        ]);

        $this->assertInstanceOf(HasMany::class, $user->favourites());
        $this->assertSame(1, $user->favourites()->count());
    }

    public function test_user_has_many_reviews(): void
    {
        $user = User::factory()->create();
        $hotel = Hotel::factory()->create();

        $review = new Review([
            'user_id' => $user->id,
            'reviewable_id' => $hotel->id,
            'reviewable_type' => 'hotel',
            'rating' => 5,
            'comment' => 'Great stay',
        ]);
        $review->status = ReviewStatus::PENDING;
        $review->save();

        $this->assertInstanceOf(HasMany::class, $user->reviews());
        $this->assertSame(1, $user->reviews()->count());
        $this->assertTrue($user->reviews->first()->is($review));
    }

    public function test_user_guard_name_is_api(): void
    {
        $user = User::factory()->create();

        $this->assertSame(['api'], Guard::getNames($user)->all());
        $this->assertSame('api', Guard::getDefaultName(User::class));
    }

    public function test_user_implements_jwt_subject(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(JWTSubject::class, $user);
        $this->assertSame($user->id, $user->getJWTIdentifier());
        $this->assertIsArray($user->getJWTCustomClaims());
    }

    public function test_trip_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(BelongsTo::class, $trip->user());
        $this->assertTrue($trip->user->is($user));
    }

    public function test_trip_belongs_to_many_destinations_through_trip_destinations(): void
    {
        $trip = Trip::factory()->create();
        $destination = Destination::factory()->create();

        $relation = $trip->destinations();
        $this->assertInstanceOf(BelongsToMany::class, $relation);
        $this->assertSame('trip_destinations', $relation->getTable());

        $trip->destinations()->attach($destination->id, [
            'day_number' => 1,
            'visit_order' => 2,
        ]);

        $this->assertSame(1, $trip->destinations()->count());
        $this->assertTrue($trip->destinations->first()->is($destination));
        $this->assertDatabaseHas('trip_destinations', [
            'trip_id' => $trip->id,
            'destination_id' => $destination->id,
            'day_number' => 1,
            'visit_order' => 2,
        ]);
    }

    public function test_trip_morphed_by_many_hotels_stores_hotel_alias(): void
    {
        $trip = Trip::factory()->create();
        $hotel = Hotel::factory()->create();

        $this->assertInstanceOf(MorphToMany::class, $trip->hotels());
        $trip->hotels()->attach($hotel->id);

        $this->assertSame(1, $trip->hotels()->count());
        $this->assertTrue($trip->hotels->first()->is($hotel));
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'hotel',
            'item_id' => $hotel->id,
        ]);
    }

    public function test_trip_morphed_by_many_restaurants_stores_restaurant_alias(): void
    {
        $trip = Trip::factory()->create();
        $restaurant = Restaurant::factory()->create();

        $this->assertInstanceOf(MorphToMany::class, $trip->restaurants());
        $trip->restaurants()->attach($restaurant->id);

        $this->assertSame(1, $trip->restaurants()->count());
        $this->assertTrue($trip->restaurants->first()->is($restaurant));
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'restaurant',
            'item_id' => $restaurant->id,
        ]);
    }

    public function test_trip_morphed_by_many_attractions_stores_attraction_alias(): void
    {
        $trip = Trip::factory()->create();
        $attraction = Attraction::factory()->create();

        $this->assertInstanceOf(MorphToMany::class, $trip->attractions());
        $trip->attractions()->attach($attraction->id);

        $this->assertSame(1, $trip->attractions()->count());
        $this->assertTrue($trip->attractions->first()->is($attraction));
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'attraction',
            'item_id' => $attraction->id,
        ]);
    }

    public function test_trip_morphed_by_many_flights_stores_flight_alias(): void
    {
        $trip = Trip::factory()->create();
        $flight = Flight::factory()->create();

        $this->assertInstanceOf(MorphToMany::class, $trip->flights());
        $trip->flights()->attach($flight->id);

        $this->assertSame(1, $trip->flights()->count());
        $this->assertTrue($trip->flights->first()->is($flight));
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'flight',
            'item_id' => $flight->id,
        ]);
    }

    public function test_trip_casts_status_enum_interests_array_and_date_fields(): void
    {
        $trip = Trip::factory()->create([
            'status' => TripStatus::PLANNING->value,
            'interests' => ['food', 'history'],
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-10',
        ]);

        $fresh = $trip->fresh();

        $this->assertInstanceOf(TripStatus::class, $fresh->status);
        $this->assertSame(TripStatus::PLANNING, $fresh->status);
        $this->assertIsArray($fresh->interests);
        $this->assertSame(['food', 'history'], $fresh->interests);
        $this->assertInstanceOf(Carbon::class, $fresh->start_date);
        $this->assertInstanceOf(Carbon::class, $fresh->end_date);
        $this->assertSame('2026-09-01', $fresh->start_date->toDateString());
        $this->assertSame('2026-09-10', $fresh->end_date->toDateString());

        $this->assertSame(TripStatus::class, $trip->getCasts()['status']);
        $this->assertSame('array', $trip->getCasts()['interests']);
        $this->assertSame('date', $trip->getCasts()['start_date']);
        $this->assertSame('date', $trip->getCasts()['end_date']);
    }

    public function test_hotel_belongs_to_destination(): void
    {
        $hotel = Hotel::factory()->create();

        $this->assertInstanceOf(BelongsTo::class, $hotel->destination());
        $this->assertInstanceOf(Destination::class, $hotel->destination);
        $this->assertSame($hotel->destination_id, $hotel->destination->id);
    }

    public function test_hotel_morph_many_reviews(): void
    {
        $hotel = Hotel::factory()->create();
        $user = User::factory()->create();

        $review = new Review([
            'user_id' => $user->id,
            'reviewable_id' => $hotel->id,
            'reviewable_type' => 'hotel',
            'rating' => 4,
            'comment' => 'Lovely',
        ]);
        $review->status = ReviewStatus::APPROVED;
        $review->save();

        $this->assertInstanceOf(MorphMany::class, $hotel->reviews());
        $this->assertSame(1, $hotel->reviews()->count());
        $this->assertTrue($hotel->reviews->first()->is($review));
    }

    public function test_hotel_morph_many_favourites_stores_alias(): void
    {
        $hotel = Hotel::factory()->create();
        $user = User::factory()->create();

        $hotel->favourites()->create(['user_id' => $user->id, 'note' => 'Nice']);

        $this->assertInstanceOf(MorphMany::class, $hotel->favourites());
        $this->assertSame(1, $hotel->favourites()->count());
        $this->assertDatabaseHas('favourites', [
            'favorable_type' => 'hotel',
            'favorable_id' => $hotel->id,
        ]);
    }

    public function test_hotel_morph_many_itinerary_items_stores_alias(): void
    {
        $hotel = Hotel::factory()->create();
        $trip = Trip::factory()->create();

        $item = $hotel->itineraryItems()->create([
            'trip_id' => $trip->id,
            'day_number' => 1,
            'item_order' => 1,
            'type' => 'hotel',
            'time_slot' => 'morning',
            'title' => 'Check-in',
            'notes' => 'Arrive noon',
            'estimated_cost' => 120,
        ]);

        $this->assertInstanceOf(MorphMany::class, $hotel->itineraryItems());
        $this->assertSame(1, $hotel->itineraryItems()->count());
        $this->assertDatabaseHas('itinerary_items', [
            'id' => $item->id,
            'itemable_type' => 'hotel',
            'itemable_id' => $hotel->id,
        ]);
        $this->assertInstanceOf(Hotel::class, $item->itemable);
    }

    public function test_hotel_morphed_by_many_trips(): void
    {
        $hotel = Hotel::factory()->create();
        $trip = Trip::factory()->create();

        $this->assertInstanceOf(MorphToMany::class, $hotel->trips());
        $hotel->trips()->attach($trip->id);

        $this->assertSame(1, $hotel->trips()->count());
        $this->assertTrue($hotel->trips->first()->is($trip));
        $this->assertDatabaseHas('trip_items', [
            'trip_id' => $trip->id,
            'item_type' => 'hotel',
            'item_id' => $hotel->id,
        ]);
    }

    public function test_restaurant_relationships(): void
    {
        $restaurant = Restaurant::factory()->create();

        $this->assertInstanceOf(BelongsTo::class, $restaurant->destination());
        $this->assertInstanceOf(Destination::class, $restaurant->destination);
        $this->assertInstanceOf(MorphMany::class, $restaurant->reviews());
        $this->assertInstanceOf(MorphMany::class, $restaurant->favourites());
        $this->assertInstanceOf(MorphMany::class, $restaurant->itineraryItems());
        $this->assertInstanceOf(MorphToMany::class, $restaurant->trips());
        $this->assertSame($restaurant->destination_id, $restaurant->destination->id);
    }

    public function test_attraction_relationships(): void
    {
        $attraction = Attraction::factory()->create();

        $this->assertInstanceOf(BelongsTo::class, $attraction->destination());
        $this->assertInstanceOf(Destination::class, $attraction->destination);
        $this->assertInstanceOf(MorphMany::class, $attraction->reviews());
        $this->assertInstanceOf(MorphMany::class, $attraction->favourites());
        $this->assertInstanceOf(MorphMany::class, $attraction->itineraryItems());
        $this->assertInstanceOf(MorphToMany::class, $attraction->trips());
        $this->assertSame($attraction->destination_id, $attraction->destination->id);
    }

    public function test_review_morph_to_resolves_hotel_alias(): void
    {
        $hotel = Hotel::factory()->create();
        $user = User::factory()->create();

        $review = new Review([
            'user_id' => $user->id,
            'reviewable_id' => $hotel->id,
            'reviewable_type' => 'hotel',
            'rating' => 5,
            'comment' => 'Perfect',
        ]);
        $review->status = ReviewStatus::PENDING;
        $review->save();

        $this->assertInstanceOf(MorphTo::class, $review->reviewable());
        $this->assertSame('hotel', $review->getAttribute('reviewable_type'));
        $this->assertInstanceOf(Hotel::class, $review->reviewable);
        $this->assertTrue($review->reviewable->is($hotel));
    }

    public function test_favourite_morph_to_resolves_hotel_alias(): void
    {
        $hotel = Hotel::factory()->create();
        $user = User::factory()->create();

        $favourite = Favourite::create([
            'user_id' => $user->id,
            'favorable_id' => $hotel->id,
            'favorable_type' => 'hotel',
            'note' => 'Must book',
        ]);

        $this->assertInstanceOf(MorphTo::class, $favourite->favorable());
        $this->assertSame('hotel', $favourite->getAttribute('favorable_type'));
        $this->assertInstanceOf(Hotel::class, $favourite->favorable);
        $this->assertTrue($favourite->favorable->is($hotel));
    }

    public function test_country_has_many_destinations(): void
    {
        $country = Country::factory()->create();
        Destination::factory()->count(2)->create(['country_id' => $country->id]);

        $this->assertInstanceOf(HasMany::class, $country->destinations());
        $this->assertSame(2, $country->destinations()->count());
    }

    public function test_category_has_many_attractions_and_restaurants(): void
    {
        $category = Category::factory()->create();
        Attraction::factory()->count(2)->create(['category_id' => $category->id]);
        Restaurant::factory()->count(3)->create(['category_id' => $category->id]);

        $this->assertInstanceOf(HasMany::class, $category->attractions());
        $this->assertInstanceOf(HasMany::class, $category->restaurants());
        $this->assertSame(2, $category->attractions()->count());
        $this->assertSame(3, $category->restaurants()->count());
    }

    public function test_category_destinations_relation_is_defined(): void
    {
        // DB-level assertion impossible: destinations table has no category_id column.
        $category = new Category();
        $this->assertInstanceOf(HasMany::class, $category->destinations());
    }

    public function test_trip_items_pivot_rows_use_aliases_not_class_names(): void
    {
        $trip = Trip::factory()->create();
        $hotel = Hotel::factory()->create();
        $restaurant = Restaurant::factory()->create();
        $attraction = Attraction::factory()->create();
        $flight = Flight::factory()->create();

        $trip->hotels()->attach($hotel->id);
        $trip->restaurants()->attach($restaurant->id);
        $trip->attractions()->attach($attraction->id);
        $trip->flights()->attach($flight->id);

        $types = DB::table('trip_items')
            ->where('trip_id', $trip->id)
            ->pluck('item_type')
            ->all();

        $this->assertEqualsCanonicalizing(['hotel', 'restaurant', 'attraction', 'flight'], $types);
        $this->assertNotContains(Hotel::class, $types);
    }
}
