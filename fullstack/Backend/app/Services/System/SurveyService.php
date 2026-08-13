<?php

namespace App\Services\System;

use App\Interfaces\System\SurveyRepositoryInterface;

class SurveyService
{
    protected $surveyRepository;

    public function __construct(SurveyRepositoryInterface $surveyRepository)
    {
        $this->surveyRepository = $surveyRepository;
    }

    public function getAllSurveys()
    {
        return $this->surveyRepository->getAllSurveys();
    }

    public function getSurveyByUserId($userId)
    {
        return $this->surveyRepository->getSurveyByUserId($userId);
    }

    public function getSurveyById($surveyId, $userId = null)
    {
        return $this->surveyRepository->getSurveyById($surveyId, $userId);
    }

    public function createSurvey(array $surveyDetails)
    {
        return $this->surveyRepository->createSurvey($surveyDetails);
    }

    public function updateSurvey($surveyId, array $newDetails, $userId = null)
    {
        return $this->surveyRepository->updateSurvey($surveyId, $newDetails, $userId);
    }

    public function deleteSurvey($surveyId, $userId = null)
    {
        return $this->surveyRepository->deleteSurvey($surveyId, $userId);
    }
}
