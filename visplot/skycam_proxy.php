<?php
/*
 * Copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$arrContextOptions=array(
    "ssl"=>array(
        "verify_peer"=>false,
        "verify_peer_name"=>false,
    ),
);

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    die("Method Not Allowed");
}

// Check that a URL has been passed
if (!isset($_GET['url']) || $_GET['url'] === '') {
    die("URL not provided");
}

$url = $_GET['url'] . "?t=" . time();
$data = @file_get_contents($url, false, stream_context_create($arrContextOptions));

if ($data === false) {
    http_response_code(502);
    exit("Failed to fetch image");
}

// Fallback: sniff content type if still unknown
$finfo = new finfo(FILEINFO_MIME_TYPE);
$detected = $finfo->buffer($data);

if ($detected && strpos($detected, "image/") === 0) {
    $contentType = $detected;
} else {
    $contentType = "application/octet-stream";
}

header("Content-type: $contentType");
echo $data;