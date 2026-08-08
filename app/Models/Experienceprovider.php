<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Experienceprovider extends Model
{
    use HasFactory;

    protected $table = 'experience_providers';
 
    protected $fillable = [
        'user_id',
        'business_name',
        'bio',
        'website',
        'phone',
        'verified_at',
    ];
 
    protected $casts = [
        'verified_at' => 'datetime',
    ];
 
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
 
    // Experiences are linked via provider_id -> users.id, not this table's id
    public function experiences(): HasMany
    {
        return $this->hasMany(Experience::class, 'provider_id', 'user_id');
    }
 
    public function isVerified(): bool
    {
        return ! is_null($this->verified_at);
    }
}
