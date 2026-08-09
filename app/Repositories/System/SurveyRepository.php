<?php

namespace App\Repositories\System;

use App\Interfaces\System\SurveyRepositoryInterface;
use App\Models\System\Survey;

class SurveyRepository implements SurveyRepositoryInterface
{
    public function getAllSurveys()
    {
        return Survey::all();

    }

    public function getSurveyByUserId($userId)
    {
        return Survey::where('user_id', $userId)->get();

    }

    public function getSurveyById($surveyId)
    {
        return Survey::findOrFail($surveyId);
    }

    public function createSurvey(array $surveyDetails)
    {
        return Survey::create($surveyDetails);

    }

    public function updateSurvey($surveyId, array $newDetails)
    {
        $survey = Survey::findOrFail($surveyId);
        $survey->update($newDetails);

        return $survey;

    }

    public function deleteSurvey($surveyId)
    {
        Survey::destroy($surveyId);

    }
}
