<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCountryRequest extends FormRequest
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
            'iso_code' => ['required', 'string', 'max:10'],
            'capital' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:10'],
            'languages' => ['nullable', 'array'],
        ];
    }
}
