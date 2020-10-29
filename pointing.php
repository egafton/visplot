<?php
/*
 * Copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
die('');
ini_set('include_path', '/home/www/html/include');
require("access_control.inc.php");
//if (!access_allowed("SKYCAM") && $_SERVER['REMOTE_ADDR'] != '1.1.1.1') { // for debugging purposes
if (!access_allowed("SKYCAM")) {
  die();
}
$s = file_get_contents("/tmp/tcs.json");
$tcs=json_decode($s,true);

header('Content-Type: application/json');
echo json_encode(array(
    'alt' => floatval($tcs['AltitudePosDeg']),
    'az' => -180.0 + floatval($tcs['AzimuthPosDeg'])

));
