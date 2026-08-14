<?php

namespace Database\Seeders;

use App\Models\Commerce\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Plan::updateOrCreate(['id' => 1], [
            'name' => 'Free',
            'price_cents' => 0,
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'ai_quota_monthly' => 5,
            'features' => ['3 active trips', '5 AI generations / month', 'Standard catalog access'],
        ]);

        Plan::updateOrCreate(['id' => 2], [
            'name' => 'Jetsetter',
            'price_cents' => 19900,
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'ai_quota_monthly' => 100,
            'features' => [
                'Unlimited active trips',
                '100 AI Concierge generations/mo',
                'Custom trip forking & exports',
                'Verified agency assignment'
            ],
        ]);

        Plan::updateOrCreate(['id' => 3], [
            'name' => 'Imperial Concierge',
            'price_cents' => 49900,
            'currency' => 'EGP',
            'billing_cycle' => 'monthly',
            'ai_quota_monthly' => 1000,
            'features' => [
                'Everything in Jetsetter',
                'Dedicated 24/7 travel desk',
                'Unlimited AI generations',
                'VIP airport lounge vouchers'
            ],
        ]);
    }
}
