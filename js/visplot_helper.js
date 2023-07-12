/**
 * @file Contains (static) helper functions used throughout the Visplot code.
 * @author ega
 * @copyright (c) 2016-2022 ega, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 * @todo: Many of these functions can be rewritten in terms of slalib functions
 * or replaced altogether.
 */
"use strict";

/**
 * @namespace
 */
function helper() {
}

/**
 * Pad a single-digit number with zeroes to get at least two digits
 * (6->"06", 13->"13", -3->"-03", -12=>"-12").
 * @param {Number} _num - Number to be padded with zeroes
 * @returns {String} The given number padded with zeroes as necessary
 */
helper.padTwoDigits = function (_num) {
    const num = parseFloat(_num);
    if (num === 0) {
        // handle -0 and +0 (for degrees of Dec, for instance)
        return 1/num < 0 ? "-00" : "00";
    }
    return num > 0
        ? (num < 10 ? `0${num.toString()}` : num.toString())
        : (num > -10 ? `-0${(-num).toString()}` : num.toString());
};

/**
 * Convert degrees to radians.
 * @param {Number} angle - Angle in degrees
 * @returns {double} Angle in radians
 */
helper.deg2rad = function (angle) {
    return angle * sla.d2r;
};

/**
 * Convert radians to degrees.
 * @param {Number} angle - Angle in radians
 * @returns {double} Angle in degrees
 */
helper.rad2deg = function (angle) {
    return angle * sla.r2d;
};

/**
 * Convert airmass to altitude.
 * @param {Number} airmass - Airmass, a number greater than or equal to 1
 * @returns {double} Altitude corresponding to the given airmass, in degrees
 * @todo Offer the choice of using more complex formulae than just AM=sec(z).
 */
helper.AirmassToAltitude = function (airmass) {
    return 90 - helper.rad2deg(Math.acos(1 / airmass));
};

/**
 * Convert altitude to airmass using slalib.
 * @param {Number} altitude - Altitude in degrees
 * @returns {double} Airmass corresponding to the given altitude
 */
helper.AltitudeToAirmass = function (altitude) {
    return sla.airmas(helper.deg2rad(90 - altitude));
};

/**
 * Convert an ephem time to an index in the night array ("xaxis")
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
    const d = a.replace(/^\s+/, "").split(/[:\s]/);
    let sign = 1;
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

helper.getCoordinates = function(xcent, ycent, x, y, r, lst) {
    if ($.inArray(Driver.telescopeName, ["NOT", "WHT", "INT"]) >= 0) {
        return helper.getCoordinates_NOT(xcent, ycent, x, y, r, lst);
    } else if ($.inArray(Driver.telescopeName, ["HJST", "OST"]) >= 0) {
        return helper.getCoordinates_HJST(xcent, ycent, x, y, r, lst);
    } else if ($.inArray(Driver.telescopeName, ["CAHA"]) >= 0) {    //CAHA
        return helper.getCoordinates_HJST(xcent, ycent, x, y, r, lst);     //CAHA
    } else {
        return null;
    }
};

/**
 * Convert pixel coordinates in GTC SkyCam image to Az/Alt and RA/Dec
 */
helper.getCoordinates_NOT = function (xcent, ycent, x, y, r, lst) {
    const myArray = new Array(4); /* Exception to Google style rule 5.2.2 */
    x = x - xcent;
    y = y - ycent;
    let newR = Math.sqrt(x * x + y * y);
    let newTheta = helper.rad2deg(Math.atan2(y, x) - helper.deg2rad(90) + helper.deg2rad(35));
    r = Math.max(r, newR);
    newR = newR - 3;
    const n = (r - newR) / r;
    newR = 6.686 + 47.324 * n + 135.465 * n * n - 187.185 * n * n * n + 87.754 * n * n * n * n;
    if (newR > r) {
        myArray[0] = "low";
    } else {
        myArray[0] = Math.round(newR);
        if (myArray[0] > 90) {
            myArray[0] = 90;
        }
    }
    newTheta = 180 - newTheta;
    if (newTheta >= 360) {
        newTheta = newTheta - 360;
    }
    myArray[1] = Math.round(newTheta);
    const val = helper.radec(newR, newTheta, lst);
    myArray[2] = helper.HMS(val[0], "h", "m", "s");
    myArray[3] = helper.HMS(val[1], "°", "'", '"');
    return myArray;
};

/**
 * Convert pixel coordinates in Monet SkyCam image to Az/Alt and RA/Dec
 */
helper.getCoordinates_HJST = function (xcent, ycent, x, y, r, lst) {
    const myArray = new Array(4); /* Exception to Google style rule 5.2.2 */
    x = x - xcent;
    y = y - ycent;
    let newR = Math.sqrt(x * x + y * y);
    let newTheta = helper.rad2deg(Math.atan2(y, x) - helper.deg2rad(90) - helper.deg2rad(5));
    r = Math.max(r, newR);
    newR = newR - 3;
    const n = (r - newR) / r;
    newR = 6.686 + 47.324 * n + 135.465 * n * n - 187.185 * n * n * n + 87.754 * n * n * n * n;
    if (newR > r) {
        myArray[0] = "low";
    } else {
        myArray[0] = Math.round(newR);
        if (myArray[0] > 90) {
            myArray[0] = 90;
        }
    }
    newTheta = 180 - newTheta;
    if (newTheta >= 360) {
        newTheta = newTheta - 360;
    }
    myArray[1] = Math.round(newTheta);
    const val = helper.radec(newR, newTheta, lst);
    myArray[2] = helper.HMS(val[0], "h", "m", "s");
    myArray[3] = helper.HMS(val[1], "°", "'", '"');
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
    return (now.valueOf() / 86400000) + 2440587.5;
};

/**
 * Calculate the Greenwich mean sidereal time from a Julian date.
 */
helper.GM_Sidereal_Time = function (jd) {
    const MJD = jd - 2400000.5;
    const MJD0 = Math.floor(MJD);
    const ut = (MJD - MJD0) * 24.0;
    const t_eph = (MJD0 - 51544.5) / 36525.0;
    let gmst = 6.697374558 + 1.0027379093 * ut + (8640184.812866 + (0.093104 - 0.0000062 * t_eph) * t_eph) * t_eph / 3600.0;
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
 * Convert Altitude, Azimuth and Local Apparent Sidereal Time
 * to RA (in hours) and Dec (in degrees).
 */
helper.radec = function (alt, az, lst) {
    const radeg = Math.PI / 180;
    const a = alt * radeg, p = Driver.obs_lat_deg * radeg, A = az * radeg;
    const sin_dec = Math.sin(a) * Math.sin(p) + Math.cos(a) * Math.cos(p) * Math.cos(A);
    let dec = Math.asin(sin_dec);
    const cos_ha = (Math.sin(a) - Math.sin(p) * sin_dec) / (Math.cos(p) * Math.cos(dec));
    const ha = 12 * Math.acos(cos_ha) / Math.PI;
    let ra = (az < 180 ? lst + ha : lst - ha);
    if (ra < 0) {
        ra += 24;
    }
    if (ra >= 24) {
        ra -= 24;
    }
    dec *= 180 / Math.PI;
    return [ra, dec];
};

/**
 * Convert RA, Dec and Local Apparent Sidereal Time to Altitude and Azimuth
 */
helper.altaz = function (ra, dec, lst) {
    let ha = lst - ra;
    if (ha < 0) {
        ha += 24;
    }
    const p = Driver.obs_lat_rad, d = helper.deg2rad(dec), h = ha * Math.PI / 12;
    const sin_alt = Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(p) * Math.cos(h);
    let alt = Math.asin(sin_alt);
    const cos_alt = (Math.sin(d) - sin_alt * Math.sin(p)) / (Math.cos(alt) * Math.cos(p));
    let az = helper.rad2deg(Math.acos(cos_alt));
    alt = helper.rad2deg(alt);
    if (Math.sin(h) > 0) {
        az = 360 - az;
    }
    return [alt, az];
};

/**
 * Convert a timestamp to a HMS string.
 */
helper.HMS = function (time, sep1, sep2, sep3) {
    return helper.degtosex(time, 0, sep1, sep2, sep3);
};

/**
 * Convert a number in degrees to HMS string of the desired precision.
 */
helper.degtosex = function (time, prec, sep1, sep2, sep3) {
    const h = Math.floor(time);
    const m = Math.floor(60.0 * helper.frac(time));
    const s = (60.0 * (60.0 * helper.frac(time) - m)).toFixed(prec);
    return `${helper.padTwoDigits(h)}${sep1}:` +
           `${helper.padTwoDigits(m)}${sep2}:` +
           `${helper.padTwoDigits(s)}${sep3}`;
};

/**
 * Convert a Python.ephem date (stored as a float) to H:MM format
 */
helper.EphemDateToHM = function (d, padHours=false) {
    let t = new Date(driver.night.DateSunset);
    t.setSeconds(t.getUTCSeconds() + (d - driver.night.Sunset) * 86400);
    const ss = t.getUTCSeconds();
    let mm = t.getUTCMinutes();
    let hh = t.getUTCHours();
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
    return `${padHours ? helper.padTwoDigits(hh) : hh}:${helper.padTwoDigits(mm)}`;
};

/**
 * @param {String} - String representing the LST
 */
helper.LSTToAngle = function (text) {
    const easy = helper.filterFloat(text);
    if (!isNaN(easy)) {
        return easy * sla.htor;
    }
    const arr = text.split(":");
    if (arr.length < 1 || arr.length > 3 || helper.notInt(arr[0])) {
        return -1;
    }
    const hh = helper.filterInt(arr[0]);
    const mm = (arr.length > 1) ? helper.filterInt(arr[1]) : 0;
    const ss = (arr.length > 2) ? helper.filterInt(arr[2]) : 0;
    if (hh < 0 || hh > 24 || mm < 0 || mm > 60 || ss < 0 || ss > 60) {
        return -1;
    }
    return sla.dtf2r(hh, mm, ss);
};

/**
 *
 */
helper.LSTToEphemDate = function (str) {
    let rad1 = helper.LSTToAngle(str[0]);
    let rad2 = helper.LSTToAngle(str[1]);
    if (rad1 === -1 || rad2 === -1) {
        return false;
    }
    let sunset = driver.night.stlSunset;
    /* If LST1 is larger, then we have to go around 00:00 */
    if (rad1 > rad2) {
        rad1 -= sla.d2pi;
    }
    /* Sidereal day is not 86400 seconds, but 86164.1! */
    let jdiff1 = (rad1-sunset)*86164.1/sla.d2pi;
    let jdiff2 = (rad2-sunset)*86164.1/sla.d2pi;
    let ut1 = driver.night.Sunset + jdiff1 / 86400;
    let ut2 = driver.night.Sunset + jdiff2 / 86400;
    if (ut2 < driver.night.Sunset) {
        ut1 += 1;
        ut2 += 1;
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
    if (ut1 > ut2) {
        ut1 -= 1;
    }
    return [ut1, ut2];
};

/**
 * Convert a H:MM or H:MM:SS or H.d format to a Python.ephem date.
 */
helper.HMToEphemDate = function (text) {
    const jsunset = driver.night.DateSunset;
    const easy = helper.filterFloat(text);
    let hh, mm, ss;
    if (!isNaN(easy)) {
        hh = Math.floor(easy);
        mm = Math.floor((easy % 1) / (1/60));
        ss = Math.floor((easy - hh - mm / 60) * 3600);
    } else {
        const arr = text.split(":");
        if (arr.length < 1 || arr.length > 3 || helper.notInt(arr[0])) {
            return -1;
        }
        hh = helper.filterInt(arr[0]);
        mm = (arr.length > 1) ? helper.filterInt(arr[1]) : 0;
        ss = (arr.length > 2) ? helper.filterInt(arr[2]) : 0;
    }
    if (hh < 0 || hh > 24 || mm < 0 || mm > 60 || ss < 0 || ss > 60) {
        return -1;
    }
    if (driver.night.tSunset[3] > driver.night.tSunrise[3]) {
        // UTC rolls over during the night, so HH must be
        // > sunset OR < sunrise
        if (hh < driver.night.tSunset[3] - 1 && hh > driver.night.tSunrise[3] + 1) {
            return -1;
        }
    } else {
        // UTC doesn't roll over during the night, so HH must be
        // > sunset AND < sunrise
        if (hh < driver.night.tSunset[3] - 1 || hh > driver.night.tSunrise[3] + 1) {
            return -1;
        }
    }
    const jtime = new Date(Date.UTC(
        driver.night.tSunset[0],
        driver.night.tSunset[1]-1,
        driver.night.tSunset[2] + ((driver.night.tSunset[3] < driver.night.tSunrise[3] || hh > 12) ? 0 : 1),
        hh, mm, ss, 0));
    const jdiff = (jtime - jsunset) / 8.64e7;
    return driver.night.Sunset + jdiff;
};

/**
 * Equivalent of str.repeat(len) for older versions of JavaScript.
 * @param {String} str - String to repeat
 * @param {Number} len - Number of repetitions
 */
helper.repeat = function (str, len) {
    return Array(len + 1).join(str);
};

/**
 * Left-pad or right-pad a string "str" with characters "w" in order to
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
        return `${helper.repeat(w, len - str.length)}${str}`;
    } else {
        return `${str}${helper.repeat(w, len - str.length)}`;
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
        return "    0 s";
    }
    let hh = Math.floor(sec / 3600);
    let mm = Math.round((sec - hh * 3600) / 60);
    if (mm == 60) {
        hh += 1;
        mm = 0;
    }
    return `${helper.pad(sec.toFixed(0), 5, true, " ")} s (${hh.toFixed(0)}h:${(mm < 10 ? "0" : "")}${mm.toFixed(0)}m)`;
};

/**
 *
 */
helper.LogDebug = function (msg) {
    helper.Log(msg, "loggerDebug");
};

/**
 *
 */
helper.LogEntry = function (msg) {
    helper.Log(msg, "loggerEntry");
};

/**
 *
 */
helper.LogWarning = function (msg) {
    helper.Log(msg, "loggerWarning");
};

/**
 *
 */
helper.LogError = function (msg) {
    helper.Log(msg, "loggerError");
};

/**
 *
 */
helper.LogSuccess = function (msg) {
    helper.Log(msg, "loggerSuccess");
};

/**
 *
 */
helper.Log = function (msg, cls) {
    const cd = new Date();
    $("#logger").append(`<span class="${cls}">` +
            `[${cd.getUTCFullYear()}-` +
            helper.pad((cd.getUTCMonth()+1).toString(), 2, true, "0") + "-" +
            helper.pad(cd.getUTCDate().toString(), 2, true, "0") + " " +
            helper.pad(cd.getUTCHours().toString(), 2, true, "0") + ":" +
            helper.pad(cd.getUTCMinutes().toString(), 2, true, "0") + ":" +
            helper.pad(cd.getUTCSeconds().toString(), 2, true, "0") + "] " +
            msg + "</span>");
    $("#logger").scrollTop($("#logger")[0].scrollHeight);
};

/**
 *
 */
helper.LunarPhaseExplanation = function (phase) {
    if (phase == "D") {
        return "D (dark time)";
    }
    if (phase == "G") {
        return "G (gray time)";
    }
    if (phase == "N") {
        return "N (no constraint / bright time)";
    }
    return "";
};

/**
 *
 */
helper.numberOfDays = function (year, month) {
    const d = new Date(Date.UTC(year, month, 0));
    return d.getUTCDate();
};

/**
 *
 */
helper.mod = function (num, modulo) {
    return ((num % modulo) + modulo) % modulo;
};

/**
 *
 */
helper.plural = function (num, what) {
    return `${num} ${what}${num === 1 ? "" : "s"}`;
};

/**
 *
 */
helper.ExtractLSTRange = function (str) {
    if (str.startsWith("UT[") || str.startsWith("UTC[")) {
        return helper.ExtractUTRange(str);
    }
    if (str.slice(-1) !== "]" || str.indexOf("-") === -1) {
        return false;
    }
    const pos = str.indexOf("[");
    const inner = str.substr(pos+1, str.length - pos - 2);
    str = inner.split("-");
    if (str.length !== 2) {
        return false;
    }
    return helper.LSTToEphemDate(str);
};

/**
 *
 */
helper.ExtractUTRange = function (str) {
    if (str.startsWith("LST[")) {
        return helper.ExtractLSTRange(str);
    }
    if (str.slice(-1) !== "]" || str.indexOf("-") === -1) {
        return false;
    }
    const pos = str.indexOf("[");
    const inner = str.substr(pos+1, str.length - pos - 2);
    str = inner.split("-");
    if (str.length !== 2) {
        return false;
    }
    let ut1 = helper.HMToEphemDate(str[0]);
    let ut2 = helper.HMToEphemDate(str[1]);
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

/**
 * Calculate the Local Sidereal Time corresponding to a given UTC time.
 * @param {Number} utc - UTC in MJD format
 * @param {Number} eqeqx - Equation of the equinoxes
 */
helper.stl = function(utc, eqeqx) {
    return sla.dranrm(sla.gmst(utc + Driver.current_dut) +
                      Driver.obs_lon_rad +
                      eqeqx);
};

/**
 * Time at which a celestial body reaches a desired altitude.
 * @param {Number} altitude - Desired altitude, in radians
 * @param {Number} tsouth - Transit time
 * @param {Number} dec - Declination of the celestial body, in radians
 * @param {String} pm - Whether to catch the body rising ("-") or setting ("+")
 */
helper.utarc = function(altitude, tsouth, dec, pm) {
    const cost = (Math.sin(altitude) - Math.sin(Driver.obs_lat_rad) * Math.sin(dec)) /
            (Math.cos(Driver.obs_lat_rad) * Math.cos(dec));
    const t = sla.r2d * Math.acos(cost) / 15;
    if (pm === "+") {
        return sla.dr2tf(6, ((tsouth + t) % 24) / 24 * sla.d2pi).ihmsf;
    } else {
        return sla.dr2tf(6, ((tsouth - t) % 24) / 24 * sla.d2pi).ihmsf;
    }
};

/**
 *
 */
helper.validColour = function(stringToTest) {
    /* Exclude valid CSS colour properties that are not colours */
    if (stringToTest === "") { return false; }
    if (stringToTest === "inherit") { return false; }
    if (stringToTest === "transparent") { return false; }

    const dummy = document.createElement("img");
    dummy.style.color = "rgb(0, 0, 0)";
    dummy.style.color = stringToTest;
    if (dummy.style.color !== "rgb(0, 0, 0)") { return true; }
    dummy.style.color = "rgb(255, 255, 255)";
    dummy.style.color = stringToTest;
    return dummy.style.color !== "rgb(255, 255, 255)";
};

/**
 * How to mark the offline time?
 */
helper.offlineStrings = [
    "Offline",
    "BadWolf",
    "#Offline",
    "#BadWolf"
];

/**
 * Format a timezone number. Display as integer and always show the sign.
 */
helper.timezone = function(value) {
    if (value >= 0) {
        return `+${value.toFixed(0)}`;
    } else {
        return value.toFixed(0);
    }
};

/**
 * Created multi-dimensional array filled with 0.
 */
helper.zeros = function(dimensions) {
    let array = [];
    for (let i=0; i<dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : this.zeros(dimensions.slice(1)));
    }
    return array;
};

/**
 * Evaluate a B-spline at a set of points.
 *
 * @see https://stackoverflow.com/a/25330648
 */
 helper.bspleval = function(xx, order, knots, coeffs) {
    const k = order;
    const t = knots;
    const m = t.length;
    const x = Array.isArray(xx) ? xx : [xx];
    const npts = x.length;
    const B = helper.zeros([m-1,k+1,npts]);
    for (let i=0; i<m-1; i++) {
        for (let ix=0; ix<npts; ix++) {
            B[i][0][ix] = ((x[ix] >= t[i]) && (x[ix] < t[i+1])) ? 1 : 0;
        }
    }
    if (k == 0) {
        B[m-2][0][npts-1] = 1;
    }
    // Next iteratively define the higher-order basis functions, working from lower order to higher.
    for (let j=1; j<k+1; j++) {
        for (let i=0; i<m-j-1; i++) {
            for (let ix=0; ix<npts; ix++) {
                let first_term = (t[i+j] == t[i]) ? 0 : ((x[ix] - t[i]) / (t[i+j] - t[i])) * B[i][j-1][ix];
                let second_term = (t[i+j+1] == t[i+1]) ? 0 : ((t[i+j+1] - x[ix]) / (t[i+j+1] - t[i+1])) * B[i+1][j-1][ix];
                B[i][j][ix] = first_term + second_term;
            }
        }
        if (k == 0) {
            B[m-j-2][j][npts-1] = 1;
        }
    }
    // Evaluate the spline by multiplying the coefficients with the highest-order basis functions.
    const y = helper.zeros([npts]);
    for (let i=0; i<m-k-1; i++) {
        for (let ix=0; ix<npts; ix++) {
            y[ix] += coeffs[i] * B[i][k][ix];
        }
    }
    return npts == 1 ? y[0] : y;
};
