<?php
// Database configuration
$host = 'localhost';
$username = 'root';  // your database username
$password = '';      // your database password
$database = 'subpay_db';  // your database name

// Create connection
try {
    $conn = new mysqli($host, $username, $password, $database);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Set charset to utf8mb4
    $conn->set_charset("utf8mb4");
    
} catch (Exception $e) {
    // Return JSON error instead of HTML
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed'
    ]);
    exit;
}
?> 