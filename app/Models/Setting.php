<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value'];

    // ── Public cache ─────────────────────────────────────────────────────

    public const PUBLIC_CACHE_KEY = 'site-settings.public';

    /** Exact keys exposed on the public endpoint */
    public const SITE_KEYS = [
        'site_name', 'logo_url', 'tagline', 'homepage_banner',
    ];

    /** Key prefixes also exposed on the public endpoint */
    public const SITE_KEYS_PREFIX = ['contact_', 'social_'];

    // ── Helpers ──────────────────────────────────────────────────────────

    public static function isPublicKey(string $key): bool
    {
        if (in_array($key, self::SITE_KEYS, true)) {
            return true;
        }

        foreach (self::SITE_KEYS_PREFIX as $prefix) {
            if (str_starts_with($key, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /** Returns whitelisted key→value map, sorted by key for stable cache. */
    public static function publicData(): array
    {
        return self::pluck('value', 'key')
            ->filter(fn ($_, $key) => self::isPublicKey($key))
            ->sortKeys()
            ->all();
    }

    public static function forgetPublicCache(): void
    {
        Cache::forget(self::PUBLIC_CACHE_KEY);
    }
}
