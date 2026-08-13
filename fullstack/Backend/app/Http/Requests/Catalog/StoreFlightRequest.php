<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreFlightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'source' => 'nullable|in:external,manual',
            'departure_airport' => 'required|string|max:10',
            'arrival_airport' => 'required|string|max:10',
            'departure_date' => 'required|date',
            'arrival_date' => 'required_if:source,manual|date|after:departure_date',
            'airline' => 'required_if:source,manual|string|max:255',
            'flight_number' => 'required_if:source,manual|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'booking_status' => 'nullable|in:pending,confirmed,cancelled',
        ];
    }
}
