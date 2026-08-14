<?php

namespace App\Policies;

use App\Models\Account\User;
use App\Models\Chat\Conversation;

class ConversationPolicy
{
    /**
     * Determine whether the user can view the conversation.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        if ($user->hasRole(['admin', 'super_admin'])) {
            return true;
        }

        return (int) $user->id === (int) $conversation->user_id ||
               ((int) $user->id === (int) $conversation->agency_id && $user->hasRole('agency'));
    }

    /**
     * Determine whether the user can send messages in the conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }
}
