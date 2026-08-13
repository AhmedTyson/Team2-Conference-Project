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
    {        // Destination count
        // number of days , budget , intersest , no of travel , travel style ,
        return [
            'destination_country_id' => 'required|numeric|exists:countries,id',
            'no_of_days' => 'required|integer',
            'budget' => 'required|numeric',
            'interests' => 'required|array',
            'no_of_travelers' => 'required|integer',
            'travel_style' => 'required|string',
        ];
    }
}
