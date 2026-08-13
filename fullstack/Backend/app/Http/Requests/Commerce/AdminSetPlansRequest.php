<?php

namespace App\Http\Requests\Commerce;

use App\Enums\BillingCycle;
use Illuminate\Foundation\Http\FormRequest;

class AdminSetPlansRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plans' => ['required', 'array', 'min:1'],
            'plans.*.name' => ['required', 'string', 'max:120'],
            'plans.*.price_cents' => ['required', 'integer', 'min:0'],
            'plans.*.currency' => ['sometimes', 'string', 'size:3'],
            'plans.*.billing_cycle' => ['sometimes', 'in:'.implode(',', [BillingCycle::MONTHLY->value, BillingCycle::YEARLY->value])],
            'plans.*.ai_quota_monthly' => ['sometimes', 'integer', 'min:0'],
            'plans.*.features' => ['sometimes', 'array'],
            'plans.*.is_active' => ['sometimes', 'boolean'],
        ];
    }
}
