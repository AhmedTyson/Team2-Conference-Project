<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\System\SettingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SiteSettingsController extends Controller
{
    protected $settingService;

    public function __construct(SettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    public function index(): JsonResponse
    {
        $data = $this->settingService->getPublicSettings();

        return ApiResponse::success($data);
    }
}
