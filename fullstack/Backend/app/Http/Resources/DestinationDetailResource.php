<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Used by GET /api/v1/destinations/{id} (the explorer detail panel).
 */
class DestinationDetailResource extends JsonResource
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
            'city_name' => $this->city_name,
            'description' => $this->description,
            'image' => $this->image,
            'latitude' => $this->latitude ? (float) $this->latitude : null,
            'longitude' => $this->longitude ? (float) $this->longitude : null,
            'country_id' => $this->country_id,
            'country' => $this->whenLoaded('country', fn () => [
                'id' => $this->country->id,
                'name' => $this->country->name,
                'iso_code' => $this->country->iso_code,
                'flag_url' => $this->country->flag_url,
            ]),
            'region' => $this->whenLoaded('country', fn () => $this->country->region
                ? [
                    'id' => $this->country->region->key,
                    'label' => $this->country->region->label,
                ]
                : null),
            'hotels_count' => $this->hotels_count ?? 0,
            'tours_count' => $this->trips_count ?? 0,
            'user_count' => (int) ($this->user_count ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
