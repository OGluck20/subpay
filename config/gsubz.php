<?php
class Gsubz {
    private $apiKey;
    private $baseUrl;

    public function __construct() {
        // Replace with your actual Gsubz API key
        $this->apiKey = 'ap_7b1896948907b9299ee7129ede348e13';
        $this->baseUrl = 'https://gsubz.com/api/pay/'; // Replace with actual Gsubz API base URL
    }

    public function purchaseData($params) {
        try {
            // Log the request parameters
            error_log("Gsubz purchase data request: " . print_r($params, true));

            // Prepare the request data
            $data = [
                'network' => $params['network'],
                'plan' => $params['plan'],
                'phone' => $params['phone'],
                'api_key' => $this->apiKey
            ];

            // Initialize cURL session
            $ch = curl_init($this->baseUrl . 'data/purchase');
            
            // Set cURL options
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ]);

            // Execute cURL request
            $response = curl_exec($ch);
            
            // Check for cURL errors
            if (curl_errno($ch)) {
                throw new Exception('Curl error: ' . curl_error($ch));
            }

            // Close cURL session
            curl_close($ch);

            // Log the API response
            error_log("Gsubz API response: " . $response);

            // Decode and return the response
            $result = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON response from Gsubz API');
            }

            return $result;

        } catch (Exception $e) {
            error_log("Gsubz API error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    public function getPlans($service) {
        try {
            // Log the request for debugging
            error_log("Fetching plans for service: " . $service);

            // Initialize cURL session
            $ch = curl_init($this->baseUrl . 'plans?service=' . urlencode($service));
            
            // Set cURL options
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $this->apiKey
            ]);

            // Execute cURL request
            $response = curl_exec($ch);
            
            // Check for cURL errors
            if (curl_errno($ch)) {
                throw new Exception('Curl error: ' . curl_error($ch));
            }

            // Close cURL session
            curl_close($ch);

            // Log the API response
            error_log("Gsubz API response for plans: " . $response);

            // Decode and return the response
            $result = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON response from Gsubz API');
            }

            return $result;

        } catch (Exception $e) {
            error_log("Gsubz API error: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}
?> 