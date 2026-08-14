<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'reviewable_type' => $this->reviewable_type,
            'reviewable_id' => $this->reviewable_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'status' => $this->status,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar ?? null,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
