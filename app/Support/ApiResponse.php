<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200,
        array $extra = []
    ): JsonResponse {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        return response()->json(array_merge($payload, $extra), $status);
    }

    public static function fail(
        string $message,
        string $type = 'http_error',
        int $status = 400,
        array $extras = []
    ): JsonResponse {
        $payload = [
            'error' => [
                'type' => $type,
                'status' => $status,
                'message' => $message,
                'timestamp' => now()->toISOString(),
            ],
        ];

        if ($extras !== []) {
            $payload['error'] = array_merge($payload['error'], $extras);
        }

        return response()->json($payload, $status);
    }
}
