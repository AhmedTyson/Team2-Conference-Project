<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\ReviewStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'reviewable_id', 'reviewable_type', 'rating', 'comment', ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

     public function reviewable(): MorphTo
    {
        return $this->morphTo();
    }

    protected function casts(): array
    {
        return [
            => ReviewStatus::class,
        ];
    }
}
