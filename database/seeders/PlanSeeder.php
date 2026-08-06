<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'price_cents' => 0,
                'currency' => 'EGP',
                'billing_cycle' => 'monthly',
                'ai_quota_monthly' => 5,
                'features' => ['3 trips', '5 AI generations / month'],
            ],
            [
                'name' => 'Pro',
                'price_cents' => 19900,
                'currency' => 'EGP',
                'billing_cycle' => 'monthly',
                'ai_quota_monthly' => 50,
                'features' => ['Unlimited trips', '50 AI generations / month', 'Priority support'],
            ],
            [
                'name' => 'Business',
                'price_cents' => 49900,
                'currency' => 'EGP',
                'billing_cycle' => 'monthly',
                'ai_quota_monthly' => 200,
                'features' => ['Unlimited trips', '200 AI generations / month', 'API access'],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
