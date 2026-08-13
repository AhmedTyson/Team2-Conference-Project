<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Interfaces\System\FlagRepositoryInterface;
use App\Models\System\Flag;
use App\Services\System\FlagService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class AdminFlagController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private FlagService $service,
        private FlagRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('review', Flag::class);

        $flags = $this->repository->getAll();

        return ApiResponse::success($flags, 'Flags retrieved successfully');
    }

    public function approve(Request $request, Flag $flag): JsonResponse
    {
        $this->authorize('review', $flag);

        $flag = $this->service->approve($flag, $request->user());

        return ApiResponse::success($flag, 'Flag approved successfully');
    }

    public function decline(Request $request, Flag $flag): JsonResponse
    {
        $this->authorize('review', $flag);

        $flag = $this->service->decline($flag, $request->user());

        return ApiResponse::success($flag, 'Flag declined successfully');
    }
}
