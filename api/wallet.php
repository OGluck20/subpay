<?php
// Prevent PHP from outputting HTML errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

function outputError($message) {
    echo json_encode([
        'status' => 'error',
        'message' => $message
    ]);
    exit;
}

try {
    $conn = new mysqli('localhost', 'root', '', 'subpay_db');

    if ($conn->connect_error) {
        outputError('Database connection failed: ' . $conn->connect_error);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $token = $_GET['token'] ?? '';
        if (!$token) {
            outputError('Token required');
        }

        // Get user ID from token
        $sql = "SELECT id FROM users WHERE token = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            // Get balance
            $balanceSql = "SELECT balance FROM users WHERE id = ?";
            $balanceStmt = $conn->prepare($balanceSql);
            $balanceStmt->bind_param("i", $user['id']);
            $balanceStmt->execute();
            $balanceResult = $balanceStmt->get_result();
            $balanceData = $balanceResult->fetch_assoc();
            
            echo json_encode([
                'status' => 'success',
                'balance' => $balanceData['balance']
            ]);
        } else {
            outputError('User not found');
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input);
        
        if (!$data) {
            outputError('Invalid JSON data received: ' . json_last_error_msg());
        }
        
        if (!isset($data->token) || !isset($data->amount) || !isset($data->type)) {
            outputError('Missing required fields');
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Get user ID from token
            $sql = "SELECT id, balance FROM users WHERE token = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $data->token);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($user = $result->fetch_assoc()) {
                // Update balance
                $newBalance = $data->type === 'credit' 
                    ? $user['balance'] + $data->amount 
                    : $user['balance'] - $data->amount;

                $updateSql = "UPDATE users SET balance = ? WHERE id = ?";
                $updateStmt = $conn->prepare($updateSql);
                $updateStmt->bind_param("di", $newBalance, $user['id']);
                
                if (!$updateStmt->execute()) {
                    throw new Exception('Failed to update balance');
                }

                // Log transaction with user_id
                $logSql = "INSERT INTO transactions (user_id, amount, type, reference, description) 
                           VALUES (?, ?, ?, ?, ?)";
                $logStmt = $conn->prepare($logSql);
                $description = $data->description ?? 'wallet_funding';
                $reference = $data->reference ?? '';
                $logStmt->bind_param("idsss", 
                    $user['id'], 
                    $data->amount, 
                    $data->type, 
                    $reference,
                    $description
                );
                
                if (!$logStmt->execute()) {
                    throw new Exception('Failed to log transaction');
                }

                $conn->commit();

                echo json_encode([
                    'status' => 'success',
                    'message' => 'Balance updated successfully',
                    'balance' => $newBalance
                ]);
            } else {
                throw new Exception('User not found');
            }
        } catch (Exception $e) {
            $conn->rollback();
            outputError($e->getMessage());
        }
    }
} catch (Exception $e) {
    outputError('Server error: ' . $e->getMessage());
}

$conn->close();
?> 