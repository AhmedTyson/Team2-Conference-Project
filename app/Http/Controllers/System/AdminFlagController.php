<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Interfaces\System\FlagRepositoryInterface;
use App\Models\System\Flag;
use App\Services\System\FlagService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class AdminFlagController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private FlagService $service,
        private FlagRepositoryInterface $repository
    ) {}

    public function index(Request $request)
    {
        $this->authorize('review', Flag::class);

        $flags = $this->repository->getAll();

        return response()->json(['data' => $flags]);
    }

    public function approve(Request $request, Flag $flag)
    {
        $this->authorize('review', $flag);

        $flag = $this->service->approve($flag, $request->user());

        return response()->json(['data' => $flag]);
    }

    public function decline(Request $request, Flag $flag)
    {
        $this->authorize('review', $flag);

        $flag = $this->service->decline($flag, $request->user());

        return response()->json(['data' => $flag]);
    }
}