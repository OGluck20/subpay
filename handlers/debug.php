<?php
function debugLog($message, $data = null) {
    $logFile = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    
    $logMessage = "[{$timestamp}] {$message}";
    if ($data !== null) {
        $logMessage .= "\nData: " . print_r($data, true);
    }
    $logMessage .= "\n" . str_repeat('-', 50) . "\n";
    
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}
?> 