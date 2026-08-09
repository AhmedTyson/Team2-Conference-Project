<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'city_name' => 'sometimes|required|string|max:255',
            'country_id' => 'sometimes|required|exists:countries,id',
            'description' => 'nullable|string',
            'image' => 'nullable|string|url',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ];
    }
}
