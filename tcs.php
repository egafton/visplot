<?php
/*
 * (c) 2016-2017 Emanuel Gafton, NOT/ING
 */

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