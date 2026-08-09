<?php

use App\Mail\PaymentFailedMail;
use App\Mail\PaymentSuccessMail;
use App\Mail\SubscriptionActivatedMail;
use App\Mail\TripForkedMail;
use App\Mail\WelcomeMail;
use App\Models\Account\User;
use App\Models\Catalog\Destination;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Trip;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Temporary route for visual Mailable testing in local environments
if (app()->environment('local')) {
    Route::get('/mail-preview/{type}', function ($type) {
        $user = new User(['name' => 'John Doe', 'email' => 'john@example.com']);

        switch ($type) {
            case 'welcome':
                return new WelcomeMail($user);

            case 'payment-success':
                $order = new Order(['id' => 8492, 'total_cents' => 150000, 'currency' => 'EGP']);
                $order->created_at = now();

                return new PaymentSuccessMail($user, $order);

            case 'payment-failed':
                $order = new Order(['id' => 8492, 'total_cents' => 150000, 'currency' => 'EGP']);

                return new PaymentFailedMail($user, $order);

            case 'trip-forked':
                $originalTrip = new Trip(['id' => 10, 'title' => 'Amazing 7-Day Paris Trip']);
                $originalTrip->setRelation('user', $user);

                $destination = new Destination(['name' => 'Paris']);
                $originalTrip->setRelation('destinations', collect([$destination]));

                $forkedTrip = new Trip(['id' => 11, 'title' => 'Amazing 7-Day Paris Trip (Forked)']);

                return new TripForkedMail($forkedTrip, $originalTrip);

            case 'subscription':
                $plan = new Plan(['name' => 'Pro Explorer', 'ai_quota_monthly' => 100]);
                $subscription = new Subscription(['id' => 1]);
                $subscription->setRelation('plan', $plan);

                return new SubscriptionActivatedMail($user, $subscription);

            default:
                return 'Invalid mail type. Options: welcome, payment-success, payment-failed, trip-forked, subscription';
        }
    });
}
