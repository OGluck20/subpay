<?php
header('Content-Type: application/json');
require_once 'auth.php';
require_once 'db.php';

try {
    // Verify token and get user
    $user = verifyToken();
    if (!$user) {
        throw new Exception('Unauthorized access');
    }

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate inputs
    if (!isset($data['network'], $data['phoneNumber'], $data['amount'])) {
        throw new Exception('Missing required fields');
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check wallet balance
        $stmt = $conn->prepare("SELECT balance FROM wallets WHERE user_id = ?");
        $stmt->bind_param("i", $user['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $wallet = $result->fetch_assoc();

        if ($wallet['balance'] < $data['amount']) {
            throw new Exception('Insufficient wallet balance');
        }

        // Process airtime purchase through provider API
        $provider_response = processAirtimePurchase($data);
        if (!$provider_response['success']) {
            throw new Exception('Provider error: ' . $provider_response['message']);
        }

        // Deduct from wallet
        $stmt = $conn->prepare("UPDATE wallets SET balance = balance - ? WHERE user_id = ?");
        $stmt->bind_param("di", $data['amount'], $user['id']);
        $stmt->execute();

        // Record transaction
        $stmt = $conn->prepare("INSERT INTO transactions (user_id, amount, type, description, reference) VALUES (?, ?, 'debit', 'airtime_purchase', ?)");
        $stmt->bind_param("ids", $user['id'], $data['amount'], $provider_response['reference']);
        $stmt->execute();

        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Airtime purchase successful',
            'reference' => $provider_response['reference']
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

// Mock function - replace with actual provider API
function processAirtimePurchase($data) {
    // Implement actual provider API call here
    return [
        'success' => true,
        'reference' => 'AIR' . time() . rand(1000, 9999)
    ];
}
?> 