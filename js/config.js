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

    // Highest limit in elevation for observing, in degrees; null if N/A
    highestLimit: null,

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
            fov: 6.4,
            flip: null
        },
        "NOTCAM": {
            type: "infrared",
            fov: 4,
            flip: null
        },
        "MOSCA": {
            type: "optical",
            fov: 7.7,
            flip: null
        },
        "STANCAM": {
            type: "optical",
            fov: 3,
            flip: null
        },
        "FIES": {
            type: "optical",
            fov: 3, /* Uses STANCAM for acquisition */
            flip: null
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

    // Highest limit in elevation for observing, in degrees; null if N/A
    highestLimit: null,

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
            fov: 8,
            flip: null
        },
        "LIRIS": {
            type: "infrared",
            fov: 4.3,
            flip: null
        },
        "ISIS": {
            type: "optical",
            fov: 15, /* Uses A&G unit for acquisition */
            flip: null
        },
        "WEAVE": {
            type: "optical",
            fov: 144, /* Field of view of the FPI camera */
            flip: null
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

    // Highest limit in elevation for observing, in degrees; null if N/A
    highestLimit: null,

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
            fov: 33.8,
            flip: null
        },
        "IDS": {
            type: "optical",
            fov: 1.2, /* Uses AG0 for acquisition */
            flip: null
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
    zenithLimit: null,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 20,

    // Highest limit in elevation for observing, in degrees; null if N/A
    highestLimit: null,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: null,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: ["alt(az)", function(az, west=false) {
        // Lowest alt as a function of az
        let spline = helper.bspleval(
            az,
            config["HJST"]._interp_order,
            west ? config["HJST"]._west_knots : config["HJST"]._east_knots,
            west ? config["HJST"]._west_coeffs : config["HJST"]._east_coeffs);
        if (west) {
            // Extra constraint from mount
            let tan_lat = Math.tan(helper.deg2rad(config["HJST"].latitude));
            let extra = az.map(function(x) {
                return 10 + (90 - Math.sign(x) * x) * tan_lat;
            });
            for (let i=0; i<az.length; i++) {
                if (spline[i] < extra[i]) {
                    spline[i] = extra[i];
                }
            }
        }
        return spline;
    }],

    // Private constants for spline interpolation
    _interp_order: 1,
    _east_knots: [ 0.0, 0.0, 0.06272, 0.41718, 0.6, 1.54312, 3.1325, 4.27379, 7.5, 8.95239, 10.2, 14.9, 17.30542, 20.5, 25.70419, 30.9, 38.4, 43.2, 47.9, 52.7, 58.6, 65.9, 71.0, 72.0, 72.6, 74.0, 74.5, 75.0, 75.8, 76.7, 79.27164, 79.88331, 83.53756, 89.9851, 90.0, 91.0, 93.42376, 97.91479, 101.14426, 112.03828, 113.98352, 119.73522, 121.44203, 123.32106, 127.4514, 133.53116, 139.41837, 145.03372, 150.81197, 156.82736, 162.37753, 167.31865, 171.75906, 175.69523, 176.94882, 179.84182, 182.85576, 185.40778, 190.21656, 192.02353, 193.81988, 195.77614, 197.24894, 199.11154, 201.50202, 204.57905, 207.58713, 210.58517, 214.05263, 217.87337, 222.63499, 226.99855, 231.90437, 237.16225, 243.46792, 249.47878, 257.14607, 263.81569, 268.45969, 278.2506, 286.47528, 292.16175, 298.57647, 304.05225, 309.86212, 314.21206, 318.7725, 322.70296, 326.61606, 330.32437, 333.29116, 336.68721, 340.65371, 345.66911, 349.17651, 352.44677, 355.80555, 355.90125, 357.31804, 358.39889, 359.4415, 359.64203, 359.808, 359.87455, 359.96217, 359.98671, 359.99361, 360.0, 360.0 ],
    _east_coeffs: [ 34.9, 31.2171, 35.90639, 37.0, 37.64729, 38.89258, 39.39684, 45.4, 44.31565, 47.7, 50.2, 50.03966, 52.2, 53.03802, 54.8, 55.5, 54.5, 53.9, 52.8, 50.8, 46.4, 41.2, 39.0, 38.4, 37.3, 39.1, 31.0, 30.2, 29.4, 26.84579, -0.06981, -0.14546, -0.02511, -1.0, -1.0, -0.08052, 0.40134, 0.47293, 10.39215, 7.14382, 5.63203, 9.98003, 16.80961, 20.81332, 22.07313, 22.39179, 22.91384, 22.61686, 20.93149, 18.77156, 16.54423, 14.08171, 11.60981, 10.29912, 14.32915, 13.36634, 12.37373, 9.57541, 7.14408, 5.35491, 3.40769, 1.50549, 0.39139, 0.04754, 0.51865, 0.20726, 0.30274, 0.22854, 0.27189, 0.44805, 0.47866, 0.00604, 0.44077, 0.38741, 0.31519, 0.63332, 0.40349, -1.53816, 0.36894, 0.34434, 0.33558, 0.16342, 0.05099, 0.26969, 0.10385, 0.16577, 0.15312, 0.13707, 0.2723, 0.29214, 0.86597, 2.21062, 8.15803, 11.43421, 15.33975, 21.06243, 19.04374, 20.89495, 24.11185, 28.74916, 29.12249, 33.05931, 29.84922, 34.57746, 32.49405, 30.59617, 34.9, 0.0, 0.0 ],
    _west_knots: [ 0.0, 0.0, 0.43906, 0.9289, 3.43831, 4.26279, 4.64371, 16.68586, 25.9871, 33.63607, 41.11415, 47.29455, 54.27802, 60.0231, 65.51256, 75.3623, 84.74086, 90.7749, 102.8279, 110.52435, 119.41237, 126.664, 138.31395, 143.00055, 147.08679, 151.76719, 155.07573, 158.89765, 161.4321, 163.53753, 165.35744, 167.40063, 170.33041, 172.74817, 175.47968, 177.88615, 180.5921, 183.78163, 187.45023, 190.99489, 191.20079, 192.60369, 193.73726, 196.46254, 201.23594, 207.70584, 212.16177, 215.22709, 216.67349, 217.96201, 219.9278, 223.27443, 226.13353, 228.33742, 232.89344, 236.1054, 238.18168, 240.67782, 254.43931, 257.76391, 261.3756, 265.11035, 267.22432, 269.34768, 270.47858, 270.632, 270.91546, 272.77368, 274.85956, 279.14741, 279.1616, 283.32465, 284.88425, 290.46391, 294.9976, 300.54234, 307.33536, 314.57557, 324.24922, 334.60212, 344.76459, 352.23777, 357.42596, 358.30622, 359.46799, 360.0, 360.0 ],
    _west_coeffs: [ 30.19696, 28.44314, 25.7733, 21.26239, 18.2562, 19.2585, -0.49723, -0.44313, -0.38703, -0.41321, -0.51456, -0.20048, -0.16414, -0.55424, 0.59959, 1.14675, 1.15849, 1.05257, 1.16337, 0.8875, 0.90519, 0.96867, 0.8207, 0.84208, -0.32408, 0.3489, 0.76552, 1.2791, 3.14849, 4.56655, 6.14878, 8.25462, 9.73472, 11.3413, 10.6179, 13.79026, 15.76711, 18.4952, 20.11215, 20.1529, 20.6319, 20.83566, 19.64862, 15.60195, 17.60646, 19.34559, 19.23461, 18.34811, 18.36469, 18.43226, 18.42064, 19.19255, 20.14556, 20.80753, 22.91636, 23.25318, 24.31191, 30.37531, 5.91216, 5.93811, 6.12262, 6.05984, 6.2616, 10.38273, 13.10561, 15.51577, 21.59492, 28.4421, 29.59934, 29.6048, 34.67723, 38.45024, 45.84522, 49.37585, 52.29566, 54.53407, 55.79151, 55.9492, 54.28657, 50.01777, 43.93784, 36.76694, 35.75006, 32.32208, 30.19696, 0.0, 0.0 ],

    // Background image for plot
    background: "img/telescopes/HJST.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "COUDE": {
            type: "optical",
            fov: 6,
            flip: null
        },
        "DIAFI": {
            type: "optical",
            fov: 8.8,
            flip: null
        },
        "GCMS": {
            type: "optical",
            fov: 20,
            flip: null
        },
        "VIRUS": {
            type: "optical",
            fov: 20, /* Uses a separate guide camera 540 arcsec North of the IFU */
            flip: "x"
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "COUDE",

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

    // Highest limit in elevation for observing, in degrees; null if N/A
    highestLimit: null,

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
            fov: 4.7,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "CQUEAN",

    // Time zone relative to UTC
    timezone: -6
};


/**
 * Configuration for the 10m Hobby-Eberly Telescope.
 */
 config["HET"] = {
    // Name of the observatory site
    site: "McDonald Observatory",

    // Full name of the telescope
    name: "Hobby-Eberly Telescope 10m",

    // Latitude in degrees, +North
    latitude: 30.681444,

    // Longitude in degrees, +East
    longitude: -104.014722,

    // Altitude above sea level, in metres
    altitude: 2026,

    // Lowest limit in zenith distance for observing, in degrees; null if N/A
    zenithLimit: null,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 46.6,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 63.4,

    // Lowest limit for unvignetted observations, in degrees; null if N/A
    vignetteLimit: null,

    // Limits based on declination (for equatorial mounts); null if N/A
    declinationLimit: null,

    // Background image for plot
    background: "img/telescopes/HET.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "VIRUS": {
            type: "optical",
            fov: 16,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "VIRUS",

    // Time zone relative to UTC
    timezone: -6
};
