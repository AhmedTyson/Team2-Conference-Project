<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $countryId = $this->route('id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('countries', 'name')->ignore($countryId),
            ],
            'iso_code' => [
                'required',
                'string',
                'max:10',
                Rule::unique('countries', 'iso_code')->ignore($countryId),
            ],
            'capital' => 'required|string|max:255',
            'flag_url' => 'nullable|url',
            'currency' => 'required|string|max:100',
            'languages' => 'required|array',
            'languages.*' => 'string|max:100',
        ];
    }
}