<?php

namespace Database\Seeders;

use App\Models\System\ContactMessage;
use Illuminate\Database\Seeder;

class ContactMessageSeeder extends Seeder
{
    public function run(): void
    {
        $messages = [
            [
                'name' => 'Lord Edward Harrington',
                'email' => 'harrington@monaco-yachting.com',
                'subject' => 'VVIP Private Jet & Yacht Charter Inquiry for Red Sea Expedition',
                'message' => 'Greetings, we require a dedicated luxury concierge team for a 7-day private yacht expedition sailing from Sharm El Sheikh to Luxor. Please connect us with your top Egyptian Customer Support representative.',
                'status' => 'unread',
                'created_at' => now()->subHours(2),
            ],
            [
                'name' => 'Sophia Al-Mansoor',
                'email' => 'sophia@dubai-capital.ae',
                'subject' => 'Corporate Retreat Booking in Cairo & Aswan',
                'message' => 'We are organizing an executive board retreat for 15 directors in October 2026. Requesting 5-star hotel suites at Four Seasons Nile Plaza and private after-hours GEM museum access.',
                'status' => 'unread',
                'created_at' => now()->subHours(5),
            ],
            [
                'name' => 'Jean-Luc Moreau',
                'email' => 'jeanluc@paris-luxury.fr',
                'subject' => 'Partnership Inquiry for Luxury Boutique Stays',
                'message' => 'Our hotel collection in Paris and Riviera would love to integrate directly with Itinera AI Concierge and Agency platform.',
                'status' => 'read',
                'created_at' => now()->subDay(),
            ],
            [
                'name' => 'Dr. Layla Hassan',
                'email' => 'layla.hassan@cairo-heritage.org',
                'subject' => 'Exclusive Cultural & Historic Landmark Access',
                'message' => 'Confirmed private evening tour schedule for Palace of Versailles and Luxor Temple VIP guests.',
                'status' => 'resolved',
                'created_at' => now()->subDays(2),
            ],
        ];

        foreach ($messages as $msg) {
            ContactMessage::firstOrCreate(
                ['email' => $msg['email'], 'subject' => $msg['subject']],
                $msg
            );
        }
    }
}
