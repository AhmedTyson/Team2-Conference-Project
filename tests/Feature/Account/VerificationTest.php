<?php

namespace Tests\Feature\Account;

use App\Models\Account\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_resend_verification()
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        $response = $this->actingAs($user, 'api')->postJson('/api/email/resend');
        $response->assertStatus(200);
    }

    public function test_verify_email_link_flow()
    {
        NotificationFacade::fake();
        Event::fake([Verified::class]);

        $user = User::factory()->create(['email_verified_at' => null]);

        $user->sendEmailVerificationNotification();

        NotificationFacade::assertSentTo(
            $user,
            VerifyEmail::class,
            function (Notification $notification, array $channels, User $notifiable) use ($user) {
                $url = $notification->toMail($user)->actionUrl;
                $this->assertStringContainsString('/email/verify/'.$user->id, $url);

                $path = parse_url($url, PHP_URL_PATH);
                $query = parse_url($url, PHP_URL_QUERY);
                $response = $this->get($path.'?'.$query);
                $response->assertStatus(200);
                $response->assertJson(['message' => 'Email verified successfully']);

                $this->assertNotNull($user->fresh()->email_verified_at);
                Event::assertDispatched(Verified::class);

                return true;
            }
        );
    }

    public function test_verify_email_invalid_hash()
    {
        $user = User::factory()->create(['email_verified_at' => null]);

        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->id,
            'hash' => 'wrong-hash',
        ]);

        $response = $this->get($url);
        $response->assertStatus(403);
        $response->assertJson(['message' => 'Invalid verification link']);
    }
}
