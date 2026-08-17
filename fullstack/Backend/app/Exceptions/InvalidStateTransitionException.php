<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;

class InvalidStateTransitionException extends AuthorizationException
{
    public function __construct(string $message = '', int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    public function report(): void
    {
        // Log the exception
        \Log::error('Invalid state transition: '.$this->getMessage());
    }

    public function render($request): JsonResponse
    {
        return response()->json([
            'error' => [
                'type' => 'invalid_state_transition',
                'status' => 409,
                'message' => $this->getMessage(),
                'timestamp' => now()->toISOString(),
            ],
        ], 409);
    }
}
