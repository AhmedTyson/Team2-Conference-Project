<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role_id',
        'name',
        'email',
        'password',
        'profile_image',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // belongs_to Role
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    // 1:1 - takes Survey
    public function survey(): HasOne
    {
        return $this->hasOne(Survey::class);
    }

    // 1:M - receives Notification
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    // 1:M - has Trip
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    // 1:M - has Favourite
    public function favourites(): HasMany
    {
        return $this->hasMany(Favourite::class);
    }

    // 1:M - writes Review
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
