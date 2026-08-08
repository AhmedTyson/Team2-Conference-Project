<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHotelRequest;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminHotelController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Hotel::paginate(min((int) request('per_page', 15) ?: 15, 100)));
    }

    public function store(StoreHotelRequest $request)
    {
        $validated = $request->validated();

        $hotel = Hotel::create($validated);

        return new JsonResource($hotel);
    }

    public function show($id)
    {
        return new JsonResource(Hotel::findOrFail($id));
    }

    public function update(UpdateHotelRequest $request, $id)
    {
        $hotel = Hotel::findOrFail($id);

        $validated = $request->validated();

        $hotel->update($validated);

        return new JsonResource($hotel);
    }

    public function destroy($id)
    {
        $hotel = Hotel::findOrFail($id);
        $hotel->delete();

        return response()->json(['success' => true]);
    }
}
