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
    $urlSkyCam = "http://monet-n-sky.as.utexas.edu/jpg/1/image.jpg?t=" . time();
} elseif (in_array($telescope, Array("CAHA"))) {							//CAHA 
    $urlSkyCam = "http://www.caha.es/WDXI/ASTMON/images/Johnson_V.png?t=" . time();		        //CAHA 
} else {
    $urlSkyCam = "";
}

header("Content-type: image");										//CAHA  NOTE: The skycam is active only after sunset (NAU), before it gets active the scaling appears wrongly. 
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
ini_set("default_socket_timeout", 5); // in seconds
echo file_get_contents($urlSkyCam);
