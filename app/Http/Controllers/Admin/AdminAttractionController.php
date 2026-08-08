<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attraction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminAttractionController extends Controller
{
    public function index(Request $request)
    {
        $query = Attraction::query();

        if ($request->has('destination_id')) {
            $query->where('destination_id', $request->input('destination_id'));
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        return JsonResource::collection($query->paginate(min((int) request("per_page", 15) ?: 15, 100)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'destination_id' => 'required|exists:destinations,id',
            'category_id' => 'required|exists:categories,id',
        ]);

        $attraction = Attraction::create($validated);
        return new JsonResource($attraction);
    }

    public function show($id)
    {
        return new JsonResource(Attraction::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $attraction = Attraction::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'destination_id' => 'sometimes|exists:destinations,id',
            'category_id' => 'sometimes|exists:categories,id',
        ]);

        $attraction->update($validated);
        return new JsonResource($attraction);
    }

    public function destroy($id)
    {
        $attraction = Attraction::findOrFail($id);
        $attraction->delete();
        return response()->json(['success' => true]);
    }
}

