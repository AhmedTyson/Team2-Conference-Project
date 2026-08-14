<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListDestinationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'region' => ['sometimes', 'string', Rule::in(['all', ...$this->existingRegionKeys()])],
            'query' => ['sometimes', 'string', 'max:100'],
        ];
    }

    protected function existingRegionKeys(): array
    {
        return \App\Models\Catalog\Region::query()->pluck('key')->all();
    }
}
