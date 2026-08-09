<?php

namespace App\Interfaces;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Collection;

interface SettingRepositoryInterface
{
    public function getAllFlat(): \Illuminate\Support\Collection;

    public function updateOrCreate(string $key, string $value): Setting;

    public function getPublicData(): array;

    public function forgetPublicCache(): void;

}
