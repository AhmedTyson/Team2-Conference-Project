<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantRequest extends FormRequest
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
            'cuisine' => ['sometimes', 'string', 'max:255'],
            'rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'destination_id' => ['sometimes', 'exists:destinations,id'],
        ];
    }
}
