<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attraction;
use App\Http\Resources\AttractionResource;
use App\Http\Requests\AdminAtrractionRequest;

class AdminAttractionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Attraction::query();

        // Apply filters based on request parameters
        if ($request->has('destination_id')) {
            $query->where('destination_id', $request->input('destination_id'));
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Paginate the results
        $attractions = $query->paginate(10);

        // Return the paginated results as a resource collection
        return response()->json([
            "success" => true,
            "message" => "Attractions retrieved successfully",
            "data" => AttractionResource::collection($attractions)
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(AdminAtrractionRequest $request)
    {
        $attraction = Attraction::create($request->validated());

        return response()->json([
            "success" => true,
            "message" => "Attraction created successfully",
            "data" => new AttractionResource($attraction)
        ], 201);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(AdminAtrractionRequest $request, string $id)
    {
        $attraction = Attraction::findOrFail($id);
        $attraction->update($request->validated());

        return response()->json([
            "success" => true,
            "message" => "Attraction updated successfully",
            "data" => new AttractionResource($attraction)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $attraction = Attraction::findOrFail($id);
        $attraction->delete();

        return response()->json([
            "success" => true,
            "message" => "Attraction deleted successfully",
            "data" => null
        ]);
    }
}
