<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../api/db.php';

try {
    $userId = $_GET['userId'] ?? null;
    
    if (!$userId) {
        throw new Exception('User ID not provided');
    }

    $query = "SELECT * FROM transactions 
              WHERE user_id = ? 
              ORDER BY created_at DESC 
              LIMIT 20";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        // Determine transaction type based on multiple factors
        $type = 'debit'; // Default to debit
        $purpose = strtolower($row['purpose'] ?? '');
        
        // Check credit condition for "Wallet Funding"
        if ($row['type'] === 'credit' || 
            strpos($purpose, 'wallet funding') !== false) {  // Case-insensitive check
            $type = 'credit';
        }

        $transactions[] = [
            'id' => $row['id'],
            'type' => $type,
            'amount' => $row['amount'],
            'purpose' => $row['purpose'] ?? '',
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'network' => $row['network'] ?? null,
            'phone_number' => $row['phone_number'] ?? null
        ];
    }

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
?> 