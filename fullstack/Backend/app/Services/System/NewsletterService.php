<?php

namespace App\Services\System;

use App\Models\System\NewsletterSubscriber;

class NewsletterService
{
    /**
     * Registers an email on the newsletter list.
     *
     * Returns true when a new subscriber was created, false when the
     * email was already subscribed.
     */
    public function subscribe(string $email): bool
    {
        $normalized = strtolower(trim($email));

        $subscriber = NewsletterSubscriber::firstOrCreate(['email' => $normalized]);

        return $subscriber->wasRecentlyCreated;
    }
}