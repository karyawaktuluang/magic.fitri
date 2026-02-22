<?php
ini_set('max_execution_time', 300);
set_time_limit(300);
ignore_user_abort(true);
error_reporting(E_ALL & ~E_DEPRECATED);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: false');

$url = 'https://sulapfoto.fun/server/proxy.php';
$method = $_SERVER['REQUEST_METHOD'];
$query = isset($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '';
$type = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';

$curl = curl_init();
$body = [];
if (!in_array($method, ['GET', 'HEAD'])) {
    if (stripos($type, 'application/json') !== false) {
        $body = file_get_contents('php://input');
    } elseif (stripos($type, 'multipart/form-data') !== false) {
        foreach ($_POST as $key => $value) {
            $body[$key] = $value;
        }
        foreach ($_FILES as $key => $file) {
            if (is_array($file['name'])) {
                foreach ($file['name'] as $index => $name) {
                    $body[$key . '[' . $index . ']'] = new CURLFile(
                        $file['tmp_name'][$index],
                        $file['type'][$index],
                        $name
                    );
                }
            } else {
                $body[$key] = new CURLFile(
                    $file['tmp_name'],
                    $file['type'],
                    $file['name']
                );
            }
        }
    } else {
        $body = http_build_query($_POST);
    }
}
curl_setopt_array($curl, [
    CURLOPT_URL => $url . $query,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => array(
        'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'origin: https://sulapfoto.fun',
        'referer: https://sulapfoto.fun/',
        'x-api-key: sulapfotokeybyichsanlabs',
    ),
]);
$response = curl_exec($curl);
$code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
header('Domain: ' . $url);
if (curl_errno($curl)) {
    http_response_code(504);
    exit;
}
curl_close($curl);
http_response_code($code);
echo $response;
