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
     * Generate an AI Concierge response using Groq.
     */
    protected function generateAiReply(Conversation $conversation, string $userPrompt): ?Message
    {
        try {
            $systemPrompt = "You are the Itinera AI Travel Concierge, a bespoke, highly knowledgeable luxury travel assistant.\n"
                ."Provide elegant, helpful, and concise travel recommendations, tips, and insights.\n"
                ."Format your answers with clean markdown (bullet points, bold titles) and maintain a warm, sophisticated concierge tone.";

            if ($conversation->trip) {
                $trip = $conversation->trip->load(['destinationCountry', 'destinations', 'hotels', 'restaurants', 'attractions']);
                $systemPrompt .= "\n\nCurrent Traveler Trip Context: Title '{$trip->title}', Destination: '{$trip->destinationCountry?->name}', Budget Tier: '{$trip->budget_level}'.";
            }

            // Collect previous messages for conversational memory
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

            $replyText = $response['choices'][0]['message']['content'] ?? "I am delighted to assist with your journey. How else may I curate your itinerary today?";

            $aiMessage = $conversation->messages()->create([
                'sender_id' => null,
                'sender_type' => 'ai',
                'body' => $replyText,
                'metadata' => [
                    'model' => config('groq.model', 'llama-3.3-70b-versatile'),
                    'provider' => 'Groq',
                ],
            ]);

            $conversation->update(['last_message_at' => now()]);

            try {
                broadcast(new MessageSent($aiMessage));
            } catch (\Throwable $e) {
                Log::info('Broadcasting notice: '.$e->getMessage());
            }

            return $aiMessage;
        } catch (\Throwable $e) {
            Log::error('AI Concierge Generation Error: '.$e->getMessage());

            // Fallback concierge reply
            $fallbackMessage = $conversation->messages()->create([
                'sender_id' => null,
                'sender_type' => 'ai',
                'body' => "I am currently reviewing your travel request. Please let me know if you would like me to curate fine dining, luxury boutique stays, or cultural highlights for your journey.",
                'metadata' => ['fallback' => true],
            ]);

            $conversation->update(['last_message_at' => now()]);
            return $fallbackMessage;
        }
    }
}
