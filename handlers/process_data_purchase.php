<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once __DIR__ . '/debug.php';

try {
    require_once __DIR__ . '/../api/db.php';
    
    debugLog('Raw POST Data:', $_POST);
    
    // Validate required fields for GSUBZ API and our database
    if (!isset($_POST['serviceID']) || !isset($_POST['phone']) || 
        !isset($_POST['plan']) || !isset($_POST['amount']) || 
        !isset($_POST['requestID']) || !isset($_POST['userId'])) {
        throw new Exception('Missing required fields');
    }

    $network = $conn->real_escape_string($_POST['serviceID']);
    $phone = $conn->real_escape_string($_POST['phone']);
    $plan = $conn->real_escape_string($_POST['plan']);
    $amount = floatval($_POST['amount']);
    $requestID = $conn->real_escape_string($_POST['requestID']);
    $userId = $conn->real_escape_string($_POST['userId']);
    $api = 'ap_7b1896948907b9299ee7129ede348e13';

    debugLog('Validated Data:', [
        'serviceID' => $network,
        'phone' => $phone,
        'plan' => $plan,
        'amount' => $amount,
        'requestID' => $requestID,
        'userId' => $userId,
        'api' => $api
    ]);

    // First check if user has sufficient balance
    $balanceQuery = "SELECT balance FROM users WHERE id = ?";
    $stmt = $conn->prepare($balanceQuery);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user || $user['balance'] < $amount) {
        throw new Exception('Insufficient balance');
    }

    // Create cURL request to GSUBZ API
    $curl = curl_init('https://gsubz.com/api/pay/');
    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, [
        'serviceID' => $network,
        'phone' => $phone,
        'plan' => $plan,
        'amount' => $amount,
        'requestID' => $requestID,
        'api' => $api
    ]);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $api
    ]);

    $response = curl_exec($curl);
    debugLog('GSUBZ API Response:', $response);

    if ($response === false) {
        throw new Exception('GSUBZ API request failed: ' . curl_error($curl));
    }

    curl_close($curl);
    
    // Parse the response to check status
    $responseData = json_decode($response, true);
    
    // If transaction was successful, update the database
    if (isset($responseData['status']) && $responseData['status'] === 'Success') {
        // Update user's balance
        $newBalance = $user['balance'] - $amount;
        $updateSql = "UPDATE users SET balance = ? WHERE id = ?";
        $stmt = $conn->prepare($updateSql);
        $stmt->bind_param("di", $newBalance, $userId);
        $stmt->execute();
        
        // Record the transaction
        $transactionSql = "INSERT INTO transactions (user_id, type, amount, status, description, reference) 
                          VALUES (?, 'data', ?, 'success', ?, ?)";
        $description = "Data purchase: {$plan}MB for {$phone}";
        $stmt = $conn->prepare($transactionSql);
        $stmt->bind_param("idss", $userId, $amount, $description, $requestID);
        $stmt->execute();
    }
    
    // Send the original response back to client
    echo $response;

} catch (Exception $e) {
    debugLog('Error in process_data_purchase.php:', [
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 