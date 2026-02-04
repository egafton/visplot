/**
 * @file Configuration file for the different telescopes supported by Visplot.
 * @copyright (c) 2016-2026 ega, irl.
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

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 6,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 88,

    // Lowest limit for unvignetted observations, in degrees
    vignetteLimit: 35,

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

    // Time zone as defined in momentjs
    timezoneName: "Atlantic/Canary"
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

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 12,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 89.8,

    // Lowest limit for unvignetted observations, in degrees
    vignetteLimit: 25,

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
    defaultInstrument: "WEAVE",

    // Time zone as defined in momentjs
    timezoneName: "Atlantic/Canary"
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

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 20,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 89,

    // Lowest limit for unvignetted observations, in degrees
    vignetteLimit: 33,

    // Limits based on declination (for equatorial mounts)
    declinationLimit: ["alt(dec)", function (dec) {
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

    // Time zone as defined in momentjs
    timezoneName: "Atlantic/Canary"
};


/**
 * Configuration for the Catalina Sky Survey 1.5m telescope on Mt. Lemmon
 */
config["CSS"] = {
    // Name of the observatory site
    site: "Mt. Lemmon",

    // Full name of the telescope
    name: "Catalina Sky Survey 1.5m",

    // Latitude in degrees, +North
    latitude: 32.442754,

    // Longitude in degrees, +East
    longitude: -110.78872,

    // Altitude above sea level, in metres
    altitude: 2789,

    // Background image for plot
    background: "img/telescopes/CSS.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "default": {
            type: "optical",
            fov: 135,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "default",

    // Time zone as defined in momentjs
    timezoneName: "America/Phoenix"
};

/**
 * Configuration for the Wyoming Infrared Observatory 2.3m telescope on Jelm Mt.
 */
config["WIRO"] = {
    // Name of the observatory site
    site: "Jelm Mt.",

    // Full name of the telescope
    name: "Wyoming Infrared Observatory 2.3m",

    // Latitude in degrees, +North
    latitude: 41.097096,

    // Longitude in degrees, +East
    longitude: -105.977128,

    // Altitude above sea level, in metres
    altitude: 2943,

    // Background image for plot
    background: "img/telescopes/WIRO.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "WDP": {
            type: "optical",
            fov: 39,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "WDP",

    // Time zone as defined in momentjs
    timezoneName: "America/Denver"
};

/**
 * Configuration for the 2.2m telescope at the Calar Alto Observatory.
 */
config["CAHA"] = {
    // Name of the observatory site
    site: "Calar Alto Observatory",

    // Full name of the telescope
    name: "CAHA 2.2m",

    // Latitude in degrees, +North
    latitude: 37.223151,

    // Longitude in degrees, +East
    longitude: -2.546075,

    // Altitude above sea level, in metres
    altitude: 2168,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 10.9,

    // Limits based on declination (for equatorial mounts)
    declinationLimit: ["alt(dec)", function (dec) {
        // Lowest elevation as a function of declination
        if (dec < -37) {
            return 90; // Cannot observe
        } else {
            const hmin = Math.asin(0.6049 * (Math.sin(dec * 1.745329251994329576923691e-2))) * 57.29577951308232;
            return Math.max(hmin, 10.9);
        }
    }],

    // Background image for plot
    background: "img/telescopes/CAHA.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "CAFOS": {
            type: "optical",
            fov: 16,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "CAFOS",

    // Time zone as defined in momentjs
    timezoneName: "Europe/Madrid"
};

/**
 * Configuration for the Observatorio Astrofísico de Javalambre in Teruel.
 */
config["OAJ"] = {
    // Name of the observatory site
    site: "Observatorio Astrofísico de Javalambre",

    // Full name of the telescope
    name: "OAJ 2.5m",

    // Latitude in degrees, +North
    latitude: 40.042018,

    // Longitude in degrees, +East
    longitude: -1.016382,

    // Altitude above sea level, in metres
    altitude: 1957,

    // Background image for plot
    background: "img/telescopes/OAJ.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "JPCam": {
            type: "optical",
            fov: 33.6,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "JPCam",

    // Time zone as defined in momentjs
    timezoneName: "Europe/Madrid"
};

/**
 * Configuration for the 8.3m Subaru Telescope.
 */
config["Subaru"] = {
    // Name of the observatory site
    site: "Mauna Kea",

    // Full name of the Telescope
    name: "Subaru Telescope 8.3m",

    // Latitude in degrees, +North
    latitude: 19.8256,

    // Longitude in degrees, +East
    longitude: -155.4761,

    // Altitude above sea level, in metres
    altitude: 4163,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 15,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 89,

    // Background image for plot
    background: "img/telescopes/Subaru.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "HSC": {
            type: "optical",
            fov: 90,
            flip: null
        },
        "FOCAS": {
            type: "optical",
            fov: 6,
            flip: null
        },
        "HDS": {
            type: "optical",
            fov: 1,
            flip: null
        },
        "IRCS": {
            type: "infrared",
            fov: 1,
            flip: null,
        },
        "PFS": {
            type: "optical",
            fov: 75,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "HSC",

    // Time zone as defined in momentjs
    timezoneName: "US/Hawaii"
}

/**
 * Configuration for the 2.7m Harlan J. Smith Telescope.
 */
config["HJST"] = {
    // Name of the observatory site
    site: "McDonald Observatory",

    // Full name of the telescope
    name: "Harlan J. Smith Telescope 2.7m",

    // Latitude in degrees, +North
    latitude: 30.671743,

    // Longitude in degrees, +East
    longitude: -104.022024,

    // Altitude above sea level, in metres
    altitude: 2075,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 20,

    // Limits based on declination (for equatorial mounts)
    declinationLimit: ["alt(az)", function (az, west = false, instr = null) {
        // Lowest alt as a function of az
        let spline = helper.bspleval(
            az,
            config["HJST"]._interp_order,
            west ? config["HJST"]._west_knots : (instr === "GCMS" ? config["HJST"]._eastGCMS_knots : config["HJST"]._east_knots),
            west ? config["HJST"]._west_coeffs : (instr === "GCMS" ? config["HJST"]._eastGCMS_coeffs : config["HJST"]._east_coeffs));
        if (west) {
            // Extra constraint from mount
            let tan_lat = Math.tan(helper.deg2rad(config["HJST"].latitude));
            let extra = az.map(function (x) {
                return 10 + (90 - Math.sign(x) * x) * tan_lat;
            });
            for (let i = 0; i < az.length; i++) {
                if (spline[i] < extra[i]) {
                    spline[i] = extra[i];
                }
            }
        }
        return spline;
    }],

    // Private constants for spline interpolation
    _interp_order: 1,
    _east_knots: [0, 0, 0.06, 0.42, 0.6, 1.54, 3.13, 4.27, 7.5, 8.95, 10.2, 14.9, 17.31, 20.5, 25.7, 30.9, 38.4, 43.2, 47.9, 52.7, 58.6, 65.9, 71, 72, 72.6, 74, 74.5, 75, 75.8, 76.7, 79.27, 79.88, 83.54, 89.99, 90, 91, 93.42, 97.91, 101.14, 112.04, 113.98, 119.74, 121.44, 123.32, 127.45, 133.53, 139.42, 145.03, 150.81, 156.83, 162.38, 167.32, 171.76, 175.7, 176.95, 179.84, 182.86, 185.41, 190.22, 192.02, 193.82, 195.78, 197.25, 199.11, 201.5, 204.58, 207.59, 210.59, 214.05, 217.87, 222.63, 227, 231.9, 237.16, 243.47, 249.48, 257.15, 263.82, 268.46, 278.25, 286.48, 292.16, 298.58, 304.05, 309.86, 314.21, 318.77, 322.7, 326.62, 330.32, 333.29, 336.69, 340.65, 345.67, 349.18, 352.45, 355.81, 355.9, 357.32, 358.4, 359.44, 359.64, 359.81, 359.87, 359.96, 359.99, 359.99, 360, 360],
    _east_coeffs: [34.9, 31.2, 35.9, 37, 37.6, 38.9, 39.4, 45.4, 44.3, 47.7, 50.2, 50, 52.2, 53, 54.8, 55.5, 54.5, 53.9, 52.8, 50.8, 46.4, 41.2, 39, 38.4, 37.3, 39.1, 31, 30.2, 29.4, 26.8, -0.1, -0.1, -0, -1, -1, -0.1, 0.4, 0.5, 10.4, 7.1, 5.6, 10, 16.8, 20.8, 22.1, 22.4, 22.9, 22.6, 20.9, 18.8, 16.5, 14.1, 11.6, 10.3, 14.3, 13.4, 12.4, 9.6, 7.1, 5.4, 3.4, 1.5, 0.4, 0, 0.5, 0.2, 0.3, 0.2, 0.3, 0.4, 0.5, 0, 0.4, 0.4, 0.3, 0.6, 0.4, -1.5, 0.4, 0.3, 0.3, 0.2, 0.1, 0.3, 0.1, 0.2, 0.2, 0.1, 0.3, 0.3, 0.9, 2.2, 8.2, 11.4, 15.3, 21.1, 19, 20.9, 24.1, 28.7, 29.1, 33.1, 29.8, 34.6, 32.5, 30.6, 34.9, 0, 0],
    _west_knots: [0, 0, 0.44, 0.93, 3.44, 4.26, 4.64, 16.69, 25.99, 33.64, 41.11, 47.29, 54.28, 60.02, 65.51, 75.36, 84.74, 90.77, 102.83, 110.52, 119.41, 126.66, 138.31, 143, 147.09, 151.77, 155.08, 158.9, 161.43, 163.54, 165.36, 167.4, 170.33, 172.75, 175.48, 177.89, 180.59, 183.78, 187.45, 190.99, 191.2, 192.6, 193.74, 196.46, 201.24, 207.71, 212.16, 215.23, 216.67, 217.96, 219.93, 223.27, 226.13, 228.34, 232.89, 236.11, 238.18, 240.68, 254.44, 257.76, 261.38, 265.11, 267.22, 269.35, 270.48, 270.63, 270.92, 272.77, 274.86, 279.15, 279.16, 283.32, 284.88, 290.46, 295, 300.54, 307.34, 314.58, 324.25, 334.6, 344.76, 352.24, 357.43, 358.31, 359.47, 360, 360],
    _west_coeffs: [30.2, 28.4, 25.8, 21.3, 18.3, 19.3, -0.5, -0.4, -0.4, -0.4, -0.5, -0.2, -0.2, -0.6, 0.6, 1.1, 1.2, 1.1, 1.2, 0.9, 0.9, 1, 0.8, 0.8, -0.3, 0.3, 0.8, 1.3, 3.1, 4.6, 6.1, 8.3, 9.7, 11.3, 10.6, 13.8, 15.8, 18.5, 20.1, 20.2, 20.6, 20.8, 19.6, 15.6, 17.6, 19.3, 19.2, 18.3, 18.4, 18.4, 18.4, 19.2, 20.1, 20.8, 22.9, 23.3, 24.3, 30.4, 5.9, 5.9, 6.1, 6.1, 6.3, 10.4, 13.1, 15.5, 21.6, 28.4, 29.6, 29.6, 34.7, 38.5, 45.8, 49.4, 52.3, 54.5, 55.8, 55.9, 54.3, 50, 43.9, 36.8, 35.8, 32.3, 30.2, 0, 0],
    _eastGCMS_knots: [0, 0, 1.8, 3, 4.2, 31.5, 61.2, 64.2, 178, 180, 194.4, 197.5, 198.2, 212.2, 224, 226, 230.5, 240.8, 245.5, 250.1, 252.6, 256, 258.5, 262, 265.4, 271.2, 272.7, 280, 287.6, 297.3, 302.4, 305.9, 310.9, 317.2, 331, 338.4, 340.6, 359.9, 360, 360],
    _eastGCMS_coeffs: [41, 40.9, 39.8, 39.5, 55, 51.7, 57.8, 9, 12, 10.3, 18.7, 18.9, 11.9, 12, 16.5, 12.2, 8.3, 11.6, 12.3, 11.6, 12.2, 7.5, 11.7, 13.9, 10.7, 12.5, 12.2, 15.1, 19.8, 21.6, 27.4, 28.7, 31.1, 35.1, 39.5, 41.4, 50.4, 50.4, 0, 0],

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

    // Time zone as defined in momentjs
    timezoneName: "US/Central"
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
    latitude: 30.67150,

    // Longitude in degrees, +East
    longitude: -104.02281,

    // Altitude above sea level, in metres
    altitude: 2070,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 10,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 89,

    // Lowest limit for unvignetted observations, in degrees
    vignetteLimit: 20,

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

    // Time zone as defined in momentjs
    timezoneName: "US/Central"
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

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 46.6,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 63.4,

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

    // Time zone as defined in momentjs
    timezoneName: "US/Central"
};

/**
 * Configuration for the 17in Kennon Observatory
 */
config["CDK"] = {
    // Name of the observatory site
    site: "Kennon Observatory",

    // Full name of the telescope
    name: "Kennon Observatory CDK 17in",

    // Latitude in degrees, +North
    latitude: 34.36425,

    // Longitude in degrees, +East
    longitude: -89.5364444,

    // Altitude above sea level, in metres
    altitude: 150,

    // Background image for plot
    background: "img/telescopes/Kennon.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "CCD": {
            type: "optical",
            fov: 30,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "CCD",

    // Time zone as defined in momentjs
    timezoneName: "US/Central"
};

/**
 * Configuration for the Dark Sky Observatory, Appalachian State University
 */
config["DSO"] = {
    // Name of the observatory site
    site: "Appalachian State University",

    // Full name of the telescope
    name: "Dark Sky Observatory 32in",

    // Latitude in degrees, +North
    latitude: 36.25292,

    // Longitude in degrees, +East
    longitude: -81.41507,

    // Altitude above sea level, in metres
    altitude: 1000,

    // Background image for plot
    background: "img/telescopes/DSO.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "CCD": {
            type: "optical",
            fov: 30,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "CCD",

    // Time zone as defined in momentjs
    timezoneName: "US/Eastern"
};

/**
 * Configuration for the Clarence T. Jones Observatory, University of Tennessee at Chattanooga
 */
config["CTJO"] = {
    // Name of the observatory site
    site: "University of Tennessee at Chattanooga",

    // Full name of the telescope
    name: "Clarence T. Jones Observatory 20.5in",

    // Latitude in degrees, +North
    latitude: 35.01744,

    // Longitude in degrees, +East
    longitude: -85.23533,

    // Altitude above sea level, in metres
    altitude: 225,

    // Background image for plot
    background: "img/telescopes/CTJO.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "default": {
            type: "optical",
            fov: 30,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "default",

    // Time zone as defined in momentjs
    timezoneName: "US/Eastern"
};

/**
 * Configuration for the 2.5m Nordic Optical Telescope.
 */
config["VLT"] = {
    // Name of the observatory site
    site: "Cerro Paranal",

    // Full name of the telescope
    name: "Very Large Telescope 4×8.2m",

    // Latitude in degrees, +North
    latitude: -24.6275,

    // Longitude in degrees, +East
    longitude: -70.404167,

    // Altitude above sea level, in metres
    altitude: 2636,

    // Lowest limit in elevation for observing, in degrees
    lowestLimit: 20,

    // Highest limit in elevation for observing, in degrees
    highestLimit: 87,

    // Background image for plot
    background: "img/telescopes/VLT.jpg",

    // Instrument definitions; fov in arcminutes
    instruments: {
        "default": {
            type: "optical",
            fov: 6.4,
            flip: null
        }
    },

    // When all else fails, what to use?
    defaultInstrument: "default",

    // Time zone as defined in momentjs
    timezoneName: "America/Santiago"
};

/**
 * Configuration for other telescopes (no details).
 */
config["TNG"] = {
    site: "Roque de Los Muchachos",
    name: "Telescopio Nazionale Galileo 3.6m",
    latitude: 28.75411,
    longitude: -17.88910,
    altitude: 2359,
    timezoneName: "Atlantic/Canary"
}
config["La Silla Observatory"] = {
    name: "La Silla Observatory",
    latitude: -29.25586,
    longitude: -70.73889,
    altitude: 2400,
    timezoneName: "America/Santiago"
}
config["W. M. Keck Observatory"] = {
    site: "Mauna Kea",
    name: "Keck Telescopes 2×10m",
    latitude: 19.82638,
    longitude: -155.47441,
    altitude: 4145,
    timezoneName: "US/Hawaii"
}
config["Gemini North"] = {
    site: "Mauna Kea",
    name: "Gemini North 8.1m",
    latitude: 19.82376,
    longitude: -155.46909,
    altitude: 4213,
    timezoneName: "US/Hawaii"
}
config["Gemini South"] = {
    site: "Cerro Pachón",
    name: "Gemini South 8.1m",
    latitude: -30.24068,
    longitude: -70.73654,
    altitude: 2722,
    timezoneName: "America/Santiago"
}
config["Hooker Telescope"] = {
    site: "Mt. Wilson",
    name: "Hooker Telescope 100in",
    latitude: 34.22588,
    longitude: -118.05721,
    altitude: 1742,
    timezoneName: "US/Pacific"
}
config["SALT"] = {
    site: "South African Astronomical Observatory",
    name: "Southern African Large Telescope 9.2m",
    latitude: -32.37588,
    longitude: 20.81083,
    altitude: 1798,
    timezoneName: "Africa/Johannesburg"
}
config["Carlos Sánchez Telescope"] = {
    site: "Teide Observatory",
    name: "Carlos Sánchez Infrared Telescope 1.52m",
    latitude: 28.30049,
    longitude: -16.51086,
    altitude: 2390,
    timezoneName: "Atlantic/Canary"
}
config["1.3m Telescope"] = {
    site: "Skinakas Observatory",
    name: "Skinakas Observatory 1.3m",
    latitude: 35.21180,
    longitude: 24.89901,
    altitude: 1750,
    timezoneName: "Europe/Athens"
}
config["2m Telescope"] = {
    site: "Tautenburg Observatory",
    name: "Tautenburg Observatory 2m",
    latitude: 50.98016,
    longitude: 11.71123,
    altitude: 341,
    timezoneName: "Europe/Berlin"
}