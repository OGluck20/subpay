<?php
// Prevent any output buffering issues
ob_clean();

// Set headers
header('Content-Type: application/json');

// Basic response array
$response = array();

try {
    // Database configuration
    $db_host = 'localhost';
    $db_user = 'root';      // Change these credentials
    $db_pass = '';          // to match your setup
    $db_name = 'subpay_db';

    // Create connection
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if email exists
    $email = $conn->real_escape_string($_POST['email']);
    $check_email = $conn->query("SELECT id FROM users WHERE email = '$email'");
    
    if ($check_email->num_rows > 0) {
        $response = [
            'status' => 'error',
            'message' => 'Email already exists'
        ];
    } else {
        // Process the registration
        $fullname = $conn->real_escape_string($_POST['fullname']);
        $phone = $conn->real_escape_string($_POST['phone']);
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (fullname, email, phone, password) VALUES ('$fullname', '$email', '$phone', '$password')";
        
        if ($conn->query($sql)) {
            $response = [
                'status' => 'success',
                'message' => 'Registration successful! Redirecting to login...'
            ];
        } else {
            throw new Exception("Error: " . $conn->error);
        }
    }

} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// Close connection
if (isset($conn)) {
    $conn->close();
}

// Send response
echo json_encode($response);
exit;
?> 