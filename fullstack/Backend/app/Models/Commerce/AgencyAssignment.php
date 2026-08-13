<?php

namespace App\Models\Commerce;

use App\Enums\AgencyAssignmentStatus;
use App\Models\Account\User;
use App\Models\Trips\Trip;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgencyAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'agency_user_id',
        'admin_id',
        'budget_level',
        'status',
        'admin_approved_at',
        'agency_responded_at',
    ];

    protected $casts = [
        'status' => AgencyAssignmentStatus::class,
        'admin_approved_at' => 'datetime',
        'agency_responded_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agency_user_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'agency_assignment_id');
    }
}
