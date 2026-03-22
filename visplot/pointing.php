<?php
/*
 * Copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
$telescope = $_GET["telescope"];

function get_NOT_pointing() {
    // Only works when deployed on the NOT servers
    ini_set("include_path", "/home/www/html/include");
    include("access_control.inc.php");
    if (!access_allowed("SKYCAM")) {
        die("Access denied");
    }
    $s = file_get_contents("/tmp/tcs.json");
    $tcs = json_decode($s, true);
    return json_encode(array(
        "alt" => floatval($tcs["AltitudePosDeg"]),
        "az" => -180.0 + floatval($tcs["AzimuthPosDeg"])
    ));
}

function get_WHT_pointing() {
    $url = "http://api.ing.iac.es/v1/redis/get";
    $data = ["TCS.alt", "TCS.az"];
    $options = array(
        'http' => array(
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data),
        )
    );
    $context  = stream_context_create($options);
    $s = file_get_contents($url, false, $context);
    $tcs = json_decode($s, true);
    return json_encode(array(
        "alt" => floatval($tcs["TCS.alt"]["value"]) * 57.2957795131,
        "az" => floatval($tcs["TCS.az"]["value"]) * 57.2957795131
    ));
}

function get_INT_pointing() {
    return json_encode(array(
        "alt" => null,
        "az" => null
    ));
}

function get_HJST_pointing() {
    return json_encode(array(
        "alt" => null,
        "az" => null
    ));
}

function get_OST_pointing() {
    return json_encode(array(
        "alt" => null,
        "az" => null
    ));
}

try {
    $pointing = call_user_func("get_${telescope}_pointing");
    header("Content-Type: application/json");
    echo $pointing;
} catch (\Throwable $e) {
    die($e->getMessage());
}
