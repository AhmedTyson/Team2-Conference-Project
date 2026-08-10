<?php

use App\Exceptions\ApiExceptionHandler;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpFoundation\Response;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // 422 Validation
        $exceptions->render(function (ValidationException $e) {
            return response()->json([
                "success" => false,
                "message" => "Validation failed.",
                "error" => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        });

        // 401 Unauthorized
        $exceptions->render(function (AuthenticationException $e) {
            return response()->json([
                "success" => false,
                "message" => "Authentication token is invalid or missing.",
            ], Response::HTTP_UNAUTHORIZED);
        });

        // 403 Forbidden Authorization
        $exceptions->render(function (AuthorizationException $e) {

            return response()->json([
                'error' => [
                    'type' => basename(get_class($e)),
                    'status' => intval($e->getCode()) ?: 500,
                    'message' => $e->getMessage(),
                    'page' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            ]);
        });

        // 404 Not Found
        $exceptions->render(function (NotFoundHttpException $e) {
            return response()->json([
                "success" => false,
                "message" => "Resource not found."
            ], Response::HTTP_NOT_FOUND);
        });

        $exceptions->render(function (\Throwable $e, Request $request) {
            $status = $e instanceof HttpExceptionInterface
                ? $e->getStatusCode()
                : 500;

            return response()->json([
                'message' => $e->getMessage(),
            ], $status);
        });
    })->create();
