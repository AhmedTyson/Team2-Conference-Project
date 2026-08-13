<?php

namespace App\Interfaces\System;

use App\Models\System\Setting;

interface SettingRepositoryInterface
{
    public function getAllFlat(): \Illuminate\Support\Collection;

    public function updateOrCreate(string $key, string $value): Setting;

    public function getPublicData(): array;

    public function forgetPublicCache(): void;
}
