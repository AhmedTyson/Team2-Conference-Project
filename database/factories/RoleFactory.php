<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            // 'name' => fake()->unique()->randomElement([]),

            // note: wait for business domain -> business logic, and allowed permissions for every role
            // We will use spatie/laravel-permissions -> to seed roles, permissions for every role

        ];
    }
}
