<?php

namespace App\Models\System;

use App\Enums\BudgetLevel;
use App\Models\Account\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Survey extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'travel_style', 'budget_level', 'interests'];

    protected function casts(): array
    {
        return [
            'budget_level' => BudgetLevel::class,
            'interests' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
