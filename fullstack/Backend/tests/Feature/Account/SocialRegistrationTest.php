<?php

namespace Tests\Feature\Account;

use App\Models\Account\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_phone_for_new_oauth_user_returns_token(): void
    {
        $user = User::factory()->create([
            'email' => 'oauth@example.com',
            'google_id' => 'google-abc-123',
            'phone' => null,
        ]);

        $this->actingAs($user, 'api')
            ->postJson('/api/auth/social/complete', ['phone' => '+201234567890'])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Registration completed successfully.',
            ])
            ->assertJsonPath('data.user.phone', '+201234567890')
            ->assertJsonStructure(['data' => ['token']]);

        $this->assertSame('+201234567890', $user->fresh()->phone);
    }

    public function test_invalid_phone_is_rejected(): void
    {
        $user = User::factory()->create([
            'email' => 'oauth2@example.com',
            'google_id' => 'google-abc-456',
            'phone' => null,
        ]);

        $this->actingAs($user, 'api')
            ->postJson('/api/auth/social/complete', ['phone' => 'ab'])
            ->assertStatus(422);
    }

    public function test_completing_phone_requires_authentication(): void
    {
        $this->postJson('/api/auth/social/complete', ['phone' => '+201234567890'])
            ->assertStatus(401);
    }
}