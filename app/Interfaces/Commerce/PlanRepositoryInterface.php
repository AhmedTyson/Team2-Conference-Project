<?php

namespace App\Interfaces\Commerce;

interface PlanRepositoryInterface
{
    public function getAllPlans();

    public function upsertPlans(array $plans);

    public function findPlan(int $id);

    public function getActiveSubscription(int $userId);

    public function getLatestSubscription(int $userId);
}
