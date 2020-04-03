<?php
/*
 * (c) 2016-2017 Emanuel Gafton, NOT/ING
 */
$urlSkyCam = 'http://www.gtc.iac.es/multimedia/netcam/camaraAllSky.jpg?t=' . time();

header("Content-type: image/jpeg");
echo file_get_contents($urlSkyCam);