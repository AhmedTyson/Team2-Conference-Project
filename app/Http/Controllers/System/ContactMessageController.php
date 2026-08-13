<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Services\System\ContactMessageService;
use App\Support\ApiResponse;
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

        return ApiResponse::success(new ContactMessageResource($message), 'Message marked as read.');
    }

    public function markAsResolved(int $id): JsonResponse
    {
        $message = $this->contactMessageService->markAsResolved($id);

        return ApiResponse::success(new ContactMessageResource($message), 'Message marked as resolved.');
    }
}
