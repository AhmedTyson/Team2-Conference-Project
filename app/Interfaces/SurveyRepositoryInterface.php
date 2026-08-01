<?php

namespace App\Interfaces;

interface SurveyRepositoryInterface
{
    public function getAllSurveys();

    public function getSurveyById($surveyId);

    public function createSurvey(array $surveyDetails);

    public function updateSurvey($surveyId, array $newDetails);

    public function deleteSurvey($surveyId);
}