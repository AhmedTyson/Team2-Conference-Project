<?php

namespace App\Policies;

use App\Models\Account\User;
use App\Models\Chat\Conversation;
use App\Models\System\Flag;

class ConversationPolicy
{
    /**
     * Determine whether the user can view the conversation.
     *
     * Privacy & Security Guard:
     * - Customers & Agencies can view their own direct conversations.
     * - Admins / Super Admins can ONLY view/inspect conversations if a Flag report
     *   has been filed for moderation (by customer, agency, or on assignment/trip).
     */
    public function view(User $user, Conversation $conversation): bool
    {
        // 1. Direct participants (Customer & Agency) can always view
        if ((int) $user->id === (int) $conversation->user_id ||
            ((int) $user->id === (int) $conversation->agency_id && $user->hasRole('agency'))) {
            return true;
        }

        // 2. Admin oversight is restricted strictly to reported / flagged conversations
        if ($user->hasRole(['admin', 'super_admin'])) {
            return Flag::query()
                ->where(function ($q) use ($conversation) {
                    $q->where('reporter_id', $conversation->user_id)
                      ->orWhere('reporter_id', $conversation->agency_id);
                })
                ->orWhere(function ($q) use ($conversation) {
                    if ($conversation->trip_id) {
                        $q->where('flaggable_type', 'trip')
                          ->where('flaggable_id', $conversation->trip_id);
                    }
                })
                ->orWhere(function ($q) use ($conversation) {
                    $q->whereHas('agencyAssignment', function ($aq) use ($conversation) {
                        $aq->where('customer_id', $conversation->user_id)
                           ->where('agency_id', $conversation->agency_id);
                    });
                })
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can send messages in the conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }
}
