<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\StoreNewsletterSubscriptionRequest;
use App\Services\System\NewsletterService;
use App\Support\ApiResponse;
use App\Support\Constants\StatusCode;
use Illuminate\Http\JsonResponse;

class NewsletterController extends Controller
{
    protected $newsletterService;

    public function __construct(NewsletterService $newsletterService)
    {
        $this->newsletterService = $newsletterService;
    }

    public function store(StoreNewsletterSubscriptionRequest $request): JsonResponse
    {
        $created = $this->newsletterService->subscribe($request->validated()['email']);

        if (! $created) {
            return ApiResponse::fail(
                'This email is already subscribed.',
                'ConflictError',
                StatusCode::HTTP_409
            );
        }

        return ApiResponse::success(null, 'Successfully subscribed to the newsletter.', StatusCode::HTTP_201);
    }
}