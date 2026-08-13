<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\UpdateSettingRequest;
use App\Http\Requests\System\UpdateSettingValueRequest;
use App\Services\System\SettingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    protected $settingService;

    public function __construct(SettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    public function index(): JsonResponse
    {
        $settings = $this->settingService->getAllSettings();

        return ApiResponse::success($settings);
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $settings = $this->settingService->bulkUpdate($request->validated('settings'));

        return ApiResponse::success($settings, 'Settings updated successfully.');
    }

    public function patchKey(UpdateSettingValueRequest $request, string $key): JsonResponse
    {
        $data = $this->settingService->patchKey($key, $request);

        return ApiResponse::success($data, "Setting '{$key}' updated.");
    }
}
