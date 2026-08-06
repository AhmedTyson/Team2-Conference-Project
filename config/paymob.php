<?php

return [
    /**
     * Secret Key
     */
    'secret_key' => 'XXXXXXXX',
    /**
     * Public Key
     */
    'public_key' => 'XXXXXXXX',
    /**
     * Payment method(s)
     * Add the Payment methods ID(s) that exist in Paymob account separated by comma , separator. (Example: 123456,98765,45678)
     */
    'integration_ids' => 'xxxx',
    /**
     * HMAC
     */
    'hmac' => 'XXXXXXXX',
    /**
     * Callback URL
     * Please add the below URL in Paymob Merchant account for both callback and response URLs Settings for each payment method.Replace only the {example.com} with your site domain
     */
    'callback_url' => 'https://{YourWebsiteURL}/paymob/callback',
];
