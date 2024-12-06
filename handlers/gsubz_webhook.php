<?php
header('Content-Type: application/json');
require_once '../api/db.php';
require_once '../config/gsubz.php';

// Log incoming webhook data
$webhookData = file_get_contents('php://input');
error_log('Incoming Gsubz Webhook: ' . $webhookData);

try {
    // Decode webhook payload
    $data = json_decode($webhookData, true);

    if (!$data) {
        throw new Exception('Invalid webhook payload');
    }

    // Verify webhook authenticity
    // Gsubz doesn't provide a signature, so we'll check for the presence of expected fields
    if (!isset($data['reference']) || !isset($data['status'])) {
        throw new Exception('Missing required webhook fields');
    }

    $conn->begin_transaction();

    try {
        $reference = $data['reference'];
        $status = strtolower($data['status']);
        
        // Update transaction status
        $stmt = $conn->prepare("
            UPDATE transactions 
            SET status = ?, 
                details = JSON_SET(details, '$.webhook_response', ?)
            WHERE reference = ?
        ");
        
        $webhookResponse = json_encode($data);
        $stmt->bind_param("sss", $status, $webhookResponse, $reference);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception('Transaction not found: ' . $reference);
        }

        // If the transaction is successful, you might want to update user's balance or perform other actions
        if ($status === 'success') {
            // Additional logic for successful transactions
            // For example, you might want to credit the user's account for certain types of transactions
        }

        $conn->commit();

        // Respond to Gsubz
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Webhook processed successfully']);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Webhook Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 