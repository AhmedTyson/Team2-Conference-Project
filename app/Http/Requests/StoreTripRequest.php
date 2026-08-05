<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'travel_style' => ['required', 'string'],
            'interests' => ['required', 'array'],
            'no_of_travelers' => ['required', 'integer', 'min:1'],
            'budget' => ['required', 'numeric', 'min:0'],
            'no_of_days' => ['required', 'integer', 'min:1'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }
}
