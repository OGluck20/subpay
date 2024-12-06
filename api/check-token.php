<?php
header('Content-Type: application/json');

require_once 'db.php';

try {
    // Get token from header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        throw new Exception('No token provided');
    }

    $token = $matches[1];
    
    // Check token in database
    $stmt = $conn->prepare("SELECT id FROM users WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Invalid token');
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Token is valid'
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 