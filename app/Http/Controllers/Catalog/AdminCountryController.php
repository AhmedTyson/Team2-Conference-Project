<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreCountryRequest;
use App\Http\Requests\Catalog\UpdateCountryRequest;
use App\Models\Catalog\Country;
use App\Services\Catalog\CountryService;
use App\Support\ApiResponse;
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
        $countries = $this->countryService->getAdminList(request('trashed') === '1');

        return JsonResource::collection($countries);
    }

    public function store(StoreCountryRequest $request)
    {
        $country = $this->countryService->store($request->validated());

        return (new JsonResource($country))->response()->setStatusCode(201);
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

    public function destroy($id): JsonResponse
    {
        $this->countryService->destroy($id);

        return ApiResponse::success(null, 'Country deleted successfully');
    }

    public function restore(int $id): JsonResponse
    {
        Country::onlyTrashed()->findOrFail($id)->restore();

        return ApiResponse::success(null, 'Country restored successfully');
    }
}
