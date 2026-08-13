<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreFlagRequest extends FormRequest
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
            'flag_type' => ['required', 'in:complaint,suggestion'],
            'flagged_user_id' => ['required', 'exists:users,id'],
            'flagged_entity_type' => ['required', 'in:user,trip,restaurant,review,agency_assignment,billing_invoice,billing_payment,complaint'],
            'flagged_entity_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:128'],
            'details' => ['nullable', 'string', 'max:4096'],
        ];
    }
}
