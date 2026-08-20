<?php

namespace App\Http\Controllers\Trips;

use App\Enums\TripStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Trips\AiTripRequest;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Trips\AiGeneration;
use App\Models\Trips\ItineraryItem;
use App\Models\Trips\Trip;
use App\Services\GroqService;
use App\Services\Trips\AiUsageService;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class AIController extends Controller
{
    public function __construct(
        protected GroqService $groq,
        protected AiUsageService $aiUsage
    ) {}

    public function enhance(Request $request): JsonResponse
    {
        $request->validate(['content' => 'required|string']);

        if ($request->user()) {
            $this->aiUsage->consumeQuota($request->user());
        }

        $enhancedContent = $this->groq->enhance($request->input('content'));

        return ApiResponse::success($enhancedContent, 'Content enhanced successfully');
    }

    public function generate(AiTripRequest $request): JsonResponse
    {
        $city        = $request->city ?: $request->destination ?: 'Rome, Italy';
        $noOfDays    = (int) ($request->no_of_days ?: 4);
        $travelStyle = $request->travel_style ?: $request->budget_tier ?: 'Luxury';
        $budgetTier  = $request->budget_tier ?: $travelStyle;
        $startDate   = $request->start_date ?: now()->toDateString();
        $endDate     = Carbon::parse($startDate)->addDays($noOfDays)->toDateString();
        $user        = $request->user();

        // ── 1. Call AI (GroqService handles Groq + deterministic fallback internally) ──
        $result       = $this->groq->generateAi($request);
        $decoded      = is_string($result) ? json_decode($result, true) : $result;
        $usedFallback = (bool) ($decoded['fallback'] ?? false);

        if (! $decoded || ! is_array($decoded) || ! isset($decoded['days'])) {
            $this->logGeneration($user?->id, null, $city, $noOfDays, $travelStyle, $budgetTier, 'failed', 0, true, 'AI returned no valid days array.');
            return ApiResponse::success(
                ['saved' => false, 'error' => 'AI generation failed — please try again.'],
                'AI generation failed'
            );
        }

        if (! $user) {
            // Unauthenticated — return plan preview only, no DB save
            return ApiResponse::success($decoded, 'Itinerary generated successfully');
        }

        // ── 2. Persist Trip + ItineraryItems in a single atomic transaction ──
        $tripId     = null;
        $itemsCount = 0;
        $saveStatus = $usedFallback ? 'fallback' : 'success';
        $saveError  = null;

        try {
            [$tripId, $itemsCount] = DB::transaction(function () use (
                $decoded, $city, $noOfDays, $startDate, $endDate, $travelStyle, $user, $request
            ) {
                // Create the Trip
                $trip = Trip::create([
                    'user_id'         => $user->id,
                    'title'           => $decoded['title'] ?? ("{$noOfDays}-Day Trip to {$city}"),
                    'travel_style'    => $travelStyle,
                    'interests'       => $request->interests ?: ['culture'],
                    'no_of_travelers' => (int) ($request->no_of_travelers ?: 2),
                    'budget'          => (float) ($decoded['estimated_budget'] ?? $request->budget ?? 7900),
                    'no_of_days'      => $noOfDays,
                    'start_date'      => $startDate,
                    'end_date'        => $endDate,
                    'status'          => TripStatus::PLANNED->value,
                    'is_public'       => false,
                ]);

                // Attach catalog destinations for each route stop (best-effort)
                $stops = preg_split('/\s*(?:->|→|\s+-\s+|;)\s*/', $city);
                foreach ($stops as $sIdx => $stop) {
                    $stopName = trim(explode(',', $stop)[0]);
                    if (! $stopName) continue;
                    $dest = Destination::where('name', 'LIKE', "%{$stopName}%")
                        ->orWhere('city_name', 'LIKE', "%{$stopName}%")
                        ->first();
                    if ($dest && ! $trip->destinations()->where('destinations.id', $dest->id)->exists()) {
                        $trip->destinations()->attach($dest->id, [
                            'day_number'  => $sIdx + 1,
                            'visit_order' => $sIdx + 1,
                        ]);
                    }
                }

                // Create one ItineraryItem per generated plan item
                $count = 0;
                foreach ($decoded['days'] as $day) {
                    $dayNum   = (int) ($day['day_number'] ?? 1);
                    $dayItems = $day['items'] ?? [];

                    foreach ($dayItems as $orderIdx => $item) {
                        $rawType      = strtolower((string) ($item['type'] ?? $item['itemable_type'] ?? 'attraction'));
                        $type         = rtrim($rawType, 's');
                        $itemableId   = $item['itemable_id'] ?? null;
                        $itemableType = null;
                        $itemModel    = null;

                        // Try linking to a real catalog record if itemable_id is present
                        if ($itemableId && is_numeric($itemableId)) {
                            $modelClass = match ($type) {
                                'hotel'       => Hotel::class,
                                'restaurant'  => Restaurant::class,
                                'attraction'  => Attraction::class,
                                'destination' => Destination::class,
                                default       => null,
                            };
                            if ($modelClass) {
                                $itemModel = $modelClass::find($itemableId);
                                if ($itemModel) {
                                    $itemableType = $type;
                                    $relation = $type === 'destination' ? 'destinations' : $type . 's';
                                    if (method_exists($trip, $relation)) {
                                        $already = $trip->$relation()
                                            ->where($itemModel->getTable() . '.id', $itemModel->id)
                                            ->exists();
                                        if (! $already) {
                                            $type === 'destination'
                                                ? $trip->destinations()->attach($itemModel->id, ['day_number' => $dayNum, 'visit_order' => 1])
                                                : $trip->$relation()->attach($itemModel->id);
                                        }
                                    }
                                }
                            }
                        }

                        // Always create an ItineraryItem row with direct coordinates
                        // itemable_type falls back to the normalized type string (NOT NULL constraint)
                        ItineraryItem::create([
                            'trip_id'        => $trip->id,
                            'itemable_type'  => $itemableType ?? $type,
                            'itemable_id'    => $itemableType && $itemModel ? $itemModel->id : null,
                            'day_number'     => $dayNum,
                            'item_order'     => $orderIdx + 1,
                            'type'           => $type,
                            'time_slot'      => $item['time'] ?? $item['time_slot'] ?? '10:00 AM',
                            'title'          => $item['title'] ?? $item['name'] ?? 'Experience Item',
                            'notes'          => $item['description'] ?? $item['desc'] ?? $item['notes'] ?? '',
                            'estimated_cost' => (float) ($item['price'] ?? $item['estimated_cost'] ?? 0),
                            'latitude'       => isset($item['latitude'])  ? (float) $item['latitude']  : null,
                            'longitude'      => isset($item['longitude']) ? (float) $item['longitude'] : null,
                            'location_label' => $item['location_label'] ?? $item['title'] ?? null,
                        ]);
                        $count++;
                    }
                }

                return [$trip->id, $count];
            });

        } catch (\Throwable $e) {
            $saveStatus = 'failed';
            $saveError  = $e->getMessage();
            Log::error('AIController::generate transaction failed: ' . $e->getMessage(), [
                'city'     => $city,
                'no_days'  => $noOfDays,
                'file'     => $e->getFile(),
                'line'     => $e->getLine(),
            ]);
        }

        // ── 3. Log generation result to ai_generations table (always, outside transaction) ──
        $this->logGeneration($user->id, $tripId, $city, $noOfDays, $travelStyle, $budgetTier, $saveStatus, $itemsCount, $usedFallback, $saveError);

        // ── 4. Return enriched response ──
        $decoded['trip_id']      = $tripId;
        $decoded['saved']        = $tripId !== null;
        $decoded['items_count']  = $itemsCount;
        $decoded['used_fallback'] = $usedFallback;
        if ($saveError) {
            $decoded['save_error'] = $saveError;
        }

        return ApiResponse::success($decoded, 'Itinerary generated successfully');
    }

    /** Persist one row to ai_generations (never throws). */
    private function logGeneration(
        ?int $userId, ?int $tripId, string $city, int $noOfDays,
        string $travelStyle, string $budgetTier, string $status,
        int $itemsCount, bool $usedFallback, ?string $error
    ): void {
        try {
            AiGeneration::create([
                'user_id'       => $userId,
                'trip_id'       => $tripId,
                'city'          => $city,
                'no_of_days'    => $noOfDays,
                'travel_style'  => $travelStyle,
                'budget_tier'   => $budgetTier,
                'status'        => $status,
                'error_message' => $error,
                'items_count'   => $itemsCount,
                'used_fallback' => $usedFallback,
            ]);
        } catch (\Throwable $e) {
            Log::warning('AiGeneration log failed: ' . $e->getMessage());
        }
    }

    public function review(Request $request, string $id): JsonResponse
    {
        $trip = Trip::with(['itineraryItems.itemable', 'destinations'])->find($id);

        if (! $trip) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        // SEC-02: ownership gate mirrors TripController::show — 404, no existence leak.
        if (Gate::forUser($request->user())->denies('view', $trip)) {
            return ApiResponse::fail('Trip not found', 'not_found', 404);
        }

        $aiUsage = app(AiUsageService::class);
        $groq = new GroqService($aiUsage);

        $trip_items = $trip->itineraryItems;
        $trip_title = $trip->title;

        // SEC-11: quota is now consumed INSIDE GroqService::review's Cache::remember closure,
        // so cache hits do NOT decrement the user's quota.
        try {
            $reviewedContent = $groq->review($trip, $trip_title, $trip_items, $request->user());
        } catch (\Throwable $e) {
            $destNames = $trip->destinations->pluck('name')->implode(', ') ?: 'selected destinations';
            $days = $trip->no_of_days ?: 3;
            $itemsCount = $trip_items->count();
            $reviewedContent = json_encode([
                'review_summary' => "Your {$days}-day trip '{$trip_title}' across {$destNames} is well-structured with {$itemsCount} itinerary item(s). Overall pacing is optimal for a {$trip->travel_style} travel style.",
                'suggestions' => [
                    'Consider reserving popular dining and cultural attractions in advance.',
                    'Verify transit times between stops to ensure comfortable buffer windows.',
                    'Store offline reservation confirmations for hassle-free check-ins.',
                ],
            ]);
        }

        $decoded = is_string($reviewedContent) ? json_decode($reviewedContent, true) : $reviewedContent;

        return ApiResponse::success($decoded ?? ['content' => $reviewedContent], 'Trip reviewed successfully');
    }
}
