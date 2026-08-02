  <?php

use App\Exceptions\JsonExceptionResolver;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\CacheJsonResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(DIR))
    ->withRouting(
        web: DIR.'/../routes/web.php',
        api: DIR.'/../routes/api.php',
        commands: DIR.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
<<<<<<< HEAD
            'isAdmin' => IsAdmin::class,
            'cache.json' => CacheJsonResponse::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return route('login');
        });
=======
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
>>>>>>> adham
    })

    ->withExceptions(function (Exceptions $exceptions): void {
<<<<<<< HEAD
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            $status  = JsonExceptionResolver::statusCode($e);
            $message = JsonExceptionResolver::message($e, $status);
            $data    = JsonExceptionResolver::data($e, $status);

            $payload = ['message' => $message, 'data' => $data];

            if (config('app.debug') && app()->environment('local') && $status >= 500) {
                $payload['debug'] = [
                    'file'  => $e->getFile() . ':' . $e->getLine(),
                    'type'  => get_class($e),
                    'trace' => collect($e->getTrace())->take(5)->toArray(),
                ];
            }

            return response()->json($payload, $status);
        });
    })

    ->create();
=======
        //
    })->create();

>>>>>>> adham
