<?php
/**
 * The purpose of this file is to act as a proxy for the JPL Horizons API,
 * allowing us to bypass CORS issues when making requests from the browser.
 * 
 * It accepts some of the GET parameters that the Horizons API expects, modifies
 * them as needed, appends some defaults, and then forwards the request to the
 * Horizons API. The response is parsed to extract the ephemeris data, which is
 * then returned as JSON.
 * 
 * The JSON response is a list representing the ephemeris time series, where
 * each entry contains:
 * - "mjd": The UTC time for the ephemeris (MJD);
 * - "ra_deg": The Right Ascension in degrees (astrometric ICRS);
 * - "dec_deg": The Declination in degrees (astrometric ICRS).
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

function mjdToUnix($mjd) {
    return ($mjd - 40587) * 86400;
}

function floorHourUTC(DateTime $dt) {
    $dt->setTime((int)$dt->format('H'), 0, 0);
    return $dt;
}

function ceilHourUTC(DateTime $dt) {
    if ($dt->format('i:s') !== '00:00') {
        $dt->modify('+1 hour');
    }
    $dt->setTime((int)$dt->format('H'), 0, 0);
    return $dt;
}

function raToDegrees($h, $m, $s) {
    return ($h + $m / 60 + $s / 3600) * 15.0;
}

function decToDegrees($d, $m, $s) {
    $sign = ($d < 0) ? -1 : 1;
    return $sign * (abs($d) + $m / 60 + $s / 3600);
}

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "error" => "Method Not Allowed"
    ]);
    exit;
}

// Check for missing parameters
$required = [
    'COMMAND',
    'SITE_COORD',
    'START_TIME',
    'STOP_TIME',
];
$missing = [];
foreach ($required as $param) {
    if (!isset($_GET[$param]) || $_GET[$param] === '') {
        $missing[] = $param;
    }
}
if (!empty($missing)) {
    http_response_code(400);
    echo json_encode([
        "error" => "Missing required parameters",
        "missing" => $missing
    ]);
    exit;
}
// Start building the params array
$params = [];
foreach ($required as $key) {
    $params[$key] = $_GET[$key];
}

// Add default parameters
$params['format'] = "text";
$params['CENTER'] = "'coord'";
$params['MAKE_EPHEM'] = "'YES'";
$params['TABLE_TYPE'] = "'OBSERVER'";
$params['QUANTITIES'] = "'1'";
$params['STEP_SIZE'] = "'30m'";

// Convert START_TIME (MJD → floor hour)
$startUnix = mjdToUnix((float)$params['START_TIME']);
$startDT = new DateTime("@".(int)$startUnix);
$startDT->setTimezone(new DateTimeZone("UTC"));
$startDT = floorHourUTC($startDT);

// Convert STOP_TIME (MJD → ceil hour)
$stopUnix = mjdToUnix((float)$params['STOP_TIME']);
$stopDT = new DateTime("@".(int)$stopUnix);
$stopDT->setTimezone(new DateTimeZone("UTC"));
$stopDT = ceilHourUTC($stopDT);

// Replace params with formatted UTC strings
$params['START_TIME'] = "'" . $startDT->format('Y-m-d H:i:s') . "'";
$params['STOP_TIME']  = "'" . $stopDT->format('Y-m-d H:i:s') . "'";

// Base API endpoint
$baseUrl = "https://ssd.jpl.nasa.gov/api/horizons.api";

// Build query string from incoming GET params
$query = http_build_query($params);
$url = $baseUrl . "?" . $query;

// Initialize cURL
$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,          // total timeout
    CURLOPT_CONNECTTIMEOUT => 5,    // connection timeout
]);

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    echo json_encode(["error" => curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

if (!preg_match('/\$\$SOE(.*?)\$\$EOE/s', $response, $matches)) {
    http_response_code(500);
    echo json_encode([
        "error" => "Ephemeris block not found",
        "params" => $params,
        "raw" => $response
    ]);
    exit;
}

$lines = explode("\n", trim($matches[1]));
$result = [];

foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '') continue;

    // Example line:
    // 2026-Mar-23 20:00 Nm  06 47 46.38 +20 23 35.5
    if (preg_match('/^(\d{4}-[A-Za-z]{3}-\d{2})\s+(\d{2}:\d{2}).*?\s+(\d{2})\s+(\d{2})\s+([\d\.]+)\s+([+\-]\d{2})\s+(\d{2})\s+([\d\.]+)/', $line, $m)) {

        $date = $m[1];
        $time = $m[2];

        // Convert UTC to Unix timestamp
        $dt = DateTime::createFromFormat('Y-M-d H:i', "$date $time", new DateTimeZone("UTC"));
        if (!$dt) continue;
        $unix = $dt->getTimestamp();
        $mjd = $unix / 86400 + 40587;

        // RA
        $ra = raToDegrees((int)$m[3], (int)$m[4], (float)$m[5]);

        // Dec
        $dec = decToDegrees((int)$m[6], (int)$m[7], (float)$m[8]);

        $result[] = [
            "mjd" => $mjd,
            "ra_deg" => $ra,
            "dec_deg" => $dec
        ];
    }
}

echo json_encode($result);