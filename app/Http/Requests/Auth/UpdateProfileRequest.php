<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Owner-only: any authenticated user may update their own profile.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'email'         => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $userId],
            'phone'         => ['sometimes', 'nullable', 'string', 'max:20', 'unique:users,phone,' . $userId],
            'profile_image' => ['sometimes', 'image', 'max:2048'],
            'password'      => ['sometimes', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * Custom error messages for the defined rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already taken.',
            'password.confirmed' => 'Password confirmation does not match.',
            'phone.unique' => 'This phone number is already taken.',
            'profile_image.image' => 'The profile image must be a valid image file.',
        ];
    }
}
