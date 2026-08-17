<?php

namespace App\Services\Catalog\AiAttraction;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class AiAttractionService
{
    /**
     * Retrieve 10 tourist attractions for a given city using OpenAI.
     *
     * @return array<int, array{name: string, lat: float, lng: float}>
     */
    public function getAttractions(string $city): array
    {
        $cityTrimmed = trim($city);
        if (empty($cityTrimmed)) {
            return [];
        }

        $cacheKey = 'ai:attractions:'.strtolower($cityTrimmed);

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($cityTrimmed) {
            return $this->fetchAttractionsFromAi($cityTrimmed);
        });
    }

    /**
     * Fetch attractions directly from the OpenAI API.
     */
    protected function fetchAttractionsFromAi(string $city): array
    {
        $apiKey = config('services.openai.key');

        if (empty($apiKey)) {
            Log::warning('OpenAI API key is missing from configuration.');

            return [];
        }

        try {
            Log::info('Calling OpenAI API for attractions in: '.$city);

            $response = Http::retry(2, 1000)
                ->connectTimeout(5)
                ->timeout(15)
                ->withToken($apiKey)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a travel assistant. Always respond with a valid JSON object containing an "attractions" key with an array of items.',
                        ],
                        [
                            'role' => 'user',
                            'content' => "Give me exactly 10 tourist attractions in {$city}.
                            Return a JSON object with this structure:
                            {
                              \"attractions\": [
                                {
                                  \"name\": \"Pyramids of Giza\",
                                  \"lat\": 29.9792,
                                  \"lng\": 31.1342
                                }
                              ]
                            }",
                        ],
                    ],
                    'temperature' => 0.3,
                ]);

            if ($response->failed()) {
                Log::error('OpenAI API request failed', [
                    'city' => $city,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [];
            }

            $payload = $response->json();
            $content = $payload['choices'][0]['message']['content'] ?? '';

            return $this->parseResponseContent($content);

        } catch (Throwable $e) {
            Log::error('Exception in AiAttractionService: '.$e->getMessage(), [
                'city' => $city,
                'exception' => $e,
            ]);

            return [];
        }
    }

    /**
     * Parse and sanitize the JSON string returned by OpenAI.
     */
    protected function parseResponseContent(string $content): array
    {
        if (empty($content)) {
            return [];
        }

        // Strip any markdown codeblock wrappers if present
        $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($content));
        $decoded = json_decode($cleanJson, true);

        if (! is_array($decoded)) {
            return [];
        }

        // Support both {"attractions": [...]} and root array [...]
        $rawItems = $decoded['attractions'] ?? (array_is_list($decoded) ? $decoded : []);

        return collect($rawItems)
            ->filter(fn ($item) => is_array($item) && ! empty($item['name']))
            ->map(fn ($item) => [
                'name' => (string) ($item['name'] ?? ''),
                'lat' => (float) ($item['lat'] ?? 0.0),
                'lng' => (float) ($item['lng'] ?? 0.0),
            ])
            ->values()
            ->toArray();
    }
}
