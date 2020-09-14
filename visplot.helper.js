/**
 * @file Contains (static) helper functions used throughout the Visplot code.
 * @author Emanuel Gafton
 * @copyright 2016-2021 Emanuel Gafton, NOT/ING.
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version. See LICENSE.md.
 */

function helper() {
}

/**
 * Convert degrees to radians.
 * @param {double} angle - Angle in degrees
 * @returns {double} Angle in radians
 */
helper.deg2rad = function (angle) {
    return angle * (Math.PI / 180);
};

/**
 * Convert radians to degrees.
 * @param {double} angle - Angle in radians
 * @returns {double} Angle in degrees
 */
helper.rad2deg = function (angle) {
    return angle * (180 / Math.PI);
};

/**
 * Pad a two digit number with zeroes ('6'->'06', '13'->'13').
 */
helper.padTwoDigits = function (_num) {
    var num = parseFloat(_num);
    if (num === 0) {
        // handle -0 and +0 (for degrees of Dec, for instance)
        return 1/num < 0 ?
            "-00" :
            "00";
    }
    return num > 0 ?
            (num < 10 ? ('0' + num.toString()) : num.toString()) :
            (num > -10 ? ('-0' + (-num).toString()) : num.toString());
};

/**
 * Convert airmass to altitude.
 *
 * @todo Offer the choice of using more complex formulae than just AM=sec(z).
 */
helper.AirmassToAltitude = function (airmass) {
    return 90 - helper.rad2deg(Math.acos(1 / airmass));
};

/**
 * Convert altitude to airmass
 *
 * @todo Offer the choice of using more complex formulae than just AM=sec(z).
 */
helper.AltitudeToAirmass = function (altitude) {
    return 1 / Math.cos(helper.deg2rad(90 - altitude));
};

/**
 * Conver an ephem time to an index in the night array ("xaxis")
 */
helper.EphemTimeToIndex = function (time) {
    return Math.round((time - driver.night.Sunset) / driver.night.xstep);
};

/**
 * Convert coordinates expressed in degrees-minutes-second to degrees
 */
helper.dmstodeg = function (a) {
    if (!a) {
        return 0;
    }
    var d = a.replace(/^\s+/, "").split(/[:\s]/), sign = 1;
    if (d[0].match(/-/)) {
        sign = -1;
        d[0].replace(/\-/, "");
    }
    return sign * (Math.abs(parseFloat(d[0])) + parseFloat(d[1]) / 60 + parseFloat(d[2]) / 3600);
};

/**
 * Split a string by newlines
 */
helper.extractLines = function (str) {
    return str.split(/\r?\n/);
};

/**
 * Convert pixel coordinates in SkyCam image to Az/Alt and RA/Dec
 */
helper.getCoordinates = function (xcent, ycent, x, y, r, lst) {
    var myArray = new Array(4);
    x = x - xcent;
    y = y - ycent;
    var newR = Math.sqrt(x * x + y * y);
    var newTeta = helper.rad2deg(Math.atan2(y, x) - helper.deg2rad(90) + helper.deg2rad(35));
    r = Math.max(r, newR);
    newR = newR - 3;
    var n = (r - newR) / r;
    newR = 6.686 + 47.324 * n + 135.465 * n * n - 187.185 * n * n * n + 87.754 * n * n * n * n;
    if (newR > r) {
        myArray[0] = "low";
    } else {
        myArray[0] = Math.round(newR);
        if (myArray[0] > 90) {
            myArray[0] = 90;
        }
    }
    newTeta = 180 - newTeta;
    if (newTeta >= 360) {
        newTeta = newTeta - 360;
    }
    myArray[1] = Math.round(newTeta);
    //var alt=helper.deg2rad(newR);
    //var az=helper.deg2rad(newTeta);
    var val = helper.radec(newR, newTeta, lst);
    myArray[2] = helper.HMS(val[0], false, "h", "m", "s");
    myArray[3] = helper.HMS(val[1], true, "°", "'", '"');
    return myArray;
};

/**
 * Get the current UTC time.
 */
helper.utc = function (time) {
    return (time.getUTCHours() + (time.getUTCMinutes() + time.getUTCSeconds() / 60) / 60) / 24;
};

/**
 * Convert a timestamp to a Julian date.
 */
helper.julianDate = function (now)
{
    var julday = (now.valueOf() / 86400000) + 2440587.5;
    return julday;
};

/**
 * Calculate the Greenwich mean sidereal time from a Julian date.
 */
helper.GM_Sidereal_Time = function (jd) {
    var MJD = jd - 2400000.5;
    var MJD0 = Math.floor(MJD);
    var ut = (MJD - MJD0) * 24.0;
    var t_eph = (MJD0 - 51544.5) / 36525.0;
    var gmst = 6.697374558 + 1.0027379093 * ut + (8640184.812866 + (0.093104 - 0.0000062 * t_eph) * t_eph) * t_eph / 3600.0;
    while (gmst > 24) {
        gmst -= 24;
    }
    return gmst;
};

/**
 * Calculate the fractional part of a number (X-[X])
 */
helper.frac = function (X) {
    X -= Math.floor(X);
    if (X < 0) {
        X += 1.0;
    }
    return X;
};

/**
 * Convert from Greenwich mean sidereal time to Local Apparent Sidereal Time)
 */
helper.LM_Sidereal_Time = function (jd) {
    return 24.0 * helper.frac((helper.GM_Sidereal_Time(jd) + Driver.obs_lon_deg / 15.0) / 24.0);
};

/**
 * Convert Altitude, Azimuth and Local Apparent Sidereal Time to RA and Dec.
 */
helper.radec = function (alt, az, lst) {
    var val = new Array(2);
    var radeg = Math.PI / 180;
    var a = alt * radeg, p = Driver.obs_lat_deg * radeg, A = az * radeg;
    var sin_dec = Math.sin(a) * Math.sin(p) + Math.cos(a) * Math.cos(p) * Math.cos(A);
    var dec = Math.asin(sin_dec);
    var cos_ha = (Math.sin(a) - Math.sin(p) * sin_dec) / (Math.cos(p) * Math.cos(dec));
    var ha = 12 * Math.acos(cos_ha) / Math.PI;
    var ra = (az < 180 ? lst + ha : lst - ha);
    if (ra < 0) {
        ra += 24;
    }
    if (ra > 24) {
        ra -= 24;
    }
    dec *= 180 / Math.PI;
    val[0] = ra;
    val[1] = dec;
    return val;
};

/**
 * Convert RA, Dec and Local Apparent Sidereal Time to Altitude and Azimuth
 */
helper.altaz = function (ra, dec, lst) {
    var ha = lst - ra;
    if (ha < 0) {
        ha += 24;
    }
    var p = Driver.obs_lat_rad, d = helper.deg2rad(dec), h = ha * Math.PI / 12;
    var sin_alt = Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(p) * Math.cos(h);
    var alt = Math.asin(sin_alt);
    var cos_alt = (Math.sin(d) - sin_alt * Math.sin(p)) / (Math.cos(alt) * Math.cos(p));
    var az = helper.rad2deg(Math.acos(cos_alt));
    alt = helper.rad2deg(alt);
    if (Math.sin(h) > 0) {
        az = 360 - az;
    }
    return [alt, az];
};

/**
 * Convert a timestamp to a HMS string
 */
helper.HMS = function (time, sign, sep1, sep2, sep3) {
    return helper.degtosex(time, sign, 0, sep1, sep2, sep3);
};
helper.degtosex = function (time, sign, prec, sep1, sep2, sep3) {
    var h = Math.floor(time);
    var min = Math.floor(60.0 * helper.frac(time));
    var sec = (60.0 * (60.0 * helper.frac(time) - min)).toFixed(prec);
    var str = (sign ? (h < 0 ? "-" : "+") : "");
    h = Math.abs(h);
    str += (h < 10 ? "0" + h : h) + sep1 + ":";
    str += (min < 10 ? "0" + min : min) + sep2 + ":";
    str += (sec < 10 ? "0" + sec : sec) + sep3;
    return str;
};

/**
 * Convert a Python.ephem date (stored as a float) to H:MM format
 */
helper.EphemDateToHM = function (d) {
    var t = new Date(driver.night.DateSunset);
    t.setSeconds(t.getUTCSeconds() + (d - driver.night.Sunset) * 86400);
    var ss = t.getUTCSeconds();
    var mm = t.getUTCMinutes();
    var hh = t.getUTCHours();
    // Round up if necessary
    if (ss > 30) {
        mm += 1;
    }
    if (mm == 60) {
        hh += 1;
        mm = 0;
    }
    if (hh == 24) {
        hh = 0;
    }
    return hh + ":" + helper.padTwoDigits(mm);
};

/**
 * Convert a H:MM or H:MM:SS format to a Python.ephem date.
 */
helper.HMToEphemDate = function (text) {
    var jsunset = driver.night.DateSunset;
    var arr = text.split(':');
    if (arr.length < 1 || arr.length > 3 || helper.notInt(arr[0])) {
        return -1;
    }
    var hh = helper.filterInt(arr[0]);
    var mm = (arr.length > 1) ? helper.filterInt(arr[1]) : 0;
    var ss = (arr.length > 2) ? helper.filterInt(arr[2]) : 0;
    if (hh < 0 || hh > 24 || mm < 0 || mm > 60 || ss < 0 || ss > 60) {
        return -1;
    }
    if (hh < driver.night.tSunset[3] - 1 && hh > driver.night.tSunrise[3] + 1) {
        return -1;
    }
    var jtime = new Date(Date.UTC(driver.night.tSunset[0], driver.night.tSunset[1], driver.night.tSunset[2] + (hh > 12 ? 0 : 1), hh, mm, ss, 0));
    var jdiff = (jtime - jsunset) / 8.64e7;
    return driver.night.Sunset + jdiff;
};

helper.repeat = function (str, len) {
    return Array(len + 1).join(str); // str.repeat(len);
};

/**
 * Left-pad or right-pad a string "str" with characters 'w' in order to
 * make it have a certain length "len".
 */
helper.pad = function (str, len, left, w) {
    if (str.length === len) {
        return str;
    }
    if (str.length > len) {
        return str.substr(0, len);
    }
    if (left) {
        return (helper.repeat(w, len - str.length)) + str;
        //return (' '.repeat(len - str.length)) + str; // This will fail on non-ES6 supporting browsers, even with babel...
    } else {
        return str + (helper.repeat(w, len - str.length));
        //return str + (' '.repeat(len - str.length));
    }
};

/**
 * Determine whether two circles intersect or not.
 */
helper.TwoCirclesIntersect = function (x1, y1, R1, x2, y2, R2) {
    return ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) <= (R1 + R2) * (R1 + R2));
};

/**
 * Determine whether a point is inside a circle.
 */
helper.PointInsideCircle = function (x, y, xc, yc, Rsq) {
    return ((x - xc) * (x - xc) + (y - yc) * (y - yc) <= Rsq);
};

/**
 *
 */
helper.filterInt = function (value) {
    if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value)) {
        return Number(value);
    }
    return NaN;
};

/**
 *
 */
helper.filterFloat = function (value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
            .test(value)) {
        return Number(value);
    }
    return NaN;
};

/**
 *
 */
helper.notInt = function (value) {
    return isNaN(helper.filterInt(value));
};

/**
 *
 */
helper.notFloat = function (value) {
    return isNaN(helper.filterFloat(value));
};

/**
 *
 */
helper.ReportSHM = function (sec) {
    if (sec < 0) {
        return '    0 s';
    }
    var hh = Math.floor(sec / 3600);
    var mm = Math.round((sec - hh * 3600) / 60);
    if (mm == 60) {
        hh += 1;
        mm = 0;
    }
    return helper.pad(sec.toFixed(0), 5, true, ' ') + ' s (' + hh.toFixed(0) + 'h:' + (mm < 10 ? '0' : '') + mm.toFixed(0) + 'm)';
};

/**
 * 
 */
helper.LogDebug = function (msg) {
    helper.Log(msg, 'loggerDebug');
};

/**
 *
 */
helper.LogEntry = function (msg) {
    helper.Log(msg, 'loggerEntry');
};

/**
 *
 */
helper.LogWarning = function (msg) {
    helper.Log(msg, 'loggerWarning');
};

/**
 *
 */
helper.LogError = function (msg) {
    helper.Log(msg, 'loggerError');
};

/**
 *
 */
helper.LogSuccess = function (msg) {
    helper.Log(msg, 'loggerSuccess');
};

/**
 *
 */
helper.Log = function (msg, cls) {
    var cd = new Date();
    $('#logger').append('<span class="' + cls + '">' +
            '[' + cd.getUTCFullYear() + '-' +
            helper.pad((cd.getUTCMonth()+1).toString(), 2, true, '0') + '-' +
            helper.pad(cd.getUTCDate().toString(), 2, true, '0') + ' ' +
            helper.pad(cd.getUTCHours().toString(), 2, true, '0') + ':' +
            helper.pad(cd.getUTCMinutes().toString(), 2, true, '0') + ':' +
            helper.pad(cd.getUTCSeconds().toString(), 2, true, '0') + '.' +
            helper.pad(cd.getUTCMilliseconds().toString(), 3, true, '0') + '] ' +
            msg + '</span>');
    $('#logger').scrollTop($('#logger')[0].scrollHeight);
};

/**
 *
 */
helper.LunarPhaseExplanation = function (phase) {
    if (phase == 'D') {
        return 'D (dark time)';
    }
    if (phase == 'G') {
        return 'G (gray time)';
    }
    if (phase == 'N') {
        return 'N (no constraint / bright time)';
    }
    return '';
};

/**
 *
 */
helper.numberOfDays = function (year, month) {
    var d = new Date(Date.UTC(year, month, 0));
    return d.getDate();
};

/**
 *
 */
helper.plural = function (num, what) {
    return num + ' ' + what + (num === 1 ? '' : 's');
};

/**
 *
 */
helper.ExtractUTRange = function (str) {
    if (str.substr(0, 1) !== '[' || str.slice(-1) !== ']' || str.indexOf('-') === -1) {
        return false;
    }
    var inner = str.substr(1, str.length - 2);
    str = inner.split('-');
    if (str.length !== 2) {
        return false;
    }
    var ut1 = helper.HMToEphemDate(str[0]);
    var ut2 = helper.HMToEphemDate(str[1]);
    if (ut1 === -1 || ut2 === -1) {
        return false;
    }
    if (ut1 < driver.night.Sunset) {
        ut1 = driver.night.Sunset;
    }
    if (ut2 < driver.night.Sunset) {
        ut2 = driver.night.Sunset;
    }
    if (ut1 > driver.night.Sunrise) {
        ut1 = driver.night.Sunrise;
    }
    if (ut2 > driver.night.Sunrise) {
        ut2 = driver.night.Sunrise;
    }
    return [ut1, ut2];
};

helper.stl = function(utc, eqeqx) {
    return sla.dranrm(sla.gmst(utc + Driver.current_dut) +
                      Driver.obs_lon_rad +
                      eqeqx);
};

helper.utarc = function(altitude, tsouth, dec, pm) {
    var cost = (Math.sin(altitude) - Math.sin(Driver.obs_lat_rad) * Math.sin(dec)) /
            (Math.cos(Driver.obs_lat_rad) * Math.cos(dec));
    var t = sla.r2d * Math.acos(cost) / 15;
    if (pm === "+") {
        return sla.dr2tf(6, (tsouth + t) / 24 * sla.d2pi).ihmsf;
    } else {
        return sla.dr2tf(6, (tsouth - t) / 24 * sla.d2pi).ihmsf;
    }
};

/**
 *
 */
helper.validColour = function(stringToTest) {
    //Alter the following conditions according to your need.
    if (stringToTest === "") { return false; }
    if (stringToTest === "inherit") { return false; }
    if (stringToTest === "transparent") { return false; }

    var dummy = document.createElement("img");
    dummy.style.color = "rgb(0, 0, 0)";
    dummy.style.color = stringToTest;
    if (dummy.style.color !== "rgb(0, 0, 0)") { return true; }
    dummy.style.color = "rgb(255, 255, 255)";
    dummy.style.color = stringToTest;
    return dummy.style.color !== "rgb(255, 255, 255)";
};
