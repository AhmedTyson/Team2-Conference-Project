<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'iso_code', 'capital', 'flag_url', 'currency', 'languages',
    ];

    protected function casts(): array
    {
        return [
            'languages' => 'array',
        ];
    }

    public function destinations(): HasMany
    {
        return $this->hasMany(Destination::class);
    }
}
