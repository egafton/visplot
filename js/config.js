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
