<?php

namespace Tests\Feature;

use App\Mail\PaymentFailedMail;
use App\Mail\PaymentSuccessMail;
use App\Mail\SubscriptionActivatedMail;
use App\Mail\TripForkedMail;
use App\Mail\WelcomeMail;
use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\Plan;
use App\Models\Commerce\Subscription;
use App\Models\Trips\Trip;
use App\Notifications\PaymentFailedNotification;
use App\Notifications\PaymentSucceededNotification;
use App\Notifications\SubscriptionActivatedNotification;
use App\Notifications\TripForkedNotification;
use App\Notifications\WelcomeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_notification_builds_correct_mailable()
    {
        $user = User::factory()->create(['name' => 'Jane Doe']);
        $notification = new WelcomeNotification;

        $mailable = $notification->toMail($user);

        $this->assertInstanceOf(WelcomeMail::class, $mailable);
        $this->assertEquals($user->email, $mailable->to[0]['address']);

        // Render to verify content binding
        $html = $mailable->render();
        $this->assertStringContainsString('Welcome aboard, Jane Doe', $html);
    }

    public function test_payment_success_notification_builds_correct_mailable()
    {
        $user = User::factory()->create(['name' => 'John Smith', 'email' => 'john@test.com']);
        $order = Order::create(['user_id' => $user->id, 'total_cents' => 25050, 'currency' => 'EGP']);

        $notification = new PaymentSucceededNotification($order);

        $mailable = $notification->toMail($user);

        $this->assertInstanceOf(PaymentSuccessMail::class, $mailable);
        $this->assertEquals($user->email, $mailable->to[0]['address']);

        $html = $mailable->render();
        $this->assertStringContainsString('250.50 EGP', $html);
        $this->assertStringContainsString((string) $order->id, $html);
    }

    public function test_payment_failed_notification_builds_correct_mailable()
    {
        $user = User::factory()->create(['name' => 'John Smith']);
        $order = Order::create(['user_id' => $user->id, 'total_cents' => 9999, 'currency' => 'USD']);

        $notification = new PaymentFailedNotification($order);
        $mailable = $notification->toMail($user);

        $this->assertInstanceOf(PaymentFailedMail::class, $mailable);

        $html = $mailable->render();
        $this->assertStringContainsString('Payment not completed', $html);
        $this->assertStringContainsString('99.99 USD', $html);
    }

    public function test_trip_forked_notification_builds_correct_mailable()
    {
        $originalUser = User::factory()->create(['name' => 'Original Creator', 'email' => 'creator@test.com']);
        $forkingUser = User::factory()->create();

        $originalTrip = Trip::create([
            'user_id' => $originalUser->id,
            'title' => 'Japan Explorer',
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 1000,
            'no_of_days' => 5,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(10),
            'status' => 'pending',
        ]);

        $forkedTrip = Trip::create([
            'user_id' => $forkingUser->id,
            'title' => 'Japan Explorer (Forked)',
            'travel_style' => 'solo',
            'no_of_travelers' => 1,
            'budget' => 1000,
            'no_of_days' => 5,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(10),
            'status' => 'pending',
            'parent_trip_id' => $originalTrip->id,
            'is_fork' => true,
        ]);

        $notification = new TripForkedNotification($forkedTrip, $originalTrip);
        $mailable = $notification->toMail($originalUser);

        $this->assertInstanceOf(TripForkedMail::class, $mailable);

        $html = $mailable->render();
        $this->assertStringContainsString('Japan Explorer', $html);
        $this->assertStringContainsString('Hi <strong>Original Creator</strong>,', $html);
    }

    public function test_subscription_activated_notification_builds_correct_mailable()
    {
        $user = User::factory()->create(['name' => 'Sub User']);
        $plan = Plan::create(['name' => 'Elite Plus', 'ai_quota_monthly' => 500, 'is_active' => true]);

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'price_cents' => 0,
            'currency' => 'EGP',
        ]);

        $notification = new SubscriptionActivatedNotification($subscription);
        $mailable = $notification->toMail($user);

        $this->assertInstanceOf(SubscriptionActivatedMail::class, $mailable);

        $html = $mailable->render();
        $this->assertStringContainsString('Elite Plus', $html);
        $this->assertStringContainsString('500', $html);
    }
}
