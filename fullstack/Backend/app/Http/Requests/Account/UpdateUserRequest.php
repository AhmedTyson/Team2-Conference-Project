<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$this->route('user'),
            'password' => 'sometimes|nullable|string|min:8',
            'role' => 'sometimes|nullable|string',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
