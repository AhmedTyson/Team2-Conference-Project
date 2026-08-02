<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

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
    ->withExceptions(function (Exceptions $exception): void {
        // 422 Validation
        $exception->render(function (ValidationException $e) {
            return response()->json([
                "success" => false,
                "message" => "Validation failed.",
                "error" => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        });

        // 401 UnAuthorized
        $exception->render(function (ValidationException $e) {
            return response()->json()([
                "success" => false,
                "message" => "Authentication token is invalid or missing.",
            ], (Response::HTTP_UNAUTHORIZED));
        });

        // 403 Forbidden Authorization
        $exception->render(function (ValidationException $e) {
            return response()->json([
                "success" => false,
                "message" => "You are not authorized to perform this action.",
            ], Response::HTTP_FORBIDDEN);
        });

        // 404 Not Found
        $exception->render(function (ValidationException $e) {
            return response()->json([
                "success"=>false,
                "message"=> "Resources not found."
            ], Response::HTTP_NOT_FOUND);
        });
    })->create();

