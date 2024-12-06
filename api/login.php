<?php
header('Content-Type: application/json');

// Your authentication logic here...

if ($authenticated) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Login successful',
        'token' => 'your_generated_token_here',
        'user' => [
            'id' => $user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'phone' => $user['phone']
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid email or password'
    ]);
}
?> 