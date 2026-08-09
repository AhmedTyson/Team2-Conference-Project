<?php

namespace App\Services;

use App\Interfaces\SettingRepositoryInterface;
use App\Repositories\SettingRepository;
use Illuminate\Support\Facades\Cache;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class SettingService
{
    protected $settingRepository;

    public function __construct(SettingRepositoryInterface $settingRepository)
    {
        $this->settingRepository = $settingRepository;
    }

    public function getPublicSettings()
    {
        return Cache::rememberForever(
            Setting::PUBLIC_CACHE_KEY,
            fn () => $this->settingRepository->getPublicData()
        );
    }

    public function getAllSettings()
    {
        return $this->settingRepository->getAllFlat();
    }

    public function bulkUpdate(array $settingsPayload)
    {
        foreach ($settingsPayload as $setting) {
            $this->settingRepository->updateOrCreate(
                $setting['key'],
                $setting['value'] ?? ''
            );
        }

        $this->settingRepository->forgetPublicCache();

        return $this->getAllSettings();
    }

    public function patchKey(string $key, $request)
    {
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store("settings/{$key}", 'public');
            $value = Storage::disk('public')->url($path);
        } else {
            $value = $request->input('value');
        }

        $this->settingRepository->updateOrCreate($key, $value);
        $this->settingRepository->forgetPublicCache();

        return ['key' => $key, 'value' => $value];
    }
}
