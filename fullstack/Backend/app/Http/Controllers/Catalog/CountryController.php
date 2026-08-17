<?php

/**
 * CountryController.php
 * Date: 2026-08-17
 * Purpose: Public API endpoints for retrieving countries and cities catalog.
 */

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Catalog\Country;
use App\Models\Catalog\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CountryController extends Controller
{
    /**
     * Get all active countries with their destinations & cities
     */
    public function index(Request $request): JsonResponse
    {
        $query = Country::with(['destinations:id,country_id,name,city_name,image,latitude,longitude']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'LIKE', "%{$search}%")
                ->orWhere('iso_code', 'LIKE', "%{$search}%");
        }

        $countries = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $countries,
        ]);
    }

    /**
     * Get single country details with destinations
     */
    public function show($id): JsonResponse
    {
        $country = Country::with(['destinations', 'region'])->find($id);

        if (! $country) {
            return response()->json(['message' => 'Country not found'], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $country,
        ]);
    }

    /**
     * Get list of all cities across destinations
     */
    public function cities(Request $request): JsonResponse
    {
        $query = Destination::with('country:id,name,iso_code');

        if ($request->has('country_id')) {
            $query->where('country_id', $request->get('country_id'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('city_name', 'LIKE', "%{$search}%")
                    ->orWhere('name', 'LIKE', "%{$search}%");
            });
        }

        $cities = $query->get()->map(function ($dest) {
            return [
                'id' => $dest->id,
                'city' => $dest->city_name ?: $dest->name,
                'name' => $dest->name,
                'country_id' => $dest->country_id,
                'country' => $dest->country ? $dest->country->name : null,
                'latitude' => (float) $dest->latitude,
                'longitude' => (float) $dest->longitude,
                'image' => $dest->image,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $cities,
        ]);
    }
}
