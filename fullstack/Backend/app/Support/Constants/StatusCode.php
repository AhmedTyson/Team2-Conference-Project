<?php

namespace App\Support\Constants;

final class StatusCode
{
    const HTTP_200 = 200;

    const HTTP_201 = 201;

    const HTTP_400 = 400;

    const HTTP_401 = 401;

    const HTTP_403 = 403;

    const HTTP_404 = 404;

    const HTTP_409 = 409;

    const HTTP_422 = 422;

    const HTTP_500 = 500;

    public static function isSuccess(int $code): bool
    {
        return $code >= 200 && $code < 300;
    }

    public static function isClientError(int $code): bool
    {
        return $code >= 400 && $code < 500;
    }

    public static function isServerError(int $code): bool
    {
        return $code >= 500 && $code < 600;
    }
}
