<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ItineraryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id', 'itemable_id', 'itemable_type', 'day_number', 'item_order',
        'type', 'time_slot', 'title', 'notes', 'estimated_cost',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function itemable(): MorphTo
    {
        return $this->morphTo();
    }
}
