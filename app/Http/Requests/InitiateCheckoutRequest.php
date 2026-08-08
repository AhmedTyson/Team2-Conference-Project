<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InitiateCheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by the auth:api middleware on the route
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => 'required|in:trip_package,trip_fork,subscription',
            'trip_id' => 'required_if:type,trip_package,trip_fork|integer|exists:trips,id',
            'plan_id' => 'required_if:type,subscription|integer|exists:plans,id',
            'billing' => 'nullable|array',
            'billing.first_name' => 'nullable|string',
            'billing.last_name' => 'nullable|string',
            'billing.email' => 'nullable|email',
            'billing.phone_number' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'trip_id.required_if' => 'A valid trip ID is required when purchasing a trip package or fork.',
            'plan_id.required_if' => 'A valid plan ID is required when purchasing a subscription.',
        ];
    }
}
