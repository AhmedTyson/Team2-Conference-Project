<?php

$secKey = 'egy_sk_test_c800c889be8ee60320ea7c0331950748ad433cc630ac1dfad78e63ff05dc4838';
$url = 'https://accept.paymob.com/v1/intention/';

$data = [
    'amount' => 1000,
    'currency' => 'EGP',
    'payment_methods' => [5835083],
    'billing_data' => [
        'email' => 'a@a.com',
        'first_name' => 'A',
        'last_name' => 'B',
        'phone_number' => '0100',
    ],
    'notify_url' => 'https://google.com/webhook',
    'return_url' => 'https://google.com/callback',
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Token '.$secKey]);
echo curl_exec($ch);
