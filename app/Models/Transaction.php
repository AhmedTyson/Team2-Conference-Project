<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    // Immutable audit trail: no update/delete should happen in application code.
    protected $fillable = [
        'user_id',
        'booking_id',
        'type',
        'amount_cents',
        'currency',
        'description',
        'metadata',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
