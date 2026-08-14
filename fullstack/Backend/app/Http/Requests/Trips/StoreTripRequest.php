<?php

namespace App\Http\Requests\Trips;

use Illuminate\Foundation\Http\FormRequest;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('budget')) {
            $budgetVal = $this->input('budget');
            if (is_string($budgetVal)) {
                $cleanBudget = preg_replace('/[^0-9.]/', '', $budgetVal);
                $this->merge([
                    'budget' => $cleanBudget !== '' ? (float) $cleanBudget : 0,
                ]);
            }
        } else {
            $this->merge(['budget' => 0]);
        }

        if (! $this->filled('start_date')) {
            $this->merge([
                'start_date' => now()->toDateString(),
            ]);
        }

        if (! $this->filled('end_date') && $this->filled('start_date')) {
            $days = (int) ($this->input('no_of_days', 3));
            $this->merge([
                'end_date' => \Illuminate\Support\Carbon::parse($this->input('start_date'))->addDays($days)->toDateString(),
            ]);
        }

        if ($this->has('interests') && is_string($this->interests)) {
            $this->merge([
                'interests' => array_filter(array_map('trim', explode(',', $this->interests))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'status' => 'nullable|string|in:pending,planning,booked,completed,cancelled,planned,active',
            'travel_style' => 'nullable|string|max:100',
            'no_of_days' => 'nullable|integer|min:1',
            'budget' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'interests' => 'nullable|array',
            'is_public' => 'nullable|boolean',
        ];
    }
}
