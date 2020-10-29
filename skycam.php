<?php
/*
 * Copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
$urlSkyCam = 'http://www.gtc.iac.es/multimedia/netcam/camaraAllSky.jpg?t=' . time();

header("Content-type: image/jpeg");
echo file_get_contents($urlSkyCam);