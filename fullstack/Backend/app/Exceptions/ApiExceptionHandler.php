<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class ApiExceptionHandler
{
    /**
     * Map of exception classes to their handler methods
     */
    public static array $handlers = [
        AuthenticationException::class => 'handleAuthenticationException',
        AccessDeniedHttpException::class => 'handleAuthorizationException',
        AuthorizationException::class => 'handleAuthorizationException',
        \Spatie\Permission\Exceptions\UnauthorizedException::class => 'handleAuthorizationException',
        ValidationException::class => 'handleValidationException',
        ModelNotFoundException::class => 'handleNotFoundException',
        NotFoundHttpException::class => 'handleNotFoundException',
        MethodNotAllowedHttpException::class => 'handleMethodNotAllowedException',
        HttpException::class => 'handleHttpException',
        QueryException::class => 'handleQueryException',
    ];

    /**
     * Main entry point: routes any Throwable to its dedicated handler.
     * Registered as the single renderable for the whole API.
     */
    public function render(Throwable $e, Request $request): JsonResponse
    {
        foreach (self::$handlers as $exceptionClass => $handlerMethod) {
            if ($e instanceof $exceptionClass) {
                return $this->{$handlerMethod}($e, $request);
            }
        }

        $this->logException($e, 'Unhandled exception');

        $status = $e instanceof HttpException
            ? $e->getStatusCode()
            : 500;

        return $this->error(
            $this->getExceptionType($e),
            $status,
            'An unexpected error occurred.'
        );
    }

    /**
     * Single error-envelope builder — every handler delegates here so the
     * error shape stays identical across the whole API.
     */
    protected function error(
        string $type,
        int $status,
        string $message,
        array $extras = []
    ): JsonResponse {
        return ApiResponse::fail($message, $type, $status, $extras);
    }

    /**
     * Handle authentication exceptions
     */
    public function handleAuthenticationException(
        AuthenticationException $e,
        Request $request
    ): JsonResponse {
        $this->logException($e, 'Authentication failed');

        return $this->error(
            $this->getExceptionType($e),
            401,
            'Authentication required. Please provide valid credentials.'
        );
    }

    /**
     * Handle authorization exceptions
     */
    public function handleAuthorizationException(
        Throwable $e,
        Request $request
    ): JsonResponse {
        $this->logException($e, 'Authorization failed');

        return $this->error(
            $this->getExceptionType($e),
            403,
            'You do not have permission to perform this action.'
        );
    }

    /**
     * Handle validation exceptions
     */
    public function handleValidationException(
        ValidationException $e,
        Request $request
    ): JsonResponse {
        $errors = [];

        foreach ($e->errors() as $field => $messages) {
            foreach ($messages as $message) {
                $errors[] = [
                    'field' => $field,
                    'message' => $message,
                ];
            }
        }

        $this->logException($e, 'Validation failed', ['errors' => $errors]);

        return $this->error(
            $this->getExceptionType($e),
            422,
            'The provided data is invalid.',
            ['validation_errors' => $errors]
        );
    }

    /**
     * Handle not found exceptions
     */
    public function handleNotFoundException(
        ModelNotFoundException|NotFoundHttpException $e,
        Request $request
    ): JsonResponse {
        $this->logException($e, 'Resource not found');

        $message = $e instanceof ModelNotFoundException
            ? 'The requested resource was not found.'
            : "The requested endpoint '{$request->getRequestUri()}' was not found.";

        return $this->error(
            $this->getExceptionType($e),
            404,
            $message
        );
    }

    /**
     * Handle method not allowed exceptions
     */
    public function handleMethodNotAllowedException(
        MethodNotAllowedHttpException $e,
        Request $request
    ): JsonResponse {
        $this->logException($e, 'Method not allowed');

        return $this->error(
            $this->getExceptionType($e),
            405,
            "The {$request->method()} method is not allowed for this endpoint.",
            ['allowed_methods' => $e->getHeaders()['Allow'] ?? 'Unknown']
        );
    }

    /**
     * Handle general HTTP exceptions
     */
    public function handleHttpException(HttpException $e, Request $request): JsonResponse
    {
        $this->logException($e, 'HTTP exception occurred');

        return $this->error(
            $this->getExceptionType($e),
            $e->getStatusCode(),
            $e->getMessage() ?: 'An HTTP error occurred.'
        );
    }

    /**
     * Handle database query exceptions
     */
    public function handleQueryException(QueryException $e, Request $request): JsonResponse
    {
        $this->logException($e, 'Database query failed', ['sql' => $e->getSql()]);

        // Handle specific database constraint violations
        $errorCode = $e->errorInfo[1] ?? null;

        return match ($errorCode) {
            1451 => $this->error(
                $this->getExceptionType($e),
                409,
                'Cannot delete this resource because it is referenced by other records.'
            ),
            1062 => $this->error(
                $this->getExceptionType($e),
                409,
                'A record with this information already exists.'
            ),
            default => $this->error(
                $this->getExceptionType($e),
                500,
                'A database error occurred. Please try again later.'
            ),
        };
    }

    /**
     * Extract a clean exception type name
     */
    private function getExceptionType(Throwable $e): string
    {
        $className = basename(str_replace('\\', '/', get_class($e)));

        return $className;
    }

    /**
     * Log exception with context
     */
    private function logException(Throwable $e, string $message, array $context = []): void
    {
        $logContext = array_merge([
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
        ], $context);

        Log::warning($message, $logContext);
    }
}
