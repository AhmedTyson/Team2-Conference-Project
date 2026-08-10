<?php

namespace Tests\Feature\Account;

use App\Models\Account\Role;
use App\Models\Account\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_401_on_invalid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_is_throttled_after_five_failed_attempts(): void
    {
        $response = null;

        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'nobody@example.com',
                'password' => 'wrong-password',
            ]);
        }

        $response->assertStatus(429);
    }

    public function test_register_is_throttled(): void
    {
        $response = null;

        for ($i = 0; $i < 6; $i++) {
            auth()->guard('api')->forgetUser();
            $response = $this->postJson('/api/register', [
                'name' => 'Test User',
                'email' => "user{$i}@example.com",
                'phone' => "0100000000{$i}",
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);
        }

        $response->assertStatus(429);
    }

    public function test_forgot_password_is_throttled(): void
    {
        User::factory()->create(['email' => 'throttled@example.com']);
        $response = null;

        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson('/api/forgot-password', [
                'email' => 'throttled@example.com',
            ]);
        }

        $response->assertStatus(429);
    }

    public function test_refresh_is_throttled(): void
    {
        $user = User::factory()->create();
        $token = auth('api')->login($user);
        $response = null;

        for ($i = 0; $i < 16; $i++) {
            $response = $this->withHeader('Authorization', "Bearer {$token}")
                ->postJson('/api/refresh');
        }

        $response->assertStatus(429);
    }

    public function test_login_token_contains_roles_claim(): void
    {
        $role = Role::create(['name' => 'user']);
        $user = User::factory()->create(['password' => bcrypt('password123')]);
        $user->assignRole($role);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk();

        $token = $response->json('token');
        $payload = json_decode(base64_decode(explode('.', $token)[1]), true);

        $this->assertContains('user', $payload['roles']);
    }
}
