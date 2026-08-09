<?php

namespace App\Repositories\System;

use App\Interfaces\System\SettingRepositoryInterface;
use App\Models\System\Setting;
use Illuminate\Support\Collection;

class SettingRepository implements SettingRepositoryInterface
{
    public function getAllFlat(): Collection
    {
        return Setting::pluck('value', 'key');
    }

    public function updateOrCreate(string $key, string $value): Setting
    {
        return Setting::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public function getPublicData(): array
    {
        return Setting::publicData();
    }

    public function forgetPublicCache(): void
    {
        Setting::forgetPublicCache();
    }
}
