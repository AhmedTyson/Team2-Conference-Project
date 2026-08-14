<?php

namespace App\Http\Requests\Trips;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AiTripRequest extends FormRequest
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
            'destination_country_id' => 'required_without_all:city,destination|nullable|numeric|exists:countries,id',
            'city' => 'nullable|string|max:255',
            'destination' => 'nullable|string|max:255',
            'no_of_days' => 'required|integer|min:1|max:60',
            'budget' => 'nullable|numeric|min:0',
            'budget_tier' => 'nullable|string',
            'interests' => 'nullable|array',
            'no_of_travelers' => 'nullable|integer|min:1',
            'travel_party' => 'nullable|string',
            'travel_style' => 'nullable|string',
            'start_date' => 'nullable|date',
            'prompt' => 'nullable|string|max:1000',
        ];
    }
}
