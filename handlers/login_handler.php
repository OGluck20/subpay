<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../api/db.php';

try {
    // Log incoming request
    error_log("Login attempt - POST data: " . print_r($_POST, true));

    // Check if request is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Validate input
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Log received data (remove in production)
    error_log("Email received: " . $email);
    error_log("Password length: " . strlen($password));

    if (empty($email) || empty($password)) {
        throw new Exception('Email and password are required');
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Check database connection
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    // Prepare SQL statement
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    if (!$stmt) {
        throw new Exception('Database query preparation failed: ' . $conn->error);
    }

    $stmt->bind_param("s", $email);
    
    if (!$stmt->execute()) {
        throw new Exception('Database query execution failed: ' . $stmt->error);
    }

    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        throw new Exception('Invalid email or password');
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        throw new Exception('Invalid email or password');
    }

    // Fetch recent transactions
    $transactionStmt = $conn->prepare("
        SELECT 
            id,
            type,
            amount,
            purpose,
            status,
            created_at,
            reference,
            details
        FROM transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");

    if (!$transactionStmt) {
        throw new Exception('Failed to prepare transaction query: ' . $conn->error);
    }

    $transactionStmt->bind_param("i", $user['id']);
    
    if (!$transactionStmt->execute()) {
        throw new Exception('Failed to fetch transactions: ' . $transactionStmt->error);
    }

    $transactionResult = $transactionStmt->get_result();
    $transactions = [];
    
    while ($transaction = $transactionResult->fetch_assoc()) {
        // Decode JSON details if exists
        if (!empty($transaction['details'])) {
            $details = json_decode($transaction['details'], true);
            $transaction = array_merge($transaction, $details);
        }
        $transactions[] = $transaction;
    }

    // Remove sensitive data
    unset($user['password']);

    // Return success response with transactions
    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'token' => bin2hex(random_bytes(32)),
        'user' => [
            'id' => $user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email']
        ],
        'balance' => $user['balance'] ?? '0.00',
        'transactions' => $transactions // Include transactions in response
    ]);

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?> 