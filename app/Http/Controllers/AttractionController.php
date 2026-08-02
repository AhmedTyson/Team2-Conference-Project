<?php

namespace App\Http\Controllers;

use App\Models\Attraction;
use App\Http\Resources\AttractionResource;
use Illuminate\Http\Request;

class AttractionController extends Controller
{
   
    public function index()
    {
        $attractions = Attraction::with(['destination', 'category'])->get();

        return AttractionResource::collection($attractions);
    }

    public function show($id)
    {
        $attraction = Attraction::with(['destination', 'category'])->findOrFail($id);

        return new AttractionResource($attraction);
    }
}