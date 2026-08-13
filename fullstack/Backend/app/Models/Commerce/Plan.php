<?php

namespace App\Models\Commerce;

use App\Enums\BillingCycle;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price_cents',
        'currency',
        'billing_cycle',
        'ai_quota_monthly',
        'features',
        'is_active',
    ];

    protected $casts = [
        'price_cents' => 'integer',
        'billing_cycle' => BillingCycle::class,
        'ai_quota_monthly' => 'integer',
        'features' => 'array',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
