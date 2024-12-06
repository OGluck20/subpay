<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

function outputError($message, $code = 500) {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    outputError('Invalid request method', 405);
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json);

if (!isset($data->reference) || !isset($data->token)) {
    outputError('Missing required parameters');
}

// Your Paystack secret key
$secretKey = 'sk_test_2c90488fdb5b45a0b586f847a459a174f7917c83';

// Verify the transaction
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.paystack.co/transaction/verify/" . rawurlencode($data->reference),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "accept: application/json",
        "authorization: Bearer " . $secretKey,
        "cache-control: no-cache"
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);

if ($err) {
    outputError('Failed to verify payment');
}

$verifyData = json_decode($response);

if (!$verifyData->status) {
    outputError('Payment verification failed');
}

// Check if payment is successful
if ($verifyData->data->status === 'success') {
    // You might want to store the transaction in your database here
    echo json_encode([
        'status' => 'success',
        'message' => 'Payment verified successfully',
        'data' => [
            'amount' => $verifyData->data->amount / 100, // Convert from kobo to naira
            'reference' => $verifyData->data->reference
        ]
    ]);
} else {
    outputError('Payment was not successful');
}
?> 