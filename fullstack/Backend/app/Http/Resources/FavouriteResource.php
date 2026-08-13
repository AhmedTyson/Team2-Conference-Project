<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FavouriteResource extends JsonResource
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
            'favorable_type' => $this->favorable_type,
            'favorable_id' => $this->favorable_id,
            'note' => $this->note,
            'created_at' => $this->created_at,
        ];
    }
}
