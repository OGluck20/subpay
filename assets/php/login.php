<?php
// Start a session to track user login status
session_start();

// Connect to the database
$conn = new mysqli('localhost', 'root', '', 'subpay_db');

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Handle login request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $conn->real_escape_string($_POST['email']);
    $password = $_POST['password'];

    $sql = "SELECT * FROM users WHERE email = '$email'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Verify the password
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            header("Location: ../dashboard.html");
        } else {
            echo "Invalid password.";
        }
    } else {
        echo "No user found with this email.";
    }
}

$conn->close();
?>
