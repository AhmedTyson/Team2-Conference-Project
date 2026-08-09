<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreHotelRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'stars' => ['required', 'integer', 'min:1', 'max:5'],
            'price_per_night' => ['required', 'integer', 'min:0'],
            'availability' => ['required', 'string'],
            'destination_id' => ['required', 'exists:destinations,id'],
        ];
    }
}
