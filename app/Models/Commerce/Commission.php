<?php

namespace App\Models\Commerce;

use App\Enums\CommissionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Commission extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'source_type',
        'source_id',
        'rate',
        'amount_cents',
        'status',
        'settled_at',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'amount_cents' => 'integer',
        'settled_at' => 'datetime',
        'status' => CommissionStatus::class,
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo(null, 'source_type', 'source_id');
    }

    public function markSettled(): void
    {
        $this->update(['status' => CommissionStatus::SETTLED->value, 'settled_at' => now()]);
    }
}
