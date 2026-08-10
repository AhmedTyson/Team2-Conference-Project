<?php

namespace App\Services;

use App\Models\Trip;
use Illuminate\Support\Facades\Log;
use LucianoTonet\GroqLaravel\Facades\Groq;

class ConciergeService
{
    public function getTripContext(Trip $trip): array
    {
        $trip->load([
            'destinations',
            'itineraryItems.itemable',
        ]);

        return [
            'trip' => [
                'title' => $trip->title,
                'budget' => $trip->budget,
                'no_of_days' => $trip->no_of_days,
                'no_of_travelers' => $trip->no_of_travelers,
                'travel_style' => $trip->travel_style,
            ],

            'destinations' => $trip->destinations
                ->map(function ($destination) {
                    return [
                        'id' => $destination->id,
                        'name' => $destination->name,
                        'city_name' => $destination->city_name,
                    ];
                })
                ->values()
                ->toArray(),

            'itinerary' => $trip->itineraryItems
                ->map(function ($item) {
                    return [
                        'day' => $item->day_number,
                        'order' => $item->item_order,
                        'type' => $item->type,
                        'title' => $item->title,
                        'time_slot' => $item->time_slot,
                        'notes' => $item->notes,
                        'estimated_cost' => $item->estimated_cost,
                    ];
                })
                ->values()
                ->toArray(),
        ];
    }

    public function ask(Trip $trip, string $message): string
    {
        try {
            $context = $this->getTripContext($trip);

            $prompt = "
                You are a travel concierge assistant.

                Use the following trip information to answer the user's question.

                Trip context:
                " . json_encode($context) . "

                User question:
                {$message}

                Answer the user based only on the provided trip context.
                If the requested information is not available in the trip context, clearly say that it is not available.
                Do not invent trip details.
                ";

            $response = Groq::chat()->completions()->create([
                'model' => config('groq.model'),
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a helpful travel concierge assistant.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                "temperature" => 0.5
                ],
            ]);

            return $response->choices[0]->message->content
                ?? 'No response available.';

        } catch (\Throwable $e) {

            Log::error(
                'Concierge AI error: ' . $e->getMessage()
            );

            throw new \RuntimeException(
                'Service unavailable. Please try again later.'
            );
        }
    }
}