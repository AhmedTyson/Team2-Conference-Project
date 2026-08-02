<?php

namespace Database\Factories;

use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Country>
 */
class CountryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->country(),
            'iso_code' => $this->faker->countryCode(),
            'capital' => $this->faker->city(),
            'flag_url' => $this->faker->imageUrl(),
            'currency' => $this->faker->currencyCode(),
            'languages' => [$this->faker->languageCode()],
        ];
    }
}
