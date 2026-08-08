<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCountryRequest;
use App\Http\Requests\UpdateCountryRequest;
use App\Models\Country;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminCountryController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Country::paginate(min((int) request('per_page', 15) ?: 15, 100)));
    }

    public function store(StoreCountryRequest $request)
    {
        $validated = $request->validated();

        $country = Country::create($validated);

        return new JsonResource($country);
    }

    public function show($id)
    {
        return new JsonResource(Country::findOrFail($id));
    }

    public function update(UpdateCountryRequest $request, $id)
    {
        $country = Country::findOrFail($id);

        $validated = $request->validated();

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
