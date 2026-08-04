<?php

use App\Exceptions\ApiExceptionHandler;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

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
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $e, Request $request) {
            $className = get_class($e);
            $handlers = ApiExceptionHandler::$handlers;

            if (array_key_exists($className, $handlers)) {
                $method = $handlers[$className];
                $handler = new ApiExceptionHandler();
                return $handler->$method($e, $request);
            }

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
    })->create();