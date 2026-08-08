<?php

namespace App\Services;

use App\Interfaces\SurveyRepositoryInterface;

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

    public function getSurveyById($surveyId)
    {
        return $this->surveyRepository->getSurveyById($surveyId);
    }

    public function createSurvey(array $surveyDetails)
    {
        return $this->surveyRepository->createSurvey($surveyDetails);
    }

    public function updateSurvey($surveyId, array $newDetails)
    {
        return $this->surveyRepository->updateSurvey($surveyId, $newDetails);
    }

    public function deleteSurvey($surveyId)
    {
        return $this->surveyRepository->deleteSurvey($surveyId);
    }
}
