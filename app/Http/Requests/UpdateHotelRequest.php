<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'stars' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'price_per_night' => ['sometimes', 'integer', 'min:0'],
            'availability' => ['sometimes', 'string'],
            'destination_id' => ['sometimes', 'exists:destinations,id'],
        ];
    }
}
