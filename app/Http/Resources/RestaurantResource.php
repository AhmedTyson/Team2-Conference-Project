<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
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
            'cuisine' => $this->cuisine,
            'price_range' => $this->price_range,
            'rating' => $this->rating ? (float) $this->rating : null,
            'address' => $this->address,
            'image' => $this->image,
            'destination_id' => $this->destination_id,
            'category_id' => $this->category_id,
            'destination' => $this->whenLoaded('destination'),
            'category' => $this->whenLoaded('category'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}