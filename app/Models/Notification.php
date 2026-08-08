<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\DatabaseNotification;

class Notification extends DatabaseNotification
{
    /**
     * The table associated with the model.
     * We override this to ensure it uses our custom 'notifications' table
     * which has standard integer increments instead of UUIDs.
     *
     * @var string
     */
    protected $table = 'notifications';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    protected static function booted()
    {
        static::creating(function ($notification) {
            // Automatically set user_id if the notifiable is a User
            if ($notification->notifiable_type === User::class) {
                $notification->user_id = $notification->notifiable_id;
            }
        });
    }

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
