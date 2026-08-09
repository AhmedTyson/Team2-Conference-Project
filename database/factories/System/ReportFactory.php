<?php

namespace Database\Factories\System;

use App\Models\Account\User;
use App\Models\System\Report;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        $from = now()->subDays(rand(7, 60));
        $to = $from->copy()->addDays(rand(1, 30));

        return [
            'user_id' => User::factory(),
            'from_date' => $from,
            'to_date' => $to,
            'file_path' => $this->faker->optional()->passthrough('reports/report_'.$this->faker->uuid().'.pdf'),
            'status' => 'completed',
        ];
    }
}
