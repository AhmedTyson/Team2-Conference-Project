<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCountryRequest extends FormRequest
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
            'iso_code' => ['sometimes', 'string', 'max:10'],
            'capital' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:10'],
            'languages' => ['nullable', 'string'],
        ];
    }
}
