<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Services\System\SurveyService;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    protected $surveyService;

    public function __construct(SurveyService $surveyService)
    {
        $this->surveyService = $surveyService;
    }

    public function index()
    {
        $surveys = $this->surveyService->getSurveyByUserId(auth()->id());

        return response()->json([
            'message' => 'Surveys retrieved successfully',
            'data' => $surveys,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->all();
        $data['user_id'] = auth()->id();

        $survey = $this->surveyService->createSurvey($data);

        return response()->json([
            'message' => 'Survey created successfully',
            'data' => $survey,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $survey = $this->surveyService->getSurveyById($id, auth()->id());

        return response()->json([
            'message' => 'Survey retrieved successfully',
            'data' => $survey,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $data = $request->all();
        unset($data['user_id']);

        $this->surveyService->updateSurvey($id, $data, auth()->id());

        return response()->json([
            'message' => 'Survey updated successfully',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->surveyService->deleteSurvey($id, auth()->id());

        return response()->json([
            'message' => 'Survey deleted successfully',
        ]);
    }
}
