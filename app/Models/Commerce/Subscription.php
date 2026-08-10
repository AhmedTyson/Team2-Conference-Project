<?php

namespace App\Models\Commerce;

use App\Enums\SubscriptionStatus;
use App\Models\Account\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'status',
        'price_cents',
        'currency',
        'started_at',
        'renews_at',
        'provider',
        'provider_ref',
    ];

    protected $casts = [
        'price_cents' => 'integer',
        'started_at' => 'datetime',
        'renews_at' => 'datetime',
        'status' => SubscriptionStatus::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', SubscriptionStatus::ACTIVE->value);
    }
}
