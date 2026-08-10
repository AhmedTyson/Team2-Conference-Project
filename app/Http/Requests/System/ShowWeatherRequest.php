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
            'lat' => ['required', 'numeric'],
            'lon' => ['required', 'numeric'],
        ];
    }
}
