/**
 * @file Configuration file for the different telescopes supported by Visplot.
 * @author ega
 * @copyright (c) 2016-2022 ega, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
"use strict";

/**
 * An associative array storing telescope configuration.
 */
var config = {};

/**
 * Configuration for the 2.5m Nordic Optical Telescope.
 */
config["NOT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "Nordic Optical Telescope 2.5m",

    // Latitude in degrees, +North
    latitude: 28.75723,

    // Longitude in degrees, +East
    longitude: -17.88510,

    // Altitude above sea level, in metres
    altitude: 2382,

    // Lowest limit in zenith distance for observing, in degrees; null if N/A
    zenithLimit: 2,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 6,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: 35,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: null,

    // Background image for plot
    background: "img/telescopes/NOT.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "ALFOSC": {
            type: "optical",
            fov: 6.4
        },
        "NOTCAM": {
            type: "infrared",
            fov: 4
        },
        "MOSCA": {
            type: "optical",
            fov: 7.7
        },
        "STANCAM": {
            type: "optical",
            fov: 3
        },
        "FIES": {
            type: "optical",
            fov: 3 /* Uses STANCAM for acquisition */
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "ALFOSC",

    // Time zone relative to UTC
    timezone: 0
};

/**
 * Configuration for the 4.2m William Herschel Telescope.
 */
config["WHT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "William Herschel Telescope 4.2m",

    // Latitude in degrees, +North
    latitude: 28.76062,

    // Longitude in degrees, +East
    longitude: -17.88166,

    // Altitude above sea level, in metres
    altitude: 2344,

    // Lowest limit in zenith distance for observing, in degrees; null if N/A
    zenithLimit: 0.2,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 12,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: 25,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: null,

    // Background image for plot
    background: "img/telescopes/WHT.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "ACAM": {
            type: "optical",
            fov: 8
        },
        "LIRIS": {
            type: "infrared",
            fov: 4.3
        },
        "ISIS": {
            type: "optical",
            fov: 15 /* Uses A&G unit for acquisition */
        },
        "WEAVE": {
            type: "optical",
            fov: 144 /* Field of view of the FPI camera */
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "ACAM",

    // Time zone relative to UTC
    timezone: 0
};

/**
 * Configuration for the 2.5m Isaac Newton Telescope.
 */
config["INT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "Isaac Newton Telescope 2.5m",

    // Latitude in degrees, +North
    latitude: 28.76209,

    // Longitude in degrees, +East
    longitude: -17.87761,

    // Altitude above sea level, in metres
    altitude: 2347,

    // Lowest limit in zenith distance for observing, in degrees; null if N/A
    zenithLimit: 1,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 20,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: 33,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: ["alt(dec)", function(dec) {
        // Lowest elevation as a function of declination
        // Taken from https://www.ing.iac.es/Astronomy/telescopes/int/int_pointing_limits.html
        if (dec < -30.1583) {
            return 90; // Cannot observe
        } else {
            const hmin = Math.asin(0.4812 * (Math.sin(dec * 1.745329251994329576923691e-2))) * 57.29577951308232;
            return Math.max(hmin, 20);
        }
    }],

    // Background image for plot
    background: "img/telescopes/INT.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "WFC": {
            type: "optical",
            fov: 33.8
        },
        "IDS": {
            type: "optical",
            fov: 1.2 /* Uses AG0 for acquisition */
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "WFC",

    // Time zone relative to UTC
    timezone: 0
};

/**
 * Configuration for the 2.7m Harlan J. Smith Telescope.
 */
 config["HJST"] = {
    // Name of the observatory site
    site: "McDonald Observatory",

    // Full name of the telescope
    name: "Harlan J. Smith Telescope 2.7m",

    // Latitude in degrees, +North
    latitude: 30.671583,

    // Longitude in degrees, +East
    longitude: -104.021561,

    // Altitude above sea level, in metres
    altitude: 2075,

    // Lowest limit in zenith distance for observing, in degrees; null if N/A
    zenithLimit: 1,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 10,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: 20,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: ["ha(dec)", function(dec) {
        // Lowest HA as a function of declination
        return helper.bspleval(
            dec,
            config["HJST"]._interp_order,
            config["HJST"]._minha_knots,
            config["HJST"]._minha_coeffs);
    }, function(dec) {
        // Highest HA as a function of declination
        return helper.bspleval(
            dec,
            config["HJST"]._interp_order,
            config["HJST"]._maxha_knots,
            config["HJST"]._maxha_coeffs);
    }],

    // Private constants for spline interpolation
    _interp_order: 1,
    _minha_knots: [ -52.0, -52.0, -50.0, -45.0, -42.0, -40.0, -30.0, -20.0,
        -17.0, -10.0, 0.0, 5.0, 15.0, 25.0, 30.0, 40.0, 50.0, 60.0, 63.0,
        73.0, 80.0, 81.0, 82.0, 85.0, 88.0, 89.0, 90.0, 90.0 ],
    _minha_coeffs: [ 2.3, 2.0, 1.1, 0.0, -1.0, -2.0, -2.7, -3.0, -3.3, -3.6,
        -4.0, -4.3, -4.7, -4.1, -3.3, -2.6, -2.2, -2.0, -1.8, -1.5, -1.2,
        -1.0, -0.5, 0.8, 2.0, 3.0, 0.0, 0.0 ],
    _maxha_knots: [ -52.0, -52.0, -50.0, -45.0, -40.0, -30.0, -20.0, -15.0,
        -5.0, 0.0, 2.0, 15.0, 25.0, 30.0, 40.0, 50.0, 60.0, 65.0, 73.0, 80.0,
        81.0, 82.0, 85.0, 88.0, 89.0, 90.0, 90.0 ],
    _maxha_coeffs: [ 2.3, 3.0, 3.4, 4.0, 4.7, 5.0, 5.3, 5.6, 5.8, 6.0, 6.5,
        7.0, 7.4, 8.0, 9.0, 10.7, 11.8, 5.4, 5.3, 5.2, 5.5, 5.0, 4.8, 4.0,
        4.0, 0.0, 0.0 ],

    // Background image for plot
    background: "img/telescopes/HJST.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "DIAFI": {
            type: "optical",
            fov: 8.8
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "DIAFI",

    // Time zone relative to UTC
    timezone: -6
};

/**
 * Configuration for the 2.1m Otto Struve Telescope.
 */
 config["OST"] = {
    // Name of the observatory site
    site: "McDonald Observatory",

    // Full name of the telescope
    name: "Otto Struve Telescope 2.1m",

    // Latitude in degrees, +North
    latitude: 30.679709,

    // Longitude in degrees, +East
    longitude: -104.024823,

    // Altitude above sea level, in metres
    altitude: 2070,

    // Lowest limit in zenith distance for observing, in degrees; null if N/A
    zenithLimit: 1,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 10,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: 20,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: null,

    // Background image for plot
    background: "img/telescopes/OST.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "CQUEAN": {
            type: "optical",
            fov: 4.7
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "CQUEAN",

    // Time zone relative to UTC
    timezone: -6
};
