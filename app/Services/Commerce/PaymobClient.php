<?php

namespace App\Services\Commerce;

use Paymob\Library\Paymob;

/**
 * PaymobClient — SDK subclass that enforces cURL timeouts.
 *
 * The paymob/php-library v1.0.4 SDK (vendor/paymob/php-library/src/Paymob.php)
 * sets CURLOPT_URL, CURLOPT_POST, CURLOPT_HTTPHEADER, CURLOPT_RETURNTRANSFER
 * but NO CURLOPT_TIMEOUT or CURLOPT_CONNECTTIMEOUT — confirmed by direct
 * source inspection on 2026-08-11. The SDK exposes no constructor option
 * or setter for timeout configuration.
 *
 * This subclass overrides HttpRequest() to inject bounded cURL timeouts
 * before the request executes. All other SDK behavior is unchanged.
 */
class PaymobClient extends Paymob
{
    public function __construct(
        protected int $timeoutSeconds,
        protected int $connectTimeoutSeconds,
        bool $debug_order = false,
        mixed $file = null,
    ) {
        parent::__construct($debug_order, $file);
    }

    /**
     * {@inheritdoc}
     *
     * Injects CURLOPT_TIMEOUT and CURLOPT_CONNECTTIMEOUT before execution.
     * Parent sets: CURLOPT_URL, CURLOPT_POST/CURLOPT_CUSTOMREQUEST,
     *              CURLOPT_HTTPHEADER, CURLOPT_RETURNTRANSFER.
     * We add the two timeout options the SDK omits entirely.
     */
    public function HttpRequest($apiPath, $method, $header = [], $data = [])
    {
        if (! in_array('curl', get_loaded_extensions())) {
            throw new \Exception('Curl extension is not loaded on your server, please check with server admin. Then try again!');
        }

        ini_set('precision', 14);
        ini_set('serialize_precision', -1);

        $curl = curl_init();

        curl_setopt($curl, CURLOPT_URL, $apiPath);
        if ($method == 'GET') {
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
        } else {
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
        }
        curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

        // Enforce bounded execution — the upstream SDK sets none of these.
        curl_setopt($curl, CURLOPT_TIMEOUT, $this->timeoutSeconds);
        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, $this->connectTimeoutSeconds);

        $response = curl_exec($curl);

        if ($response === false) {
            throw new \Exception('Curl error: '.curl_error($curl));
        }
        curl_close($curl);

        return json_decode($response, false);
    }
}
