<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The 'user' role must exist so AuthController::register can assign it.
        Role::firstOrCreate(['name' => 'user', 'guard_name' => 'api']);
    }

    public function test_user_can_register_and_receives_token(): void
    {
        Notification::fake();

        $payload = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('message', 'user created')
                 ->assertJsonPath('user.email', 'john@example.com')
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'roles']]);

        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue($user->hasRole('user'));

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_user_can_login_and_receives_token(): void
    {
        $user = User::factory()->create(['email' => 'login@example.com']);

        $response = $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'user logged in successfully')
                 ->assertJsonPath('user.email', 'login@example.com')
                 ->assertJsonStructure(['token']);
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        $user = User::factory()->create(['email' => 'login@example.com']);

        $response = $this->postJson('/api/login', [
            'email' => 'login@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
                 ->assertJsonPath('message', 'Invalid email or password');
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'api')
            ->getJson('/api/user')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
    }

    public function test_user_can_logout_and_token_is_invalidated(): void
    {
        $user = User::factory()->create(['email' => 'logout@example.com']);

        $login = $this->postJson('/api/login', [
            'email' => 'logout@example.com',
            'password' => 'password',
        ]);
        $token = $login->json('token');

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertStatus(200)
            ->assertJsonPath('message', 'User Logged out Successfully');

        // The blacklisted token must no longer authenticate requests.
        $this->withToken($token)->getJson('/api/user')->assertStatus(401);
    }

    public function test_user_can_refresh_token(): void
    {
        $user = User::factory()->create(['email' => 'refresh@example.com']);

        $login = $this->postJson('/api/login', [
            'email' => 'refresh@example.com',
            'password' => 'password',
        ]);
        $oldToken = $login->json('token');

        $response = $this->withToken($oldToken)->postJson('/api/refresh');

        $response->assertStatus(200)->assertJsonStructure(['token']);

        $newToken = $response->json('token');
        $this->assertNotEquals($oldToken, $newToken);

        // The refreshed token is valid for authenticated requests.
        $this->withToken($newToken)->getJson('/api/user')->assertStatus(200);
    }

    public function test_forgot_password_sends_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'forgot@example.com']);

        $this->postJson('/api/forgot-password', ['email' => 'forgot@example.com'])
            ->assertStatus(200)
            ->assertJsonStructure(['message']);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_user_can_reset_password(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'reset@example.com',
            'token' => $token,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['message']);

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));

        // New password can be used to log in.
        $this->postJson('/api/login', [
            'email' => 'reset@example.com',
            'password' => 'new-password-123',
        ])->assertStatus(200)->assertJsonStructure(['token']);
    }
}
