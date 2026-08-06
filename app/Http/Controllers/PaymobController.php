<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Exception;
use Paymob\Library\Paymob;
class PaymobController extends Controller
{

    protected $secret_key;
    protected $public_key;
    protected $integration_ids;
    protected $hmac;
    /**
     * Initiate Paymob Configuration
     */
    public function __construct()
    {

        $this->secret_key = config('paymob.secret_key');
        $this->public_key = config('paymob.public_key');
        $this->integration_ids = config('paymob.integration_ids');
        $this->hmac = config('paymob.hmac');
    }

    /**
     * Process Paymob Payment
     */
    public function process()
    {
        try {
            // Prepare billing data: Fill empty keys with 'N/A'; required!
            $billing = [
                "email" => 'someone@example.com',
                "first_name" => 'john',
                "last_name" => 'doe',
                "street" => 'NA',
                "phone_number" => '+1xxxxxxxx',
                "city" => 'NA',
                "country" => 'NA',
                "state" => 'NA',
                "postal_code" => 'NA',
            ];

            $integrations = explode(',', $this->integration_ids);
            $integration_ids = [];
            foreach ($integrations as $id) {
                $id = (int) $id;
                if ($id > 0) {
                    array_push($integration_ids, $id);
                }
            }

            // Prepare order data
            $orderId = '1';
            $currency = 'EGP'; // set the currency as per your need
            $price = '10'; // set the price as per your need
            $country = Paymob::getCountryCode($this->secret_key);
            $cents = $country == 'omn' ? 1000 : 100;
            $round = 2;
            $price = round((round($price, $round)) * $cents, $round);

            $data = [
                "amount" => $price,
                "currency" => $currency,
                "payment_methods" => $integration_ids,
                "billing_data" => $billing,
                "extras" => ["merchant_intention_id" => $orderId . '_' . time()],
                "special_reference" => $orderId . '_' . time()
            ];

            // Create Paymob intention
            $paymobReq = new Paymob('', '');
            $status = $paymobReq->createIntention($this->secret_key, $data, $orderId);

            // Process the response
            if (!$status['success']) {
                $response = ['IsSuccess' => 'false', 'Message' => $status['message']];
            } else {
                $countryCode = $paymobReq->getCountryCode($this->secret_key);
                $apiUrl = $paymobReq->getApiUrl($countryCode);
                $cs = $status['cs'];
                $to = $apiUrl . "unifiedcheckout/?publicKey=$this->public_key&clientSecret=$cs";
                // Redirect the user to Paymob checkout page
                return redirect($to);
            }
        } catch (Exception $e) {
            // Handle exceptions
            $response = ['IsSuccess' => 'false', 'Message' => $e->getMessage()];
        }
        return response()->json($response);
    }

    /**
     * Get Paymob payment information
     */
    public function callback(Request $request)
    {
        try {
            // Verify HMAC
            if (!Paymob::verifyHmac($this->hmac, $_GET)) {
                $response = ['IsSuccess' => 'false', 'Message' => 'Ops, you are accessing wrong data'];
                return response()->json($response);
            }

            // Extract intention ID from request parameters
            $orderId = Paymob::getIntentionId(Paymob::filterVar('merchant_order_id'));

            // Check if intention ID is valid
            if (empty($orderId)) {
                $response = ['IsSuccess' => 'false', 'Message' => 'Ops, you are accessing wrong data'];
                return response()->json($response);
            }

            // Check payment status
            $success = Paymob::filterVar('success') === "true";
            $is_voided = Paymob::filterVar('is_voided') === "true";
            $is_refunded = Paymob::filterVar('is_refunded') === "true";
            $msg = $success && !$is_voided && !$is_refunded ? 'Paymob : Payment Approved' : 'Paymob : Payment is not completed';

            // Prepare response
            $response = ['IsSuccess' => $success ? 'true' : 'false', 'Message' => $msg];
        } catch (Exception $e) {
            // Handle exceptions
            $response = ['IsSuccess' => 'false', 'Message' => $e->getMessage()];
        }
        return response()->json($response);
    }
}
