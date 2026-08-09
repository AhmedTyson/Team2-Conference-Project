<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Services\ContactMessageService;
use Illuminate\Http\JsonResponse;

class ContactMessageController extends Controller
{
    protected $contactMessageService;

    public function __construct(ContactMessageService $contactMessageService)
    {
        $this->contactMessageService = $contactMessageService;
    }

    public function index()
    {
        $messages = $this->contactMessageService->getAdminList();
        return ContactMessageResource::collection($messages);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $message = $this->contactMessageService->markAsRead($id);

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read.',
            'data' => new ContactMessageResource($message),
        ]);
    }

    public function markAsResolved(int $id): JsonResponse
    {
        $message = $this->contactMessageService->markAsResolved($id);

        return response()->json([
            'success' => true,
            'message' => 'Message marked as resolved.',
            'data' => new ContactMessageResource($message),
        ]);
    }
}
