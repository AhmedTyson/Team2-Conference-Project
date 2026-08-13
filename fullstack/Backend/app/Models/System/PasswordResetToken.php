<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Password Reset Token Model
 *
 * Extends Laravel's built-in PasswordResetToken model to add expiration functionality.
 * Tokens automatically expire after 60 minutes.
 */
class PasswordResetToken extends Model
{
    /** @use HasFactory */
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'password_reset_tokens';

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'email';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'token',
        'expires_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Create a new password reset token with expiration.
     */
    public static function createWithExpiration(string $email, string $token): static
    {
        $tokenInstance = new static;
        $tokenInstance->email = $email;
        $tokenInstance->token = $token;
        $tokenInstance->expires_at = Carbon::now()->addMinutes(60);
        $tokenInstance->save();

        return $tokenInstance;
    }

    /**
     * Check if the token has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the token is still valid.
     */
    public function isValid(): bool
    {
        return ! $this->isExpired();
    }
}
