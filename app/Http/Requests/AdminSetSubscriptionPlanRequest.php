<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AdminSetSubscriptionPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // set admin subscriptions
            'plan_id' => 'required|exists:plans,id',
            'name' => 'required|string|max:255',
            'price_monthly' => 'required|numeric',
            'price_yearly' => 'required|numeric',
            'features' => 'required|array|min:1',
            'features.*.name' => 'required|string|max:255',
        ];
    }
}
