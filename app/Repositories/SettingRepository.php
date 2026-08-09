<?php

namespace App\Repositories;

use App\Interfaces\SettingRepositoryInterface;
use App\Models\Setting;
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
