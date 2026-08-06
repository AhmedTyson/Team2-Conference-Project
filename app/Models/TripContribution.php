<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TripContribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'contributor_name',
        'amount_cents',
        'message',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}