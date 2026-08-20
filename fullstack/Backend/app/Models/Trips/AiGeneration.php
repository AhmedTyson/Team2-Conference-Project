<?php

namespace App\Models\Trips;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGeneration extends Model
{
    protected $fillable = [
        'user_id', 'trip_id', 'city', 'no_of_days', 'travel_style',
        'budget_tier', 'status', 'error_message', 'items_count', 'used_fallback',
    ];

    protected $casts = [
        'used_fallback' => 'boolean',
        'items_count'   => 'integer',
        'no_of_days'    => 'integer',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
