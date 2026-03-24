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
const telescopes = {};

/**
 * Configuration for the 2.5m Nordic Optical Telescope.
 */
telescopes["NOT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "Nordic Optical Telescope 2.5m",

    // Location (island, country)
    location: "La Palma, Spain",

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

    // Parameters for performing astrometry on the skycam image
    skycamParams: {
        url: "http://www.gtc.iac.es/multimedia/netcam/camaraAllSky.jpg",
        zenithX: 326,
        zenithY: 250,
        radius: 320,
        rotation: 35, // 0=North up, 90=North left
        distortPower: 1.05
    },

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
telescopes["WHT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "William Herschel Telescope 4.2m",

    // Location (island, country)
    location: "La Palma, Spain",

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

    // Parameters for performing astrometry on the skycam image
    skycamParams: telescopes["NOT"].skycamParams,

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
telescopes["INT"] = {
    // Name of the observatory site
    site: "Roque de Los Muchachos",

    // Full name of the telescope
    name: "Isaac Newton Telescope 2.5m",

    // Location (island, country)
    location: "La Palma, Spain",

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
        }
        const hmin = Math.asin(0.4812 * (Math.sin(dec * 1.745329251994329576923691e-2))) * 57.29577951308232;
        return Math.max(hmin, 20);
    }],

    // Background image for plot
    background: "img/telescopes/INT.jpg",

    // Parameters for performing astrometry on the skycam image
    skycamParams: telescopes["NOT"].skycamParams,

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
telescopes["CSS 60in"] = {
    // Name of the observatory site
    site: "Mt. Lemmon",

    // Full name of the telescope
    name: "Catalina Sky Survey 60in Survey Telescope",

    // Location (state, country)
    location: "Arizona, United States",

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
telescopes["WIRO"] = {
    // Name of the observatory site
    site: "Jelm Mt.",

    // Full name of the telescope
    name: "Wyoming Infrared Observatory 2.3m",

    // Location (state, country)
    location: "Wyoming, United States",

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
telescopes["CAHA"] = {
    // Name of the observatory site
    site: "Calar Alto Observatory",

    // Full name of the telescope
    name: "CAHA 2.2m",

    // Location (province, country)
    location: "Almería, Spain",

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
        }
        const hmin = Math.asin(0.6049 * (Math.sin(dec * 1.745329251994329576923691e-2))) * 57.29577951308232;
        return Math.max(hmin, 10.9);
    }],

    // Background image for plot
    background: "img/telescopes/CAHA.jpg",

    // Parameters for performing astrometry on the skycam image
    skycamParams: {
        url: "http://www.caha.es/WDXI/ASTMON/images/Johnson_V.png",
        zenithX: 186,
        zenithY: 211,
        radius: 186,
        rotation: 1,
        distortPower: 0.9
    },

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
telescopes["OAJ"] = {
    // Name of the observatory site
    site: "Observatorio Astrofísico de Javalambre",

    // Full name of the telescope
    name: "OAJ 2.5m",

    // Location (province, country)
    location: "Teruel, Spain",

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
telescopes["Subaru"] = {
    // Name of the observatory site
    site: "Mauna Kea",

    // Full name of the Telescope
    name: "Subaru Telescope 8.3m",

    // Location (state, country)
    location: "Hawaii, United States",

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
            flip: null
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
};

/**
 * Configuration for the 2.7m Harlan J. Smith Telescope.
 */
telescopes["HJST"] = {
    // Name of the observatory site
    site: "Mt. Locke, McDonald Observatory",

    // Full name of the telescope
    name: "Harlan J. Smith Telescope 2.7m",

    // Location (state, country)
    location: "Texas, United States",

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
        const spline = helper.bspleval(
            az,
            telescopes["HJST"].interpOrder,
            west ? telescopes["HJST"].westKnots : (instr === "GCMS" ? telescopes["HJST"].eastGCMSKnots : telescopes["HJST"].eastKnots),
            west ? telescopes["HJST"].westCoeffs : (instr === "GCMS" ? telescopes["HJST"].eastGCMSCoeffs : telescopes["HJST"].eastCoeffs));
        if (west) {
            // Extra constraint from mount
            const tanLat = Math.tan(sla.d2r * telescopes["HJST"].latitude);
            const extra = az.map(function (x) {
                return 10 + (90 - Math.sign(x) * x) * tanLat;
            });
            for (let i = 0; i < az.length; i += 1) {
                if (spline[i] < extra[i]) {
                    spline[i] = extra[i];
                }
            }
        }
        return spline;
    }],

    // Private constants for spline interpolation
    interpOrder: 1,
    eastKnots: [0, 0, 0.06, 0.42, 0.6, 1.54, 3.13, 4.27, 7.5, 8.95, 10.2, 14.9, 17.31, 20.5, 25.7, 30.9, 38.4, 43.2, 47.9, 52.7, 58.6, 65.9, 71, 72, 72.6, 74, 74.5, 75, 75.8, 76.7, 79.27, 79.88, 83.54, 89.99, 90, 91, 93.42, 97.91, 101.14, 112.04, 113.98, 119.74, 121.44, 123.32, 127.45, 133.53, 139.42, 145.03, 150.81, 156.83, 162.38, 167.32, 171.76, 175.7, 176.95, 179.84, 182.86, 185.41, 190.22, 192.02, 193.82, 195.78, 197.25, 199.11, 201.5, 204.58, 207.59, 210.59, 214.05, 217.87, 222.63, 227, 231.9, 237.16, 243.47, 249.48, 257.15, 263.82, 268.46, 278.25, 286.48, 292.16, 298.58, 304.05, 309.86, 314.21, 318.77, 322.7, 326.62, 330.32, 333.29, 336.69, 340.65, 345.67, 349.18, 352.45, 355.81, 355.9, 357.32, 358.4, 359.44, 359.64, 359.81, 359.87, 359.96, 359.99, 359.99, 360, 360],
    eastCoeffs: [34.9, 31.2, 35.9, 37, 37.6, 38.9, 39.4, 45.4, 44.3, 47.7, 50.2, 50, 52.2, 53, 54.8, 55.5, 54.5, 53.9, 52.8, 50.8, 46.4, 41.2, 39, 38.4, 37.3, 39.1, 31, 30.2, 29.4, 26.8, -0.1, -0.1, -0, -1, -1, -0.1, 0.4, 0.5, 10.4, 7.1, 5.6, 10, 16.8, 20.8, 22.1, 22.4, 22.9, 22.6, 20.9, 18.8, 16.5, 14.1, 11.6, 10.3, 14.3, 13.4, 12.4, 9.6, 7.1, 5.4, 3.4, 1.5, 0.4, 0, 0.5, 0.2, 0.3, 0.2, 0.3, 0.4, 0.5, 0, 0.4, 0.4, 0.3, 0.6, 0.4, -1.5, 0.4, 0.3, 0.3, 0.2, 0.1, 0.3, 0.1, 0.2, 0.2, 0.1, 0.3, 0.3, 0.9, 2.2, 8.2, 11.4, 15.3, 21.1, 19, 20.9, 24.1, 28.7, 29.1, 33.1, 29.8, 34.6, 32.5, 30.6, 34.9, 0, 0],
    westKnots: [0, 0, 0.44, 0.93, 3.44, 4.26, 4.64, 16.69, 25.99, 33.64, 41.11, 47.29, 54.28, 60.02, 65.51, 75.36, 84.74, 90.77, 102.83, 110.52, 119.41, 126.66, 138.31, 143, 147.09, 151.77, 155.08, 158.9, 161.43, 163.54, 165.36, 167.4, 170.33, 172.75, 175.48, 177.89, 180.59, 183.78, 187.45, 190.99, 191.2, 192.6, 193.74, 196.46, 201.24, 207.71, 212.16, 215.23, 216.67, 217.96, 219.93, 223.27, 226.13, 228.34, 232.89, 236.11, 238.18, 240.68, 254.44, 257.76, 261.38, 265.11, 267.22, 269.35, 270.48, 270.63, 270.92, 272.77, 274.86, 279.15, 279.16, 283.32, 284.88, 290.46, 295, 300.54, 307.34, 314.58, 324.25, 334.6, 344.76, 352.24, 357.43, 358.31, 359.47, 360, 360],
    westCoeffs: [30.2, 28.4, 25.8, 21.3, 18.3, 19.3, -0.5, -0.4, -0.4, -0.4, -0.5, -0.2, -0.2, -0.6, 0.6, 1.1, 1.2, 1.1, 1.2, 0.9, 0.9, 1, 0.8, 0.8, -0.3, 0.3, 0.8, 1.3, 3.1, 4.6, 6.1, 8.3, 9.7, 11.3, 10.6, 13.8, 15.8, 18.5, 20.1, 20.2, 20.6, 20.8, 19.6, 15.6, 17.6, 19.3, 19.2, 18.3, 18.4, 18.4, 18.4, 19.2, 20.1, 20.8, 22.9, 23.3, 24.3, 30.4, 5.9, 5.9, 6.1, 6.1, 6.3, 10.4, 13.1, 15.5, 21.6, 28.4, 29.6, 29.6, 34.7, 38.5, 45.8, 49.4, 52.3, 54.5, 55.8, 55.9, 54.3, 50, 43.9, 36.8, 35.8, 32.3, 30.2, 0, 0],
    eastGCMSKnots: [0, 0, 1.8, 3, 4.2, 31.5, 61.2, 64.2, 178, 180, 194.4, 197.5, 198.2, 212.2, 224, 226, 230.5, 240.8, 245.5, 250.1, 252.6, 256, 258.5, 262, 265.4, 271.2, 272.7, 280, 287.6, 297.3, 302.4, 305.9, 310.9, 317.2, 331, 338.4, 340.6, 359.9, 360, 360],
    eastGCMSCoeffs: [41, 40.9, 39.8, 39.5, 55, 51.7, 57.8, 9, 12, 10.3, 18.7, 18.9, 11.9, 12, 16.5, 12.2, 8.3, 11.6, 12.3, 11.6, 12.2, 7.5, 11.7, 13.9, 10.7, 12.5, 12.2, 15.1, 19.8, 21.6, 27.4, 28.7, 31.1, 35.1, 39.5, 41.4, 50.4, 50.4, 0, 0],

    // Background image for plot
    background: "img/telescopes/HJST.jpg",

    // Parameters for performing astrometry on the skycam image
    skycamParams: {
        url: "http://monet-n-sky.as.utexas.edu/jpg/1/image.jpg",
        zenithX: 339,
        zenithY: 254,
        radius: 288,
        rotation: -7,
        distortPower: 0.5
    },

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
telescopes["OST"] = {
    // Name of the observatory site
    site: "Mt. Locke, McDonald Observatory",

    // Full name of the telescope
    name: "Otto Struve Telescope 2.1m",

    // Location (state, country)
    location: "Texas, United States",

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

    // Parameters for performing astrometry on the skycam image
    skycamParams: telescopes["HJST"].skycamParams,

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
telescopes["HET"] = {
    // Name of the observatory site
    site: "Mt. Fowlkes, McDonald Observatory",

    // Full name of the telescope
    name: "Hobby-Eberly Telescope 10m",

    // Location (state, country)
    location: "Texas, United States",

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

    // Parameters for performing astrometry on the skycam image
    skycamParams: telescopes["HJST"].skycamParams,

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
telescopes["CDK"] = {
    // Name of the observatory site
    site: "Kennon Observatory",

    // Full name of the telescope
    name: "Kennon Observatory CDK 17in",

    // Location (state, country)
    location: "Mississippi, United States",

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
telescopes["DSO"] = {
    // Name of the observatory site
    site: "Appalachian State University",

    // Full name of the telescope
    name: "Dark Sky Observatory 32in",

    // Location (state, country)
    location: "North Carolina, United States",

    // Latitude in degrees, +North
    latitude: 36.25292,

    // Longitude in degrees, +East
    longitude: -81.41507,

    // Altitude above sea level, in metres
    altitude: 1000,

    // Background image for plot
    background: "img/telescopes/DSO.jpg",

    // Parameters for performing astrometry on the skycam image
    skycamParams: {
        url: "https://dsoftp.appstate.edu/dsoftp/NewSite/dsoftp/Webcams/DSO-AllSky-CurrentImage.JPG",
        zenithX: 314,
        zenithY: 235,
        radius: 294,
        rotation: 67,
        distortPower: 1.05
    },

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
telescopes["CTJO"] = {
    // Name of the observatory site
    site: "University of Tennessee at Chattanooga",

    // Full name of the telescope
    name: "Clarence T. Jones Observatory 20.5in",

    // Location (state, country)
    location: "Tennessee, United States",

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
telescopes["VLT"] = {
    // Name of the observatory site
    site: "Cerro Paranal",

    // Full name of the telescope
    name: "Very Large Telescope 4×8.2m",

    // Country
    location: "Chile",

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
telescopes["TNG"] = {
    site: "Roque de Los Muchachos",
    name: "Telescopio Nazionale Galileo 3.6m",
    location: "La Palma, Spain",
    latitude: 28.75411,
    longitude: -17.88910,
    altitude: 2359,
    timezoneName: "Atlantic/Canary"
};
telescopes["Mercator Telescope"] = {
    site: "Roque de Los Muchachos",
    name: "Mercator Telescope 1.2m",
    location: "La Palma, Spain",
    latitude: 28.76240,
    longitude: -17.87849,
    altitude: 2331,
    timezoneName: "Atlantic/Canary"
};
telescopes["GTC"] = {
    site: "Roque de Los Muchachos",
    name: "Gran Telescopio Canarias 10.4m",
    location: "La Palma, Spain",
    latitude: 28.75666,
    longitude: -17.89200,
    altitude: 2267,
    timezoneName: "Atlantic/Canary"
};
telescopes["LBT"] = {
    site: "Mt. Graham",
    name: "Large Binocular Telescope 2×8.4m",
    location: "Arizona, United States",
    latitude: 32.70144,
    longitude: -109.88933,
    altitude: 3221,
    timezoneName: "America/Phoenix"
};
telescopes["VATT"] = {
    site: "Mt. Graham",
    name: "Vatican Advanced Technology Telescope 72in",
    location: "Arizona, United States",
    latitude: 32.70126,
    longitude: -109.89207,
    altitude: 3178,
    timezoneName: "America/Phoenix"
};
telescopes["MMT"] = {
    site: "Mt. Hopkins",
    name: "MMT Observatory 6.5m",
    location: "Arizona, United States",
    latitude: 31.68896,
    longitude: -110.88516,
    altitude: 2616,
    timezoneName: "America/Phoenix"
};
telescopes["Hale Telescope"] = {
    site: "Palomar Observatory",
    name: "Hale Telescope 200in",
    location: "California, United States",
    latitude: 33.35629,
    longitude: -116.86490,
    altitude: 1713,
    timezoneName: "US/Pacific"
};
telescopes["Magellan Telescopes"] = {
    site: "Las Campanas Observatory",
    name: "Magellan Telescopes 2×6.5m",
    location: "Chile",
    latitude: -29.01421,
    longitude: -70.69243,
    altitude: 2392,
    timezoneName: "America/Santiago"
};
telescopes["Du Pont Telescope"] = {
    site: "Las Campanas Observatory",
    name: "Du Pont Telescope 2.5m",
    location: "Chile",
    latitude: -29.00744,
    longitude: -70.70396,
    altitude: 2380,
    timezoneName: "America/Santiago"
};
telescopes["Haleakala Observatory"] = {
    name: "Haleakala Observatory",
    location: "Hawaii, United States",
    latitude: 20.70799,
    longitude: -156.25680,
    altitude: 3052,
    timezoneName: "US/Hawaii"
};
telescopes["MPG/ESO"] = {
    site: "La Silla Observatory",
    name: "MPG/ESO Telescope 2.2m",
    location: "Chile",
    latitude: -29.25784,
    longitude: -70.73660,
    altitude: 2375,
    timezoneName: "America/Santiago"
};
telescopes["ESO"] = {
    site: "La Silla Observatory",
    name: "ESO Telescope 3.6m",
    location: "Chile",
    latitude: -29.26100,
    longitude: -70.73160,
    altitude: 2400,
    timezoneName: "America/Santiago"
};
telescopes["NTT"] = {
    site: "La Silla Observatory",
    name: "New Technology Telescope 3.58m",
    location: "Chile",
    latitude: -29.25892,
    longitude: -70.73374,
    altitude: 2375,
    timezoneName: "America/Santiago"
};
telescopes["W. M. Keck Observatory"] = {
    site: "Mauna Kea",
    name: "Keck Telescopes 2×10m",
    location: "Hawaii, United States",
    latitude: 19.82638,
    longitude: -155.47441,
    altitude: 4145,
    timezoneName: "US/Hawaii"
};
telescopes["Gemini North"] = {
    site: "Mauna Kea",
    name: "Gemini North 8.1m",
    location: "Hawaii, United States",
    latitude: 19.82376,
    longitude: -155.46909,
    altitude: 4213,
    timezoneName: "US/Hawaii"
};
telescopes["CFHT"] = {
    site: "Mauna Kea",
    name: "Canada–France–Hawaii Telescope 3.58m",
    location: "Hawaii, United States",
    latitude: 19.82523,
    longitude: -155.46892,
    altitude: 4204,
    timezoneName: "US/Hawaii"
};
telescopes["UKIRT"] = {
    site: "Mauna Kea",
    name: "United Kingdom Infra-Red Telescope 3.8m",
    location: "Hawaii, United States",
    latitude: 19.82244,
    longitude: -155.47037,
    altitude: 4194,
    timezoneName: "US/Hawaii"
};
telescopes["Gemini South"] = {
    site: "Cerro Pachón",
    name: "Gemini South 8.1m",
    location: "Chile",
    latitude: -30.24068,
    longitude: -70.73654,
    altitude: 2722,
    timezoneName: "America/Santiago"
};
telescopes["TAO"] = {
    site: "Cerro Chajnantor",
    name: "Tokyo Atacama Observatory 6.5m",
    location: "Chile",
    latitude: -22.98607,
    longitude: -67.74214,
    altitude: 5640,
    timezoneName: "America/Santiago"
};
telescopes["LSST"] = {
    site: "Cerro Pachón",
    name: "Vera C. Rubin Observatory 8.4m",
    location: "Chile",
    latitude: -30.24464,
    longitude: -70.74933,
    altitude: 2672,
    timezoneName: "America/Santiago"
};
telescopes["SOAR"] = {
    site: "Cerro Pachón",
    name: "SOAR Telescope 4.1m",
    location: "Chile",
    latitude: -30.23790,
    longitude: -70.73353,
    altitude: 2738,
    timezoneName: "America/Santiago"
};
telescopes["Blanco 4m"] = {
    site: "Cerro Tololo",
    name: "Victor M. Blanco Telescope 4m",
    location: "Chile",
    latitude: -30.16974,
    longitude: -70.80649,
    altitude: 2207,
    timezoneName: "America/Santiago"
};
telescopes["Hooker Telescope"] = {
    site: "Mt. Wilson",
    name: "Hooker Telescope 100in",
    location: "California, United States",
    latitude: 34.22588,
    longitude: -118.05721,
    altitude: 1742,
    timezoneName: "US/Pacific"
};
telescopes["Shane Telescope"] = {
    site: "Lick Observatory",
    name: "Shane Telescope 120in",
    location: "California, United States",
    latitude: 37.34308,
    longitude: -121.63715,
    altitude: 1283,
    timezoneName: "US/Pacific"
};
telescopes["SALT"] = {
    site: "South African Astronomical Observatory",
    name: "Southern African Large Telescope 9.2m",
    location: "Sutherland, South Africa",
    latitude: -32.37588,
    longitude: 20.81083,
    altitude: 1837,
    timezoneName: "Africa/Johannesburg"
};
telescopes["Radcliffe Telescope"] = {
    site: "South African Astronomical Observatory",
    name: "Radcliffe Telescope 74in",
    location: "Sutherland, South Africa",
    latitude: -32.37895,
    longitude: 20.81168,
    altitude: 1798,
    timezoneName: "Africa/Johannesburg"
};
telescopes["Carlos Sánchez Telescope"] = {
    site: "Teide Observatory",
    name: "Carlos Sánchez Infrared Telescope 1.52m",
    location: "Tenerife, Spain",
    latitude: 28.30049,
    longitude: -16.51086,
    altitude: 2390,
    timezoneName: "Atlantic/Canary"
};
telescopes["ESA OGS"] = {
    site: "Teide Observatory",
    name: "ESA Optical Ground Station 1m",
    location: "Tenerife, Spain",
    latitude: 28.30097,
    longitude: -16.51180,
    altitude: 2400,
    timezoneName: "Atlantic/Canary"
};
telescopes["IAC80"] = {
    site: "Teide Observatory",
    name: "IAC80 Telescope 0.8m",
    location: "Tenerife, Spain",
    latitude: 28.29966,
    longitude: -16.51101,
    altitude: 2381,
    timezoneName: "Atlantic/Canary"
};
telescopes["Skinakas Observatory"] = {
    name: "Skinakas Observatory 1.3m",
    location: "Crete, Greece",
    latitude: 35.21180,
    longitude: 24.89901,
    altitude: 1750,
    timezoneName: "Europe/Athens"
};
telescopes["Kryoneri Observatory"] = {
    name: "Kryoneri Observatory 1.3m",
    location: "Greece",
    latitude: 37.97194,
    longitude: 22.61860,
    altitude: 930,
    timezoneName: "Europe/Athens"
};
telescopes["Tautenburg Observatory"] = {
    name: "Tautenburg Observatory 2m",
    location: "Thüringen, Germany",
    latitude: 50.98016,
    longitude: 11.71123,
    altitude: 341,
    timezoneName: "Europe/Berlin"
};
telescopes["AAT"] = {
    site: "Siding Spring Observatory",
    name: "Anglo-Australian Telescope 3.9m",
    location: "New South Wales, Australia",
    latitude: -31.27539,
    longitude: 149.06721,
    altitude: 1164,
    timezoneName: "Australia/Sydney"
};
telescopes["Armagh Observatory"] = {
    name: "Armagh Observatory",
    location: "Northern Ireland, United Kingdom",
    latitude: 54.35211,
    longitude: -6.64855,
    altitude: 61,
    timezoneName: "Europe/Belfast"
};
telescopes["ARC"] = {
    site: "Apache Point Observatory",
    name: "ARC 3.5m",
    location: "New Mexico, United States",
    latitude: 32.78038,
    longitude: -105.82040,
    altitude: 2788,
    timezoneName: "America/Denver"
};
telescopes["SDSS"] = {
    site: "Apache Point Observatory",
    name: "SDSS 2.5m",
    location: "New Mexico, United States",
    latitude: 32.77959,
    longitude: -105.82037,
    altitude: 2788,
    timezoneName: "America/Denver"
};
telescopes["Seimei Telescope"] = {
    site: "Okayama Observatory",
    name: "Seimei Telescope 3.8m",
    location: "Japan",
    latitude: 34.57687,
    longitude: 133.59669,
    altitude: 372,
    timezoneName: "Asia/Tokyo"
};
telescopes["Mayall Telescope"] = {
    site: "Kitt Peak",
    name: "Mayall Telescope 4m",
    location: "Arizona, United States",
    latitude: 31.96418,
    longitude: -111.59998,
    altitude: 2120,
    timezoneName: "America/Phoenix"
};
telescopes["Bok Telescope"] = {
    site: "Kitt Peak",
    name: "Bok Telescope 90in",
    location: "Arizona, United States",
    latitude: 31.963127,
    longitude: -111.60019,
    altitude: 2031,
    timezoneName: "America/Phoenix"
};
telescopes["OSN"] = {
    site: "Sierra Nevada Observatory",
    name: "OSN 1.5m",
    location: "Granada, Spain",
    latitude: 37.06289,
    longitude: -3.38607,
    altitude: 2896,
    timezoneName: "Europe/Madrid"
};
telescopes["VISTA"] = {
    site: "Cerro Paranal",
    name: "VISTA 4.1m",
    location: "Chile",
    latitude: -24.61590,
    longitude: -70.39749,
    altitude: 2518,
    timezoneName: "America/Santiago"
};
telescopes["Wise Observatory"] = {
    name: "Wise Observatory 1m",
    location: "Israel",
    latitude: 30.59737,
    longitude: 34.76217,
    altitude: 875,
    timezoneName: "Asia/Jerusalem"
};
telescopes["TRAPPIST-North"] = {
    site: "Oukaïmeden Observatory",
    name: "TRAPPIST-North 0.6m",
    location: "Morocco",
    latitude: 31.20606,
    longitude: -7.86653,
    altitude: 2750,
    timezoneName: "Africa/Casablanca"
};
telescopes["TRAPPIST-South"] = {
    site: "La Silla Observatory",
    name: "TRAPPIST-South 0.6m",
    location: "Chile",
    latitude: -29.25455,
    longitude: -70.73940,
    altitude: 2313,
    timezoneName: "America/Santiago"
};
telescopes["JS 2.15m"] = {
    site: "Leoncito Astronomical Complex",
    name: "Jorge Sahade Telescope 2.15m",
    location: "Argentina",
    latitude: -31.79865,
    longitude: -69.29568,
    altitude: 2483,
    timezoneName: "America/Argentina/San_Juan"
};
telescopes["AlbaNova"] = {
    site: "Stockholms universitet",
    name: "AlbaNova Telescope 0.8m",
    location: "Sweden",
    latitude: 59.35344,
    longitude: 18.05784,
    altitude: 36,
    timezoneName: "Europe/Stockholm"
};
telescopes["Brorfelde Observatory"] = {
    name: "Brorfelde Observatory 77cm",
    location: "Denmark",
    latitude: 55.62466,
    longitude: 11.66522,
    altitude: 60,
    timezoneName: "Europe/Copenhagen"
};
telescopes["MOA Telescope 1.8m"] = {
    site: "Mt. John Observatory",
    name: "MOA Telescope 1.8m",
    location: "New Zealand",
    latitude: -43.98520,
    longitude: 170.46408,
    altitude: 1029,
    timezoneName: "Pacific/Auckland"
};
telescopes["Valongo Observatory"] = {
    name: "Valongo Observatory 0.42m",
    location: "Brazil",
    latitude: -22.89849,
    longitude: -43.18669,
    altitude: 23,
    timezoneName: "America/Sao_Paulo"
};
telescopes["Sertão de Itaparica Observatory"] = {
    name: "Sertão de Itaparica Observatory 1m",
    location: "Brazil",
    latitude: -8.79220,
    longitude: -38.68859,
    altitude: 390,
    timezoneName: "America/Sao_Paulo"
};
telescopes["Pico dos Dias Observatory"] = {
    name: "Pico dos Dias Observatory 1.6m",
    location: "Brazil",
    latitude: -22.53494,
    longitude: -45.58312,
    altitude: 1864,
    timezoneName: "America/Sao_Paulo"
};
telescopes["Observatorio Astronómico Nacional, Mexico"] = {
    name: "Observatorio Astronómico Nacional 2.1m",
    location: "Baja California, Mexico",
    latitude: 31.04412,
    longitude: -115.46365,
    altitude: 2830,
    timezoneName: "America/Tijuana"
};
telescopes["Guillermo Haro Observatory"] = {
    name: "Guillermo Haro Observatory 2.1m",
    location: "Sonora, Mexico",
    latitude: 31.05311,
    longitude: -110.38385,
    altitude: 2480,
    timezoneName: "America/Hermosillo"
};
telescopes["Byurakan Observatory"] = {
    name: "Byurakan Observatory 2.6m",
    location: "Armenia",
    latitude: 40.33029,
    longitude: 44.27338,
    altitude: 1406,
    timezoneName: "Asia/Yerevan"
};
telescopes["Lulin Observatory"] = {
    name: "Lulin Observatory 1m",
    location: "Taiwan",
    latitude: 23.46937,
    longitude: 120.87264,
    altitude: 2862,
    timezoneName: "Asia/Taipei"
};
telescopes["LAMOST"] = {
    site: "Xinglong Station",
    name: "LAMOST 4m",
    location: "China",
    latitude: 40.39562,
    longitude: 117.57583,
    altitude: 960,
    timezoneName: "Asia/Shanghai"
};
telescopes["Lijiang Telescope"] = {
    site: "Yunnan Observatory",
    name: "Lijiang Telescope 2.4m",
    location: "China",
    latitude: 26.69507,
    longitude: 100.02985,
    altitude: 2014,
    timezoneName: "Asia/Shanghai"
};
telescopes["Ali Observatory"] = {
    name: "Ali Observatory",
    location: "Tibet, China",
    latitude: 32.32541,
    longitude: 80.02690,
    altitude: 5035,
    timezoneName: "Asia/Shanghai"
};
telescopes["INO340"] = {
    site: "Iranian National Observatory",
    name: "INO340 3.4m",
    location: "Iran",
    latitude: 33.67392,
    longitude: 51.31857,
    altitude: 3572,
    timezoneName: "Asia/Tehran"
};
telescopes["BTA-6"] = {
    site: "Special Astrophysical Observatory",
    name: "BTA-6 6m",
    location: "Russia",
    latitude: 43.64666,
    longitude: 41.44069,
    altitude: 2070,
    timezoneName: "Europe/Moscow"
};
telescopes["Pulkovo Observatory"] = {
    name: "Pulkovo Observatory",
    location: "Russia",
    latitude: 59.77181,
    longitude: 30.32615,
    altitude: 81,
    timezoneName: "Europe/Moscow"
};
telescopes["Sharjah Astronomical Observatory"] = {
    name: "Sharjah Astronomical Observatory",
    location: "Dubai, United Arab Emirates",
    latitude: 25.28257,
    longitude: 55.46202,
    altitude: 17,
    timezoneName: "Asia/Dubai"
};
telescopes["Tien Shan Astronomical Observatory"] = {
    name: "Tien Shan Astronomical Observatory 1m",
    location: "Kazakhstan",
    latitude: 43.05725,
    longitude: 76.97180,
    altitude: 2735,
    timezoneName: "Asia/Almaty"
};
telescopes["AZT-20"] = {
    site: "Assy-Turgen Observatory",
    name: "AZT-20 1.5m",
    location: "Kazakhstan",
    latitude: 43.22485,
    longitude: 77.87101,
    altitude: 2750,
    timezoneName: "Asia/Almaty"
};
telescopes["AZT-24"] = {
    site: "Campo Imperatore Observatory",
    name: "AZT-24 1.1m",
    location: "Abruzzo, Italy",
    latitude: 42.44422,
    longitude: 13.55812,
    altitude: 2154,
    timezoneName: "Europe/Rome"
};
telescopes["MINERVA-Australis"] = {
    site: "Mt. Kent Observatory",
    name: "MINERVA-Australis 4×0.7m",
    location: "Queensland, Australia",
    latitude: -27.79822,
    longitude: 151.85570,
    altitude: 682,
    timezoneName: "Australia/Brisbane"
};
telescopes["Mt. Stromlo Observatory"] = {
    name: "Mt. Stromlo Observatory 74in",
    location: "Canberra, Australia",
    latitude: -35.31911,
    longitude: 149.00888,
    altitude: 767,
    timezoneName: "Australia/Sydney"
};
telescopes["CSS 0.7m"] = {
    site: "Mt. Bigelow",
    name: "Catalina Sky Survey 0.7m Schmidt",
    location: "Arizona, United States",
    latitude: 32.41675,
    longitude: -110.73253,
    altitude: 2516,
    timezoneName: "America/Phoenix"
};
telescopes["CSS 40in"] = {
    site: "Mt. Lemmon",
    name: "Catalina Sky Survey 40in Follow-up Telescope",
    location: "Arizona, United States",
    latitude: 32.44257,
    longitude: -110.78889,
    altitude: 2789,
    timezoneName: "America/Phoenix"
};
telescopes["Kuiper Telescope"] = {
    site: "Mt. Bigelow",
    name: "Kuiper Telescope 61in",
    location: "Arizona, United States",
    latitude: 32.41691,
    longitude: -110.73262,
    altitude: 2520,
    timezoneName: "America/Phoenix"
};
telescopes["TNT"] = {
    site: "Thai National Observatory",
    name: "Thai National Telescope 2.4m",
    location: "Thailand",
    latitude: 18.57370,
    longitude: 98.48225,
    altitude: 2457,
    timezoneName: "Asia/Bangkok"
};
telescopes["HCT"] = {
    site: "Indian Astronomical Observatory",
    name: "Himalayan Chandra Telescope 2m",
    location: "India",
    latitude: 32.77962,
    longitude: 78.96384,
    altitude: 4500,
    timezoneName: "Asia/Kolkata"
};
telescopes["Halley's Mount"] = {
    name: "Halley's Mount",
    location: "Saint Helena",
    latitude: -15.96202,
    longitude: -5.69950,
    altitude: 659,
    timezoneName: "Atlantic/St_Helena"
};
telescopes["Dominion Astrophysical Observatory"] = {
    name: "Dominion Astrophysical Observatory 72in",
    location: "British Columbia, Canada",
    latitude: 48.51978,
    longitude: -123.41832,
    altitude: 229,
    timezoneName: "America/Vancouver"
};
telescopes["Observatorio Astronómico Nacional, Colombia"] = {
    name: "Observatorio Astronómico Nacional 20cm",
    location: "Bogotá, Canada",
    latitude: 4.59621,
    longitude: -74.07750,
    altitude: 2555,
    timezoneName: "America/Bogota"
};
telescopes["RTT150"] = {
    site: "TÜBİTAK National Observatory",
    name: "RTT150 1.5m",
    location: "Antalya, Turkey",
    latitude: 36.82550,
    longitude: 30.33534,
    altitude: 2457,
    timezoneName: "Europe/Istanbul"
};
telescopes["Aristarchos Telescope"] = {
    site: "Helmos Observatory",
    name: "Aristarchos Telescope 2.3m",
    location: "Greece",
    latitude: 37.98559,
    longitude: 22.19829,
    altitude: 2340,
    timezoneName: "Europe/Athens"
};
telescopes["TJO"] = {
    site: "Montsec Observatory",
    name: "Joan Oró Telescope 0.8m",
    location: "Lleida, Spain",
    latitude: 42.05164,
    longitude: 0.72966,
    altitude: 1570,
    timezoneName: "Europe/Madrid"
};
telescopes["Rosemary Hill Observatory"] = {
    name: "Rosemary Hill Observatory 30in",
    location: "Florida, United States",
    latitude: 29.4001,
    longitude: -82.5862,
    altitude: 23,
    timezoneName: "US/Eastern"
};
telescopes["Perek Telescope"] = {
    site: "Ondřejov Observatory",
    name: "Perek Telescope 2m",
    location: "Czech Republic",
    latitude: 49.91515,
    longitude: 14.78098,
    altitude: 528,
    timezoneName: "Europe/Prague"
};
telescopes["Kottamia Astronomical Observatory"] = {
    name: "Kottamia Astronomical Observatory 74in",
    location: "Egypt",
    latitude: 29.93406,
    longitude: 31.82772,
    altitude: 450,
    timezoneName: "Africa/Cairo"
};
telescopes["Santa Martina Observatory"] = {
    name: "Santa Martina Observatory",
    location: "Chile",
    latitude: -33.26913,
    longitude: -70.53437,
    altitude: 1449,
    timezoneName: "America/Santiago"
};
telescopes["Piszkéstető Station"] = {
    name: "Piszkéstető Station",
    location: "Hungary",
    latitude: 47.91746,
    longitude: 19.89365,
    altitude: 944,
    timezoneName: "Europe/Budapest"
};
telescopes["Milanković Telescope"] = {
    site: "Vidojevica Astronomical Station",
    name: "Milanković Telescope 1.4m",
    location: "Hungary",
    latitude: 43.14120,
    longitude: 21.55573,
    altitude: 1150,
    timezoneName: "Europe/Belgrade"
};
telescopes["Rozhen Observatory"] = {
    name: "Rozhen Observatory 2m",
    location: "Bulgaria",
    latitude: 41.69316,
    longitude: 24.73894,
    altitude: 1759,
    timezoneName: "Europe/Sofia"
};
telescopes["Haute-Provence Observatory"] = {
    name: "Haute-Provence Observatory 1.93m",
    location: "France",
    latitude: 43.93144,
    longitude: 5.71245,
    altitude: 650,
    timezoneName: "Europe/Paris"
};
telescopes["US Naval Observatory"] = {
    name: "US Naval Observatory 26in",
    location: "Washington, D.C., United States",
    latitude: 38.92096,
    longitude: -77.06704,
    altitude: 81,
    timezoneName: "America/New_York"
};
telescopes["KST"] = {
    site: "US Naval Observatory Flagstaff Station",
    name: "Kaj Strand Telescope 61in",
    location: "Arizona, United States",
    latitude: 35.18404,
    longitude: -111.74065,
    altitude: 2282,
    timezoneName: "America/Phoenix"
};
telescopes["LDT"] = {
    site: "Lowell Observatory",
    name: "Lowell Discovery Telescope 4.3m",
    location: "Arizona, United States",
    latitude: 34.74437,
    longitude: -111.42234,
    altitude: 2360,
    timezoneName: "America/Phoenix"
};
telescopes["Perkins Telescope"] = {
    site: "Lowell Observatory",
    name: "Perkins Telescope 72in",
    location: "Arizona, United States",
    latitude: 35.09705,
    longitude: -111.53680,
    altitude: 2206,
    timezoneName: "America/Phoenix"
};
telescopes["Hall Telescope"] = {
    site: "Lowell Observatory",
    name: "Hall Telescope 42in",
    location: "Arizona, United States",
    latitude: 35.09675,
    longitude: -111.53635,
    altitude: 2206,
    timezoneName: "America/Phoenix"
};
telescopes["GOTO North"] = {
    site: "Roque de Los Muchachos",
    name: "Gravitational-wave Optical Transient Observer 4×0.4m",
    location: "La Palma, Spain",
    latitude: 28.76007,
    longitude: -17.87929,
    altitude: 2300,
    timezoneName: "Atlantic/Canary"
};
telescopes["GOTO South"] = {
    site: "Siding Spring Observatory",
    name: "Gravitational-wave Optical Transient Observer 4×0.4m",
    location: "New South Wales, Australia",
    latitude: -31.27345,
    longitude: 149.06417,
    altitude: 1164,
    timezoneName: "Australia/Sydney"
};
