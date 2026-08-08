<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Temporary route for visual Mailable testing in local environments
if (app()->environment('local')) {
    Route::get('/mail-preview/{type}', function ($type) {
        $user = new \App\Models\User(['name' => 'John Doe', 'email' => 'john@example.com']);
        
        switch ($type) {
            case 'welcome':
                return new \App\Mail\WelcomeMail($user);
            
            case 'payment-success':
                $order = new \App\Models\Order(['id' => 8492, 'total_cents' => 150000, 'currency' => 'EGP']);
                $order->created_at = now();
                return new \App\Mail\PaymentSuccessMail($user, $order);

            case 'payment-failed':
                $order = new \App\Models\Order(['id' => 8492, 'total_cents' => 150000, 'currency' => 'EGP']);
                return new \App\Mail\PaymentFailedMail($user, $order);

            case 'trip-forked':
                $originalTrip = new \App\Models\Trip(['id' => 10, 'title' => 'Amazing 7-Day Paris Trip']);
                $originalTrip->setRelation('user', $user);
                
                $destination = new \App\Models\Destination(['name' => 'Paris']);
                $originalTrip->setRelation('destinations', collect([$destination]));

                $forkedTrip = new \App\Models\Trip(['id' => 11, 'title' => 'Amazing 7-Day Paris Trip (Forked)']);
                return new \App\Mail\TripForkedMail($forkedTrip, $originalTrip);

            case 'subscription':
                $plan = new \App\Models\Plan(['name' => 'Pro Explorer', 'ai_quota_monthly' => 100]);
                $subscription = new \App\Models\Subscription(['id' => 1]);
                $subscription->setRelation('plan', $plan);
                return new \App\Mail\SubscriptionActivatedMail($user, $subscription);

            default:
                return 'Invalid mail type. Options: welcome, payment-success, payment-failed, trip-forked, subscription';
        }
    });
}
