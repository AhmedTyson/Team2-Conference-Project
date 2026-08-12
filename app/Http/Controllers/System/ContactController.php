<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;

use App\Http\Requests\System\StoreContactMessageRequest;
use App\Services\System\ContactMessageService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    protected $contactMessageService;

    public function __construct(ContactMessageService $contactMessageService)
    {
        $this->contactMessageService = $contactMessageService;
    }

    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        $this->contactMessageService->store($request->validated());

        return ApiResponse::success(null, 'Your message has been sent successfully.', 201);
    }
}
