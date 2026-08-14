<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Services\Catalog\StatsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    protected $statsService;

    public function __construct(StatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    public function summary(): JsonResponse
    {
        return ApiResponse::success($this->statsService->summary(), 'Stats summary fetched successfully');
    }
}
