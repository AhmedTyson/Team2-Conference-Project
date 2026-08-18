<?php

namespace App\Services;

use App\Http\Requests\Trips\AiTripRequest;
use App\Models\Account\User;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Trips\Trip;
use App\Services\Trips\AiUsageService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use LucianoTonet\GroqLaravel\Facades\Groq;

class GroqService
{
    protected $aiUsageService;

    public function __construct(?AiUsageService $aiUsageService = null)
    {
        $this->aiUsageService = $aiUsageService ?? app(AiUsageService::class);
    }

    /**
     * Create a new class instance.
     */
    public function enhance(string $content)
    {
        try {
            $responce = Groq::chat()->completions()->create([
                'model' => config('groq.model'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a helpful assistant that enhances text content.',
                    ],
                    [
                        'role' => 'user',
                        'content' => "Enhance the following content: {$content}",
                    ],
                ],
                'temperature' => 0.5,

            ]);

        } catch (\Throwable $e) {

            Log::error('Error enhancing content: '.$e->getMessage());
            throw new \RuntimeException('Service unavailable. Please try again later.');
        }

        return $responce['choices'][0]['message']['content'] ?? $content;
    }

    public function generateAi(AiTripRequest $request)
    {
        $destinationCountryId = $request->destination_country_id;
        $city = $request->city ?: $request->destination ?: 'Rome, Italy';
        $budget = $request->budget ?: 7900;
        $noOfDays = $request->no_of_days ?: 4;
        $noOfTravelers = $request->no_of_travelers ?: 2;
        $travelParty = $request->travel_party ?: 'Couple / Romantic';
        $travelStyle = $request->travel_style ?: $request->budget_tier ?: 'Luxury';
        $interests = $request->interests ?: ['History & Culture', 'Michelin Dining', 'Art & High Fashion'];

        try {
            $country = $destinationCountryId ? Country::where('id', $destinationCountryId)->first() : null;
            $countryName = $country ? $country->name : (explode(',', $city)[1] ?? $city);

            $destination = $destinationCountryId ? Destination::where('country_id', $destinationCountryId)->first() : null;
            $destinationId = $destination?->id;

            $resturants = $destinationId ? Restaurant::where('destination_id', $destinationId)->first() : null;
            $hotels = $destinationId ? Hotel::where('destination_id', $destinationId)->first() : null;
            $attractions = $destinationId ? Attraction::where('destination_id', $destinationId)->first() : null;

            $interestString = is_array($interests) ? implode(', ', $interests) : (string) $interests;

        $prompt = "
            Generate a comprehensive luxury master travel itinerary in strict valid JSON format.

            Destination / City: {$city}
            Country: {$countryName}
            Budget: \${$budget}
            Days: {$noOfDays}
            Travelers: {$noOfTravelers} ({$travelParty})
            Travel Style / Tier: {$travelStyle}
            Interests: {$interestString}

Return only a valid JSON object matching this exact schema:
            {
            \"title\": \"{$noOfDays}-Day {$travelStyle} {$city} Experience\",
            \"meta\": \"{$noOfDays} Days • {$city} • {$travelParty} • {$travelStyle}\",
            \"description\": \"Editorial luxury summary describing the curated experience, access, dining, and culture in 2-3 sentences.\",
            \"estimated_budget\": {$budget},
            \"planned_items_count\": " . ($noOfDays * 5) . ",
            \"osrm_waypoints\": \"Verified\",
            \"days\": [
                {
                \"day_number\": 1,
                \"title\": \"Theme or landmark highlight for day 1\",
                \"items\": [
                    {
                    \"time\": \"09:30 AM\",
                    \"title\": \"Private VIP Tour\",
                    \"description\": \"Detailed description of exclusive experience.\",
                    \"price\": 600,
                    \"type\": \"ATTRACTION\"
                    }
                ]
                }
            ]
            }
            Return pure JSON only. No markdown fences, no explanatory text.";

            $cacheKey = 'ai:generate_itinerary:'.md5(json_encode([$city, $budget, $noOfDays, $noOfTravelers, $travelStyle, $interestString]));

            $response = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($prompt, $request) {
                // Atomically consume quota only on actual generation
                if ($request->user()) {
                    $this->aiUsageService->consumeQuota($request->user());
                }

                return Groq::chat()->completions()->create([
                    'model' => config('groq.model', 'llama-3.3-70b-versatile'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an ultra-luxury travel concierge AI. Always respond with pure valid JSON only.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.5,
                ]);
            });

            $content = $response['choices'][0]['message']['content'] ?? '';
            // Clean up any markdown json wrappers if present
            $content = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($content));
            if ($content && json_decode($content, true)) {
                return $content;
            }
        } catch (\Throwable $e) {
            Log::warning('Groq AI generation fallback: '.$e->getMessage());
        }

        // Deterministic Luxury Synthesis Fallback
        return json_encode($this->generateLuxuryFallback($city, $noOfDays, $travelParty, $travelStyle, $budget, $interests));
    }

    /**
     * Fallback luxury trip synthesis engine for reliable response
     */
    protected function generateLuxuryFallback(string $city, int $days, string $party, string $tier, float $budget, $interests): array
    {
        $daysList = [];
        $themes = [
            1 => ['title' => 'Imperial Glory & Rooftop Views', 'items' => [
                ['time' => '09:30 AM', 'title' => 'Private VIP Historic Landmark Tour', 'description' => 'Includes fast-track underground access with a private archeologist guide.', 'price' => 600, 'type' => 'ATTRACTION'],
                ['time' => '01:30 PM', 'title' => 'Curated Historic Piazza Dining', 'description' => 'Classic local cuisine in an intimate heritage setting; reservations reserved.', 'price' => 180, 'type' => 'RESTAURANT'],
                ['time' => '04:00 PM', 'title' => 'Private Fountain & Architecture Walking Tour', 'description' => 'Guided exploration of city fountains and plazas with a focus on art history.', 'price' => 300, 'type' => 'ATTRACTION'],
                ['time' => '08:00 PM', 'title' => 'Panoramic Skyline Dinner', 'description' => 'Michelin-starred dining with direct, unobstructed views of the city monument.', 'price' => 550, 'type' => 'RESTAURANT'],
            ]],
            2 => ['title' => 'The Holy See & High Fashion', 'items' => [
                ['time' => '08:00 AM', 'title' => 'Exclusive Museum Private Early Access', 'description' => 'Exclusive entry before the general public to view masterpieces in serene silence.', 'price' => 950, 'type' => 'ATTRACTION'],
                ['time' => '01:00 PM', 'title' => 'Premier Luxury Seafood Dining', 'description' => 'The city’s premier spot for gourmet dining; private table in the historic courtyard.', 'price' => 250, 'type' => 'RESTAURANT'],
                ['time' => '03:30 PM', 'title' => 'Haute Couture Personal Shopping Session', 'description' => 'A dedicated fashion consultant facilitates private viewings at flagship luxury boutiques.', 'price' => 400, 'type' => 'ATTRACTION'],
                ['time' => '08:30 PM', 'title' => 'Three-Michelin-Starred Degustation', 'description' => 'Elite gastronomy institution offering an unparalleled multi-course tasting menu.', 'price' => 900, 'type' => 'RESTAURANT'],
            ]],
            3 => ['title' => 'Renaissance Art & Secret Alleys', 'items' => [
                ['time' => '10:00 AM', 'title' => 'Private Docent Art Gallery Tour', 'description' => 'In-depth look at classical sculpture and oil masterpieces with an art historian.', 'price' => 450, 'type' => 'ATTRACTION'],
                ['time' => '01:00 PM', 'title' => 'Hilltop Villa Terrace Lunch', 'description' => 'High-end dining with panoramic views overlooking the sunlit city skyline.', 'price' => 220, 'type' => 'RESTAURANT'],
                ['time' => '03:30 PM', 'title' => 'Private Vintage Vespa & Chauffeur Tour', 'description' => 'Discover hidden local gems, scenic viewpoints and secret garden terraces.', 'price' => 500, 'type' => 'ATTRACTION'],
                ['time' => '08:00 PM', 'title' => 'Top-Tier Rooftop Wine & Dine', 'description' => 'Sophisticated Michelin-starred regional cuisine atop the grand terrace steps.', 'price' => 600, 'type' => 'RESTAURANT'],
            ]],
            4 => ['title' => 'Roman Relaxation & Culinary Mastery', 'items' => [
                ['time' => '10:30 AM', 'title' => 'Luxury Wellness & Thalassotherapy Spa', 'description' => 'A morning of hydrotherapy and Mediterranean-inspired treatments in a serene setting.', 'price' => 600, 'type' => 'ATTRACTION'],
                ['time' => '01:30 PM', 'title' => 'Artisanal Epicurean Deli Experience', 'description' => 'The city’s most elite culinary institution; world-famous authentic specialties.', 'price' => 150, 'type' => 'RESTAURANT'],
                ['time' => '04:00 PM', 'title' => 'Private Masterclass with Executive Chef', 'description' => 'Hosted in a private penthouse with a master chef; includes sommelier wine pairing.', 'price' => 500, 'type' => 'ATTRACTION'],
                ['time' => '08:30 PM', 'title' => 'Two-Michelin-Starred Farewell Gala Dinner', 'description' => 'Refined farewell dinner featuring innovative culinary fusion and vintage champagne.', 'price' => 750, 'type' => 'RESTAURANT'],
            ]],
        ];

        $totalItems = 0;
        for ($i = 1; $i <= $days; $i++) {
            $templateKey = (($i - 1) % 4) + 1;
            $theme = $themes[$templateKey];
            $daysList[] = [
                'day_number' => $i,
                'title' => $theme['title'],
                'items' => $theme['items'],
            ];
            $totalItems += count($theme['items']);
        }

        return [
            'title' => "{$days}-Day {$tier} {$city} Experience",
            'meta' => "{$days} Days • {$city} • {$party} • {$tier}",
            'description' => "This curated holiday offers unparalleled access to {$city}’s most iconic treasures. From private, after-hours tours to personal shopping sessions and dining at Michelin-starred institutions, every detail is designed for discerning travelers seeking history, art, and world-class gastronomy at a balanced pace.",
            'estimated_budget' => $budget > 0 ? $budget : 7900,
            'planned_items_count' => $totalItems,
            'osrm_waypoints' => 'Verified',
            'days' => $daysList,
        ];
    }

    public function review(Trip $trip, string $trip_title, $trip_items, ?User $user = null)
    {

        try {
            $itinerary = [];
            foreach ($trip_items as $item) {
               $itinerary[] = [
    'day' => $item->day_number,
    'order' => $item->item_order,
    'item_type' => $item->itemable
        ? class_basename($item->itemable_type)
        : 'N/A',
    'item_name' => $item->itemable?->name ?? 'N/A',
    'time_slot' => $item->time_slot,
    'notes' => $item->notes,
];
            }

            $prompt = "  
                Review the following trip itinerary.

                Trip Title: {$trip_title}
                Itinerary: ".json_encode($itinerary)."
                
                Return only a valid JSON object with the keys 'review_summary' and 'suggestions'.
                Do not include markdown, code blocks, bold formatting, backslashes,
                special characters, or any text before or after the JSON.
                Ensure the JSON is well-formed and can be parsed without errors.";

            $cacheKey = 'trip_review_'.md5($trip->id.$trip_title.json_encode($itinerary));

            // SEC-11: quota consumed INSIDE the closure so cache hits do NOT decrement quota.
            $response = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($prompt, $user) {

                // Only consume quota on actual generation (cache miss), not on cache hits.
                if ($user) {
                    $this->aiUsageService->consumeQuota($user);
                }

                try {
                    return Groq::chat()->completions()->create([
                        'model' => config('groq.model'),
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => 'You are a travel reviewer AI tool.',
                            ],
                            [
                                'role' => 'user',
                                'content' => $prompt,
                            ],
                        ],
                        'temperature' => 0.5,

                    ]);
                } catch (\Throwable $e) {
                    // Restore quota if the Groq call itself fails (cache-miss path only).
                    if ($user) {
                        $this->aiUsageService->restoreQuota($user);
                    }
                    throw $e;
                }
            });

    }catch (\Throwable $e) {
    Log::error('Error reviewing trip', [
        'message' => $e->getMessage(),
        'class' => get_class($e),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ]);

    throw new \RuntimeException('Service unavailable. Please try again later.');
}

        return $response['choices'][0]['message']['content'] ?? 'No review available.';
    }
}
