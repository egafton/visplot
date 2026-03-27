/**
 * @file Configuration file for Visplot.
 * @copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
"use strict";

/**
 * An associative array storing various settings.
 */
/* eslint no-unused-vars: "off" */
const config = {
    graphFont: "Ubuntu, sans-serif",
    graphResolutionTimeAxis: 1000, // number of points on the x-axis
    graphCurrentTimeRefreshInterval: 5000, // ms
    graphCopyright: `© 2016-${new Date().getFullYear()} ega, irl`,
    offlineStrings: [
        "offline",
        "badwolf"
    ],
    skycamTimeRefreshInterval: 500, // ms
    skycamImageRefreshInterval: 30000, // ms
    skycamRequestTimeout: 3000, // ms
    skycamTcsTimeout: 3000, // ms
    skycamTcsCrosshairColor: "#9f3",
    skycamImageSizeX: 640, // px
    skycamImageSizeY: 480, // px
    skycamProxy: function(url) {
        return `${window.baseurl}skycam_proxy.php?url=${encodeURIComponent(url)}`;
    },
    stdPressure: 1013.25, // hPa
    stdTemperature: 298.15, // K, 15 deg
    gravAcceleration: 9.80665, // m/s^2
    molarMass: 0.0289644, // kg/mol
    gasConstant: 8.31446, // J/(mol*K)
    refractionTLR: -0.0065, // temperature lapse rate, K/m
    refractionWavelength: 0.55, // microns
    refractionHumidity: 0.2, // 0-1
    zipContent: "visplot.txt", // name of file inside zip archive
    zipName: "schedule.visplot", // name of zip archive
    zipOptions: {
        mimeType: "application/octet-stream",
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }
    },
    githubURL: "https://github.com/egafton/visplot",
    githubAPIURL: "https://api.github.com/repos/egafton/visplot",
    defaultTelescopeName: "NOT",
    defaultTelescopeImage: "img/telescopes/default.jpg",
    defaultEpoch: 2000, // Julian year
    defaultObstime: 600, // s
    defaultMaxAirmass: 2,
    defaultType: "Staff",
    allowedTypes: ["Monitor", "ToO", "SoftToO", "Payback", "Fast-Track", "Service", "CATService", "Visitor", "Staff"],
    defaultFillColors: {
        "Monitor": "orange",
        "ToO": "#FF9900",
        "SoftToO": "#FFFF99",
        "Payback": "blue",
        "Fast-Track": "blue",
        "Service": "blue",
        "CATService": "blue",
        "Visitor": "blue",
        "Staff": "blue"
    },
    defaultTextColors: {
        "Monitor": "black",
        "ToO": "black",
        "SoftToO": "black",
        "Payback": "white",
        "Fast-Track": "white",
        "Service": "white",
        "CATService": "white",
        "Visitor": "white",
        "Staff": "white"
    },
    defaultSkyPA: 0, // deg
    defaultPriority: 1,
    defaultInstrumentList: {
        default: {
            fov: 6, // arcmin
            type: "optical",
            flip: null
        }
    },
    defaultInstrument: "default",
    defaultProject: function(tel) {
        return tel === "HJST" ? "223-2701" : (tel === "OST" ? "223-2101" : ( tel === "HET" ? "UT223-001" : "65-199"));
    },
    defaultWPriority: 2,
    defaultWUrgency: 1,
    defaultWAltitude: 1,
    defaultWSlewing: 1,
    nightCutoff: 10, // if local hour is smaller, show the plot for previous night by default
    planets: ["mercury", "venus", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"], // celestial bodies for which sla.rdplan works (exclude the Sun at night...)
    aladinDefaultSettings: {
        target: `0.0 0.0`,
        survey: "P/DSS2/color",
        fov: 0.1, // deg
        pa: 0,
        flip: null,
        reticle: true,
        showZoomControl: true,
        showFullscreenControl: false,
        showLayersControl: false,
        showGotoControl: false,
        reticleColor: "rgb(144, 238, 144)"
    },
    aladinOpticalSurvey: "P/DSS2/color",
    aladinInfraredSurvey: "P/2MASS/color",
    simbadCoordsRegex: String.raw`Coordinates\(ICRS.*?\):\s+(\d+)\s+(\d+)\s+([\d\.]+)\s+([+\-\d]+)\s+(\d+)\s+([\d\.]+)`,
    simbadPMRegex: String.raw`Proper motions:\s+([+\-\d\.]+)\s+([+\-\d\.]+)`,
    simbadURL: function(identifier) {
        return `https://simbad.cds.unistra.fr/simbad/sim-id?output.format=ASCII&Ident=${encodeURIComponent(identifier)}`;
    },
    simbadTimeout: 3000, // ms
    horizonsURL: function(params) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            query.append(key, value);
        }
        return `${window.baseurl}horizons_proxy.php?${query.toString()}`;
    },
    horizonsTimeout: 5000, // ms
    mbCacheKey: "majorBodiesCache",
    mbCacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    mapAPIKey: "def7cfdebee03cd500fbdbcfc8c48e90",
    mapTileSource: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    mapTileSettings: {
        minZoom: 2,
        maxZoom: 19,
        attribution: "",
        noWrap: true
    },
    mapWorldBounds: [
        [-90, -180], // deg
        [90, 180] // deg
    ],
    mapInitialView: [21, 5],
    mapInitialZoom: 2,
    mapMaxClusterRadius: 40, // px
    mapRedPinURL: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    mapBluePinURL: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    mapShadowPinURL: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    mapSunIcon: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Sun_icon.svg",
    mapTerminatorRefreshInterval: 2000, // ms
    mapTwilights: [
        {name: "night", alt: 0, color: '#000', opacity: 0.3},
        {name: "civil", alt: -6, color: '#000', opacity: 0.25},
        {name: "nautical", alt: -12, color: '#000', opacity: 0.2},
        {name: "astronomical", alt: -18, color: '#000', opacity: 0.15}
    ],
    mapEquatorStyle: {
        color: '#ffff88',
        opacity: 0.5,
        weight: 2,
        dashArray: [3, 3]
    },
    mapTropicsStyle: {
        color: '#ffffee',
        opacity: 0.5,
        weight: 2,
        dashArray: [3, 3]
    },
    axialTilt: 23.4394, // deg
    blanksNorthern: [
        "Blank00+06 00:06:57.17 +06:06:22.2",
        "Blank01+06 01:08:41.88 +06:23:43.5",
        "Blank01+14 01:35:06.00 +14:33:23.4",
        "Blank02+05 02:01:10.30 +05:06:56.2",
        "Blank02+14 02:14:26.26 +14:01:23.9",
        "Blank02+19 02:56:21.26 +19:38:41.3",
        "Blank03+31 03:33:31.70 +31:02:59.3",
        "Blank04+28 04:13:56.14 +28:08:33.0",
        "Blank04+24 04:26:38.69 +24:39:00.4",
        "Blank05+00 05:47:22.73 +00:24:17.3",
        "Blank08+24 08:52:36.48 +24:43:42.2",
        "Blank09+74 09:08:21.12 +74:08:07.4",
        "Blank09+24 09:58:19.68 +24:59:11.4",
        "Blank10+33 10:30:25.20 +33:15:35.6",
        "Blank11+22 11:00:32.64 +22:03:55.4",
        "Blank11+13 11:33:39.12 +13:26:35.9",
        "Blank11+27 11:54:07.92 +27:00:19.1",
        "Blank12+21 12:41:44.40 +21:58:48.7",
        "Blank12+17 12:56:12.72 +17:26:49.2",
        "Blank13+24 13:34:05.52 +24:56:42.0",
        "Blank14+35 14:02:58.08 +35:11:28.7",
        "Blank14+31 14:22:46.32 +31:53:33.4",
        "Blank14+43 14:55:08.16 +43:30:10.4",
        "Blank15+26 15:31:05.76 +26:15:17.6",
        "Blank18+00 18:28:53.76 +00:03:40.3",
        "Blank23+00 23:22:00.72 +00:38:05.8"
    ],
    blanksSouthern: [
        "Blank00-16 00:06:00.55 -16:15:04.3",
        "Blank00-11 00:59:31.22 -11:20:16.4",
        "Blank01-32 01:39:26.57 -32:50:56.8",
        "Blank02-13 02:33:30.00 -13:25:28.2",
        "Blank03-38 03:08:50.59 -38:38:24.0",
        "Blank03-20 03:36:06.19 -20:58:11.3",
        "Blank04-38 04:02:24.96 -38:14:34.1",
        "Blank04-15 04:20:04.90 -15:16:00.5",
        "Blank05-08 05:41:55.18 -08:27:23.4",
        "Blank09-07 09:12:00.00 -07:50:50.0",
        "Blank11-77 11:05:33.84 -77:46:21.7",
        "Blank11-01 11:23:08.16 -01:42:10.3",
        "Blank11-03 11:58:47.28 -03:42:52.4",
        "Blank12-00 12:19:55.20 -00:09:51.1",
        "Blank13-10 13:38:06.24 -10:44:17.5",
        "Blank15-34 15:42:55.44 -34:06:39.6",
        "Blank15-04 15:53:31.92 -04:42:22.8",
        "Blank16-24 16:27:41.76 -24:45:20.9",
        "Blank16-15 16:50:49.68 -15:22:04.8",
        "Blank18-03 18:28:03.12 -03:49:55.9",
        "Blank22-47 22:58:27.84 -47:34:36.8",
        "Blank23-03 23:40:51.12 -03:53:58.6"
    ],
    standardsNorthern: [
        "HD19445    03:08:25.6/-0.22 +26:19:51/-0.83",
        "GD71       05:52:27.51      +15:53:16.6",
        "Hiltner600 06:45:13.37      +02:08:14.7",
        "He3/GJ246  06:47:37.99      +37:30:57.1",
        "HD84937    09:48:56.1       +13:44:39",
        "Feige34    10:39:36.7       +43:06:09",
        "HD93521    10:48:23.5       +37:34:13",
        "GD153      12:57:02.34      +22:01:52.7",
        "BD+262606  14:49:02.4       +25:42:09",
        "BD+332642  15:51:59.9       +32:56:53",
        "Wolf1346   20:34:21.9       +25:03:50",
        "BD+174708  22:11:31.4       +18:05:34",
        "Feige110   23:19:58.4       -05:09:57"
    ],
    standardsSouthern: [
        "G158-100   00:33:54.32 -12:07:57.1",
        "CD-34d241  00:41:46.92 -33:39:08.5",
        "BPM16274   00:50:03.18 -52:08:17.4",
        "LTT1020    01:54:49.68 -27:28:29.7",
        "EG21       03:10:30.98 -68:36:02.2",
        "LTT1788    03:48:22.17 -39:08:33.6",
        "GD50       03:48:50.06 -00:58:30.4",
        "SA95-42    03:53:43.67 -00:04:33.0",
        "HZ4        03:55:21.70 +09:47:18.7",
        "LB227      04:09:28.76 +17:07:54.4",
        "HZ2        04:12:43.51 +11:51:50.4",
        "GD71       05:52:27.51 +15:53:16.6",
        "LTT2415    05:56:24.30 -27:51:28.8",
        "HILT600    06:45:13.33 +02:08:14.1",
        "HD49798    06:48:04.64 -44:18:59.3",
        "HD60753    07:33:27.26 -50:35:03.7",
        "LTT3218    08:41:32.37 -32:56:32.9",
        "GD108      10:00:47.33 -07:33:31.2",
        "LTT3864    10:32:13.90 -35:37:42.4",
        "LTT4364    11:45:42.92 -64:50:29.5",
        "Feige56    12:06:47.25 +11:40:12.7",
        "LTT4816    12:38:50.94 -49:47:58.8",
        "Feige67    12:41:51.83 +17:31:20.5",
        "G60-54     13:00:09.53 +03:28:55.7",
        "CD-32d9927 14:11:46.37 -33:03:14.3",
        "LTT6248    15:39:00.02 -28:35:33.1",
        "EG274      16:23:33.75 -39:13:47.5",
        "G138-31    16:27:53.59 +09:12:24.5",
        "LTT7379    18:36:26.29 -44:18:33.0",
        "LTT7987    20:10:57.38 -30:13:01.2",
        "G24-9      20:13:56.05 +06:42:55.2",
        "LDS749B    21:32:15.75 +00:15:13.6",
        "G93-48     21:52:25.33 +02:23:24.3",
        "NGC7293    22:29:38.46 -20:50:13.3",
        "LTT9239    22:52:40.88 -20:35:26.3",
        "LTT9491    23:19:34.98 -17:05:29.8",
        "Feige110   23:19:58.39 -05:09:55.8"
    ]
};
