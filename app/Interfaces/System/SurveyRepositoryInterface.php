<?php

namespace App\Interfaces\System;

interface SurveyRepositoryInterface
{
    public function getAllSurveys();

    public function getSurveyById($surveyId, $userId = null);

    public function getSurveyByUserId($userId);

    public function createSurvey(array $surveyDetails);

    public function updateSurvey($surveyId, array $newDetails, $userId = null);

    public function deleteSurvey($surveyId, $userId = null);
}
