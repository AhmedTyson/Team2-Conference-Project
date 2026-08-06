<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFlightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'airline' => 'nullable|string|max:255',
            'flight_number' => 'nullable|string|max:255',
            'departure_airport' => 'nullable|string|max:10',
            'arrival_airport' => 'nullable|string|max:10',
            'departure_date' => 'nullable|date',
            'arrival_date' => 'nullable|date|after:departure_date',
            'price' => 'nullable|numeric|min:0',
            'booking_status' => 'nullable|in:pending,confirmed,cancelled',
        ];
    }
}
