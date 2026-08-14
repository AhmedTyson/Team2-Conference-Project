<?php

namespace App\Http\Resources\Chat;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userId = $request->user()?->id;

        $unreadCount = $this->messages()
            ->where('is_read', false)
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', '!=', $userId)
                  ->orWhereNull('sender_id');
            })
            ->count();

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title ?? ($this->type === 'ai_concierge' ? 'Itinera AI Concierge' : 'Travel Inquiry'),
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'agency' => $this->agency ? [
                'id' => $this->agency->id,
                'name' => $this->agency->name,
                'email' => $this->agency->email,
            ] : null,
            'trip' => $this->trip ? [
                'id' => $this->trip->id,
                'title' => $this->trip->title,
                'status' => $this->trip->status,
                'destination' => $this->trip->destinationCountry?->name ?? 'Custom Itinerary',
            ] : null,
            'unread_count' => $unreadCount,
            'latest_message' => $this->latestMessage ? [
                'id' => $this->latestMessage->id,
                'sender_type' => $this->latestMessage->sender_type,
                'body' => $this->latestMessage->body,
                'created_at' => $this->latestMessage->created_at?->toIso8601String(),
            ] : null,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
