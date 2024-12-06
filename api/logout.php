<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $conn = new mysqli('localhost', 'root', '', 'subpay_db');
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    $data = json_decode(file_get_contents('php://input'));
    
    if (!$data || !isset($data->token)) {
        throw new Exception("Invalid request");
    }

    // Clear token from database
    $sql = "UPDATE users SET token = NULL WHERE token = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $data->token);
    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'message' => 'Logged out successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 