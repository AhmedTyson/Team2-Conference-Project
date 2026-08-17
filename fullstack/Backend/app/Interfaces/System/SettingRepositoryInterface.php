<?php

namespace App\Interfaces\System;

use App\Models\System\Setting;
use Illuminate\Support\Collection;

interface SettingRepositoryInterface
{
    public function getAllFlat(): Collection;

    public function updateOrCreate(string $key, string $value): Setting;

    public function getPublicData(): array;

    public function forgetPublicCache(): void;
}
