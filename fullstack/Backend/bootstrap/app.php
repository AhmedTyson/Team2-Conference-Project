<?php

use App\Exceptions\ApiExceptionHandler;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(HandleCors::class);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'verified' => EnsureEmailIsVerified::class,
        ]);

        $middleware->group('api', [
            // Must run first: reject all requests while app is in maintenance mode
            PreventRequestsDuringMaintenance::class,
            SubstituteBindings::class,
            EnsureUserIsActive::class,
            // SEC-16: global authenticated-API cap (60/min per user, IP fallback).
            'throttle:api_authenticated',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Pure API Server: Always render exceptions as JSON (Postman, web, curl, etc.)
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            return true;
        });

        // Single renderable: every API exception flows through ApiExceptionHandler
        $exceptions->renderable(function (Throwable $e, Request $request) {
            return app(ApiExceptionHandler::class)->render($e, $request);
        });
    })
    ->create();
