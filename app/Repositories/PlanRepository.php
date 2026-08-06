<?php

namespace App\Repositories;

use App\Interfaces\PlanRepositoryInterface;
use App\Models\Plan;
use App\Models\Subscription;

class PlanRepository implements PlanRepositoryInterface
{
    public function getAllPlans()
    {
        return Plan::where('is_active', true)->orderBy('price_cents')->get();
    }

    public function upsertPlans(array $plans)
    {
        return collect($plans)->map(fn (array $data) => Plan::updateOrCreate(
            ['name' => $data['name']],
            $data
        ));
    }

    public function findPlan(int $id)
    {
        return Plan::where('is_active', true)->findOrFail($id);
    }

    public function getActiveSubscription(int $userId)
    {
        return Subscription::active()->where('user_id', $userId)->latest()->first();
    }

    public function getLatestSubscription(int $userId)
    {
        return Subscription::where('user_id', $userId)->latest()->first();
    }
}
