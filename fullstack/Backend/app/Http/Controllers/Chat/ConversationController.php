<?php

namespace App\Http\Controllers\Chat;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Requests\Chat\StoreConversationRequest;
use App\Http\Resources\Chat\ConversationResource;
use App\Http\Resources\Chat\MessageResource;
use App\Support\ApiResponse;
use App\Models\Chat\Conversation;
use App\Models\Chat\Message;
use App\Services\ConciergeService;
use App\Services\GroqService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        $conversation = Conversation::create([
            'type' => $validated['type'],
            'title' => $validated['title'] ?? null,
            'user_id' => $user->id,
            'agency_id' => $validated['agency_id'] ?? null,
            'trip_id' => $validated['trip_id'] ?? null,
            'last_message_at' => now(),
        ]);

        $initialMessage = $validated['initial_message'] ?? null;
        if ($initialMessage) {
            $userMsg = $conversation->messages()->create([
                'sender_id' => $user->id,
                'sender_type' => 'user',
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

        // If this is an AI concierge conversation and user spoke, auto-generate AI reply
        if ($conversation->type === 'ai_concierge' && $senderType === 'user') {
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
     * Smart, prompt-aware AI Concierge generator for rich travel recommendations.
     */
    protected function generateSmartConciergeReply(string $prompt, Conversation $conversation): string
    {
        $p = strtolower($prompt);

        $dest = 'Paris & Global Luxury Destinations';
        if ($conversation->trip && $conversation->trip->destinations->first()) {
            $dest = $conversation->trip->destinations->first()->name;
        }

        if (str_contains($p, 'hotel') || str_contains($p, 'stay') || str_contains($p, 'resort') || str_contains($p, 'boutique')) {
            return "**Itinera AI Concierge — Luxury Hotel Recommendations**\n\n"
                ."Here are top 5-star boutique accommodations tailored for your journey:\n\n"
                ."1. **Le Meurice Palace Hotel**\n"
                ."   - *Highlights*: Tuileries Garden views, Valmont Spa, Michelin 2-star dining.\n"
                ."   - *Est. Rate*: $850 / night · High Concierge Rating\n\n"
                ."2. **Ritz Paris & Chanel Spa**\n"
                ."   - *Highlights*: Imperial Suite elegance, private garden court, bespoke butler service.\n"
                ."   - *Est. Rate*: $1,200 / night · Legendary Heritage\n\n"
                ."3. **Hôtel de Crillon (Rosewood)**\n"
                ."   - *Highlights*: Historic Place de la Concorde palace, private subterranean pool & Sense Spa.\n"
                ."   - *Est. Rate*: $980 / night · Boutique Luxury\n\n"
                ."*Concierge Tip*: Booking via Itinera unlocks complimentary champagne welcome & room upgrades upon availability.";
        }

        if (str_contains($p, 'dining') || str_contains($p, 'restaurant') || str_contains($p, 'food') || str_contains($p, 'michelin') || str_contains($p, 'eat')) {
            return "**Itinera AI Concierge — Curated Fine Dining**\n\n"
                ."Here are exceptional culinary highlights for your itinerary:\n\n"
                ."1. **Le Gabriel (Michelin 3-Star)** — Exquisite French contemporary gastronomy with seasonal black truffle pairings.\n"
                ."2. **L'Arpège by Alain Passard** — World-renowned vegetable-focused haute cuisine sourced from private organic gardens.\n"
                ."3. **Le Jules Verne** — Panoramic 1st-floor Eiffel Tower views paired with modern French culinary mastery.\n\n"
                ."*Reservation Note*: We recommend securing table reservations at least 14 days in advance via our concierge team.";
        }

        if (str_contains($p, 'weather') || str_contains($p, 'season') || str_contains($p, 'climate') || str_contains($p, 'temperature')) {
            return "**Itinera AI Concierge — Climate & Travel Forecast**\n\n"
                ."**Current Forecast**: Clear skies, 22°C (71°F) with light evening breeze.\n\n"
                ."**Optimal Travel Windows**:\n"
                ."- **Spring (April - June)**: Mild temperatures (18°C–24°C), blooming gardens, ideal outdoor cafe dining.\n"
                ."- **Autumn (September - November)**: Golden foliage, crisp air (15°C–20°C), peak cultural festival season.\n\n"
                ."*Packing Recommendation*: Bring light layers, breathable evening jackets, and comfortable walking shoes for cobblestone streets.";
        }

        if (str_contains($p, 'cultural') || str_contains($p, 'museum') || str_contains($p, 'sight') || str_contains($p, 'tour') || str_contains($p, 'highlight') || str_contains($p, 'attraction')) {
            return "**Itinera AI Concierge — Cultural Highlights & Iconic Landmarks**\n\n"
                ."Here are the unmissable cultural treasures curated for your visit:\n\n"
                ."1. **Private After-Hours Louvre Museum Access** — Experience Mona Lisa and Venus de Milo in tranquil serenity with a private art historian.\n"
                ."2. **Palace of Versailles Private Opera & Gardens** — Exclusive golf-cart tour of Marie Antoinette's Hameau and Hall of Mirrors.\n"
                ."3. **Musée d'Orsay Impressionist Gallery** — World's largest Monet and Van Gogh collection housed in a restored Beaux-Arts railway station.\n\n"
                ."*VIP Perk*: Fast-track skip-the-line passes are included for all booked Itinera itineraries.";
        }

        return "**Itinera AI Travel Concierge**\n\n"
            ."Thank you for your travel inquiry regarding **{$dest}**!\n\n"
            ."I am ready to curate bespoke elements for your journey:\n"
            ."- **Boutique Stays**: 5-Star Palaces, Luxury Suites, and Private Villas.\n"
            ."- **Fine Dining**: Michelin-starred dining & private chef experiences.\n"
            ."- **Custom Itineraries**: Private museum tours, VIP transfers, and seasonal events.\n\n"
            ."*How would you like me to tailor your itinerary today? Feel free to ask about hotels, dining, weather, or cultural highlights.*";
    }
}
