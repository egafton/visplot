/**
 * @copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
"use strict";

/**
 * @class
 * @constructor
 */
function Driver() {
    try {
        helper.LogSuccess(`Hello, this is Visplot version ${window.version}`);

        /* HTML5 canvas, context and Graph class - related variables */
        this.canvas = document.getElementById("canvasFrame");
        this.context = this.canvas.getContext("2d");
        this.graph = new Graph();
        window.requestAnimationFrame(() => {
            driver.Refresh();
        });

        this.skyCanvas = document.getElementById("canvasSkycam");
        this.skyContext = this.skyCanvas.getContext("2d");
        this.skyGraph = new SkyGraph(this.skyCanvas, this.skyContext);
        this.rescaleCanvas(this.skyCanvas, this.skyContext);

        /* global A */
        /* Preload Aladin object */
        this.objAladin = A.aladin("#details_map", config.aladinDefaultSettings);
        this.aladinInitialized = true;
        this.objAladin.on("positionChanged", function () {
            driver.objAladin.view.applyRotation();
        });

        /* OB queue - related */
        this.ob = false; // Whether or not the page is a referral from the OB queue
        this.obdata = null; // Actual JSON-decoded object containing OB info
        this.obprocessed = false; // OB info is processed automatically only once, upon page load

        /* Retrieve list major bodies from JPL Horizons */
        this.getMajorBodies();

        // Night, targets, planning
        this.nightInitialized = false;
        this.scheduleMode = false;
        this.rescheduling = false;
        this.night = null;
        this.resolvedIdentifiers = {};
        this.resolvedEphemerides = {}; // for JPL Horizons
        this.targets = new TargetList();
        this.RequestedScheduleType = 0;
        /* Types of request:
        *   1: update the schedule
        *   2: schedule the night "from scratch"
        *   3: just plot the altitudes of the targets (no scheduling)
        */
        CodeMirror.defineSimpleMode("simplemode", {
            meta: {
                lineComment: "#"
            },
            start: [{
                regex: /#.*/,
                sol: true, /* only match at start of line; ^ in regex doesn't work */
                token: 'comment'
            }]
        });
        this.CMeditor = CodeMirror.fromTextArea($("#targets")[0], {
            lineNumbers: true,
            mode: "simplemode",
            styleActiveLine: { nonEmpty: false },
            extraKeys: {
                Tab: function () {
                    driver.targets.validateAndFormatTargets().then(() => {
                        $("#plotTargets").focus();
                    }).catch(ex => { helper.LogException(ex); });
                }
            }
        });
        const editor = this.CMeditor;
        this.visibleLineMap = [];
        this.isVisibleLine = function(content) {
            if (!content) {
                return false;
            }
            const t = content.trim().toLowerCase();
            const words = helper.splitQuoted(t);
            return t !== "" && !t.startsWith("#") && !config.offlineStrings.includes(words[0]);
        };
        this.rebuildVisibleLineMap = function() {
            const lineCount = editor.lineCount();
            driver.visibleLineMap = new Array(lineCount);
            let visibleIndex = 0;
            for (let i = 0; i < lineCount; i += 1) {
                const line = editor.getLine(i);
                if (driver.isVisibleLine(line)) {
                    visibleIndex += 1;
                    driver.visibleLineMap[i] = visibleIndex;
                } else {
                    driver.visibleLineMap[i] = null;
                }
            }
        };
        editor.on("changes", function() {
            driver.rebuildVisibleLineMap();
            editor.clearGutter("CodeMirror-linenumbers");
            editor.refresh();
        });
        editor.setOption("lineNumberFormatter", function (line) {
            const val = driver.visibleLineMap[line-1];
            return (val === null || typeof val === "undefined") ? "" : val;
        });

        // Create debounced function once
        this.debouncedAutosave = this.debounce(
            () => this.autosave(),
            config.autosaveDebounceTime
        );

        this.CMeditor.on("change", this.debouncedAutosave);

        // Clear all button
        $("#clearAll").click(function() {
            if (driver.CMeditor.getValue() !== "") {
                const extraInfo = driver.scheduleMode ? " The current schedule WILL BE LOST!" : "";
                if (!window.confirm(`Are you sure you want to clear all targets?${extraInfo}`)) {
                    return;
                }
            }
            driver.CMeditor.setValue("");
            driver.targets = new TargetList();
            driver.scheduleMode = false;
            driver.rescheduling = false;
            driver.RequestedScheduleType = 0;
            driver.targets.validateAndFormatTargets();
            $("#planNight").val("Schedule observations");
            $("#planNight").prop("disabled", true);
            driver.Refresh();
        });

        // "global" variables to track various browser events
        this.reObj = null; // Object that is being moved/rescheduled on the RHS
        this.reY = null; // Tracking of mouse y-position during said rescheduling
        this.mouseInsideObject = -1;

        /* Update footer */
        $("#footer-year").text((new Date()).getUTCFullYear());
        $("#footer-version").text(window.version);
        $("#footer-version").attr("href", `${config.githubURL}/tree/v${window.version}`);
        window.fetch(`${config.githubAPIURL}/tags`)
            .then(response => response.json())
            .then(tags => tags.forEach(tag => {
                if (tag.name === `v${window.version}`) {
                    window.fetch(`${config.githubAPIURL}/commits/${tag.commit.sha}`)
                        .then(response => response.json())
                        .then(info => {
                            $("#footer-date").text(`, committed on ${info.commit.author.date.replace("T", " at ").slice(0, 19)} UTC`);
                        })
                        .catch(ex => { helper.LogException(ex); });
                }
            }))
            .catch(ex => { console.warn(ex); });
    } catch (ex) {
        helper.LogException(ex);
    }
}

Driver.prototype.debounce = function(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

Driver.prototype.autosave = function() {
    localStorage.setItem("autosaved", driver.CMeditor.getValue());
};

Driver.prototype.getCachedMajorBodies = function() {
    try {
        const cached = JSON.parse(localStorage.getItem(config.mbCacheKey));
        if (!cached) {
            return null;
        }
        const isExpired = (Date.now() - cached.timestamp) > config.mbCacheTTL;
        if (isExpired) {
            return null;
        }
        return cached.data;
    } catch (ex) {
        console.warn('Cache parse failed, ignoring cache.', ex);
        return null;
    }
};

Driver.prototype.setCachedMajorBodies = function(data) {
    try {
        localStorage.setItem(config.mbCacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    } catch (ex) {
        console.warn('Failed to write cache.', ex);
    }
};

Driver.prototype.getMajorBodies = function() {
    const cachedData = this.getCachedMajorBodies();
    if (cachedData) {
        this.majorBodies = cachedData;
        helper.LogEntry(`Loaded ${Object.keys(cachedData).length} major bodies from cache.`);
        return;
    }
    $.get({
        url: config.horizonsURL({ 'COMMAND': `'MB'` }),
        timeout: 20000
    }).then(function(data) {
        driver.majorBodies = data;
        driver.setCachedMajorBodies(data);
        helper.LogEntry(`Retrieved ${Object.keys(data).length} major bodies from JPL Horizons.`);
    }).catch(function(ex) {
        helper.LogEntry('Failed to fetch major bodies from JPL Horizons (check the console).');
        console.error(ex);
    });
};

Driver.prototype.SetupMap = function() {
    try {
        /* global L */
        const tileLayer = L.tileLayer(config.mapTileSource, config.mapTileSettings);
        /* Load map */
        this.map = L.map('map', {
            attributionControl: false,
            zoomControl: true,
            fullscreenControl: true,
            worldCopyJump: false,
            layers: [tileLayer],
            maxBounds: L.latLngBounds(config.mapWorldBounds[0], config.mapWorldBounds[1]),
            maxBoundsViscosity: 1
        });
        const baseMaps = { "Satellite Map": tileLayer};
        const clouds = L.OWM.cloudsClassic({showLegend: false, opacity: 0.6, appId: config.mapAPIKey});
        const rain = L.OWM.rainClassic({showLegend: false, opacity: 0.6, appId: config.mapAPIKey});
        driver.nightLayerGroup = L.layerGroup();
        const overlayMaps = {
            "Clouds": clouds,
            "Rain": rain,
            "Night & Twilight": driver.nightLayerGroup
        };
        // Add layers
        L.control.layers(baseMaps, overlayMaps).addTo(this.map);
        /* Equator and tropics */
        L.polyline([[0, -180], [0, 180]], config.mapEquatorStyle).addTo(this.map);
        L.polyline([[config.axialTilt, -180], [config.axialTilt, 180]], config.mapTropicsStyle).addTo(this.map);
        L.polyline([[-config.axialTilt, -180], [-config.axialTilt, 180]], config.mapTropicsStyle).addTo(this.map);
        function addLineLabel(lat, text, map) {
            return L.marker([lat + 2, -178], {
                icon: L.divIcon({
                    className: 'map-label',
                    html: text,
                    iconSize: [0, 0],
                    iconAnchor: [0, 16]
                }),
                interactive: false // prevents mouse interference
            }).addTo(map);
        }
        // Add labels
        addLineLabel(0, "Equator", this.map);
        addLineLabel(config.axialTilt, "Tropic of Cancer", this.map);
        addLineLabel(-config.axialTilt, "Tropic of Capricorn", this.map);

        function refreshMap() {
            driver.map.setView(config.mapInitialView, config.mapInitialZoom);
        }

        refreshMap();
        $("#viewall").on('click', refreshMap);

        // Store markers by key
        this.markersByKey = {};
        this.redPin = L.icon({
            iconUrl: config.mapRedPinURL,
            shadowUrl: config.mapShadowPinURL,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        this.bluePin = L.icon({
            iconUrl: config.mapBluePinURL,
            shadowUrl: config.mapShadowPinURL,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        this.markers = L.markerClusterGroup({
            maxClusterRadius: config.mapMaxClusterRadius,
            showCoverageOnHover: false,
            iconCreateFunction: function(cluster) {
                // Get all markers in the cluster
                const childMarkers = cluster.getAllChildMarkers();
                // If selected telescope is in this cluster, use red style
                const containsSelected = childMarkers.some(m => m.options.alt === Driver.telescopeName);
                const c = containsSelected ? 'red-cluster' : 'blue-cluster';
                return L.divIcon({
                    html: `<div><span>${cluster.getChildCount()}</span></div>`,
                    className: `marker-cluster ${c}`,
                    iconSize: L.point(40, 40)
                });
            }
        });
        for (const [key, telescope] of Object.entries(telescopes)) {
            const marker = L.marker(
                {lng: telescope.longitude, lat: telescope.latitude},
                {icon: this.bluePin, alt: key}
            ).bindTooltip(
                telescope.name + (telescope.site ? `<br/>${telescope.site}, ` : "<br/>") + `${telescope.location}`
            ).on("click", function() {
                $("#def_telescope").val(key).trigger("change");
            });
            this.markers.addLayer(marker);
            this.markersByKey[key] = marker;
        }
        this.map.addLayer(this.markers);
        driver.highlightCurrentTelescope();
        this.map.on('zoomend', function() {
            if (driver.map.getZoom() <= 2) {
                $("#viewall").hide();
            } else {
                $("#viewall").show();
            }
        });
        $('#zoom_to_telescope').on('click', function() {
            const key = $('#def_telescope').val();
            if (!key) {
                return;
            }
            const telescope = telescopes[key];
            if (!telescope || !telescope.latitude || !telescope.longitude) {
                return;
            }
            driver.map.setView([telescope.latitude, telescope.longitude], 16);
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.startSunTimer = function() {
    try {
        this.updateSunAndNight();
        this.sunInterval = setInterval(() => {
            // Only run the heavy math if the layer is actually turned on in the UI
            if (driver.map.hasLayer(this.nightLayerGroup)) {
                driver.updateSunAndNight();
            }
        }, config.mapTerminatorRefreshInterval);
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.stopSunTimer = function() {
    try {
        if (this.sunInterval) {
            clearInterval(this.sunInterval);
            this.sunInterval = null;
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.buildNightPolygon = function(ssp, alt = 0, step = 1) {
    const delta = ssp[2];
    const gha = ssp[3];
    const h = sla.d2r * alt;
    const k = Math.sin(h);

    // Helper to test if a specific coordinate is darker than our target altitude
    const isNight = (latRad, haRad) => {
        const altSin = Math.sin(latRad) * Math.sin(delta) + Math.cos(latRad) * Math.cos(delta) * Math.cos(haRad);
        return altSin <= k;
    };

    const intervals = [];

    // 1. Sweep Longitudes to build Latitude Intervals
    for (let lon = -180; lon <= 180; lon += step) {
        const lonRad = sla.d2r * lon;
        const haRad = sla.drange(gha + lonRad);

        // Simplify our spherical equation
        const A = Math.sin(delta);
        const B = Math.cos(delta) * Math.cos(haRad);
        const R = Math.sqrt(A * A + B * B);

        // Edge Case: 0 Roots (Entire longitude is either 24hr Day or 24hr Night)
        if (R === 0 || Math.abs(k / R) > 1) {
            if (isNight(0, haRad) || isNight(sla.pihalf, haRad)) {
                intervals.push({ lon: lon, bounds: [-90, 90] });
            } else {
                intervals.push({ lon: lon, bounds: null });
            }
            continue;
        }

        const gamma = Math.atan2(A, B);
        const acosTerm = Math.acos(k / R);

        // Calculate roots, unwrap from radians, and map to -90 to +90 bounds
        let roots = [gamma + acosTerm, gamma - acosTerm]
            .map(r => {
                let n = r;
                while (n > Math.PI) {
                    n -= sla.d2pi;
                }
                while (n <= -Math.PI) {
                    n += sla.d2pi;
                }
                return n;
            })
            .filter(r => r >= -sla.pihalf - 1e-5 && r <= sla.pihalf + 1e-5)
            .map(r => sla.r2d * r)
            .sort((a, b) => a - b);

        // Enforce hard clamps to map edges
        roots = roots.map(r => Math.max(-90, Math.min(90, r)));

        // Extract the exact interval of night for this specific longitude
        if (roots.length === 0) {
            if (isNight(0, haRad)) {
                intervals.push({ lon: lon, bounds: [-90, 90] });
            } else {
                intervals.push({ lon: lon, bounds: null });
            }
        } else if (roots.length === 1) {
            const rLat = roots[0];
            const testBelow = sla.d2r * ((rLat - 90) / 2);
            if (isNight(testBelow, haRad)) {
                intervals.push({ lon: lon, bounds: [-90, rLat] });
            } else {
                intervals.push({ lon: lon, bounds: [rLat, 90] });
            }
        } else if (roots.length === 2) {
            const mid = sla.d2r * ((roots[0] + roots[1]) / 2);
            if (isNight(mid, haRad)) {
                intervals.push({ lon: lon, bounds: [roots[0], roots[1]] });
            } else {
                intervals.push({ lon: lon, bounds: null });
            }
        }
    }

    // 2. Group into contiguous MultiPolygons to avoid crossing the daytime center
    const multiPolys = [];
    let currentBlock = [];

    for (let i = 0; i < intervals.length; i += 1) {
        if (intervals[i].bounds) {
            currentBlock.push(intervals[i]);
        } else if (currentBlock.length > 0) {
            multiPolys.push(currentBlock);
            currentBlock = [];
        }
    }
    if (currentBlock.length > 0) {
        multiPolys.push(currentBlock);
    }

    // 3. Trace Top/Bottom Edges for Leaflet
    const finalPolygons = [];
    multiPolys.forEach(block => {
        const poly = [];
        // Trace the top boundary left-to-right
        for (let i = 0; i < block.length; i += 1) {
            poly.push([block[i].bounds[1], block[i].lon]);
        }
        // Trace the bottom boundary right-to-left
        for (let i = block.length - 1; i >= 0; i -= 1) {
            poly.push([block[i].bounds[0], block[i].lon]);
        }
        // Wrap in an extra array so Leaflet treats it as a MultiPolygon structure
        finalPolygons.push([poly]);
    });

    return finalPolygons;
};

Driver.prototype.updateNightPolygons = function (ssp) {
    try {
        if (!driver.nightPolygons) {
            driver.nightPolygons = {};
        }
        config.mapTwilights.forEach(tw => {
            const polys = driver.buildNightPolygon(ssp, tw.alt, 1);
            if (!driver.nightPolygons[tw.name]) {
                driver.nightPolygons[tw.name] = L.polygon(polys, {
                    color: null, // No visible border wireframe
                    fillColor: tw.color,
                    fillOpacity: tw.opacity,
                    interactive: false
                }).addTo(driver.nightLayerGroup);
            } else {
                driver.nightPolygons[tw.name].setLatLngs(polys);
            }
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.updateSunAndNight = function() {
    try {
        if (!driver.map.hasLayer(driver.nightLayerGroup)) {
            return;
        }
        const ssp = helper.SubsolarPoint();
        if (!driver.sunMarker) {
            // Add sun marker
            const sunIcon = L.icon({
                iconUrl: config.mapSunIcon,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            driver.sunMarker = L.marker([ssp[0], ssp[1]], {icon: sunIcon}).addTo(driver.nightLayerGroup);
        } else {
            driver.sunMarker.setLatLng([ssp[0], ssp[1]]);
        }
        driver.updateNightPolygons(ssp);
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.highlightCurrentTelescope = function () {
    try {
        if (this.markersByKey) {
            for (const key in this.markersByKey) {
                if (key === Driver.telescopeName) {
                    this.markersByKey[key].setIcon(this.redPin);
                } else {
                    this.markersByKey[key].setIcon(this.bluePin);
                }
            }
        }
        if (this.markers) {
            // Refresh clusters to update icons
            this.markers.refreshClusters();
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.ParseOBInfoIfAny = function () {
    try {
        if ($("#obinfo").length === 0) {
            helper.LogEntry("No OB info detected.");
            this.ob = false;
        } else {
            helper.LogEntry("OB info detected. Decoding. Please wait...");
            this.obdata = JSON.parse(decodeURIComponent($("#obinfo").val()));
            if (typeof this.obdata === "object") {
                helper.LogEntry("JSON object decoded successfully.");
                this.ob = true;
                if (this.obdata.Telescope.length) {
                    helper.LogEntry(`Setting telescope to <i>${this.obdata.Telescope}</i>.`);
                    driver.setTelescopeName(this.obdata.Telescope).then(function () { });
                }
            } else {
                helper.LogError("Could not decode JSON object. Falling back to standard (non-OB) visplot...");
                this.ob = false;
            }
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.CallbackSetDate = function () {
    try {
        this.night.setEphemerides();
        this.nightInitialized = true;
        this.Refresh(true);
        helper.LogEntry("Done.");

        if (this.ob && !this.obprocessed) {
            helper.LogEntry("Processing the targets from the OB queue...");
            const ntargets = this.obdata.nTargets;
            helper.LogEntry(`${helper.plural(ntargets, "target")} found.`);
            let constraint;
            const lines = [];
            for (let i = 1; i <= ntargets; i += 1) {
                const obj = this.obdata.Targets[`target${i}`];
                if ("LST1" in obj && "LST2" in obj) {
                    constraint = `LST[${obj.LST1}-${obj.LST2}]`;
                } else {
                    constraint = obj.Constraint;
                }
                const line = helper.quoteIfNeeded(obj.Name) + " " + obj.RA + (parseFloat(obj.PM.RA) === 0.0 ? "" : "/" + parseFloat(obj.PM.RA)) + " " + obj.Dec + (parseFloat(obj.PM.Dec) === 0.0 ? "" : "/" + parseFloat(obj.PM.Dec)) + " " + parseInt(obj.Epoch) + " " + obj.ObsTime + " " + helper.quoteIfNeeded(obj.Proposal) + " " + constraint + " " + obj.Type + " " + `${obj.Instrument}:${obj.Mode}:${obj.GroupID}:${obj.BlockID}`;
                lines.push(line);
            }
            this.obprocessed = true;
            this.CMeditor.setValue(lines.join("\n"));
        }

        // Force recalculation of all targets
        this.targets.InputText = "";
        $("#plotTargets").trigger("click");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.CallbackSetTargets = function (obj) {
    try {
        helper.LogEntry("Done.");
        if (this.RequestedScheduleType === 1) {
            this.targets.addTargets(obj.split(/\r?\n/));
        } else {
            this.targets.setTargets(obj.split(/\r?\n/));
        }
        this.CallbackUpdateSchedule();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.CallbackUpdateSchedule = function () {
    try {
        if (this.RequestedScheduleType === 1) {
            helper.LogEntry("Updating schedule. Please wait...");
            this.targets.updateSchedule();
            helper.LogEntry("Done.");
        }
        if (this.RequestedScheduleType === 2) {
            helper.LogEntry("Scheduling the observing night. Please wait...");
            this.targets.plan(this.targets.Targets);
            helper.LogEntry("Done.");
            this.scheduleMode = true;
            $("#planNight").val(Driver.updSchedText);
        }
        if (this.RequestedScheduleType === 3) {
            this.scheduleMode = false;
            $("#planNight").val("Schedule observations");
            $("#planNight").removeAttr("disabled");
        }
        $("#saveDoc").removeAttr("disabled");
        this.Refresh();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.BtnEvtSetDate = function (e) {
    try {
        if (this.scheduleMode && !window.confirm("Are you sure you want to replot the targets?\nThe current schedule WILL BE LOST!")) {
            e.preventDefault();
            return;
        }

        const year = helper.filterInt($("#dateY").val());
        const month = helper.filterInt($("#dateM").val());
        const day = helper.filterInt($("#dateD").val());
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            helper.LogError(`Invalid date (${year}-${month}-${day}).`);
            return;
        }
        if (year < 1988 || year > 2100) {
            helper.LogError(`Invalid year (${year}). Please enter a number between 1988 and 2100.`);
            return;
        }
        if (month < 1 || month > 12) {
            helper.LogError(`Invalid month (${month}). Please enter a number between 1 and 12.`);
            return;
        }
        const dmax = helper.numberOfDays(year, month);
        if (day < 1 || day > dmax) {
            helper.LogError(`Invalid day (${day}) for ${year}-${helper.padTwoDigits(month)}. Please enter a number between 1 and ${dmax}.`);
            return;
        }
        const evening = moment.tz(`${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)} 20:00`, Driver.timezoneName);
        if (!evening.isValid) {
            helper.LogError(`Invalid date (${year}-${month}-${day}).`);
            return;
        }
        const morning = evening.clone().add(1, "days");
        const eveningOffset = evening.utcOffset() / 60;
        const morningOffset = morning.utcOffset() / 60;
        if (eveningOffset !== morningOffset) {
            helper.LogWarning("DST transition detected — time axis includes clock change.");
        }
        Driver.obsTimezoneE = eveningOffset;
        Driver.obsTimezoneM = morningOffset;
        const adE = helper.tzDescription(evening.zoneAbbr(), evening.utcOffset() / 60);
        const adM = helper.tzDescription(morning.zoneAbbr(), morning.utcOffset() / 60);
        Driver.obsTimezoneAbbrE = adE.abbr;
        Driver.obsTimezoneAbbrM = adM.abbr;
        Driver.obsTimezoneDescriptionE = adE.desc;
        Driver.obsTimezoneDescriptionM = adM.desc;
        if (eveningOffset !== morningOffset) {
            helper.LogEntry(`Initializing date to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)}; time zone set to ${Driver.timezoneName} (${adE.desc} in the evening, ${adM.desc} in the morning)`);
        } else {
            helper.LogEntry(`Initializing date to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)}; time zone set to ${Driver.timezoneName} (${adE.desc}}`);
        }
        this.night = new Night(year, month, day);
        this.scheduleMode = false;
        driver.CallbackSetDate();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.BtnEvtPlotTargets = function () {
    try {
        if (this.RequestedScheduleType < 1 || this.RequestedScheduleType > 3) {
            helper.LogError("Unknown value for Driver.RequestedScheduleType.");
            return;
        }
        if (!this.nightInitialized) {
            helper.LogError("Night not initialized. Click on [Set] first!");
            return;
        }
        this.targets.validateAndFormatTargets().then(val => {
            if (!val) {
                return;
            }
            if (driver.RequestedScheduleType !== 1 && driver.scheduleMode) {
                if (!window.confirm("Are you sure you want to replot the targets?\nThe current schedule WILL BE LOST!")) {
                    return;
                }
            }
            if (driver.RequestedScheduleType === 1) {
                const ret = driver.targets.prepareScheduleForUpdate();
                if (ret === "") { // nothing to do, since the input form has not been changed
                    return;
                }
                if (ret === false) { // reschedule at will, since we are not in the middle of the night
                    driver.RequestedScheduleType = 2;
                } else if (ret === true) { // we are in the middle of the night, but there are no new targets; just redo the schedule and replot
                    driver.CallbackUpdateSchedule();
                } else { // ... and there are new targets;
                    helper.LogEntry("Calculating altitudes for the new targets. Please wait...");
                    driver.CallbackSetTargets($("#added_targets").val());
                }
            }
            $("#plotTargets").prop("disabled", true);
            if (driver.RequestedScheduleType !== 1) {
                if (driver.RequestedScheduleType === 2 && !(driver.targets.inputHasChanged($("#targets_actual").val(), driver.targets.ComputedTargets))) {
                    helper.LogEntry("No need to recompute altitudes. Proceeding to scheduling.");
                    driver.CallbackUpdateSchedule();
                } else {
                    helper.LogEntry("Calculating altitudes for all targets. Please wait...");
                    driver.CallbackSetTargets($("#targets_actual").val());
                }
            }
            $("#plotTargets").prop("disabled", false);
        }).catch(ex => { helper.LogException(ex); });
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrameMouseMove = function (e) {
    try {
        if (this.targets.Ntargets === 0) {
            return;
        }
        const x = e.offsetX || e.layerX;
        const y = e.offsetY || e.layerY;
        if (this.rescheduling) {
            if (x > this.graph.targetsx) {
                this.reY = null;
                for (let i = 0; i < this.targets.nTargets; i += 1) {
                    const obj = this.targets.Targets[i];
                    if (y >= obj.ystart && y <= obj.yend) {
                        if (this.reObj === obj) {
                            break;
                        }
                        if (y <= 0.5 * (obj.ystart + obj.yend)) {
                            if (i > 0 && this.targets.Targets[i-1] === this.reObj) {
                                break;
                            }
                            this.reY = obj.ystart;
                        } else {
                            if (i < this.targets.nTargets-1 && this.targets.Targets[i+1] === this.reObj) {
                                break;
                            }
                            this.reY = obj.yend;
                        }
                        break;
                    }
                }
            } else {
                this.reY = null;
            }
            this.graph.drawRHSofSchedule(this.context);
            return;
        }
        for (let i = 0; i < this.targets.nTargets; i += 1) {
            const obj = this.targets.Targets[i];
            if (this.insideObject(x, y, obj)) {
                if (this.mouseInsideObject !== i) {
                    this.mouseInsideObject = i;
                    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.graph.drawBackground(this.context);
                    this.graph.drawEphemerides(this.context);
                    this.graph.highlightTarget(this.context, obj);
                    this.graph.drawTargets(this.context, this.targets.Targets, true);
                    if (this.scheduleMode) {
                        this.graph.drawSchedule(this.context);
                    } else {
                        this.graph.drawTargetNames(this.context, this.targets.Targets);
                    }
                    $("#canvasFrame").css("cursor", "pointer");
                }
                return;
            }
        }
        if (this.mouseInsideObject > -1) {
            this.mouseInsideObject = -1;
            this.Refresh();
            $("#canvasFrame").css("cursor", "auto");
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.insideObject = function (x, y, obj) {
    try {
        if (this.targets.nTargets === 0) {
            return false;
        }
        // xlab, ylab: where the objid is in the plot when it is not scheduled (at highest altitude)
        // rxmid, rymid: where the objid is on the right in schedulemode
        return (helper.PointInsideCircle(x, y, obj.xlab, obj.ylab, this.graph.CircleSizeSq)) || (helper.PointInsideCircle(x, y, obj.rxmid, obj.rymid, this.graph.CircleSizeSq));
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrameMouseDown = function (e) {
    try {
        if (this.targets.Ntargets === 0 || !this.scheduleMode) {
            return;
        }
        const x = e.offsetX || e.layerX;
        const y = e.offsetY || e.layerY;
        if (x > this.graph.targetsx) {
            for (const obj of this.targets.Targets) {
                if (y >= obj.ystart && y <= obj.yend) {
                    this.reObj = obj;
                    this.rescheduling = true;
                    this.graph.drawRHSofSchedule(this.context);
                }
            }
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrameMouseUp = function (e) {
    try {
        if (this.targets.Ntargets === 0 || !this.scheduleMode) {
            return;
        }
        const x = e.offsetX || e.layerX;
        const y = e.offsetY || e.layerY;
        if (x > this.graph.targetsx) {
            if (!this.rescheduling) {
                return;
            }
            const targets = this.targets.Targets;
            const movedIndex = targets.indexOf(this.reObj);
            let scheduleorder = null;
            for (let i = 0; i < this.targets.nTargets; i += 1) {
                const obj = targets[i];
                if (y >= obj.ystart && y <= obj.yend) {
                    if (this.reObj === obj) {
                        break;
                    }
                    if (y <= 0.5 * (obj.ystart + obj.yend)) {
                        if (i > 0 && targets[i-1] === this.reObj) {
                            break;
                        }
                        // Schedule before obj
                        helper.LogDebug(`Moving ${targets[movedIndex].Name} before ${obj.Name}.`);
                        scheduleorder = [...Array(this.targets.nTargets).keys()];
                        scheduleorder.splice(movedIndex, 1);
                        scheduleorder.splice(i-(movedIndex < i ? 1 : 0), 0, movedIndex);
                    } else {
                        if (i < this.targets.nTargets-1 && this.targets.Targets[i+1] === this.reObj) {
                            break;
                        }
                        // Schedule after obj
                        helper.LogDebug(`Moving ${targets[movedIndex].Name} after ${obj.Name}.`);
                        scheduleorder = [...Array(this.targets.nTargets).keys()];
                        scheduleorder.splice(movedIndex, 1);
                        scheduleorder.splice(i-(movedIndex < i ? 1 : 0)+1, 0, movedIndex);
                    }
                    break;
                }
            }
            this.rescheduling = false;
            this.reY = null;
            if (scheduleorder !== null) {
                helper.LogEntry("Rescheduling the observing night. Please wait...");
                this.targets.scheduleAndOptimizeGivenOrder(scheduleorder);
                helper.LogEntry("Done.");
                this.scheduleMode = true;
                this.Refresh();
            }
            this.graph.drawRHSofSchedule(this.context);
        } else if (this.rescheduling) {
            this.rescheduling = false;
            this.reY = null;
            this.graph.drawRHSofSchedule(this.context);
            return;
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrameClick = function (e) {
    try {
        if (this.targets.Ntargets === 0) {
            return;
        }
        const x = (e.offsetX || e.layerX);
        const y = (e.offsetY || e.layerY);
        for (let i = 0; i < this.targets.nTargets; i += 1) {
            const obj = this.targets.Targets[i];
            if (this.insideObject(x, y, obj)) {
                const moonHasSet = obj.Scheduled ? (this.night.ymoon[helper.MJDToIndex(obj.ScheduledMidTime)] < 0) : false;
                const LunarPhase = moonHasSet ? "D" : (this.night.MoonIllumination <= 40 ? "D" : (this.night.MoonIllumination <= 70 ? (obj.MinMoonDistance <= 90 ? "G" : "D") : (obj.MinMoonDistance <= 60 ? "N" : "G")));
                $("#details_title").html(obj.Name);
                let finalString = '<h2 class="h2-instr">Object details</h2>' +
                    `<p class="pp">Proposal: <b>${obj.ProjectNumber}</b></p>` +
                    `<p class="pp">Type: <span style="margin-top:-2px;color:${obj.LabelFillColor}">&#11044;</span>&nbsp;<b>${obj.FullType}</b></p>` +
                    `<p class="pp">RA: <b>${obj.RA}</b></p>` +
                    `<p class="pp">Dec: <b>${obj.Dec.replace("-", "–")}</b></p>` +
                    `<p class="pp">Epoch: <b>${obj.Epoch === "1950" ? "B1950" : "J2000"}</b></p>` +
                    `<p class="pp">Moon Distance: <span title="${helper.LunarPhaseExplanation(LunarPhase)}"><b>${obj.MinMoonDistance}°</b> (${LunarPhase})</span></p>` +
                    `<p class="pp">Moon Closest At: <b>${helper.MJDToHM(obj.MinMoonDistanceTime, "UTC", true)}</b></p>` +
                    `<p class="pp">Obstime: <b>${obj.ExptimeSeconds.toFixed(0)} s</b> (${obj.ExptimeHM})</p>` +
                    "$INSTRUMENT" +
                    "$MODE" +
                    "$BACKLINK" +
                    "$SCHEDULE";
                if (obj.ExtraInfo === null && obj.BacklinkToOBQueue === null && obj.Instrument !== null) {
                    finalString = finalString.replace("$INSTRUMENT", "");
                } else {
                    finalString = finalString.replace("$INSTRUMENT", `<p class="pp">Instrument: <b>${obj.Instrument}</b></p>`);
                }
                if (obj.ExtraInfo === null) {
                    finalString = finalString.replace("$MODE", "");
                } else {
                    finalString = finalString.replace("$MODE", `<p class="pp">Instrument/Mode: <b>${obj.ExtraInfo}</b></p>`);
                }
                if (obj.BacklinkToOBQueue === null) {
                    finalString = finalString.replace("$BACKLINK", "");
                } else {
                    const backlink = `<p class="pp"><a href="${obj.BacklinkToOBQueue}" target="_blank">OB update link (Staff)</a></p>` +
                        `<p class="pp"><a href="${obj.BacklinkToOBQueuePublic}" target="_blank">OB update link (Public)</a></p>`;
                    finalString = finalString.replace("$BACKLINK", backlink);
                }
                if (this.scheduleMode || obj.Scheduled || obj.Observed) {
                    let schedText = '<div style="height:5px; padding-top: 15px"></div><h2 class="h2-instr">Scheduling</h2>';
                    if (this.scheduleMode) {
                        if (obj.Scheduled) {
                            schedText += `<p class="pp">Suggested UTC: <b>${helper.MJDToHM(obj.ScheduledStartTime)}–${helper.MJDToHM(obj.ScheduledEndTime)}</b></p>`;
                        } else {
                            schedText += '<p class="pp">Not scheduled for observation.</p>';
                        }
                        schedText += '<p class="pp2"><span style="display:inline-block;width:80px">Started:</span><input type="text" class="inpshort" id="actual_start" /></p>';
                        schedText += '<p class="pp2"><span style="display:inline-block;width:80px">Finished:</span><input type="text" class="inpshort" id="actual_end" /></p>';
                        schedText += '<p class="pp2"><span style="display:inline-block;width:80px">Comments:</span><textarea id="popcomm"></textarea></p>';
                    }
                    if (obj.Scheduled) {
                        schedText += `<input type="hidden" id="id_of_observed" value="${i}" />`;
                        if (obj.Observed) {
                            schedText += '<input id="unmark_as_observed" type="button" value="Remove the Observed tag" onclick="driver.markAsObserved(false);" />';
                        } else {
                            schedText += '<input id="mark_as_observed" type="button" value="Mark as Observed" onclick="driver.markAsObserved(true);" />';
                        }
                    }
                    finalString = finalString.replace("$SCHEDULE", schedText);
                } else {
                    finalString = finalString.replace("$SCHEDULE", "");
                }
                $("#details_info").html(finalString);
                if (this.scheduleMode) {
                    $("#actual_start").val(obj.ObservedStartTime);
                    $("#actual_end").val(obj.ObservedEndTime);
                    $("#popcomm").val(obj.Comments);
                }

                const ra = sla.r2d * obj.J2000[0];
                const dec = sla.r2d * obj.J2000[1];
                let instrument = obj.Instrument;
                if (!(instrument in Driver.instruments)) {
                    /* Got a weird instrument? Just show the default FoV */
                    instrument = Driver.defaultInstrument;
                }
                const fov = Driver.instruments[instrument].fov / 60;
                const flip = Driver.instruments[instrument].flip;
                const surveyName = Driver.instruments[instrument].type === "optical" ? config.aladinOpticalSurvey : config.aladinInfraredSurvey;
                $("#details_map_hang").html(surveyName);
                this.objAladin.setImageSurvey(surveyName);
                this.objAladin.setFov(fov);
                this.objAladin.setFlip(flip);
                this.objAladin.gotoRaDec(ra, dec);
                this.objAladin.setPA(obj.SkyPA);
                $("a#inline").trigger("click");
                break;
            }
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrameDrop = function (e) {
    try {
        if (!this.nightInitialized) {
            return;
        }
        e.preventDefault();
        const dropped = e.originalEvent.dataTransfer.getData("Text");
        const numberPattern = /[+\-]?\d+(\.\d+)?/g;
        const floats = dropped.match(numberPattern).map(function (v) {
            return parseFloat(v);
        });
        if (floats.length === 6) {
            this.CMeditor.setValue(`Object ${floats.join(" ")}`);
            $("#plotTargets").trigger("click");
        }
    } catch (ex) {
        console.warn(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.InitializeDate = function () {
    try {
        let year, month, day, datemsg;
        if (this.ob) {
            helper.LogEntry(`Date string provided by the OB queue: ${this.obdata.Date}`);
            year = parseInt(this.obdata.Date.substr(0, 4));
            month = parseInt(this.obdata.Date.substr(4, 2));
            day = parseInt(this.obdata.Date.substr(6, 2));
            datemsg = `Date set to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)}, as provided by the OB queue.`;
        } else {
            const localTimeAtTel = moment.tz(Driver.timezoneName);
            const ad = helper.tzDescription(localTimeAtTel.zoneAbbr(), localTimeAtTel.utcOffset() / 60);
            helper.LogEntry(`Current time at the telescope is ${localTimeAtTel.format()}, time zone is ${Driver.timezoneName} (${ad.desc})}`);
            let thedate;
            const localHourAtTel = localTimeAtTel.hour();
            if (localHourAtTel < config.nightCutoff) {
                helper.LogEntry(`Setting date to yesterday because at the telescope it is still morning (local time ${localTimeAtTel.format('HH:mm')})`);
                thedate = localTimeAtTel.subtract(1, "days");
                datemsg = `Default date set to ${thedate.format('YYYY-MM-DD')} (last night).`;
            } else {
                helper.LogEntry(`Setting date to today because the local hour at the telescope is ${localTimeAtTel.format('HH:mm')}`);
                thedate = localTimeAtTel;
                datemsg = `Default date set to ${thedate.format('YYYY-MM-DD')}.`;
            }
            year = thedate.year();
            month = thedate.month() + 1;
            day = thedate.date();
        }
        $("#dateY").val(year);
        $("#dateM").val(helper.padTwoDigits(month));
        $("#dateD").val(helper.padTwoDigits(day));
        helper.LogEntry(datemsg);
        helper.LogSuccess("Page initialized.");
        $("#dateSet").trigger("click");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.BtnEvtSkycamClick = function () {
    try {
        this.skyGraph.refreshRemote();
        this.skyGraph.startTimer();
        $.fancybox.open({
            src: "#skycamblock",
            type: "inline",
            touch: false,
            beforeClose: function () {
                driver.skyGraph.stopTimer();
            }
        });
        this.skyGraph.redraw(this.skyContext);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.UpdateInstrumentList = function () {
    try {
        const tel = $("#def_telescope").val();
        $("#def_instrument option").remove();
        for (const key in (telescopes[tel].instruments || config.defaultInstrumentList)) {
            $("#def_instrument").append(new Option(key, key));
        }
        return tel;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.BindEvents = function () {
    // Allow the current date to be changed with a simple Enter key
    $("#dateD").keydown(function (e) {
        if (e.key === "Enter") {
            driver.BtnEvtSetDate(e);
        }
    });
    $("#dateM").keydown(function (e) {
        if (e.key === "Enter") {
            driver.BtnEvtSetDate(e);
        }
    });
    $("#dateY").keydown(function (e) {
        if (e.key === "Enter") {
            driver.BtnEvtSetDate(e);
        }
    });
    $("#def_epoch").keydown(function (e) {
        if (e.key === "Enter") {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_project").keydown(function (e) {
        if (e.key === "Enter") {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_type").keydown(function (e) {
        if (e.key === "Enter") {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_maxam").keydown(function (e) {
        if (e.key === "Enter") {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_obstime").keydown(function (e) {
        if (e.key === "Enter") {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_instrument").keydown(function (e) {
        if (e.key === "Enter") {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_telescope").on("change", function () {
        const tel = driver.UpdateInstrumentList();
        // Set instrument name to default
        $("#def_instrument").val(telescopes[tel].defaultInstrument || "default");
        // Set project number to default if not compatible with telescope
        driver.setTelescopeName(tel);
    });

    // Help button
    $("#helpBtn").click(function () {
        $.fancybox.open({
            src: "#help-container",
            type: "inline",
            touch: false
        });
    });

    const expandWith = function(text) {
        const val = driver.CMeditor.getValue();
        if (val.trim().length === 0) {
            driver.CMeditor.setValue(`${val}${text}`);
        } else if (val.substr(val.length - 1) === "\n") {
            driver.CMeditor.setValue(`${val}\n${text}`);
        } else {
            driver.CMeditor.setValue(`${val}\n\n${text}`);
        }
        driver.targets.validateAndFormatTargets()
            .catch(ex => { helper.LogException(ex); });
    };

    // Sample targets and target box
    $("#targetBlanksNorth").click(function () {
        expandWith(Driver.BlankFieldsNorth);
    });
    $("#targetBlanksSouth").click(function () {
        expandWith(Driver.BlankFieldsSouth);
    });
    $("#targetStandardsNorth").click(function () {
        expandWith(Driver.StandardsNorth);
    });
    $("#targetStandardsSouth").click(function () {
        expandWith(Driver.StandardsSouth);
    });
    $("#targets").blur(function () {
        driver.targets.validateAndFormatTargets()
            .catch(ex => { helper.LogException(ex); });
    });
    $("#tcsExport").click(function () {
        driver.targets.ExportTCSCatalogue();
    });
    $("#configBtn").click(function () {
        driver.BtnEvtConfig();
    });
    $("#configapply").click(function () {
        $("#configsubmit").val("true");
        $.fancybox.close();
    });

    // Lightbox frames
    $("a#inline").fancybox({
        touch: false
    });

    // Canvas frame
    $("#canvasFrame").on("dragend", function (e) {
        e.preventDefault();
    });
    $("#canvasFrame").on("dragover", function (e) {
        e.preventDefault();
    });
    $("#canvasFrame").on("drop", function (e) {
        driver.EvtFrameDrop(e);
    });
    $("#canvasFrame").on("mousemove", function (e) {
        driver.EvtFrameMouseMove(e);
    });
    $("#canvasFrame").on("mousedown", function (e) {
        driver.EvtFrameMouseDown(e);
    });
    $("#canvasFrame").on("mouseup", function (e) {
        driver.EvtFrameMouseUp(e);
    });
    $("#canvasFrame").on("click", function (e) {
        driver.EvtFrameClick(e);
    });
    // SkyCam div
    $("#showSkyCam").on("click", function () {
        driver.BtnEvtSkycamClick();
    });

    for (let k in Driver.FillColors) {
        $(`#def_col_${k.replace("-", "_")}`).addClass("inpshort");
        $(`#def_tcol_${k.replace("-", "_")}`).addClass("inpshort");
        $(`#def_col_${k.replace("-", "_")}`).keydown(function (e) {
            if (e.key === "Enter") {
                $("#configsubmit").val("true");
                $.fancybox.close();
            }
        });
        $(`#def_tcol_${k.replace("-", "_")}`).keydown(function (e) {
            if (e.key === "Enter") {
                $("#configsubmit").val("true");
                $.fancybox.close();
            }
        });
    }

    // Save and Load document events
    serializer.BindEvents();
};

Driver.prototype.perWordMatcher = function(params, data) {
    // If there’s no search term, return all
    if ($.trim(params.term) === '') {
        return data;
    }

    // Split the search term into words
    const terms = helper.normalizeText(params.term).split(/\s+/);
    const text = helper.normalizeText(data.text);

    // Only include items that match ALL terms
    for (let i = 0; i < terms.length; i += 1) {
        if (!text.includes(terms[i])) {
            return null; // no match
        }
    }

    return data;
};

/**
 * @memberof Driver
 */
Driver.prototype.BtnEvtConfig = function () {
    try {
        $("#configsubmit").val("false");
        $("#def_epoch").val(Driver.defaultEpoch);
        $("#def_project").val(Driver.defaultProject);
        $("#def_type").val(Driver.defaultType);
        $("#def_maxam").val(Driver.defaultAM);
        $("#def_obstime").val(Driver.defaultObstime);
        $("#def_instrument").val(Driver.defaultInstrument);
        $("#w_priority").val(Driver.wPriority);
        $("#w_urgency").val(Driver.wUrgency);
        $("#w_altitude").val(Driver.wAltitude);
        $("#w_slewing").val(Driver.wSlewing);
        for (let k in Driver.FillColors) {
            $(`#def_col_${k.replace("-", "_")}`).val(Driver.FillColors[k]);
            $(`#def_tcol_${k.replace("-", "_")}`).val(Driver.TextColors[k]);
        }
        $.fancybox.open({
            src: "#config-container",
            type: "inline",
            touch: false,
            afterShow: function() {
                driver.map.invalidateSize();
                driver.startSunTimer();
                if (!window.selectInitialized) {
                    setTimeout(() => {
                        $('#def_telescope').select2({
                            placeholder: "Start typing or select on the map",
                            minimumResultsForSearch: 0, // always show search input
                            width: '750px',
                            dropdownParent: $('.fancybox-content'),
                            dropdownCssClass: 'select2-dropdown-below',
                            matcher: driver.perWordMatcher
                        });
                    }, 0); // 0 ms lets Fancybox finish DOM updates
                    window.selectInitialized = true;
                }
            },
            beforeClose: function () {
                driver.stopSunTimer();
                driver.CallbackUpdateDefaults();
            }
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.CallbackUpdateDefaultsAfterTelUpdate = function (resetTel) {
    try {
        let re, resetCol = false;
        re = $("#def_epoch").val().trim();
        if (re !== Driver.defaultEpoch) {
            if (re === "1950" || re === "2000") {
                Driver.defaultEpoch = re;
                helper.LogSuccess(`Default <i>Epoch</i> set to <i>${re}</i>.`);
            } else {
                helper.LogError(`Default <i>Epoch</i> was not updated since the input <i>${re}</i> is invalid (must be 1950 or 2000).`);
            }
        }
        re = $("#def_project").val().trim();
        if (re !== Driver.defaultProject) {
            Driver.defaultProject = re;
            helper.LogSuccess(`Default <i>Proposal ID</i> set to <i>${re}</i>.`);
        }
        re = $("#def_type").val().trim();
        if (re !== Driver.defaultType) {
            let reok = true;
            if (!config.allowedTypes.includes(re)) {
                const wl = re.length;
                if (re.indexOf("Staff/") !== 0 || (re.indexOf("Staff/") === 0 && (wl < 8 || wl > 9))) {
                    reok = false;
                }
            }
            if (reok) {
                Driver.defaultType = re;
                helper.LogSuccess(`Default <i>Observation type</i> set to <i>${re}</i>.`);
            } else {
                helper.LogError(`Default <i>Observation type</i> was not updated since the input <i>${re}</i> is invalid (must be one of the following: ` + config.allowedTypes.map(type => `<i>${type}</i>`).join(", ") + ")");
            }
        }
        re = $("#def_maxam").val().trim();
        if (re !== Driver.defaultAM) {
            if (helper.notFloat(re)) {
                helper.LogError(`Default <i>Maximum airmass</i> was not updated since the input <i>${re}</i> is invalid (must be a float).`);
            } else {
                Driver.defaultAM = re;
                helper.LogSuccess(`Default <i>Maximum airmass</i> set to <i>${re}</i>.`);
            }
        }
        re = $("#def_obstime").val().trim();
        if (re !== Driver.defaultObstime) {
            if (helper.notInt(re)) {
                helper.LogError(`Default <i>Observing time</i> was not updated since the input <i>${re}</i> is invalid (must be an integer).`);
            } else {
                Driver.defaultObstime = re;
                helper.LogSuccess(`Default <i>Observing time</i> set to <i>${re}</i>.`);
            }
        }
        re = $("#def_instrument").val().trim();
        if (re !== Driver.defaultInstrument) {
            Driver.defaultInstrument = re;
            helper.LogSuccess(`Default <i>Instrument</i> set to <i>${re}</i>.`);
        }
        re = $("#w_priority").val().trim();
        if (re !== Driver.wPriority) {
            if (helper.notFloat(re)) {
                helper.LogError(`<i>Priority</i> weight was not updated since the input <i>${re}</i> is invalid (must be a float).`);
            } else {
                Driver.wPriority = re;
                helper.LogSuccess(`<i>Priority</i> weight set to <i>${re}</i>.`);
            }
        }
        re = $("#w_urgency").val().trim();
        if (re !== Driver.wUrgency) {
            if (helper.notFloat(re)) {
                helper.LogError(`<i>Urgency</i> weight was not updated since the input <i>${re}</i> is invalid (must be a float).`);
            } else {
                Driver.wUrgency = re;
                helper.LogSuccess(`<i>Urgency</i> weight set to <i>${re}</i>.`);
            }
        }
        re = $("#w_altitude").val().trim();
        if (re !== Driver.wAltitude) {
            if (helper.notFloat(re)) {
                helper.LogError(`<i>Altitude</i> weight was not updated since the input <i>${re}</i> is invalid (must be a float).`);
            } else {
                Driver.wAltitude = re;
                helper.LogSuccess(`<i>Altitude</i> weight set to <i>${re}</i>.`);
            }
        }
        re = $("#w_slewing").val().trim();
        if (re !== Driver.wSlewing) {
            if (helper.notFloat(re)) {
                helper.LogError(`<i>Slewing</i> weight was not updated since the input <i>${re}</i> is invalid (must be a float).`);
            } else {
                Driver.wSlewing = re;
                helper.LogSuccess(`<i>Slewing</i> weight set to <i>${re}</i>.`);
            }
        }
        for (const k in Driver.FillColors) {
            re = $(`#def_col_${k.replace("-", "_")}`).val().trim();
            if (re !== Driver.FillColors[k]) {
                if (helper.validColour(re)) {
                    Driver.FillColors = [k, re];
                    helper.LogSuccess(`<i>${k}/fill colour</i> has been set to <i>${re}</i>.`);
                    resetCol = true;
                } else {
                    helper.LogError(`Input for <i>${k}/fill colour</i> is not a valid CSS colour (<i>${re}</i>).`);
                }
            }
            re = $(`#def_tcol_${k.replace("-", "_")}`).val().trim();
            if (re !== Driver.TextColors[k]) {
                if (helper.validColour(re)) {
                    Driver.TextColors = [k, re];
                    helper.LogSuccess(`<i>${k}/text colour</i> has been set to <i>${re}</i>.`);
                    resetCol = true;
                } else {
                    helper.LogError(`Input for <i>${k}/text colour</i> is not a valid CSS colour (<i>${re}</i>).`);
                }
            }
            if (resetCol) {
                for (const target of this.targets.Targets) {
                    target.resetColours();
                }
            }
        }
        this.night.setEphemerides();
        this.Refresh();

        helper.LogDebug("Saving new configuration to the browser...");
        localStorage.setItem("visplot", true);
        localStorage.setItem("telescopeName", Driver.telescopeName);
        localStorage.setItem("defaultEpoch", Driver.defaultEpoch);
        localStorage.setItem("defaultProject", Driver.defaultProject);
        localStorage.setItem("defaultType", Driver.defaultType);
        localStorage.setItem("defaultAM", Driver.defaultAM);
        localStorage.setItem("defaultObstime", Driver.defaultObstime);
        localStorage.setItem("defaultInstrument", Driver.defaultInstrument);
        localStorage.setItem("wPriority", Driver.wPriority);
        localStorage.setItem("wUrgency", Driver.wUrgency);
        localStorage.setItem("wAltitude", Driver.wAltitude);
        localStorage.setItem("wSlewing", Driver.wSlewing);
        for (const k in Driver.FillColors) {
            localStorage.setItem(`fill_${k}`, Driver.FillColors[k]);
        }
        for (const k in Driver.TextColors) {
            localStorage.setItem(`text_${k}`, Driver.TextColors[k]);
        }
        localStorage.setItem("opt_reschedule_later", $("#opt_reschedule_later").is(":checked"));
        localStorage.setItem("opt_reorder_targets", $("#opt_reorder_targets").is(":checked"));
        localStorage.setItem("opt_allow_over_axis", $("#opt_allow_over_axis").is(":checked"));
        localStorage.setItem("opt_algorithm", $('input[type="radio"][name="opt_algorithm"]:checked').val());
        localStorage.setItem("opt_schedule_between", $('input[type="radio"][name="opt_schedule_between"]:checked').val());
        localStorage.setItem("opt_show_lastobstime", $("#opt_show_lastobstime").is(":checked"));
        localStorage.setItem("opt_colour_targets", $("#opt_colour_targets").is(":checked"));
        helper.LogEntry("Done.");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.CallbackUpdateDefaults = function () {
    try {
        if ($("#configsubmit").val() === "false") {
            return;
        }
        helper.LogEntry("Updating default parameters...");
        const re = $("#def_telescope").val().trim();
        if (re !== Driver.telescopeName) {
            if (Object.keys(telescopes).includes(re)) {
                driver.setTelescopeName(re).then(function () {
                    // Recalculate ephemerides
                    driver.CallbackSetDate();
                    helper.LogSuccess(`<i>Telescope name</i> set to <i>${re}</i>.`);
                    driver.CallbackUpdateDefaultsAfterTelUpdate(true);
                });
            } else {
                helper.LogError("<i>Telescope name</i> was not updated since the input was invalid.");
                driver.CallbackUpdateDefaultsAfterTelUpdate(false);
            }
        } else {
            driver.CallbackUpdateDefaultsAfterTelUpdate(false);
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.CallbackShowCurrentTime = function () {
    try {
        if (!this.nightInitialized) {
            return;
        }
        const now = new Date();
        if (now < this.night.DateSunset || now > this.night.DateSunrise) {
            return;
        }
        this.Refresh();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.Refresh = function (resized = false) {
    try {
        // Cache some variables
        const graph = driver.graph;
        const canvas = driver.canvas;
        const context = driver.context;
        const night = driver.night;
        const targets = driver.targets;
        const minwidth = driver.graph.minwidth;
        const ratio = driver.graph.ratio;
        const winheight = parseInt(window.innerHeight) - 4;
        let winwidth = parseInt(window.innerWidth) - 4;
        let cw, ch;
        if (winwidth <= 1600) {
            cw = Math.max(minwidth, window.innerWidth);
            ch = Math.floor(cw / ratio);
        } else {
            if (window.jsplitterSettings) {
                window.jsplitterSettings.maxleftwidth = winwidth - driver.graph.minwidth - 10;
            }
            winwidth -= $("#sidebar").innerWidth() + 10;
            // Try to fill the window vertically (normally, the aspect ratio is > 1.4)
            ch = winheight;
            cw = parseInt(ch * ratio);
            // If we overflow the width, then fill the window horizontally and adjust the height
            if (cw > winwidth) {
                ch = Math.floor(winwidth / ratio);
                cw = Math.floor(ch * ratio);
            } else {
                cw = winwidth;
            }
        }
        // Resize the canvas to fit the window
        $("#canvasFrame").height(`${ch}px`);
        $("#canvasFrame").width(`${cw}px`);
        canvas.height = ch;
        canvas.width = cw;
        driver.rescaleCanvas(canvas, context);

        // Measure text to figure out margins
        graph.Resize(canvas, context);

        document.title = `${Driver.telescopeName}/Visplot`;
        context.clearRect(0, 0, canvas.width, canvas.height);
        /* Recalculate xaxis */
        graph.xaxis = [];
        for (let i = 0; i < night.Nx; i += 1) {
            graph.xaxis.push(graph.xstart + graph.width * (night.xaxis[i] - night.Sunset) / night.wnight);
        }
        if (resized) {
            targets.setTargetsSize();
        }
        if (driver.nightInitialized) {
            graph.drawBackground(context);
            graph.drawEphemerides(context);
            if (driver.mouseInsideObject > -1) {
                driver.graph.highlightTarget(context, targets.Targets[driver.mouseInsideObject]);
            }
            graph.drawTargets(context, targets.Targets, driver.mouseInsideObject > -1);
            if (driver.scheduleMode) {
                graph.drawSchedule(context);
            } else if (targets.nTargets > 0) {
                graph.drawTargetNames(context, targets.Targets);
            }
        }

        $(".canvas-link").css("bottom", `${$("#canvas-wrapper").height() - ch + graph.scale(12)}px`).css("font-size", graph.pt(7));
        $(".canvas-link").blur();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.markAsObserved = function (observed) {
    try {
        const idOfObserved = $("#id_of_observed").val();
        const obj = this.targets.Targets[idOfObserved];
        obj.Observed = observed;
        obj.ObservedStartTime = $("#actual_start").val();
        obj.ObservedEndTime = $("#actual_end").val();
        obj.Comments = $("#popcomm").val();
        obj.resetColours();
        this.Refresh();
        helper.LogSuccess(`Object <i>${obj.Name}</i> ${observed ? "" : "is no longer "}marked as <i>Observed</i>.`);
        $.fancybox.close();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.rescaleCanvas = function (cnv, ctx) {
    try {
        // Query the various pixel ratios
        const devicePixelRatio = window.devicePixelRatio || 1;
        const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
        const ratio = devicePixelRatio / backingStoreRatio;

        // Upscale the canvas if the two ratios do not match
        if (devicePixelRatio !== backingStoreRatio) {
            const oldWidth = cnv.width;
            const oldHeight = cnv.height;

            cnv.width = oldWidth * ratio;
            cnv.height = oldHeight * ratio;

            cnv.style.width = `${oldWidth}px`;
            cnv.style.height = `${oldHeight}px`;

            // Now scale the context to counter the fact that we have manually scaled our canvas element
            ctx.scale(ratio, ratio);
        }

        // Save for later
        window.ratio = ratio;
    } catch (ex) {
        helper.LogException(ex);
    }
};

Driver.prototype.setTelescopeName = function (val, initial=false) {
    try {
        return new Promise(function (resolve) {
            if (Object.keys(telescopes).includes(val) && Driver._telescopeName !== val) {
                Driver._telescopeName = val;
                $("#def_telescope").val(val);
                // Mark on map
                driver.highlightCurrentTelescope();
                // Background with telescope image
                $("#canvasFrame").css("background-image", 'url(' + window.baseurl + (telescopes[val].background || config.defaultTelescopeImage) + ')');
                // Recalculate Skycam properties
                driver.skyGraph.updateTelescope();
                if (!initial) {
                    // Revalidate targets to recompute TCS lines
                    driver.targets.validateAndFormatTargets().then(() => {
                        // Replot targets
                        $("#dateSet").trigger("click");
                        $("#plotTargets").trigger("click");
                        resolve();
                    }).catch(ex => { helper.LogException(ex); resolve(); });
                } else {
                    resolve();
                }
            } else {
                return resolve();
            }
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
Driver._fillObj = config.defaultFillColors;

/**
 * @memberof Driver
 */
Driver._textObj = config.defaultTextColors;

/**
 * @memberof Driver
 */
Object.defineProperties(Driver, {
    telescopeName: {
        get: function () {
            return this._telescopeName || config.defaultTelescopeName;
        }
    },
    updSchedText: {
        get: function () {
            return "Update schedule";
        }
    },
    obsLatDeg: {
        get: function () {
            return telescopes[this.telescopeName].latitude;
        }
    },
    obsLonDeg: {
        get: function () {
            return telescopes[this.telescopeName].longitude;
        }
    },
    obsLatRad: {
        get: function () {
            return sla.d2r * Driver.obsLatDeg;
        }
    },
    obsLonRad: {
        get: function () {
            return sla.d2r * Driver.obsLonDeg;
        }
    },
    isUTC: {
        get: function () {
            return this._timezoneE === 0 && this._timezoneM === 0;
        }
    },
    hasDST: {
        get: function () {
            return this._timezoneE !== this._timezoneM;
        }
    },
    timezoneName: {
        get: function () {
            return telescopes[this.telescopeName].timezoneName;
        }
    },
    obsTimezoneE: {
        get: function () {
            return this._timezoneE;
        }, set: function (val) {
            this._timezoneE = val;
        }
    },
    obsTimezoneM: {
        get: function () {
            return this._timezoneM;
        }, set: function (val) {
            this._timezoneM = val;
        }
    },
    obsTimezoneAbbrE: {
        get: function () {
            return this._tzAbbrE;
        }, set: function (val) {
            this._tzAbbrE = val;
        }
    },
    obsTimezoneAbbrM: {
        get: function () {
            return this._tzAbbrM;
        }, set: function (val) {
            this._tzAbbrM = val;
        }
    },
    obsTimezoneDescriptionE: {
        get: function () {
            return this._tzDescriptionE;
        }, set: function (val) {
            this._tzDescriptionE = val;
        }
    },
    obsTimezoneDescriptionM: {
        get: function () {
            return this._tzDescriptionM;
        }, set: function (val) {
            this._tzDescriptionM = val;
        }
    },
    obsAltitude: {
        get: function () {
            return telescopes[this.telescopeName].altitude;
        }
    },
    currentDut: {
        get: function () {
            // Reported in milliseconds -> Julian days
            return 68.9677 / (1000 * sla.d2s);
        }
    },
    obsLowestLimit: {
        get: function () {
            return telescopes[this.telescopeName].lowestLimit || null;
        }
    },
    obsHighestLimit: {
        get: function () {
            return telescopes[this.telescopeName].highestLimit || null;
        }
    },
    obsDeclinationLimit: {
        get: function () {
            return telescopes[this.telescopeName].declinationLimit || null;
        }
    },
    obsLowerHatch: {
        get: function () {
            return telescopes[this.telescopeName].vignetteLimit || null;
        }
    },
    plotTitle: {
        get: function () {
            const lon = sla.r2d * sla.drange(this.obsLonRad);
            const telescope = telescopes[this.telescopeName];
            return `Altitudes at ${this.telescopeName}, ` +
                (typeof telescope.site !== "undefined" && telescope.site !== null ? telescope.site + ", " : "") +
                (lon >= 0 ? `${lon.toFixed(4)}E ` : `${Math.abs(lon).toFixed(4)}W `) +
                (this.obsLatDeg > 0 ? `+${this.obsLatDeg.toFixed(4)}N` : `${Math.abs(this.obsLatDeg).toFixed(4)}S`) +
                ", " + this.obsAltitude.toFixed(0) + " m above sea level";
        }
    },
    defaultEpoch: {
        get: function () {
            return this._defaultEpoch || String(config.defaultEpoch);
        }, set: function (val) {
            this._defaultEpoch = val;
        }
    },
    defaultObstime: {
        get: function () {
            return this._defaultObstime || String(config.defaultObstime);
        }, set: function (val) {
            this._defaultObstime = val;
        }
    },
    defaultProject: {
        get: function () {
            return this._defaultProject || config.defaultProject;
        }, set: function (val) {
            this._defaultProject = val;
        }
    },
    defaultAM: {
        get: function () {
            return this._defaultAM || config.defaultMaxAirmass.toFixed(1);
        }, set: function (val) {
            this._defaultAM = val;
        }
    },
    defaultType: {
        get: function () {
            return this._defaultType || config.defaultType;
        }, set: function (val) {
            this._defaultType = val;
        }
    },
    defaultInstrument: {
        get: function () {
            return this._defaultInstrument || (telescopes[Driver.telescopeName].defaultInstrument || config.defaultInstrument);
        }, set: function (val) {
            this._defaultInstrument = val;
        }
    },
    defaultSkyPA: {
        get: function () {
            return this._defaultSkyPA || String(config.defaultSkyPA);
        }, set: function (val) {
            this._defaultSkyPA = val;
        }
    },
    defaultPriority: {
        get: function() {
            return String(config.defaultPriority);
        }
    },
    wPriority: {
        get: function() {
            return this._wPriority || config.defaultWPriority;
        }, set: function(val) {
            this._wPriority = val;
        }
    },
    wUrgency: {
        get: function() {
            return this._wUrgency || config.defaultWUrgency;
        }, set: function(val) {
            this._wUrgency = val;
        }
    },
    wAltitude: {
        get: function() {
            return this._wAltitude || config.defaultWAltitude;
        }, set: function(val) {
            this._wAltitude = val;
        }
    },
    wSlewing: {
        get: function() {
            return this._wSlewing || config.defaultWSlewing;
        }, set: function(val) {
            this._wSlewing = val;
        }
    },
    instruments: {
        get: function() {
            return telescopes[Driver.telescopeName].instruments || config.defaultInstrumentList;
        }
    },
    FillColors: {
        get: function () {
            return this._fillObj;
        }, set: function (val) {
            this._fillObj[val[0]] = val[1];
        }
    },
    TextColors: {
        get: function () {
            return this._textObj;
        }, set: function (val) {
            this._textObj[val[0]] = val[1];
        }
    },
    BlankFieldsNorth: {
        get: function () {
            return "# Northern blank fields\n" +
                   config.blanksNorthern.map(function (e) {
                       return `${e.trim()} 2000 ${Driver.defaultObstime} ${Driver.defaultProject} ${Driver.defaultAM},NT+AT`;
                   }).filter(Boolean).join("\n");
        }
    },
    BlankFieldsSouth: {
        get: function () {
            return "# Southern blank fields\n" +
                   config.blanksSouthern.map(function (e) {
                       return `${e.trim()} 2000 ${Driver.defaultObstime} ${Driver.defaultProject} ${Driver.defaultAM},NT+AT`;
                   }).filter(Boolean).join("\n");
        }
    },
    StandardsNorth: {
        get: function () {
            return "# Northern spectrophotometric standards\n" +
                   config.standardsNorthern.map(function (e) {
                       return e.trim();
                   }).filter(Boolean).join("\n");
        }
    },
    StandardsSouth: {
        get: function () {
            return "# Southern spectrophotometric standards\n" +
                   config.standardsSouthern.map(function (e) {
                       return e.trim();
                   }).filter(Boolean).join("\n");
        }
    }
});
