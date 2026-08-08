<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminCountryController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Country::paginate(min((int) request("per_page", 15) ?: 15, 100)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'iso_code' => 'required|string|max:10',
            'capital' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
            'languages' => 'nullable|string',
        ]);

        $country = Country::create($validated);
        return new JsonResource($country);
    }

    public function show($id)
    {
        return new JsonResource(Country::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $country = Country::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'iso_code' => 'sometimes|string|max:10',
            'capital' => 'nullable|string|max:255',
            'currency' => 'nullable|string|max:10',
            'languages' => 'nullable|string',
        ]);

        $country->update($validated);
        return new JsonResource($country);
    }

    public function destroy($id)
    {
        $country = Country::findOrFail($id);
        $country->delete();
        return response()->json(['success' => true]);
    }
}
