<?php

namespace Tests\Unit;

use App\Models\Account\User;
use App\Models\Catalog\Category;
use App\Models\Catalog\Hotel;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Sprint1UnitTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_have_roles()
    {
        $user = User::factory()->create();
        $this->assertTrue(method_exists($user, 'assignRole'), 'Sarah/Lojy: User role trait missing');
    }

    public function test_trip_relationships()
    {
        $trip = new Trip;
        $this->assertTrue(method_exists($trip, 'destinations'), 'Fady: Trip destinations missing');
        $this->assertTrue(method_exists($trip, 'hotels'), 'Fady/Adham: Trip hotels morph missing');
    }

    public function test_category_relationships()
    {
        $category = new Category;
        $this->assertTrue(method_exists($category, 'hotels') || method_exists($category, 'destinations') || method_exists($category, 'restaurants'), 'Rana: Category relationships missing');
    }

    public function test_inventory_reviews_polymorphic()
    {
        $hotel = new Hotel;
        $this->assertTrue(method_exists($hotel, 'reviews'), 'Kenzy: Hotel reviews missing');
    }
}
