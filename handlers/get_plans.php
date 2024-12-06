<?php
header('Content-Type: application/json');

// Get the POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$service = $data['service'] ?? '';

// Debug logging
error_log("Received input: " . $input);
error_log("Parsed service: " . $service);

if (empty($service)) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Service code is required',
        'debug' => [
            'input' => $input,
            'parsed' => $data
        ]
    ]);
    exit;
}

// Your GSUBZ API key
$apiKey = 'ap_7b1896948907b9299ee7129ede348e13';

// Initialize cURL session
$ch = curl_init();

// Set cURL options
curl_setopt_array($ch, [
    CURLOPT_URL => "https://gsubz.com/api/plans?service=" . urlencode($service),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]
]);

// Execute cURL request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Check for errors
if (curl_errno($ch)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch plans: ' . curl_error($ch)
    ]);
    exit;
}

curl_close($ch);

// Forward the response from GSUBZ
if ($httpCode === 200) {
    $result = json_decode($response, true);
    echo json_encode([
        'status' => 'success',
        'plans' => $result['plans'] ?? []
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch plans from provider',
        'http_code' => $httpCode,
        'response' => $response
    ]);
}
?> 