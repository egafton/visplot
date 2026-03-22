/**
 * @file Contains (static) helper functions used throughout the Visplot code.
 * @copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
"use strict";

/**
 * Split a string from the right, limiting the number of splits.
 * Behaves similarly to Python's rsplit: performs at most `maxsplit`
 * splits starting from the right-hand side of the string.
 *
 * @param {String|RegExp} [sep=/\s+/] - Separator used to split the string.
 * If omitted, splits on whitespace.
 * @param {Number} [maxsplit] - Maximum number of splits to perform from the
 * right. If not provided or falsy, all possible splits are performed.
 * @returns {String[]} An array of substrings resulting from the split.
 */
String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep || /s+/);
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
};

/**
 * Utility namespace containing helper functions for logging, formatting,
 * and general-purpose operations used throughout Visplot.
 *
 * @namespace helper
 */
function helper() {
}

/**
 * Log a debug message using the standard logger with error styling.
 * This is a convenience wrapper around helper.Log that applies the
 * "loggerDebug" CSS class to the message.
 *
 * @param {String} msg - The message to be logged.
 * @returns {void} No return value. Delegates logging to helper.Log.
 */
helper.LogDebug = function (msg) {
    helper.Log(msg, "loggerDebug");
};

/**
 * Log a general informational message using the standard logger.
 * This is a convenience wrapper around helper.Log that applies the
 * "loggerEntry" CSS class for neutral (non-error, non-warning, non-debug)
 * output.
 *
 * @param {String} msg - The message to be logged.
 * @returns {void} No return value. Delegates logging to helper.Log.
 */
helper.LogEntry = function (msg) {
    helper.Log(msg, "loggerEntry");
};

/**
 * Log a warning message using the standard logger with error styling.
 * This is a convenience wrapper around helper.Log that applies the
 * "loggerWarning" CSS class to the message.
 *
 * @param {String} msg - The message to be logged.
 * @returns {void} No return value. Delegates logging to helper.Log.
 */
helper.LogWarning = function (msg) {
    helper.Log(`Warning: ${msg}`, "loggerWarning");
};

/**
 * Log an error message using the standard logger with error styling.
 * This is a convenience wrapper around helper.Log that applies the
 * "loggerError" CSS class to the message.
 *
 * @param {String} msg - The message to be logged.
 * @returns {void} No return value. Delegates logging to helper.Log.
 */
helper.LogError = function (msg) {
    helper.Log(`Error: ${msg}`, "loggerError");
};

/**
 * Log a success message using the standard logger with success styling.
 * This is a convenience wrapper around helper.Log that applies the
 * "loggerSuccess" CSS class to the message.
 *
 * @param {String} msg - The message to be logged.
 * @returns {void} No return value. Delegates logging to helper.Log.
 */
helper.LogSuccess = function (msg) {
    helper.Log(msg, "loggerSuccess");
};

/**
 * Log an exception in a normalized, human-readable format.
 * If the input has a `message` property, logs the message along with
 * the first line of the stack trace. Otherwise, logs the value directly.
 *
 * @param {*} e - The exception or error object to be logged.
 * May be an Error instance or any value.
 * @returns {void} No return value. Delegates logging to helper.LogError.
 */
helper.LogException = function (e) {
    if (!e) return;
    if (e.hasOwnProperty("message")) {
        helper.LogError(`${e.message} -- ${e.stack.split("\n")[0]}`);
    } else {
        helper.LogError(`${e}`);
    }
};

/**
 * Append a UTC-timestamped log message to the logger element.
 * The message is wrapped in a <span> with the provided CSS class
 * and the logger view is automatically scrolled to the latest entry.
 *
 * @param {String} msg - The message to be logged (HTML is not escaped).
 * @param {String} cls - CSS class name applied to the log entry for styling.
 * @returns {void} No return value. Produces a side effect on the DOM.
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
 * Pad a single-digit number with zeroes to get at least two digits
 * (6->"06", 13->"13", -3->"-03", -12=>"-12").
 *
 * @param {Number} _num - Number to be padded with zeroes.
 * @returns {String} The given number padded with zeroes as necessary.
 */
helper.padTwoDigits = function (_num) {
    try {
        const num = parseFloat(_num);
        if (num === 0) {
            // handle -0 and +0 (for degrees of Dec, for instance)
            return 1/num < 0 ? "-00" : "00";
        }
        return num > 0
            ? (num < 10 ? `0${num.toString()}` : num.toString())
            : (num > -10 ? `-0${(-num).toString()}` : num.toString());
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert airmass to ZD by inverting Hardie's formula.
 *
 * @param {Number} airmass - Airmass, a number greater than or equal to 1.
 * @returns {Number} ZD corresponding to the given airmass, in radians.
 */
helper.AirmasstoZD = function (X) {
    if (X <= 1) return 0; // zenith

    // Initial guess: sec z ≈ X  =>  s ≈ X - 1
    let s = X - 1;

    for (let i = 0; i < 5; i++) {
        // f(s) = model - X
        const f = 1 + s * (0.9981833 - s * (0.002875 + 0.0008083 * s)) - X;

        // f'(s)
        const df =
            0.9981833 -
            2 * 0.002875 * s -
            3 * 0.0008083 * s * s;

        s -= f / df;
    }

    const secz = 1 + s;
    const z = Math.acos(1 / secz);

    // Clamp to model limit (~87° ≈ 1.52 rad)
    return Math.min(z, 1.52);
};

/**
 * Convert airmass to altitude.
 *
 * @param {Number} airmass - Airmass, a number greater than or equal to 1.
 * @returns {Number} Altitude corresponding to the given airmass, in degrees.
 */
helper.AirmassToAltitude = function (airmass) {
    try {
        return 90 - sla.r2d * helper.AirmasstoZD(airmass);
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert altitude to airmass using slalib.
 *
 * @param {Number} altitude - Altitude in degrees.
 * @returns {Number} Airmass corresponding to the given altitude.
 */
helper.AltitudeToAirmass = function (altitude) {
    try {
        return sla.airmas(sla.d2r * (90 - altitude));
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert a Modified Julian Date (MJD) value to its corresponding index
 * in the night array ("xaxis"), based on the configured sunset reference
 * and step size.
 *
 * @param {Number} time - Time expressed in Modified Julian Date (MJD).
 * @returns {Number} The computed index (rounded to nearest integer).
 */
helper.MJDToIndex = function (time) {
    try {
        return Math.round((time - driver.night.Sunset) / driver.night.xstep);
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert coordinates expressed in degrees-minutes-second to degrees
 */
helper.dmstodeg = function (a) {
    try {
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
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Split a string into an array of lines using newline delimiters.
 * Handles both Unix (\n) and Windows (\r\n) line endings.
 *
 * @param {String} str - The input string to be split.
 * @returns {String[]} An array of lines.
 */
helper.extractLines = function (str) {
    try {
        return str.split(/\r?\n/);
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Parse a SIMBAD service response to extract ICRS coordinates and optional
 * proper motion values.
 * Returns a formatted coordinate string, optionally including proper motion
 * (converted from mas/yr to arcsec/yr), or null if parsing fails or the
 * response indicates an error.
 *
 * @param {String} responseText - Raw response text returned by the SIMBAD service.
 * @returns {String|null} A formatted coordinate string:
 * "HH MM SS.SSS ±DD MM SS.SSS" optionally with "/pm" components,
 * null if no valid data is found.
 */
helper.parseSIMBADResponse = function (responseText) {
    try {
        if (responseText.startsWith("!!")) return null;
        const coordsRegex = new RegExp(/Coordinates\(ICRS.*?\):\s+(\d+)\s+(\d+)\s+([\d\.]+)\s+([+\-\d]+)\s+(\d+)\s+([\d\.]+)/g);
        const ca = coordsRegex.exec(responseText);
        if (ca === null) return null;
        const pmRegex = new RegExp(/Proper motions:\s+([+\-\d\.]+)\s+([+\-\d\.]+)/g);
        const pa = pmRegex.exec(responseText);
        if (pa === null) {
            return `${ca[1]} ${ca[2]} ${ca[3]} ${ca[4]} ${ca[5]} ${ca[6]}`;
        } else {
            return `${ca[1]} ${ca[2]} ${ca[3]}/${(parseFloat(pa[1])/1000).toFixed(5)} ${ca[4]} ${ca[5]} ${ca[6]}/${(parseFloat(pa[2])/1000).toFixed(5)}`;
        }
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Get the current UTC time.
 */
helper.utc = function (time) {
    try {
        return (time.getUTCHours() + (time.getUTCMinutes() + time.getUTCSeconds() / 60) / 60) / 24;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert a timestamp to a MJD.
 */
helper.getMJD = function (now)
{
    try {
        return (now.valueOf() / sla.d2s / 1000) + 40587;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Calculate the fractional part of a number (X-[X])
 */
helper.frac = function (X) {
    try {
        X -= Math.floor(X);
        if (X < 0) {
            X += 1.0;
        }
        return X;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert a fractional timestamp (in hours) to a formatted HH:MM:SS string.
 * Allows custom separators between hours, minutes, and seconds.
 *
 * @param {Number} time - Time in fractional hours (e.g., 13.5123 for 13:30:44).
 * @param {String} sep1 - Separator after hours (e.g., 'h' or ':').
 * @param {String} sep2 - Separator after minutes (e.g., 'm' or ':').
 * @param {String} sep3 - Separator after seconds (e.g., 's' or '').
 * @returns {String|undefined} Formatted HMS string, or undefined if an exception occurs.
 */
helper.HMS = function (time, sep1, sep2, sep3) {
    try {
        const h = Math.floor(time);
        const m = Math.floor(60.0 * helper.frac(time));
        const s = (60.0 * (60.0 * helper.frac(time) - m)).toFixed(0);
        return `${helper.padTwoDigits(h)}${sep1}` +
               `${helper.padTwoDigits(m)}${sep2}` +
               `${helper.padTwoDigits(s)}${sep3}`;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert MJD to H:MM format
 */
helper.MJDToHM = function (d, padHours=false) {
    try {
        let t = new Date(driver.night.DateSunset);
        t.setUTCSeconds(t.getUTCSeconds() + (d - driver.night.Sunset) * sla.d2s);
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
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert MJD to H:MM format in the local time at the telescope.
 */
helper.MJDToHMLocal = function (d, utcOffset, padHours=false) {
    try {
        let t = new Date(driver.night.DateSunset);
        t.setUTCSeconds(t.getUTCSeconds() + (d - driver.night.Sunset) * sla.d2s + utcOffset * 3600);
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
        hh = (hh % 24 + 24) % 24;
        return `${padHours ? helper.padTwoDigits(hh) : hh}:${helper.padTwoDigits(mm)}`;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @param {String} - String representing the LST
 */
helper.LSTToAngle = function (text) {
    try {
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
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 *
 */
helper.LSTToMJD = function (str) {
    try {
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
        let jdiff1 = (rad1-sunset)*86164.1 / sla.d2pi;
        let jdiff2 = (rad2-sunset)*86164.1 / sla.d2pi;
        let ut1 = driver.night.Sunset + jdiff1 / sla.d2s;
        let ut2 = driver.night.Sunset + jdiff2 / sla.d2s;
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
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert a H:MM or H:MM:SS or H.d format to MJD.
 */
helper.HMToMJD = function (text) {
    try {
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
    } catch (e) {
        helper.LogException(e);
    }
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
    try {
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
    } catch (e) {
        helper.LogException(e);
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
helper.ExtractAMRange = function (str) {
    try {
        if (!str.startsWith("AM")) {
            return null;
        }
        if (str.startsWith("AM[") && str.slice(-1) !== "]") {
            return false;
        }
        /* Possible formats are: AM<high> equivalent to AM[1-<high>]; and AM[<low>-<high>]; return the pair of airmasses as floats */
        if (str.indexOf("[") === -1) {
            // Make sure it is a float
            const high = helper.filterFloat(str.slice(2));
            if (isNaN(high) || high < 1) {
                return false;
            }
            return [1, high];
        } else {
            if (str.indexOf("-") === -1) {
                return false;
            }
            const pos = str.indexOf("[");
            const inner = str.substr(pos+1, str.length - pos - 2);
            str = inner.split("-");
            if (str.length !== 2) {
                return false;
            }
            const low = helper.filterFloat(str[0]);
            const high = helper.filterFloat(str[1]);
            if (isNaN(low) || isNaN(high) || low < 1 || high < 1 || low > high) {
                return false;
            }
            return [low, high];
        }
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 *
 */
helper.ExtractMoonRange = function (str) {
    try {
        if (!str.startsWith("MOON")) {
            return null;
        }
        if (str.startsWith("MOON[") && str.slice(-1) !== "]") {
            return false;
        }
        /* Possible formats are: MOON<low> equivalent to MOON[<low>-180]; and MOON[<low>-<high>]; return the pair of moon distances as floats */
        if (str.indexOf("[") === -1) {
            // Make sure it is a float
            const low = helper.filterFloat(str.slice(4));
            if (isNaN(low) || low > 180) {
                return false;
            }
            return [low, 180];
        } else {
            if (str.indexOf("-") === -1) {
                return false;
            }
            const pos = str.indexOf("[");
            const inner = str.substr(pos+1, str.length - pos - 2);
            str = inner.split("-");
            if (str.length !== 2) {
                return false;
            }
            const low = helper.filterFloat(str[0]);
            const high = helper.filterFloat(str[1]);
            if (isNaN(low) || isNaN(high) || low < 1 || high < 1 || low > high) {
                return false;
            }
            return [low, high];
        }
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 *
 */
helper.ExtractLSTRange = function (str) {
    try {
        if (!str.startsWith("LST[")) {
            return null;
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
        return helper.LSTToMJD(str);
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 *
 */
helper.ExtractHARange = function (str, ra) {
    try {
        if (!str.startsWith("HA[")) {
            return null;
        }
        if (str.slice(-1) !== "]" || str.indexOf("-") === -1) {
            return false;
        }
        const pos = str.indexOf("[");
        const inner = str.substr(pos+1, str.length - pos - 2);
        str = inner.rsplit("-", 1);
        if (str.length !== 2) {
            return false;
        }
        const ra_h = sla.rtoh * ra;
        const lst = [parseFloat(str[0]) + ra_h, parseFloat(str[1]) + ra_h];
        return helper.LSTToMJD(lst);
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 *
 */
helper.ExtractUTRange = function (str, ra = null) {
    try {
        if (!str.startsWith("UTC[")) {
            if (str.startsWith("LST[")) {
                return helper.ExtractLSTRange(str);
            }
            if (str.startsWith("HA["))  {
                return helper.ExtractHARange(str, ra || 0);
            }
            return null;
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
        let ut1 = helper.HMToMJD(str[0]);
        let ut2 = helper.HMToMJD(str[1]);
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
    } catch (e) {
        helper.LogException(e);
    }
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
 *
 * @param {Number} altitude - Desired altitude, in radians.
 * @param {Number} tsouth - Transit time.
 * @param {Number} dec - Declination of the celestial body, in radians.
 * @param {String} pm - Whether to catch the body rising ("-") or setting ("+").
 */
helper.utarc = function(altitude, tsouth, dec, pm) {
    try {
        if (pm !== "+" && pm !== "-") {
            throw new Error("pm must be '+' (setting) or '-' (rising)");
        }
        const sinφ = Math.sin(Driver.obs_lat_rad);
        const cosφ = Math.cos(Driver.obs_lat_rad);
        const cost = (Math.sin(altitude) - sinφ * Math.sin(dec)) / (cosφ * Math.cos(dec));
        // Object never reaches requested altitude
        if (cost > 1 || cost < -1) {
            return null;
        }
        const H = sla.rtoh * Math.acos(cost);
        const time = (tsouth + (pm === "+" ? H : -H) + 24) % 24;
        return sla.dr2tf(6, time / 24 * sla.d2pi).ihmsf;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Check whether a string represents a valid CSS color value.
 * Excludes certain non-color CSS keywords like "inherit" or "transparent".
 * Uses a temporary DOM element to validate if the browser recognizes the color.
 *
 * @param {String} stringToTest - The string to validate as a CSS color.
 * @returns {Boolean} True if the string is a valid CSS color, false otherwise.
 */
helper.validColour = function(stringToTest) {
    try {
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
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Predefined strings used to indicate offline or unavailable telescope for
 * scheduling (e.g., bad weather, time assigned to a different user, etc.).
 *
 * @type {String[]}
 */
helper.offlineStrings = [
    "Offline",
    "BadWolf"
];

/**
 * Format a timezone offset as a signed integer string.
 * Positive values are prefixed with '+', negative values keep the '-' sign.
 *
 * @param {Number} value - Timezone offset (e.g., hours from UTC).
 * @returns {String} Formatted timezone string, e.g., "+3" or "-5".
 */
helper.timezone = function(value) {
    if (value >= 0) {
        return `+${value.toFixed(0)}`;
    } else {
        return value.toFixed(0);
    }
};

/**
 * Create a multi-dimensional array filled with zeros.
 * Supports arbitrary dimensions by recursively nesting arrays.
 *
 * @param {Number[]} dimensions - An array specifying the size of each dimension,
 * e.g., [3, 2] creates a 3x2 array.
 * @returns {Array} A nested array of zeros with the specified shape.
 */
helper.zeros = function(dimensions) {
    let array = [];
    for (let i=0; i<dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : this.zeros(dimensions.slice(1)));
    }
    return array;
};

/**
 * Evaluate a B-spline at one or more points using the Cox–de Boor recursion formula.
 * Returns either a single value (if a scalar input is given) or an array of evaluated values.
 *
 * @see https://stackoverflow.com/a/25330648
 *
 * @param {Number|Number[]} xx - The point(s) at which to evaluate the B-spline.
 * @param {Number} order - The order of the B-spline (degree = order).
 * @param {Number[]} knots - Knot vector defining the B-spline intervals.
 * @param {Number[]} coeffs - Coefficients for the B-spline basis functions.
 * @returns {Number|Number[]} The evaluated spline value(s).
 */
 helper.bspleval = function(xx, order, knots, coeffs) {
    try {
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
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Compute the smallest angular distance between two angles on a circle.
 * The result is always in the range [0, 180] degrees.
 *
 * @param {Number} a - First angle in degrees.
 * @param {Number} b - Second angle in degrees.
 * @returns {Number} The minimal absolute angular distance between `a` and `b`.
 */
helper.angDist = function(a, b) {
    try {
        const d = Math.abs(a - b) % 360;
        return d > 180 ? 360 - d : d;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert a Modified Julian Date (MJD) value to the fractional hour of the day in UTC.
 *
 * @param {Number} mjd - Time expressed in Modified Julian Date (MJD).
 * @returns {Number} The fractional number of hours (0–24) corresponding to the UTC time.
 */
helper.mjdToUTCHours = function(mjd) {
    try {
        const dayFrac = mjd % 1;
        return dayFrac * 24;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Compute the current subsolar point (the point on Earth where the Sun is
 * directly overhead), along with the Sun's declination and Greenwich Hour
 * Angle (GHA).
 *
 * @returns {Number[]} An array containing:
 * [0] Latitude of the subsolar point in degrees,
 * [1] Longitude of the subsolar point in degrees,
 * [2] Sun's declination in radians,
 * [3] Sun's Greenwich Hour Angle in radians.
 */
helper.SubsolarPoint = function() {
    try {
        const l = moment().utc();
        const tgmt = l.hour() + l.minute()/60 + l.second()/3600 + l.millisecond()/3600000;
        const mjd = sla.cldj(l.year(), l.month()+1, l.date()) + tgmt/24;
        const sun = sla.rdplan(mjd, "Sun", 0, 0);
        const lat = sla.r2d * sun.dec;
        const gha = sla.gmst(mjd) - sun.ra;
        const lng = sla.r2d * sla.drange(-gha);
        return [lat, lng, sun.dec, gha];
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Normalize a string by removing diacritics and converting to lowercase.
 * Uses Unicode NFD normalization to separate base characters and accents,
 * then removes all combining diacritical marks.
 *
 * @param {String} str - The input string to normalize.
 * @returns {String} The normalized, lowercase string without diacritics.
 */
helper.normalizeText = function(str) {
    try {
        return str
            .normalize('NFD')                 // split letters and diacritics
            .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
            .toLowerCase();
    } catch (e) {
        helper.LogException(e);
    }
};