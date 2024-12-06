<?php
$logFile = __DIR__ . '/debug.log';
if (file_exists($logFile)) {
    echo '<pre>' . htmlspecialchars(file_get_contents($logFile)) . '</pre>';
} else {
    echo 'No debug log found.';
}
?> 