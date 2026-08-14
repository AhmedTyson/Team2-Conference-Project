<?php

use App\Models\Account\User;
use App\Models\Chat\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{id}', function (User $user, $id) {
    $conversation = Conversation::find($id);
    if (! $conversation) {
        return false;
    }

    if ($user->hasRole(['admin', 'super_admin'])) {
        return true;
    }

    return (int) $conversation->user_id === (int) $user->id ||
           ((int) $conversation->agency_id === (int) $user->id && $user->hasRole('agency'));
});
