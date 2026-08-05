<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:countries,name',
            'iso_code' => 'required|string|max:10|unique:countries,iso_code',
            'capital' => 'required|string|max:255',
            'flag_url' => 'nullable|url',
            'currency' => 'required|string|max:100',
            'languages' => 'required|array',
            'languages.*' => 'string|max:100',
        ];
    }
}