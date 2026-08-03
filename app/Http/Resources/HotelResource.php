<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HotelResource extends JsonResource
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
            'address' => $this->address,
            'price_per_night' => $this->price_per_night ? (float) $this->price_per_night : null,
            'rating' => $this->rating ? (float) $this->rating : null,
            'stars' => $this->stars,
            'availability' => $this->availability,
            'image' => $this->image,
            'destination_id' => $this->destination_id,
            'destination' => $this->whenLoaded('destination'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
