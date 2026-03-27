<?php
/*
 * Copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
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

// Validation loop
if (!isset($_GET['url']) || $_GET['url'] === '') {
    die("URL not provided");
}

header("Content-type: image");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
ini_set("default_socket_timeout", 5); // in seconds
echo file_get_contents($_GET['url'] . "?t=" . time(), false, stream_context_create($arrContextOptions));