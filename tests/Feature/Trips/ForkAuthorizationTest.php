<?php

namespace Tests\Feature\Trips;

use App\Enums\OrderStatus;
use App\Enums\SubscriptionStatus;
use App\Interfaces\Commerce\PaymentGatewayInterface;
use App\Models\Account\User;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\Trip;
use App\Services\Trips\TripForkService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ForkAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    private function owner(): User
    {
        return User::factory()->create(['is_active' => true]);
    }

    private function buyer(): User
    {
        return User::factory()->create(['is_active' => true]);
    }

    private function privateTrip(User $owner): Trip
    {
        return Trip::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Private Original',
            'status' => 'pending',
            'is_public' => false,
        ]);
    }

    private function publicTrip(User $owner): Trip
    {
        return Trip::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Public Original',
            'status' => 'pending',
            'is_public' => true,
        ]);
    }

    private function setupPaymobMock(): void
    {
        $this->mock(PaymentGatewayInterface::class, function ($mock) {
            $mock->shouldReceive('createIntention')->andReturn([
                'success' => true,
                'client_secret' => 'test_secret',
                'checkout_url' => 'https://checkout.example.com/test',
                'message' => 'ok',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | R6 — Fork authorization follows resolved policy (D1 — Option B)
    |--------------------------------------------------------------------------
    */

    public function test_r6_checkout_rejects_fork_of_private_trip_by_non_owner(): void
    {
        $this->setupPaymobMock();

        $owner = $this->owner();
        $buyer = $this->buyer();
        $trip = $this->privateTrip($owner);

        $this->actingAs($buyer, 'api')
            ->postJson('/api/v1/checkout/initiate', [
                'type' => 'trip_fork',
                'trip_id' => $trip->id,
            ])
            ->assertStatus(403);

        // No Order, no Payment, no gateway call.
        $this->assertEquals(0, DB::table('orders')->count());
        $this->assertEquals(0, DB::table('payments')->count());
    }

    public function test_r6_checkout_rejected_for_private_trip_does_not_create_order(): void
    {
        $this->setupPaymobMock();

        $owner = $this->owner();
        $buyer = $this->buyer();
        $trip = $this->privateTrip($owner);

        $this->actingAs($buyer, 'api')
            ->postJson('/api/v1/checkout/initiate', [
                'type' => 'trip_fork',
                'trip_id' => $trip->id,
            ])
            ->assertStatus(403);

        $this->assertDatabaseMissing('orders', ['user_id' => $buyer->id]);
    }

    public function test_r6_fulfillment_does_not_copy_private_trip_to_non_owner(): void
    {
        $owner = $this->owner();
        $buyer = $this->buyer();
        $trip = $this->privateTrip($owner);

        $this->expectException(AuthorizationException::class);

        app(TripForkService::class)->fulfillFork($buyer->id, $trip->id);
    }

    public function test_r6_fulfillment_rejects_private_trip_without_paid_check(): void
    {
        $owner = $this->owner();
        $buyer = $this->buyer();
        $trip = $this->privateTrip($owner);

        $this->expectException(AuthorizationException::class);

        app(TripForkService::class)->fulfillFork($buyer->id, $trip->id);

        $this->assertEquals(0, Trip::where('parent_trip_id', $trip->id)->count());
    }

    public function test_r6_owner_can_fork_their_own_private_trip(): void
    {
        $owner = $this->owner();
        $trip = $this->privateTrip($owner);

        $forked = app(TripForkService::class)->fulfillFork($owner->id, $trip->id);

        $this->assertNotNull($forked);
        $this->assertEquals($owner->id, $forked->user_id);
        $this->assertEquals($trip->id, $forked->parent_trip_id);
    }

    /*
    |--------------------------------------------------------------------------
    | R7 — Public/shared fork follows explicit policy (D1 — Option B)
    |--------------------------------------------------------------------------
    */

    public function test_r7_checkout_allows_fork_of_public_trip_by_any_user(): void
    {
        $this->setupPaymobMock();

        $owner = $this->owner();
        $buyer = $this->buyer();
        $trip = $this->publicTrip($owner);

        $response = $this->actingAs($buyer, 'api')
            ->postJson('/api/v1/checkout/initiate', [
                'type' => 'trip_fork',
                'trip_id' => $trip->id,
            ]);

        $response->assertOk();

        $order = DB::table('orders')->where('user_id', $buyer->id)->first();
        $this->assertNotNull($order);
        $this->assertEquals(OrderStatus::PENDING->value, $order->status);
    }

    public function test_r7_fulfillment_copies_public_trip_for_non_owner(): void
    {
        $owner = $this->owner();
        $buyer = $this->buyer();
        $trip = $this->publicTrip($owner);

        $forked = app(TripForkService::class)->fulfillFork($buyer->id, $trip->id);

        $this->assertEquals($buyer->id, $forked->user_id);
        $this->assertEquals($trip->id, $forked->parent_trip_id);
        $this->assertStringContainsString('Forked', $forked->title);
    }

    public function test_r7_fork_policy_uses_is_public_flag(): void
    {
        $owner = $this->owner();
        $buyer = $this->buyer();

        $private = $this->privateTrip($owner);
        $public = $this->publicTrip($owner);

        // Private trip — fork forbidden for non-owner.
        $this->expectException(AuthorizationException::class);
        app(TripForkService::class)->fulfillFork($buyer->id, $private->id);
    }
}
