<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantRequest extends FormRequest
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
            'name' => 'sometimes|required|string|max:255',
            'cuisine' => 'sometimes|required|string|max:255',
            'price_range' => 'nullable|string|in:$,$$,$$$,$$$$',
            'rating' => 'nullable|numeric|between:0,5',
            'address' => 'nullable|string|max:255',
            'image' => 'nullable|string|url',
            'destination_id' => 'sometimes|required|exists:destinations,id',
            'category_id' => 'nullable|exists:categories,id',
        ];
    }
}
