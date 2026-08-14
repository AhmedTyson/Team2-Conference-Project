<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\RegionResource;
use App\Services\Catalog\RegionService;

class RegionController extends Controller
{
    protected $regionService;

    public function __construct(RegionService $regionService)
    {
        $this->regionService = $regionService;
    }

    public function index()
    {
        $regions = collect([['id' => 'all', 'label' => 'All destinations']])
            ->merge(RegionResource::collection($this->regionService->index())->resolve());

        return response()->json($regions->values());
    }
}
