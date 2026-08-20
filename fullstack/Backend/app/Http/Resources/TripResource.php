<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'title'           => $this->title,
            'travel_style'    => $this->travel_style,
            'interests'       => $this->interests,
            'no_of_travelers' => $this->no_of_travelers,
            'budget'          => $this->budget,
            'no_of_days'      => $this->no_of_days,
            'start_date'      => $this->start_date,
            'end_date'        => $this->end_date,
            'status'          => $this->status,
            'estimated_cost'  => $this->estimated_cost,
            'is_public'       => (bool) $this->is_public,
            'user'            => $this->whenLoaded('user'),

            // Explicitly map itinerary_items to include latitude/longitude/location_label
            'itinerary_items' => $this->whenLoaded('itineraryItems', function () {
                return $this->itineraryItems->map(fn ($item) => [
                    'id'             => $item->id,
                    'itemable_type'  => $item->itemable_type,
                    'itemable_id'    => $item->itemable_id,
                    'itemable'       => $item->relationLoaded('itemable') ? $item->itemable : null,
                    'day_number'     => $item->day_number,
                    'item_order'     => $item->item_order,
                    'type'           => $item->type,
                    'time_slot'      => $item->time_slot,
                    'title'          => $item->title,
                    'notes'          => $item->notes,
                    'estimated_cost' => $item->estimated_cost,
                    'latitude'       => $item->latitude  !== null ? (float) $item->latitude  : null,
                    'longitude'      => $item->longitude !== null ? (float) $item->longitude : null,
                    'location_label' => $item->location_label,
                ]);
            }),

            'destinations' => $this->whenLoaded('destinations'),
            'hotels'       => $this->whenLoaded('hotels'),
            'attractions'  => $this->whenLoaded('attractions'),
            'restaurants'  => $this->whenLoaded('restaurants'),
            'flights'      => $this->whenLoaded('flights'),
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}
