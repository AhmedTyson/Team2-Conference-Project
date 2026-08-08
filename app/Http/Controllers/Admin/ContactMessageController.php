<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ContactMessageStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactMessageController extends Controller
{
    /**
     * List all contact messages paginated.
     */
    public function index()
    {
        $messages = ContactMessage::latest()->paginate(20);

        return ContactMessageResource::collection($messages);
    }

    /**
     * Mark message as Read.
     */
    public function markAsRead(int $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);

        $message->update([
            'status' => ContactMessageStatus::READ->value,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read.',
            'data' => new ContactMessageResource($message),
        ]);
    }

    /**
     * Mark message as Resolved.
     */
    public function markAsResolved(int $id): JsonResponse
    {
        $message = ContactMessage::findOrFail($id);

        $message->update([
            'status' => ContactMessageStatus::RESOLVED->value,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message marked as resolved.',
            'data' => new ContactMessageResource($message),
        ]);
    }
}
