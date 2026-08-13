<?php

namespace Tests\Feature\Trips;

use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use LucianoTonet\GroqLaravel\Facades\Groq;
use Mockery;
use Tests\TestCase;

class AiQuotaCacheHitTest extends TestCase
{
    use RefreshDatabase;

    private function ownerWithQuota(): User
    {
        $owner = User::factory()->create(['is_active' => true]);
        $plan = Plan::factory()->create(['ai_quota_monthly' => 5]);
        Subscription::factory()->create([
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'renews_at' => now()->addMonth(),
        ]);

        $owner->forceFill([
            'ai_generations_count' => 0,
            'ai_reset_at' => now()->addMonth(),
        ])->save();

        return $owner;
    }

    private function tripWithItem(User $owner): Trip
    {
        $trip = Trip::factory()->create(['user_id' => $owner->id, 'title' => 'My Trip']);

        ItineraryItem::factory()->create([
            'trip_id' => $trip->id,
            'itemable_id' => Attraction::factory()->create([
                'latitude' => 30.0,
                'longitude' => 31.2,
            ])->id,
            'itemable_type' => Attraction::class,
            'day_number' => 1,
            'item_order' => 1,
        ]);

        return $trip;
    }

    private function mockGroqOnce(): void
    {
        $chain = Mockery::mock();
        $chain->shouldReceive('completions')->andReturnSelf();
        $chain->shouldReceive('create')->andReturn([
            'choices' => [
                ['message' => ['content' => '{"review_summary":"Great trip","suggestions":["Add more time in Cairo"]}']],
            ],
        ]);

        $chat = Mockery::mock();
        $chat->shouldReceive('completions')->andReturn($chain);

        Groq::shouldReceive('chat')->once()->andReturn($chat);
    }

    /*
    |--------------------------------------------------------------------------
    | R15 — AI quota not consumed on cache hit
    |--------------------------------------------------------------------------
    */

    public function test_r15_quota_decremented_once_on_cache_miss_then_hit(): void
    {
        $user = $this->ownerWithQuota();
        $trip = $this->tripWithItem($user);

        Cache::flush();

        // First call — cache miss, quota consumed, Groq called.
        $this->mockGroqOnce();

        $this->actingAs($user, 'api')
            ->getJson("/api/review/{$trip->id}")
            ->assertOk();

        $this->assertEquals(1, $user->fresh()->ai_generations_count);

        // Second identical call — cache hit, quota NOT consumed, Groq NOT called again.
        Groq::shouldReceive('chat')->never();

        $this->actingAs($user, 'api')
            ->getJson("/api/review/{$trip->id}")
            ->assertOk();

        $this->assertEquals(1, $user->fresh()->ai_generations_count);
    }

    public function test_r15_cache_hit_does_not_consume_quota(): void
    {
        $user = $this->ownerWithQuota();
        $trip = $this->tripWithItem($user);

        Cache::flush();

        // Prime cache.
        $this->mockGroqOnce();

        $this->actingAs($user, 'api')
            ->getJson("/api/review/{$trip->id}")
            ->assertOk();

        $this->assertEquals(1, $user->fresh()->ai_generations_count);

        // Clear Groq expectations — second call should NOT call Groq.
        Groq::shouldReceive('chat')->never();

        // Second call — served from cache.
        $this->actingAs($user, 'api')
            ->getJson("/api/review/{$trip->id}")
            ->assertOk();

        // Quota must remain at 1 — cache hit should not have decremented.
        $this->assertEquals(1, $user->fresh()->ai_generations_count);
    }

    public function test_r15_cache_key_scoped_to_trip_content(): void
    {
        $user = $this->ownerWithQuota();
        $trip1 = $this->tripWithItem($user);
        $trip1->update(['title' => 'Trip One']);

        $trip2 = Trip::factory()->create(['user_id' => $user->id, 'title' => 'Trip Two']);
        ItineraryItem::factory()->create([
            'trip_id' => $trip2->id,
            'itemable_id' => Attraction::factory()->create([
                'latitude' => 31.0,
                'longitude' => 32.0,
            ])->id,
            'itemable_type' => Attraction::class,
            'day_number' => 1,
            'item_order' => 1,
        ]);

        Cache::flush();

        // First trip — cache miss, quota +1.
        $chain = Mockery::mock();
        $chain->shouldReceive('completions')->andReturnSelf();
        $chain->shouldReceive('create')->andReturn([
            'choices' => [
                ['message' => ['content' => '{"review_summary":"One"}']],
            ],
        ]);

        $chat = Mockery::mock();
        $chat->shouldReceive('completions')->andReturn($chain);
        Groq::shouldReceive('chat')->once()->andReturn($chat);

        $this->actingAs($user, 'api')
            ->getJson("/api/review/{$trip1->id}")
            ->assertOk();

        $this->assertEquals(1, $user->fresh()->ai_generations_count);

        // Second trip — different cache key, cache miss, quota +1.
        $chain2 = Mockery::mock();
        $chain2->shouldReceive('completions')->andReturnSelf();
        $chain2->shouldReceive('create')->andReturn([
            'choices' => [
                ['message' => ['content' => '{"review_summary":"Two"}']],
            ],
        ]);

        $chat2 = Mockery::mock();
        $chat2->shouldReceive('completions')->andReturn($chain2);
        Groq::shouldReceive('chat')->once()->andReturn($chat2);

        $this->actingAs($user, 'api')
            ->getJson("/api/review/{$trip2->id}")
            ->assertOk();

        // Quota should be 2 — each distinct trip consumed once.
        $this->assertEquals(2, $user->fresh()->ai_generations_count);
    }
}
