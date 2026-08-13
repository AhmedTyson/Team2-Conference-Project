<?php

namespace Tests\Feature\Account;

use App\Models\Account\User;
use App\Models\Trips\Trip;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailVerificationGateTest extends TestCase
{
    use RefreshDatabase;

    private User $verified;

    private User $unverified;

    private Trip $trip;

    protected function setUp(): void
    {
        parent::setUp();

        $this->verified = User::factory()->create();
        $this->unverified = User::factory()->unverified()->create();

        $this->trip = Trip::factory()->create(['user_id' => $this->verified->id]);
    }

    public function test_unverified_user_is_blocked_from_business_route(): void
    {
        $this->actingAs($this->unverified, 'api')
            ->getJson('/api/v1/trips/'.$this->trip->id)
            ->assertStatus(403)
            ->assertJsonPath('error.type', 'email_not_verified')
            ->assertJsonPath('error.status', 403);
    }

    public function test_verified_user_reaches_business_route(): void
    {
        $this->actingAs($this->verified, 'api')
            ->getJson('/api/v1/trips/'.$this->trip->id)
            ->assertStatus(200);
    }

    public function test_unverified_user_still_reaches_account_routes(): void
    {
        $this->actingAs($this->unverified, 'api')
            ->getJson('/api/user')
            ->assertStatus(200);

        $this->actingAs($this->unverified, 'api')
            ->getJson('/api/email/verify-notice')
            ->assertStatus(403)
            ->assertJsonPath('error.type', 'email_not_verified');

        $this->actingAs($this->unverified, 'api')
            ->patchJson('/api/v1/profile', ['name' => 'New Name'])
            ->assertStatus(200);
    }

    public function test_login_allowed_for_unverified_user(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => $this->unverified->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200)->assertJsonPath('success', true);
    }

    public function test_email_change_invalidates_verification_and_sends_link(): void
    {
        Notification::fake();

        $this->actingAs($this->verified, 'api')
            ->patchJson('/api/v1/profile', ['email' => 'new@example.com'])
            ->assertStatus(200);

        $user = $this->verified->fresh();

        $this->assertEquals('new@example.com', $user->email);
        $this->assertNull($user->email_verified_at);

        Notification::assertSentTo($user, VerifyEmail::class);

        $this->actingAs($user, 'api')
            ->getJson('/api/v1/trips/'.$this->trip->id)
            ->assertStatus(403)
            ->assertJsonPath('error.type', 'email_not_verified');
    }
}
