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
        $this->merge([
            'from' => $this->input('from') ?? $this->input('from_date') ?? now()->subDays(30)->format('Y-m-d'),
            'to' => $this->input('to') ?? $this->input('to_date') ?? now()->format('Y-m-d'),
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
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'format' => 'nullable|in:pdf,excel',
        ];
    }
}
