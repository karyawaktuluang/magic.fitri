<?php
ini_set('max_execution_time', 300);
set_time_limit(300);
ignore_user_abort(true);
error_reporting(E_ALL & ~E_DEPRECATED);

function checkServer($url, $timeout = 5)
{
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => $url . '/systeminfo',
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => $timeout,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
    ));
    curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_errno($curl);
    curl_close($curl);
    return ($error === 0 && $code >= 200 && $code < 400);
}

function getDomain()
{
    $servers = [
        'https://canada.sulapfoto.com' => 10,
    ];
    if (isset($_SERVER['HTTP_X_SERVER'])) {
        $servers = array_fill_keys(array_map('trim', explode(',', $_SERVER['HTTP_X_SERVER'])), 10);
    }
    $keys = array_keys($servers);
    shuffle($keys);
    $shuffled = [];
    foreach ($keys as $key) {
        $shuffled[$key] = $servers[$key];
    }
    $activeServer = array_rand($shuffled);
    foreach ($shuffled as $server => $timeout) {
        if (checkServer($server, $timeout)) {
            $activeServer = $server;
            break;
        }
    }
    return $activeServer;
}

function getBearerToken()
{
    $headers = [];
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['HTTP_X_AUTHORIZATION'])) {
        $headers['Authorization'] = $_SERVER['HTTP_X_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    }
    if (!isset($headers['Authorization'])) {
        return null;
    }
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        return $matches[1];
    }
    return null;
}

function isJwtExpired($jwt)
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return true;
    $payload = json_decode(
        base64_decode(strtr($parts[1], '-_', '+/')),
        true
    );
    if (!isset($payload['exp'])) return false;
    return $payload['exp'] < time();
}
