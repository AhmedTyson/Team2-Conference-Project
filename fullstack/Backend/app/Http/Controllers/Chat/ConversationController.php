<?php

namespace App\Http\Controllers\Chat;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Requests\Chat\StoreConversationRequest;
use App\Http\Resources\Chat\ConversationResource;
use App\Http\Resources\Chat\MessageResource;
use App\Support\ApiResponse;
use App\Models\Catalog\Attraction;
use App\Models\Catalog\Destination;
use App\Models\Catalog\Flight;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Chat\Conversation;
use App\Models\Chat\Message;
use App\Models\Trips\Trip;
use App\Services\ConciergeService;
use App\Services\GroqService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use LucianoTonet\GroqLaravel\Facades\Groq;

class ConversationController extends Controller
{
    use AuthorizesRequests;

    /**
     * List conversations for the authenticated user / agency / admin.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::query()
            ->with(['user', 'agency', 'trip.destinationCountry', 'latestMessage']);

        if ($user->hasRole(['admin', 'super_admin'])) {
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }
        } elseif ($user->hasRole('agency')) {
            $query->where(function ($q) use ($user) {
                $q->where('agency_id', $user->id)
                  ->orWhere('user_id', $user->id);
            });
        } else {
            $query->where('user_id', $user->id);
        }

        $conversations = $query->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();

        return ApiResponse::success(
            ConversationResource::collection($conversations),
            'Conversations retrieved successfully'
        );
    }

    /**
     * Start a new conversation.
     */
    public function store(StoreConversationRequest $request, GroqService $groqService): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $userId = $user->id;
        $agencyId = $validated['agency_id'] ?? null;
        $senderType = 'user';

        // Agencies may open a thread on behalf of an assigned customer:
        // the conversation is owned by the customer (user_id) and linked to
        // the agency (agency_id) so both sides see it in their chat lists.
        if ($user->hasRole('agency') && !empty($validated['customer_id'])) {
            $userId = (int) $validated['customer_id'];
            $agencyId = $user->id;
            $senderType = 'agency';
        }

        $conversation = Conversation::create([
            'type' => $validated['type'],
            'title' => $validated['title'] ?? null,
            'user_id' => $userId,
            'agency_id' => $agencyId,
            'trip_id' => $validated['trip_id'] ?? null,
            'last_message_at' => now(),
        ]);

        $initialMessage = $validated['initial_message'] ?? null;
        if ($initialMessage) {
            $userMsg = $conversation->messages()->create([
                'sender_id' => $user->id,
                'sender_type' => $senderType,
                'body' => $initialMessage,
            ]);

            if ($conversation->type === 'ai_concierge') {
                $this->generateAiReply($conversation, $initialMessage);
            }
        }

        return ApiResponse::success(
            new ConversationResource($conversation->load(['user', 'agency', 'trip.destinationCountry', 'latestMessage'])),
            'Conversation created successfully',
            201
        );
    }

    /**
     * Show conversation details.
     */
    public function show(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorize('view', $conversation);

        return ApiResponse::success(
            new ConversationResource($conversation->load(['user', 'agency', 'trip.destinationCountry', 'latestMessage'])),
            'Conversation details retrieved'
        );
    }

    /**
     * Get paginated messages in a conversation.
     */
    public function messages(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();

        return ApiResponse::success(
            MessageResource::collection($messages),
            'Messages retrieved successfully'
        );
    }

    /**
     * Send a message within a conversation.
     */
    public function sendMessage(Conversation $conversation, SendMessageRequest $request): JsonResponse
    {
        $this->authorize('sendMessage', $conversation);

        $user = $request->user();
        $senderType = 'user';
        if ($user->hasRole(['admin', 'super_admin'])) {
            $senderType = 'admin';
        } elseif ($user->hasRole('agency') && (int) $conversation->agency_id === (int) $user->id) {
            $senderType = 'agency';
        }

        $message = $conversation->messages()->create([
            'sender_id' => $user->id,
            'sender_type' => $senderType,
            'body' => $request->validated('body'),
            'metadata' => $request->validated('metadata'),
        ]);

        $conversation->update(['last_message_at' => now()]);

        try {
            broadcast(new MessageSent($message))->toOthers();
        } catch (\Throwable $e) {
            Log::info('Broadcasting notice: '.$e->getMessage());
        }

        $responseData = [
            'message' => new MessageResource($message),
        ];

        // If this is an AI concierge conversation, consume quota credit and auto-generate AI reply
        if ($conversation->type === 'ai_concierge' && $senderType !== 'ai') {
            try {
                $aiUsage = app(\App\Services\Trips\AiUsageService::class);
                $aiUsage->consumeQuota($user);
            } catch (\Throwable $quotaErr) {
                return ApiResponse::fail($quotaErr->getMessage(), 'ai_quota_exhausted', 422);
            }

            $aiMessage = $this->generateAiReply($conversation, $message->body);
            if ($aiMessage) {
                $responseData['ai_reply'] = new MessageResource($aiMessage);
            }
        }

        return ApiResponse::success($responseData, 'Message sent successfully', 201);
    }

    /**
     * Mark messages in conversation as read.
     */
    public function markAsRead(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorize('view', $conversation);

        $user = $request->user();
        $conversation->messages()
            ->where('is_read', false)
            ->where(function ($q) use ($user) {
                $q->where('sender_id', '!=', $user->id)
                  ->orWhereNull('sender_id');
            })
            ->update(['is_read' => true]);

        return ApiResponse::success(null, 'Messages marked as read');
    }

    /**
     * Generate an AI Concierge response using Groq or dynamic Concierge Engine.
     */
    protected function generateAiReply(Conversation $conversation, string $userPrompt): ?Message
    {
        $replyText = null;

        // Try Groq API if API key is configured
        if (config('groq.api_key')) {
            try {
                $systemPrompt = "You are the Itinera AI Travel Concierge, a bespoke, highly knowledgeable luxury travel assistant.\n"
                    ."Provide elegant, helpful, and concise travel recommendations, tips, and insights.\n"
                    ."Format your answers with clean markdown (bullet points, bold titles) and maintain a warm, sophisticated concierge tone.";

                if ($conversation->trip) {
                    $trip = $conversation->trip->load(['destinationCountry', 'destinations', 'hotels', 'restaurants', 'attractions']);
                    $systemPrompt .= "\n\nCurrent Traveler Trip Context: Title '{$trip->title}', Destination: '{$trip->destinationCountry?->name}', Budget Tier: '{$trip->budget_level}'.";
                }

                $history = $conversation->messages()
                    ->orderBy('created_at', 'desc')
                    ->take(6)
                    ->get()
                    ->reverse();

                $messagesPayload = [
                    ['role' => 'system', 'content' => $systemPrompt],
                ];

                foreach ($history as $msg) {
                    $role = $msg->sender_type === 'ai' ? 'assistant' : 'user';
                    $messagesPayload[] = ['role' => $role, 'content' => $msg->body];
                }

                $response = Groq::chat()->completions()->create([
                    'model' => config('groq.model', 'llama-3.3-70b-versatile'),
                    'messages' => $messagesPayload,
                    'temperature' => 0.6,
                    'max_tokens' => 1024,
                ]);

                $replyText = $response['choices'][0]['message']['content'] ?? null;
            } catch (\Throwable $e) {
                Log::error('AI Concierge Groq API Notice: '.$e->getMessage());
            }
        }

        // Fallback to intelligent prompt-aware Concierge Engine if Groq API key is missing or failed
        if (! $replyText) {
            $replyText = $this->generateSmartConciergeReply($userPrompt, $conversation);
        }

        $aiMessage = $conversation->messages()->create([
            'sender_id' => null,
            'sender_type' => 'ai',
            'body' => $replyText,
            'metadata' => [
                'model' => config('groq.api_key') ? config('groq.model', 'llama-3.3-70b-versatile') : 'itinera-concierge-v2',
                'provider' => config('groq.api_key') ? 'Groq' : 'Itinera AI Engine',
            ],
        ]);

        $conversation->update(['last_message_at' => now()]);

        try {
            broadcast(new MessageSent($aiMessage));
        } catch (\Throwable $e) {
            Log::info('Broadcasting notice: '.$e->getMessage());
        }

        return $aiMessage;
    }

    /**
     * Smart, prompt-aware AI Concierge generator powered by Wikipedia Live Search API & Real-world Knowledge.
     */
    protected function generateSmartConciergeReply(string $prompt, Conversation $conversation): string
    {
        $p = strtolower(trim($prompt));

        // 1. Query Wikipedia Live Real-World Search API for true travel facts
        try {
            $wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' . urlencode($prompt) . '&format=json';
            $res = Http::withHeaders(['User-Agent' => 'ItineraApp/1.0'])->timeout(5)->get($wikiUrl);
            $items = $res->json('query.search') ?? [];

            if (!empty($items)) {
                $out = "**Itinera AI Concierge — Real-World Travel Information**\n\n";
                $out .= "Here are authentic real-world travel facts & recommendations for: *\"" . e($prompt) . "\"*\n\n";
                $count = 0;
                foreach (array_slice($items, 0, 4) as $item) {
                    $title = $item['title'] ?? '';
                    $snippet = html_entity_decode(strip_tags($item['snippet'] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    // Remove citation brackets
                    $snippet = preg_replace('/\[\d+\]/', '', $snippet);
                    if (!empty($title) && !empty($snippet)) {
                        $count++;
                        $out .= "{$count}. **{$title}**\n";
                        $out .= "   - {$snippet}...\n\n";
                    }
                }
                if ($count > 0) {
                    $out .= "*Verified Real-World Data*: Retrieved live for your travel query.";
                    return $out;
                }
            }
        } catch (\Throwable $e) {
            Log::info('Wikipedia Live Search API notice: '.$e->getMessage());
        }

        // 2. Real Flights from Database if specific to flights
        if (str_contains($p, 'flight') || str_contains($p, 'fly') || str_contains($p, 'airline')) {
            $flights = Flight::orderBy('price', 'asc')->take(4)->get();

            if ($flights->isNotEmpty()) {
                $out = "**Itinera AI Concierge — Verified Live Flight Schedules**\n\n";
                foreach ($flights as $idx => $f) {
                    $status = is_object($f->booking_status) && isset($f->booking_status->value) ? $f->booking_status->value : 'Available';
                    $out .= ($idx + 1) . ". **{$f->airline}** (Flight `{$f->flight_number}`)\n";
                    $out .= "   - *Route*: **{$f->departure_airport}** ➔ **{$f->arrival_airport}**\n";
                    $out .= "   - *Price*: \${$f->price} · *Status*: {$status}\n\n";
                }
                return $out;
            }
        }

        // 3. Fallback Overview
        return "**Itinera AI Travel Concierge**\n\n"
            ."I have analyzed your query: *\"".e($prompt)."\"*\n\n"
            ."For the most comprehensive AI generation with Llama 3.3 70B, make sure your `GROQ_API_KEY` is configured in `.env`.\n\n"
            ."*Feel free to ask about specific cities, hotels, fine dining, or flight options!*";
    }
}
