<?php

namespace App\Services;

use App\Http\Requests\Trips\AiTripRequest;
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

        try {
            // filter where country
            // filter budget

            // edit messages

            $country = Country::where('id', $request->destination_country_id)->first();

            $destination = Destination::where('country_id', $request->destination_country_id)->first();
            $destinationId = $destination?->id;

            // restu
            // hotels
            // attractions
            $resturants = Restaurant::where('destination_id', $destinationId)->first();

            // if(!$resturants){
            //     throw new \RuntimeException("No restaurants found for the selected country.");
            // }

            $hotels = Hotel::where('destination_id', $destinationId)->first();

            // if(!$hotels){
            //     throw new \RuntimeException("No hotels found for the selected country.");
            // }

            $attractions = Attraction::where('destination_id', $destinationId)->first();

            // if(!$attractions){
            //     throw new \RuntimeException("No attractions found for the selected country.");
            // }

            $prompt = "  
                Generate a travel itinerary.

                Country: {$country->name}
                Budget: {$request->budget}
                Days: {$request->no_of_days}
                Travelers: {$request->no_of_travelers}
                Travel Style: {$request->travel_style}
                Interests: ".implode(', ', $request->interests)."
                
                Generate Transportation Tips, Estimated Costs and a list of recommended attractions:{$attractions?->name}, restaurants:{$resturants?->name}, and hotels:{$hotels?->name} for the trip.
                
                return response in json format with keys: itinerary, transportation_tips, estimated_costs, recommended_attractions, recommended_restaurants, recommended_hotels. don't add special characters or bold json in beginneing or end of the response.";

            $cacheKey = 'ai:generate_itinerary'.md5(json_encode([$request->destination_country_id, $request->budget, $request->no_of_days, $request->no_of_travelers, $request->travel_style, implode(', ', $request->interests)]));

            $response = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($prompt, $request) {

                // Atomically consume quota only on actual generation (cache miss)
                $this->aiUsageService->consumeQuota($request->user());

                return Groq::chat()->completions()->create([
                    'model' => config('groq.model'),
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a travel planer AI tool.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.5,

                ]);
            });

        } catch (\Throwable $e) {
            // Restore quota if generation fails
            if ($request->user()) {
                $this->aiUsageService->restoreQuota($request->user());
            }
            Log::error('Error generating content: '.$e->getMessage());
            throw new \RuntimeException($e->getMessage() ?: 'Service unavailable. Please try again later.');
        }

        return $response['choices'][0]['message']['content'] ?? $request->content;
    }

    public function review(Trip $trip, string $trip_title, $trip_items)
    {

        try {
            $itinerary = [];
            foreach ($trip_items as $item) {
                $itinerary[] = [
                    'day' => $item->day_number,
                    'order' => $item->visit_order,
                    'item_type' => class_basename($item->itemable_type),
                    'item_name' => $item->itemable->name ?? 'N/A',
                    'estimated_date' => $item->estimated_date,
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

            $response = Cache::remember($cacheKey, now()->addMinutes(60), function () use ($prompt) {

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
            });

        } catch (\Throwable $e) {

            Log::error('Error reviewing trip: '.$e->getMessage());
            throw new \RuntimeException('Service unavailable. Please try again later.');
        }

        return $response['choices'][0]['message']['content'] ?? 'No review available.';
    }
}
