<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:ai_concierge,agency_inquiry,direct_support',
            'title' => 'nullable|string|max:255',
            'trip_id' => 'nullable|exists:trips,id',
            'agency_id' => 'nullable|exists:users,id',
            'customer_id' => 'nullable|exists:users,id',
            'initial_message' => 'nullable|string|max:5000',
        ];
    }
}
