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
            'image' => $this->image ?: 'https://image.pollinations.ai/prompt/'.urlencode(($this->name ?: 'luxury').' 5-star hotel resort photography').'?width=800&height=600&nologo=true',
            'destination_id' => $this->destination_id,
            'destination' => $this->whenLoaded('destination'),
            'reviews_count' => $this->when(! is_null($this->reviews_count), fn () => $this->reviews_count),
            'reviews' => $this->when(! is_null($this->reviews_count), fn () => $this->formatReviews((int) $this->reviews_count)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function formatReviews(int $n): string
    {
        return $n >= 1000 ? round($n / 1000, 1).'K' : (string) $n;
    }
}
