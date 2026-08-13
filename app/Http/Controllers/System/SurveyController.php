<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\StoreSurveyRequest;
use App\Http\Requests\System\UpdateSurveyRequest;
use App\Services\System\SurveyService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SurveyController extends Controller
{
    protected $surveyService;

    public function __construct(SurveyService $surveyService)
    {
        $this->surveyService = $surveyService;
    }

    public function index(): JsonResponse
    {
        $surveys = $this->surveyService->getSurveyByUserId(auth()->id());

        return ApiResponse::success($surveys, 'Surveys retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSurveyRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();

        $survey = $this->surveyService->createSurvey($data);

        return ApiResponse::success($survey, 'Survey created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $survey = $this->surveyService->getSurveyById($id, auth()->id());

        return ApiResponse::success($survey, 'Survey retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSurveyRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();

        $this->surveyService->updateSurvey($id, $data, auth()->id());

        return ApiResponse::success(null, 'Survey updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->surveyService->deleteSurvey($id, auth()->id());

        return ApiResponse::success(null, 'Survey deleted successfully');
    }
}
