<?php
/*
 * Copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
$telescope = $_GET["telescope"];

function get_NOT_pointing() {
    ini_set('include_path', '/home/www/html/include');
    include("access_control.inc.php");
    if (!access_allowed("SKYCAM")) {
        die("Access denied");
    }
    $s = file_get_contents("/tmp/tcs.json");
    $tcs = json_decode($s,true);

    header('Content-Type: application/json');
    return json_encode(array(
        'alt' => floatval($tcs['AltitudePosDeg']),
        'az' => -180.0 + floatval($tcs['AzimuthPosDeg'])
    ));
}

if ($telescope === "NOT") {
    try {
        $pointing = get_NOT_pointing();
        header('Content-Type: application/json');
        echo $pointing;
    } catch (\Throwable $e) {
        die($e->getMessage());
    }
} else {
    die ("Unknown telescope");
}
