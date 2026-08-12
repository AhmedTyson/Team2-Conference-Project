<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Support\ApiResponse;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Reject requests from blocked (is_active = false) users at a single
     * centralized boundary, regardless of which route they hit.
     *
     * Runs inside the api middleware group, before route middleware. It only
     * acts when a bearer token is present and resolvable; invalid/expired
     * tokens pass through so the auth:api middleware handles them normally.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken() === null) {
            return $next($request);
        }

        try {
            $user = auth('api')->user();
        } catch (\Throwable $e) {
            return $next($request);
        }

        if ($user && ! $user->is_active) {
            return ApiResponse::fail('Your account has been blocked.', 'account_blocked', 403);
        }

        return $next($request);
    }
}
