<?php

namespace App\Http\Controllers;

use App\Services\SettingService;
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

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
