<?php

namespace App\Http\Controllers;

use App\Http\Resources\AttractionResource;
use App\Services\AttractionService;

class AttractionController extends Controller
{
    protected $attractionService;

    public function __construct(AttractionService $attractionService)
    {
        $this->attractionService = $attractionService;
    }

    public function index()
    {
        $attractions = $this->attractionService->getPublicList();

        return AttractionResource::collection($attractions);
    }

    public function show($id)
    {
        $attraction = $this->attractionService->showPublic($id);

        return new AttractionResource($attraction);
    }
}
