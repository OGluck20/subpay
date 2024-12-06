<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email'], $data['password'], $data['fullname'])) {
        throw new Exception('Required fields missing');
    }
    
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $fullname = $data['fullname'];
    
    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        throw new Exception('Email already registered');
    }
    
    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (email, password, fullname) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $email, $password, $fullname);
    
    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Registration successful'
        ]);
    } else {
        throw new Exception('Registration failed');
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?> 