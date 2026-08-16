<?php

namespace Tests\Feature\Trips;

use App\Models\Account\User;
use App\Models\Trips\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CommunityForkTripTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'user', 'guard_name' => 'api']);
    }

    public function test_user_can_fork_public_community_trip(): void
    {
        $author = User::factory()->create();
        $author->assignRole('user');

        $originalTrip = Trip::factory()->create([
            'user_id' => $author->id,
            'title' => 'Community Shared Bali Adventure',
            'status' => 'planned',
            'is_public' => true,
        ]);

        $forker = User::factory()->create();
        $forker->assignRole('user');

        $response = $this->actingAs($forker, 'api')->postJson("/api/trips/{$originalTrip->id}/fork");

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Community Shared Bali Adventure (Forked)');

        $this->assertDatabaseHas('trips', [
            'user_id' => $forker->id,
            'title' => 'Community Shared Bali Adventure (Forked)',
            'is_public' => false,
        ]);
    }

    public function test_cannot_fork_private_trip_without_permission(): void
    {
        $owner = User::factory()->create();

        $privateTrip = Trip::factory()->create([
            'user_id' => $owner->id,
            'title' => 'Secret Private Trip',
            'status' => 'planned',
            'is_public' => false,
        ]);

        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger, 'api')->postJson("/api/trips/{$privateTrip->id}/fork");

        $response->assertStatus(403);
    }
}
