<?php

namespace App\Repositories;

use App\Interfaces\SurveyRepositoryInterface;
use App\Models\Survey;

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