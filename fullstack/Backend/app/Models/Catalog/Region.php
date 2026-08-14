<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    use HasFactory;

    protected $fillable = [
        'key', 'label',
    ];

    public function countries(): HasMany
    {
        return $this->hasMany(Country::class);
    }
}
