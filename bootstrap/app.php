<?php

use App\Exceptions\ApiExceptionHandler;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance;
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
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);

        $middleware->group('api', [
            // Must run first: reject all requests while app is in maintenance mode
            // (php artisan down / up). This prevents DB/auth calls against an
            // intentionally-offline application.
            PreventRequestsDuringMaintenance::class,
            SubstituteBindings::class,
            EnsureUserIsActive::class,
            // SEC-16: global authenticated-API cap (60/min per user, IP fallback).
            // Route-level throttles (login/ai/maps/checkout/...) still apply on top.
            'throttle:api_authenticated',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Single renderable: every API exception flows through ApiExceptionHandler
        $exceptions->renderable(function (Throwable $e, Request $request) {
            return app(ApiExceptionHandler::class)->render($e, $request);
        });
    })
    ->create();
