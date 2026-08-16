<?php

namespace App\Http\Requests\System;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GenerateReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasAnyRole(['admin', 'super_admin']);
    }

    protected function prepareForValidation(): void
    {
        $from = $this->input('from') ?: $this->input('from_date');
        $to = $this->input('to') ?: $this->input('to_date');

        $this->merge([
            'from' => $from ?: '2000-01-01',
            'to' => $to ?: now()->format('Y-m-d'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'format' => 'nullable|in:pdf,excel',
        ];
    }
}
