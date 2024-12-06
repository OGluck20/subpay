<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once '../api/db.php';

// Flutterwave configuration
define('FLW_SECRET_KEY', 'FLWSECK_TEST-e5e51ee2de24669eb510b9c53a7d84a1-X'); // Your secret key

function verifyFlutterwavePayment($transactionId) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => "https://api.flutterwave.com/v3/transactions/".$transactionId."/verify",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "GET",
        CURLOPT_HTTPHEADER => array(
            "Authorization: Bearer " . FLW_SECRET_KEY,
            "Content-Type: application/json"
        ),
    ));

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        throw new Exception("cURL Error: " . $err);
    }

    return json_decode($response, true);
}

try {
    // Log incoming request
    error_log('Received payment verification request: ' . json_encode($_POST));

    // Validate input
    $user_id = $_POST['user_id'] ?? null;
    $amount = $_POST['amount'] ?? null;
    $reference = $_POST['reference'] ?? null;
    $flw_ref = $_POST['flw_ref'] ?? null;
    
    if (!$user_id || !$amount || !$reference || !$flw_ref) {
        throw new Exception('Missing required parameters');
    }

    // Verify payment with Flutterwave
    $verification = verifyFlutterwavePayment($reference);
    error_log('Flutterwave verification response: ' . json_encode($verification));
    
    if ($verification['status'] === 'success' && 
        $verification['data']['status'] === 'successful' && 
        $verification['data']['amount'] >= $amount) {

        // Start database transaction
        $conn->begin_transaction();

        try {
            // Update user's balance
            $updateStmt = $conn->prepare("
                UPDATE users 
                SET balance = balance + ? 
                WHERE id = ?
            ");
            $updateStmt->bind_param("di", $amount, $user_id);
            $updateStmt->execute();

            if ($updateStmt->affected_rows === 0) {
                throw new Exception('Failed to update balance');
            }

            // Record transaction
            $insertStmt = $conn->prepare("
                INSERT INTO transactions (
                    user_id, 
                    type,
                    purpose,
                    amount, 
                    status, 
                    reference,
                    details
                ) VALUES (?, 'credit', 'Wallet Funding', ?, 'success', ?, ?)
            ");

            $details = json_encode([
                'flw_ref' => $flw_ref,
                'payment_type' => $verification['data']['payment_type'] ?? '',
                'processor_response' => $verification['data']['processor_response'] ?? ''
            ]);

            $insertStmt->bind_param("idss", $user_id, $amount, $reference, $details);
            $insertStmt->execute();

            // Get updated balance and transactions
            $balanceResult = $conn->query("SELECT balance FROM users WHERE id = $user_id");
            $userData = $balanceResult->fetch_assoc();

            $transactions = $conn->query("
                SELECT 
                    id,
                    type,
                    purpose,
                    amount,
                    status,
                    created_at,
                    reference,
                    details
                FROM transactions 
                WHERE user_id = $user_id 
                ORDER BY created_at DESC 
                LIMIT 10
            ")->fetch_all(MYSQLI_ASSOC);

            // Format the transactions if needed
            $formattedTransactions = array_map(function($transaction) {
                // Decode JSON details if exists
                if (!empty($transaction['details'])) {
                    $details = json_decode($transaction['details'], true);
                    $transaction = array_merge($transaction, $details);
                }
                
                return $transaction;
            }, $transactions);

            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Wallet funded successfully',
                'balance' => $userData['balance'],
                'transactions' => $formattedTransactions
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    } else {
        throw new Exception('Payment verification failed');
    }

} catch (Exception $e) {
    error_log('Error in fund_wallet.php: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 