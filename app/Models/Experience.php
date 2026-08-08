<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Experience extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'experience';

    protected $fillable = [
        'provider_id',
        'destination_id',
        'name',
        'description',
        'price_cents',
        'duration_minutes',
        'max_participants',
        'status',
        'eco_score',
    ];
 
    protected $casts = [
        'price_cents' => 'integer',
        'duration_minutes' => 'integer',
        'max_participants' => 'integer',
        'eco_score' => 'integer',
    ];
 
    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }
 
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }
 
    public function address(): MorphOne
    {
        return $this->morphOne(Address::class, 'addressable');
    }
 
    public function views(): MorphMany
    {
        return $this->morphMany(EntityView::class, 'viewable');
    }
 
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
