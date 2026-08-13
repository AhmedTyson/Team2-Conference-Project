<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'profile_image' => $this->profile_image,
            'verified_at' => $this->email_verified_at,
            'is_active' => $this->is_active,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values(), $this->getRoleNames()),
            'created_at' => $this->created_at,
            'trips' => $this->whenLoaded('trips', fn () => $this->trips->map(
                fn ($trip) => [
                    'id' => $trip->id,
                    'title' => $trip->title,
                    'budget' => $trip->budget,
                    'status' => $trip->status?->value ?? (string) $trip->status,
                    'no_of_days' => $trip->no_of_days,
                    'start_date' => $trip->start_date,
                    'end_date' => $trip->end_date,
                ]
            )->values()),
        ];
    }
}
