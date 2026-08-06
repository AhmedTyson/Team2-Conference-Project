<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRestaurantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'source' => 'nullable|in:external,manual',
            'destination_id' => 'required|exists:destinations,id',
            'category_id' => 'nullable|exists:categories,id',

            'name' => 'required_if:source,manual|string|max:255',
            'cuisine' => 'required_if:source,manual|string|max:255',
            'price_range' => 'nullable|string|in:$,$$,$$$,$$$$',
            'rating' => 'nullable|numeric|between:0,5',
            'address' => 'nullable|string|max:255',
            'image' => 'nullable|string|url',
        ];
    }
}
