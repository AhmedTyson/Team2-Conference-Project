<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCountryRequest;
use App\Http\Requests\Admin\UpdateCountryRequest;
use App\Services\CountryService;
use Illuminate\Http\JsonResponse;

class AdminCountryController extends Controller
{
    protected CountryService $countryService;

    public function __construct(CountryService $countryService)
    {
        $this->countryService = $countryService;
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->countryService->getAllCountries(),
        ]);
    }

    public function store(StoreCountryRequest $request): JsonResponse
    {
        $country = $this->countryService->createCountry($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Country created successfully.',
            'data' => $country,
        ], 201);
    }

    public function update(UpdateCountryRequest $request, int $id): JsonResponse
    {
        $country = $this->countryService->updateCountry($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Country updated successfully.',
            'data' => $country,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->countryService->deleteCountry($id);

        return response()->json([
            'success' => true,
            'message' => 'Country deleted successfully.',
        ]);
    }
}