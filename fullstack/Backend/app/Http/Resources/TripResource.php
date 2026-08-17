<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'title' => $this->title,
            'travel_style' => $this->travel_style,
            'interests' => $this->interests,
            'no_of_travelers' => $this->no_of_travelers,
            'budget' => $this->budget,
            'no_of_days' => $this->no_of_days,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'status' => $this->status,
            'estimated_cost' => $this->estimated_cost,
            'is_public' => (bool) $this->is_public,
            'user' => $this->whenLoaded('user'),
            'itinerary_items' => $this->whenLoaded('itineraryItems'),
            'destinations' => $this->whenLoaded('destinations'),
            'hotels' => $this->whenLoaded('hotels'),
            'attractions' => $this->whenLoaded('attractions'),
            'restaurants' => $this->whenLoaded('restaurants'),
            'flights' => $this->whenLoaded('flights'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
