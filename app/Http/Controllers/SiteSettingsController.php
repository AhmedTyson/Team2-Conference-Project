<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SiteSettingsController extends Controller
{
    /**
     * GET /api/v1/site-settings
     *
     * Returns whitelisted public site settings (cached forever,
     * invalidated on admin PUT /settings or PATCH /settings/{key}).
     * No authentication required.
     */
    public function index(): JsonResponse
    {
        $data = Cache::rememberForever(
            Setting::PUBLIC_CACHE_KEY,
            fn () => Setting::publicData()
        );

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
