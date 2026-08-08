<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    public static function fail(
        string $message,
        string $type = 'http_error',
        int $status = 400,
        array $details = []
    ): JsonResponse {
        $payload = [
            'error' => [
                'type' => $type,
                'status' => $status,
                'message' => $message,
                'timestamp' => now()->toISOString(),
            ],
        ];

        if ($details !== []) {
            $payload['error']['details'] = $details;
        }

        return response()->json($payload, $status);
    }
}
