<?php

namespace App\Http\Requests\System;

use Illuminate\Foundation\Http\FormRequest;

class ShowWeatherRequest extends FormRequest
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
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'lat.required' => 'Latitude parameter (lat) is required.',
            'lat.numeric' => 'Latitude must be a valid numeric value.',
            'lat.between' => 'Latitude must be between -90 and 90 degrees.',
            'lon.required' => 'Longitude parameter (lon) is required.',
            'lon.numeric' => 'Longitude must be a valid numeric value.',
            'lon.between' => 'Longitude must be between -180 and 180 degrees.',
        ];
    }
}
