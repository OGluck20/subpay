<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../api/db.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['userId'], $input['amount'], $input['phone'], $input['network'])) {
        throw new Exception('Missing required fields');
    }

    $userId = $input['userId'];
    $amount = floatval($input['amount']);
    $phone = $input['phone'];
    $network = $input['network'];

    // Start transaction
    $conn->begin_transaction();

    try {
        // Check user balance
        $stmt = $conn->prepare("SELECT balance FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if (!$user) {
            throw new Exception('User not found');
        }

        $currentBalance = floatval($user['balance']);
        if ($currentBalance < $amount) {
            throw new Exception('Insufficient balance');
        }

        // Update user balance
        $newBalance = $currentBalance - $amount;
        $stmt = $conn->prepare("UPDATE users SET balance = ? WHERE id = ?");
        $stmt->bind_param("di", $newBalance, $userId);
        $stmt->execute();

        // Record transaction with correct fields
        $stmt = $conn->prepare("INSERT INTO transactions (user_id, type, amount, purpose, phone_number, network, status) VALUES (?, 'airtime', ?, ?, ?, ?, 'success')");
        $purpose = $network . " Airtime Purchase";
        $stmt->bind_param("idsss", $userId, $amount, $purpose, $phone, $network);
        $stmt->execute();

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Airtime purchase successful',
            'data' => [
                'balance' => $newBalance,
                'amount' => $amount,
                'phone' => $phone,
                'network' => $network,
                'transaction_id' => $conn->insert_id
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?> 