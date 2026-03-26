/**
 * @copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
"use strict";

/**
 * @namespace
 */
function serializer() {
}

/**
 * Bind click events to HTML buttons.
 */
serializer.BindEvents = function () {
    $("#saveDoc").click(function () {
        serializer.saveDocument();
    });

    $("#loadDoc").change(function (e) {
        serializer.loadDocument(e);
    });

    $("#pngExport").click(function () {
        serializer.exportPNG();
    });

    $("#pdfExport").click(function () {
        serializer.exportPDF();
    });

    $("#tcsSave").click(function () {
        serializer.saveTCS();
    });
};

/**
 * Save the observing schedule and all the settings to a file.
 */
serializer.saveDocument = function () {
    helper.Log("Exporting schedule in visplot format...");
    try {
        const zip = new JSZip();
        zip.file(config.zipContent, JSON.stringify({
            night: driver.night,
            graph: driver.graph,
            targets: driver.targets,
            ta: $("#targets_actual").val(),
            tgts: driver.CMeditor.getValue(),
            driver: {
                ob: driver.ob,
                obdata: driver.obdata,
                obprocessed: driver.obprocessed,
                nightInitialized: driver.nightInitialized,
                scheduleMode: driver.scheduleMode,
                resolvedEphemerides: driver.resolvedEphemerides,
                resolvedIdentifiers: driver.resolvedIdentifiers,
                telescopeName: Driver.telescopeName,
                defaultEpoch: Driver.defaultEpoch,
                defaultProject: Driver.defaultProject,
                defaultType: Driver.defaultType,
                defaultAM: Driver.defaultAM,
                defaultObstime: Driver.defaultObstime,
                defaultInstrument: Driver.defaultInstrument,
                wPriority: Driver.wPriority,
                wUrgency: Driver.wUrgency,
                wAltitude: Driver.wAltitude,
                wSlewing: Driver.wSlewing,
                FillColors: Driver.FillColors,
                TextColors: Driver.TextColors,
                "opt_reschedule_later": $("#opt_reschedule_later").is(":checked"),
                "opt_reorder_targets": $("#opt_reorder_targets").is(":checked"),
                "opt_allow_over_axis": $("#opt_allow_over_axis").is(":checked"),
                "opt_schedule_between": $('input[type="radio"][name="opt_schedule_between"]:checked').val(),
                "opt_show_lastobstime": $("#opt_show_lastobstime").is(":checked")
            },
            version: window.version
        }));
        zip.generateAsync(config.zipOptions).then(function (content) {
            window.saveAs(content, config.zipName);
        });
        helper.LogEntry("Done.");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * Save the list of targets in TCS format to disk.
 */
serializer.saveTCS = function () {
    helper.Log("Exporting schedule in TCS format...");
    let filename;
    if (["NOT", "WHT", "INT"].includes(Driver.telescopeName)) {
        filename = "visplot.cat";
    } else if (["HJST", "OST"].includes(Driver.telescopeName)) {
        filename = "visplot.wrk";
    }
    try {
        const blob = new Blob(
            [$("#tcspre").html()],
            {
                type: "text/plain;charset=utf-8"
            });
        window.saveAs(blob, filename);
        helper.LogEntry("Done.");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * Load an observing schedule from disk.
 */
serializer.loadDocument = function (e) {
    helper.LogEntry("Importing schedule from the given file...");
    const files = e.target.files; // FileList object
    if (files === false || files === null || typeof files === "undefined" || files.length !== 1) {
        helper.LogError("Failed to load the file.");
        return;
    }
    const newZip = new JSZip();
    newZip.loadAsync(files[0]).then(function (zip) {
        if (zip === false || zip === null || typeof zip === "undefined") {
            helper.LogError("Could not open the file because it has an invalid format.");
            return;
        }
        newZip.file(config.zipContent).async("string").then(function (txt) {
            const obj = JSON.parse(txt);
            const badObj = obj === false || obj === null || typeof obj === "undefined";
            const badNight = obj.night === null || typeof obj.night === "undefined";
            const badGraph = obj.graph === null || typeof obj.graph === "undefined";
            const badDriver = obj.driver === null || typeof obj.driver === "undefined";
            const badTargets = obj.targets === null || typeof obj.targets === "undefined";
            if (badObj || badNight || badGraph || badDriver || badTargets) {
                helper.LogError("Could not open the file because it has an invalid format.");
                return;
            }
            const badVersion = obj.version === null || typeof obj.version === "undefined" || obj.version !== window.version;
            if (badVersion) {
                helper.LogWarning(`The file ${files[0].name} has been produced with a different version of Visplot. Some functionality may be limited or unavailable.`);
            }
            driver.ob = obj.driver.ob;
            driver.obdata = obj.driver.obdata;
            driver.obprocessed = obj.driver.obprocessed;
            driver.nightInitialized = obj.driver.nightInitialized;
            driver.scheduleMode = obj.driver.scheduleMode;
            if (typeof obj.driver.resolvedEphemerides !== "undefined") {
                driver.resolvedEphemerides = obj.driver.resolvedEphemerides;
            } else {
                driver.resolvedEphemerides = {};
            }
            if (typeof obj.driver.resolvedIdentifiers !== "undefined") {
                driver.resolvedIdentifiers = obj.driver.resolvedIdentifiers;
            } else {
                driver.resolvedIdentifiers = {};
            }
            driver.setTelescopeName(obj.driver.telescopeName).then(function() {
                Driver.defaultEpoch = obj.driver.defaultEpoch;
                Driver.defaultProject = obj.driver.defaultProject;
                Driver.defaultAM = obj.driver.defaultAM;
                Driver.defaultType = obj.driver.defaultType;
                Driver.defaultObstime = obj.driver.defaultObstime;
                for (let k in Driver.FillColors) {
                    Driver.FillColors = [k, obj.driver.FillColors[k]];
                    Driver.TextColors = [k, obj.driver.TextColors[k]];
                }
                // Backwards-compatibility
                if (typeof obj.driver.defaultInstrument !== "undefined") {
                    Driver.defaultInstrument = obj.driver.defaultInstrument;
                }
                if (typeof obj.driver.wPriority !== "undefined") {
                    Driver.wPriority = obj.driver.wPriority;
                }
                if (typeof obj.driver.wUrgency !== "undefined") {
                    Driver.wUrgency = obj.driver.wUrgency;
                }
                if (typeof obj.driver.wAltitude !== "undefined") {
                    Driver.wAltitude = obj.driver.wAltitude;
                }
                if (typeof obj.driver.wSlewing !== "undefined") {
                    Driver.wSlewing = obj.driver.wSlewing;
                }
                if (typeof obj.driver.opt_reschedule_later !== "undefined") {
                    $("#opt_reschedule_later").prop("checked", obj.driver.opt_reschedule_later === true);
                }
                if (typeof obj.driver.opt_reorder_targets !== "undefined") {
                    $("#opt_reorder_targets").prop("checked", obj.driver.opt_reorder_targets === true);
                }
                if (typeof obj.driver.opt_allow_over_axis !== "undefined") {
                    $("#opt_allow_over_axis").prop("checked", obj.driver.opt_allow_over_axis === true);
                }
                if (typeof obj.driver.opt_schedule_between !== "undefined") {
                    $(`#${obj.driver.opt_schedule_between}`).prop("checked", true);
                }
                if (typeof obj.driver.opt_show_lastobstime !== "undefined") {
                    $("#opt_show_lastobstime").prop("checked", obj.driver.opt_show_lastobstime === true);
                }
                Object.setPrototypeOf = Object.setPrototypeOf || function (object, proto) {
                    object.__proto__ = proto;
                    return object;
                };
                driver.night = Object.setPrototypeOf(obj.night, Night.prototype);
                driver.graph = Object.setPrototypeOf(obj.graph, Graph.prototype);
                driver.targets = Object.setPrototypeOf(obj.targets, TargetList.prototype);
                for (let i = 0; i < obj.targets.nTargets; i += 1) {
                    Object.setPrototypeOf(driver.targets.Targets[i], Target.prototype);
                }
                helper.LogEntry("Done.");
                $("#targets_actual").val(obj.ta);
                $("#dateY").val(driver.night.year);
                $("#dateM").val(helper.padTwoDigits(driver.night.month));
                $("#dateD").val(helper.padTwoDigits(driver.night.day));
                driver.CMeditor.setValue(obj.tgts);
                driver.nightInitialized = true;
                driver.Refresh();
                if (driver.scheduleMode) {
                    driver.targets.displayScheduleStatistics();
                    $("#planNight").val(Driver.updSchedText);
                }
                $("#tcsExport").removeAttr("disabled");
                $("#planNight").removeAttr("disabled");
                $("#saveDoc").removeAttr("disabled");
            });
        }).catch(ex => { helper.LogException(ex); });
    }).catch(function (ex) {
        helper.LogException(ex);
    });
};

/**
 * Export the canvas as a png file.
 */
serializer.exportPNG = function () {
    try {
        /* By default, HTML5 canvases are exported with a transparent background
        (which might be rendered improperly, i.e. with a black background, in some viewers).
        This function automatically adds a white background to the image and opens
        the resulting, composited png file in a new tab/window.
        */
        helper.LogEntry("Trying to export png file...");
        // Save context state
        const w = driver.canvas.width;
        const h = driver.canvas.height;
        const data = driver.context.getImageData(0, 0, w, h);
        const compositeOperation = driver.context.globalCompositeOperation;
        // Add a white background behind everything else that is already drawn
        driver.context.globalCompositeOperation = "destination-over";
        driver.context.fillStyle = "#fff";
        driver.context.fillRect(0, 0, w, h);
        // Save image
        const imageData = driver.canvas.toDataURL("image/png");
        // Restore context state
        driver.context.clearRect(0, 0, w, h);
        driver.context.putImageData(data, 0, 0);
        driver.context.globalCompositeOperation = compositeOperation;
        helper.LogSuccess("Done! The png file has been opened in a new tab.");
        // Open image in a new tab
        window.open(imageData, "_blank");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * Export the canvas as a pdf file.
 */
serializer.exportPDF = async function () {
    try {
        helper.LogEntry("Trying to export svg file...");
        // Save context state
        const w = driver.canvas.width / window.devicePixelRatio;
        const h = driver.canvas.height / window.devicePixelRatio;
        const ctx = new C2S(w, h);
        const graph = driver.graph;
        graph.drawTargets(ctx, driver.targets.Targets, false);
        graph.drawEphemerides(ctx);
        graph.drawBackground(ctx, true);
        if (driver.scheduleMode) {
            graph.drawSchedule(ctx);
        } else {
            graph.drawTargetNames(ctx, driver.targets.Targets);
        }
        const svgString = ctx.getSerializedSvg(true);
        const res = await window.fetch(`${window.baseurl}assets/Ubuntu-Regular.ttf`);
        const fontData = await res.arrayBuffer();
        // Create PDF document
        const ratio = 72/96;
        const doc = new PDFDocument({
            size: [w*ratio, h*ratio],
            margin: 0
        });
        doc.registerFont("Ubuntu", fontData);
        doc.font("Ubuntu");
        const stream = doc.pipe(blobStream());
        SVGtoPDF(doc, svgString, 0, 0, {
            fontCallback: (family) => {
                // Normalize the family string
                const name = family.toLowerCase();
                // Primary font: Ubuntu
                if (name.includes("ubuntu")) {
                    return "Ubuntu";
                }
                // Fallback for missing symbols (arrows, boxes, etc.)
                return "Helvetica";
            }
        });
        doc.end();
        stream.on("finish", function () {
            const url = stream.toBlobURL("application/pdf");
            window.open(url, "_blank");
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};
