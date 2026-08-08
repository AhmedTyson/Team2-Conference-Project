<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'trip_fork_price_cents', 'value' => (string) env('SITE_FORK_PRICE_CENTS', 50000)], // 500 EGP
            ['key' => 'platform_booking_commission_rate', 'value' => (string) env('PLATFORM_COMMISSION_RATE', 0.05)], // 5%
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], ['value' => $setting['value']]);
        }
    }
}
