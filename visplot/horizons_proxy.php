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
    echo json_encode([
        "error" => "Method Not Allowed"
    ]);
    exit;
}

// Check for COMMAND first, as it dictates the requirements
$command = isset($_GET['COMMAND']) ? $_GET['COMMAND'] : '';

// Define required parameters based on the command
if ($command === "'MB'") {
    $required = ['COMMAND'];
} else {
    $required = [
        'COMMAND',
        'SITE_COORD',
        'START_TIME',
        'STOP_TIME',
    ];
}

// Validation loop
$missing = [];
foreach ($required as $param) {
    if (!isset($_GET[$param]) || $_GET[$param] === '') {
        $missing[] = $param;
    }
}
if (!empty($missing)) {
    echo json_encode([
        "error" => "Missing required parameters: " . implode(", ", $missing)
    ]);
    exit;
}
// Start building the params array
$params = [];
foreach ($required as $key) {
    $params[$key] = $_GET[$key];
}

$params['format'] = "text";
if ($command !== "'MB'") {
    // Add default parameters
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
}

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
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 10,          // total timeout
    CURLOPT_CONNECTTIMEOUT => 5,    // connection timeout
]);

$response = curl_exec($ch);
if ($response === false) {
    echo json_encode([
        "error" => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}
curl_close($ch);

if ($command === "'MB'") {
    $excludeObjects = ["EM-L1", "EM-L2", "EM-L4", "EM-L5"];
    $lines = explode("\n", $response);
    $bodies = [];
    $isTableContent = false;
    foreach ($lines as $line) {
        // Exit condition: Stop if we hit the spacecraft section
        // stripos is case-insensitive
        if (stripos($line, 'spacecraft') !== false) {
            break;
        }
        // Start condition: Look for the separator line under the headers
        if (strpos($line, '-----------------------------') !== false) {
            $isTableContent = true;
            continue;
        }
        if (!$isTableContent) {
            continue;
        }
        // Fixed-width parsing based on the API's visual columns
        // Column 1 (ID): Start index 0, length 10
        // Column 2 (Name): Start index 11, length 35
        $idStr = trim(substr($line, 0, 10));
        $nameStr = trim(substr($line, 11, 35));

        // Validation & Filtering
        // Skip if ID or Name is empty (handles rows like 551/552)
        if (empty($idStr) || empty($nameStr)) {
            continue;
        }
        $id = (int)$idStr;
        if ($id < 100) {
            continue;
        }
        // Skip if name is in the exclusion list
        if (in_array($nameStr, $excludeObjects)) {
            continue;
        }
        // Store result: {"Name": ID}
        $bodies[strtolower($nameStr)] = $id;
    }

    echo json_encode($bodies);
} else {
    if (stripos($response, 'No matches found.') !== false) {
        echo json_encode([
            "error" => "No matches found"
        ]);
        exit;
    }
    if (!preg_match('/\$\$SOE(.*?)\$\$EOE/s', $response, $matches)) {
        echo json_encode([
            "error" => "Ephemeris block not found"
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
}
