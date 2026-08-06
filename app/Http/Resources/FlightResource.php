<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FlightResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'airline'           => $this->airline,
            'flight_number'     => $this->flight_number,
            'departure_airport' => $this->departure_airport,
            'arrival_airport'   => $this->arrival_airport,
            'departure_date'    => $this->departure_date ? $this->departure_date->format('Y-m-d H:i:s') : null,
            'arrival_date'      => $this->arrival_date ? $this->arrival_date->format('Y-m-d H:i:s') : null,
            'price'             => $this->price ? (float) $this->price : null,
            'booking_status'    => $this->booking_status?->value,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
        ];
    }
}
