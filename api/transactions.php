<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'db.php';

try {
    // Get JSON input
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    if (!isset($data['user_id'])) {
        throw new Exception('User ID is required');
    }

    $userId = intval($data['user_id']);

    // Get transactions
    $stmt = $conn->prepare("
        SELECT * FROM transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $transactions = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        'status' => 'success',
        'transactions' => $transactions
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 