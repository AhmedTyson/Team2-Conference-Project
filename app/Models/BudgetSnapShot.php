<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'total_budget_cents',
        'spent_cents',
        'remaining_cents',
        'breakdown',
        'recorded_at',
    ];

    protected $casts = [
        'total_budget_cents' => 'integer',
        'spent_cents' => 'integer',
        'remaining_cents' => 'integer',
        'breakdown' => 'array',
        'recorded_at' => 'datetime',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}