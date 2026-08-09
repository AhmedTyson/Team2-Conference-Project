<?php

namespace App\Http\Requests\System;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'value' => ['required_without:file', 'nullable', 'string', 'max:1000'],
            'file' => ['required_without:value', 'file', 'max:5120',
                'mimes:jpg,jpeg,png,webp,gif,svg,pdf'],
        ];
    }
}
