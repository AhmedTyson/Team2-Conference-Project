<?php

namespace App\Http\Requests\System;

use App\Enums\BudgetLevel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSurveyRequest extends FormRequest
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
            'travel_style' => ['required', 'string', 'max:255'],
            'budget_level' => ['required', Rule::enum(BudgetLevel::class)],
            'interests' => ['required', 'array', 'max:50'],
            'interests.*' => ['string', 'max:255'],
        ];
    }
}
