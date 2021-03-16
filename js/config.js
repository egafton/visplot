/**
 * @file Configuration file for the different telescopes supported by Visplot.
 * @author ega
 * @copyright (c) 2016-2021 ega, NOT/ING.
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
 * Configuration for the Nordic Optical Telescope.
 */
config["NOT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "Nordic Optical Telescope",

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
    defaultInstrument: "ALFOSC"
};

/**
 * Configuration for the William Herschel Telescope.
 */
config["WHT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "William Herschel Telescope",

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
    defaultInstrument: "ACAM"
};

/**
 * Configuration for the Isaac Newton Telescope.
 */
config["INT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "Isaac Newton Telescope",

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
    defaultInstrument: "WFC"
};
