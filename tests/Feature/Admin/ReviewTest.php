<?php

namespace Tests\Feature\Admin;

use App\Enums\ReviewStatus;
use App\Models\Hotel;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage reviews', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage reviews']);
    }

    private function makeReview(array $overrides = []): Review
    {
        $hotel = Hotel::factory()->create();

        return Review::factory()->create(array_merge([
            'reviewable_id' => $hotel->id,
            'reviewable_type' => Hotel::class,
            'status' => ReviewStatus::PENDING->value,
        ], $overrides));
    }

    public function test_admin_can_list_reviews_paginated_15(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Review::factory()->count(17)->create([
            'reviewable_id' => Hotel::factory()->create()->id,
            'reviewable_type' => Hotel::class,
        ]);

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/reviews');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(15, 'data');
    }

    public function test_admin_approve_review_persists_approved_status(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $review = $this->makeReview();

        $response = $this->actingAs($admin, 'api')
            ->patchJson("/api/v1/admin/reviews/{$review->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Review approved successfully.')
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'status' => ReviewStatus::APPROVED->value,
        ]);
    }

    public function test_admin_reject_review_persists_rejected_status(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $review = $this->makeReview();

        $response = $this->actingAs($admin, 'api')
            ->patchJson("/api/v1/admin/reviews/{$review->id}/reject");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Review rejected successfully.')
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'status' => ReviewStatus::REJECTED->value,
        ]);
    }

    public function test_admin_can_destroy_review(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $review = $this->makeReview();

        $response = $this->actingAs($admin, 'api')
            ->deleteJson("/api/v1/admin/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Review deleted successfully.');

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_traveler_cannot_moderate_reviews(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $review = $this->makeReview();

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/reviews')->assertStatus(403);
        $this->actingAs($user, 'api')->patchJson("/api/v1/admin/reviews/{$review->id}/approve")->assertStatus(403);
        $this->actingAs($user, 'api')->patchJson("/api/v1/admin/reviews/{$review->id}/reject")->assertStatus(403);
        $this->actingAs($user, 'api')->deleteJson("/api/v1/admin/reviews/{$review->id}")->assertStatus(403);
    }
}