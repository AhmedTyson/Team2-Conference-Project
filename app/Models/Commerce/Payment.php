<?php

namespace App\Models\Commerce;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    // Append-only: no update/delete should happen in application code.
    const UPDATED_AT = null;

    protected $fillable = [
        'booking_id',
        'order_id',
        'paymob_transaction_id',
        'status',
        'amount_cents',
        'currency',
        'card_type',
        'card_subtype',
        'card_pan',
        'hmac_valid',
        'raw_payload',
    ];

    protected $casts = [
        'amount_cents' => 'integer',
        'status' => PaymentStatus::class,
        'hmac_valid' => 'boolean',
        'raw_payload' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
