<?php

namespace App\Http\Controllers;

use App\Http\Resources\DestinationResource;
use App\Services\DestinationService;
use Illuminate\Http\Request;

class DestinationController extends Controller
{
    protected $destinationService;

    public function __construct(DestinationService $destinationService)
    {
        $this->destinationService = $destinationService;
    }

    public function index()
    {
        return DestinationResource::collection(
            $this->destinationService->index()
        );
    }

    public function show($id)
    {
        return new DestinationResource(
            $this->destinationService->show($id)
        );
    }
}