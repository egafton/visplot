<?php
/*
 * Copyright (c) 2016-2022 ega, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
$telescope = $_GET["telescope"];

if (in_array($telescope, Array("NOT", "WHT", "INT"))) {
    $urlSkyCam = "http://www.gtc.iac.es/multimedia/netcam/camaraAllSky.jpg?t=" . time();
} elseif (in_array($telescope, Array("HJST", "OST"))) {
    $urlSkyCam = "http://www.gtc.iac.es/multimedia/netcam/camaraAllSky.jpg?t=" . time();
} else {
    $urlSkyCam = "";
}

header("Content-type: image/jpeg");
echo file_get_contents($urlSkyCam);
