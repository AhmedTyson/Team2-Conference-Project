<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favourite extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'favorable_id', 'favorable_type', 'note'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function favorable()
    {
        return $this->morphTo();
    }
}
