<?php

namespace Tests\Feature\Account;

use App\Models\Account\Role;
use App\Models\Account\User;
use App\Models\Commerce\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class BlockedUserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Plan::create([
            'name' => 'Free',
            'slug' => 'free',
            'price_cents' => 0,
            'currency' => 'EGP',
            'ai_quota_monthly' => 5,
            'features' => [],
        ]);
    }

    private function makeUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'email' => 'blocked@example.com',
            'password' => 'password',
        ], $attributes));
    }

    public function test_blocked_user_cannot_login(): void
    {
        $this->makeUser(['is_active' => false]);

        $this->postJson('/api/login', [
            'email' => 'blocked@example.com',
            'password' => 'password',
        ])->assertStatus(401)
            ->assertJsonPath('error.type', 'invalid_credentials');

        $this->assertGuest('api');
    }

    public function test_active_user_can_login_normally(): void
    {
        $role = Role::firstOrCreate(['name' => 'user']);
        $user = User::factory()->create([
            'email' => 'active@example.com',
            'is_active' => true,
            'password' => 'password',
        ]);
        $user->assignRole($role);

        $response = $this->postJson('/api/login', [
            'email' => 'active@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'user logged in successfully',
                'data' => [
                    'token' => $response->json('data.token'),
                    'user' => $response->json('data.user'),
                ],
            ]);
    }

    public function test_blocked_user_existing_token_is_rejected(): void
    {
        $user = $this->makeUser(['is_active' => true]);
        $token = JWTAuth::fromUser($user);

        $user->update(['is_active' => false]);

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertStatus(403)
            ->assertJsonPath('error.type', 'account_blocked');
    }

    public function test_reactivated_user_can_authenticate_again(): void
    {
        $user = $this->makeUser(['is_active' => false]);

        $this->postJson('/api/login', [
            'email' => 'blocked@example.com',
            'password' => 'password',
        ])->assertStatus(401);

        $user->update(['is_active' => true]);

        $response = $this->postJson('/api/login', [
            'email' => 'blocked@example.com',
            'password' => 'password',
        ])->assertOk();

        $this->withToken($response->json('data.token'))
            ->getJson('/api/user')
            ->assertOk();
    }

    public function test_invalid_or_expired_token_is_not_blocked_by_account_check(): void
    {
        $this->withToken('not-a-real-token')
            ->getJson('/api/user')
            ->assertStatus(401);
    }
}
