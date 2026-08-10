<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreCountryRequest;
use App\Http\Requests\Catalog\UpdateCountryRequest;
use App\Services\Catalog\CountryService;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminCountryController extends Controller
{
    protected $countryService;

    public function __construct(CountryService $countryService)
    {
        $this->countryService = $countryService;
    }

    public function index()
    {
        $countries = $this->countryService->getAdminList();
        return JsonResource::collection($countries);
    }

    public function store(StoreCountryRequest $request)
    {
        $country = $this->countryService->store($request->validated());
        return new JsonResource($country);
    }

    public function show($id)
    {
        $country = $this->countryService->showAdmin($id);
        return new JsonResource($country);
    }

    public function update(UpdateCountryRequest $request, $id)
    {
        $country = $this->countryService->update($id, $request->validated());
        return new JsonResource($country);
    }

    public function destroy($id)
    {
        $this->countryService->destroy($id);
        return response()->json(['success' => true]);
    }
}
