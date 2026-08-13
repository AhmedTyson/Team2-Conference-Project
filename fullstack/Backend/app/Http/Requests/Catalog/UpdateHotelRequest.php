<?php

namespace App\Http\Requests\Catalog;

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
            'destination_id' => ['sometimes', 'exists:destinations,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'price_per_night' => ['sometimes', 'numeric', 'min:0'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'stars' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'availability' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'string', 'max:255'],
        ];
    }
}
