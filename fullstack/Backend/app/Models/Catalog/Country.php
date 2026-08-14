<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Country extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'region_id', 'name', 'iso_code', 'capital', 'flag_url', 'currency', 'languages',
    ];

    protected function casts(): array
    {
        return [
            'languages' => 'array',
        ];
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function destinations(): HasMany
    {
        return $this->hasMany(Destination::class);
    }
}
