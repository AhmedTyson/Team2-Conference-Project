<?php

namespace App\Models\System;

use App\Models\System\Enums\FlagStatus;
use App\Models\Account\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Agency\AgencyAssignment;



class Flag extends Model
{
    use HasApiTokens, HasFactory, HasUuids;
    protected $fillable = [
    'reporter_id',
    'flaggable_type',
    'flaggable_id',
    'agency_assignment_id',
    'reason',
    'details',
    'status',
    'reviewed_by',
    'reviewed_at',
];

protected $casts = [
    'reviewed_at' => 'datetime',
    'status' => FlagStatus::class,
];

public function reporter()
{
    return $this->belongsTo(User::class, 'reporter_id');
}

public function flaggable()
{
    return $this->morphTo(); // handles company, booking, or whatever you flag
}

public function agencyAssignment()
{
    return $this->belongsTo(AgencyAssignment::class);
}

public function reviewer()
{
    return $this->belongsTo(User::class, 'reviewed_by');
}

}
