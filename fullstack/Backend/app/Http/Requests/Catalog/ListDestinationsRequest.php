<?php

namespace App\Http\Requests\Catalog;

use App\Models\Catalog\Region;
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
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    protected function existingRegionKeys(): array
    {
        return Region::query()->pluck('key')->all();
    }
}
