/**
 * @author Emanuel Gafton
 * @copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */

function serializer() {
}

serializer.BindEvents = function () {
    $('#saveDoc').click(function () {
        serializer.saveDocument();
    });

    $('#loadDoc').change(function (e) {
        serializer.loadDocument(e);
    });

    $('#pngExport').click(function () {
        serializer.exportPNG();
    });
};

serializer.saveDocument = function () {
    helper.Log('Exporting schedule in visplot format...');
    try {
        const zip = new JSZip();
        zip.file("visplot.txt", JSON.stringify({
            night: driver.night,
            graph: driver.graph,
            targets: driver.targets,
            ta: $('#targets_actual').val(),
            tgts: driver.CMeditor.getValue(),
            driver: {ob: driver.ob, obdata: driver.obdata, obLines: driver.obLines, obLinks: driver.obLinks, obExtraInfo: driver.obExtraInfo, obprocessed: driver.obprocessed, nightInitialized: driver.nightInitialized, scheduleMode: driver.scheduleMode, defaultEpoch: Driver.defaultEpoch, defaultProject: Driver.defaultProject, defaultType: Driver.defaultType, defaultObstime: Driver.defaultObstime, FillColors: Driver.FillColors, TextColors: Driver.TextColors}
        }));
        zip.generateAsync({
            mimeType: "application/octet-stream",
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {level: 9}
        }).then(function (content) {
            saveAs(content, "schedule.visplot");
        });
        helper.LogEntry('Done.');
    } catch (e) {
        helper.LogError('Error: <i>' + e + '</i>');
    }
};

serializer.loadDocument = function (e) {
    helper.LogEntry('Importing schedule from the given file...');
    const files = e.target.files; // FileList object
    if (files === false || files === null || files === undefined || files.length != 1) {
        helper.LogError('Error: Failed to load the file.');
        return;
    }
    const new_zip = new JSZip();
    new_zip.loadAsync(files[0]).then(function (zip) {
        if (zip === false || zip === null || zip === undefined) {
            helper.LogError('Error: Could not open the file because it has an invalid format.');
            return;
        }
        new_zip.file("visplot.txt").async("string").then(function (txt) {
            const obj = JSON.parse(txt);
            if (obj === false || obj === null || obj === undefined || obj.night === null || obj.night === undefined || obj.graph === null || obj.graph === undefined || obj.driver === null || obj.driver === undefined || obj.targets === null || obj.targets === undefined) {
                helper.LogError('Error: Could not open the file because it has an invalid format.');
                return;
            }
            driver.ob = obj.driver.ob;
            driver.obdata = obj.driver.obdata;
            driver.obLines = obj.driver.obLines;
            driver.obLinks = obj.driver.obLinks;
            driver.obExtraInfo = obj.driver.obExtraInfo;
            driver.obprocessed = obj.driver.obprocessed;
            driver.nightInitialized = obj.driver.nightInitialized;
            driver.scheduleMode = obj.driver.scheduleMode;
            Driver.defaultEpoch = obj.driver.defaultEpoch;
            Driver.defaultProject = obj.driver.defaultProject;
            Driver.defaultType = obj.driver.defaultType;
            Driver.defaultObstime = obj.driver.defaultObstime;
            for (let k in Driver.FillColors) {
                Driver.FillColors = [k, obj.driver.FillColors[k]];
                Driver.TextColors = [k, obj.driver.TextColors[k]];
            }
            Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
                obj.__proto__ = proto;
                return obj;
            };
            let deserialize = function (object) {
                Object.setPrototypeOf(object, window[object['#']].prototype);
                return object;
            };
            driver.night = Object.setPrototypeOf(obj.night, Night.prototype);
            driver.graph = Object.setPrototypeOf(obj.graph, Graph.prototype);
            driver.targets = Object.setPrototypeOf(obj.targets, TargetList.prototype);
            for (let i = 0; i < obj.targets.nTargets; i += 1) {
                Object.setPrototypeOf(driver.targets.Targets[i], Target.prototype);
            }
            helper.LogEntry('Done.');
            $('#targets_actual').val(obj.ta);
            $('#dateY').val(driver.night.year);
            $('#dateM').val(helper.padTwoDigits(driver.night.month));
            $('#dateD').val(helper.padTwoDigits(driver.night.day));
            driver.CMeditor.setValue(obj.tgts);
            driver.graph.ctx = driver.context;
            driver.graph.canvas = driver.canvas;
            driver.nightInitialized = true;
            driver.Refresh();
            if (driver.scheduleMode) {
                driver.targets.display_scheduleStatistics();
                $('#pngExport').removeAttr('disabled');
                $('#planNight').val(Driver.updSchedText);
            }
            $('#tcsExport').removeAttr('disabled');
            $('#planNight').removeAttr('disabled');
            $('#saveDoc').removeAttr('disabled');
        }).catch(function (e) {
            helper.LogError('Error: Could not open the file because it has an invalid format (' + e + ').');
            return;
        });
    }).catch(function (e) {
        helper.LogError('Error: Could not open the file because it has an invalid format (' + e + ').');
        return;
    });
};

serializer.exportPNG = function () {
    /* By default, HTML5 canvases are exported with a transparent background
     (which might be rendered improperly, i.e. with a black background, in some viewers).
     This function automatically adds a white background to the image and opens 
     the resulting, composited png file in a new tab/window.
     */
    helper.LogEntry('Trying to export png file...');
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
    helper.LogSuccess('Done! The png file has been opened in a new tab.');
    // Open image in a new tab
    window.open(imageData, "_blank");
};
