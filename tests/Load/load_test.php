<?php

declare(strict_types=1);

$base = getenv('BASE_URL') ?: 'http://127.0.0.1:8000/api';
$seconds = (int) (getenv('DURATION') ?: 15);
$email = getenv('TEST_EMAIL') ?: 'admin@threedos.com';
$password = getenv('TEST_PASSWORD') ?: 'password';

$publicGets = [
    '/v1/destinations',
    '/v1/hotels',
    '/v1/restaurants',
    '/v1/attractions',
    '/v1/categories',
];

$login = json_decode((string) file_get_contents($base . '/login', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode(['email' => $email, 'password' => $password]),
        'timeout' => 5,
    ],
])), true);

$token = $login['token'] ?? null;

if (! $token) {
    fwrite(STDERR, "login failed for {$email}\n");
    exit(1);
}

$mh = curl_multi_init();
$active = [];
$count = 0;
$errors = 0;
$latencies = [];

$spawn = static function () use ($base, $token, $publicGets, &$active, &$mh): void {
    foreach ($publicGets as $path) {
        $ch = curl_init($base . $path);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
        ]);
        curl_multi_add_handle($mh, $ch);
        $active[] = $ch;
    }

    $ch = curl_init($base . '/user');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
        CURLOPT_TIMEOUT => 5,
    ]);
    curl_multi_add_handle($mh, $ch);
    $active[] = $ch;

    $ch = curl_init($base . '/v1/trips/create');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
        CURLOPT_TIMEOUT => 5,
    ]);
    curl_multi_add_handle($mh, $ch);
    $active[] = $ch;
};

$spawn();
$deadline = microtime(true) + $seconds;

while (microtime(true) < $deadline) {
    curl_multi_exec($mh, $running);

    if ($running > 0) {
        curl_multi_select($mh, 0.05);
    }

    while (($msg = curl_multi_info_read($mh)) !== false) {
        $ch = $msg['handle'];
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $total = curl_getinfo($ch, CURLINFO_TOTAL_TIME) * 1000;

        if ($code >= 400 || $code === 0) {
            $errors++;
        }

        $latencies[] = $total;
        $count++;

        curl_multi_remove_handle($mh, $ch);
        $active = array_values(array_filter($active, static fn ($c) => $c !== $ch));
    }

    if ($running === 0 && $active === []) {
        $spawn();
    }
}

foreach ($active as $ch) {
    curl_multi_remove_handle($mh, $ch);
}
curl_multi_close($mh);

sort($latencies);
$n = count($latencies);
$avg = $n > 0 ? array_sum($latencies) / $n : 0;
$p50 = $latencies[(int) floor($n * 0.50)] ?? 0;
$p95 = $latencies[(int) floor($n * 0.95)] ?? 0;
$p99 = $latencies[(int) floor($n * 0.99)] ?? 0;

printf("results: requests=%d errors=%d error_rate=%.2f%% avg=%.1fms p50=%.1fms p95=%.1fms p99=%.1fms\n", $count, $errors, $n > 0 ? $errors / $n * 100 : 0, $avg, $p50, $p95, $p99);