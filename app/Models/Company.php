<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'domain',
        'admin_user_id',
        'travel_budget_cents',
    ];

    protected $casts = [
        'travel_budget_cents' => 'integer',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function address(): MorphOne
    {
        return $this->morphOne(Address::class, 'addressable');
    }
}