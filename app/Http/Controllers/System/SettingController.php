<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\UpdateSettingRequest;
use App\Http\Requests\System\UpdateSettingValueRequest;
use App\Services\System\SettingService;
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

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $settings = $this->settingService->bulkUpdate($request->validated('settings'));

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data' => $settings,
        ]);
    }

    public function patchKey(UpdateSettingValueRequest $request, string $key): JsonResponse
    {
        $data = $this->settingService->patchKey($key, $request);

        return response()->json([
            'success' => true,
            'message' => "Setting '{$key}' updated.",
            'data' => $data,
        ]);
    }
}
