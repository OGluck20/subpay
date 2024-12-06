function sendSms($phone_number, $message) {
    $api_key = "YOUR_TERMI_API_KEY";
    $sender = "SubPay";
    $url = "https://api.ng.termii.com/api/sms/send";

    $data = [
        "to" => $phone_number,
        "from" => $sender,
        "sms" => $message,
        "type" => "plain",
        "channel" => "dnd",
        "api_key" => $api_key
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}
