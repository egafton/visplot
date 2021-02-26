/**
 * @file Configuration file for the NOT.
 * @author Emanuel Gafton
 * @copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
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
    /**
     * Name of the observatory site
     */
    site: "Roque de Los Muchachos",

    /**
     * Latitude in degrees, +North
     */
    latitude: 28.75723,

    /**
     * Longitude in degrees, +East
     */
    longitude: -17.88510,

    /**
     * Altitude above sea level, in metres
     */
    altitude: 2382,

    /**
     * Lowest limit in elevation for observing, in degrees
     */
    lowestLimit: 6,

    /**
     * Lowest limit in elevation for unvignetted observations, in degrees;
     * set to null if not applicable
     */
    vignetteLimit: 35
};

/**
 * Configuration for the William Herschel Telescope.
 */
config["WHT"] = {
    /**
     * Name of the observatory site
     */
    site: "Roque de Los Muchachos",

    /**
     * Latitude in degrees, +North
     */
    latitude: 28.76062,

    /**
     * Longitude in degrees, +East
     */
    longitude: -17.88166,

    /**
     * Altitude above sea level, in metres
     */
    altitude: 2344,

    /**
     * Lowest limit in elevation for observing, in degrees
     */
    lowestLimit: 12,

    /**
     * Lowest limit in elevation for unvignetted observations, in degrees;
     * set to null if not applicable
     */
    vignetteLimit: 25
};

/**
 * Configuration for the Isaac Newton Telescope.
 */
config["INT"] = {
    /**
     * Name of the observatory site
     */
    site: "Roque de Los Muchachos",

    /**
     * Latitude in degrees, +North
     */
    latitude: 28.76209,

    /**
     * Longitude in degrees, +East
     */
    longitude: -17.87761,

    /**
     * Altitude above sea level, in metres
     */
    altitude: 2347,

    /**
     * Lowest limit in elevation for observing, in degrees
     */
    lowestLimit: 20,

    /**
     * Lowest limit in elevation for unvignetted observations, in degrees;
     * set to null if not applicable
     */
    vignetteLimit: 33
};