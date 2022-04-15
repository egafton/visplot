/**
 * @author ega
 * @copyright (c) 2016-2022 ega, NOT/ING.
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
    /*
     * Version number (with brief changelog):
     *
     * 1.0 - Initial version, in use at the NOT until 2021
     *     - Altitude computations performed on the server side (pyephem)
     *
     * 2.0 - First version hosted on github
     *     - Includes a ported subset of slalib
     *     - All computations now performed on the client side
     *
     * 2.1 - Improved handling of OB data
     *     - Different Aladin surveys used for optical vs infrared instruments
     *     - Many bug fixes (part of them reported by NOT staff)
     *     - Syntax highlight for line comments
     *     - Revamped Configuration and Help sections
     *     - Updated 3rd party libraries
     *
     * 2.2 - Aladin is hosted locally, and allows arbitrary position angles
     *     - Aladin FoV is now instrument-specific, as defined in config.js
     *     - Many bug fixes (part of them reported by NOT staff)
     *
     * 2.3 - Added CATServer OB type
     *
     * 2.4 - Added more telescopes, and support for telescopes in different
     *       time zones.
     *     - Now storing configuration in the browser's localStorage.
     *
     * 2.5 - Added declination limits for equatorial-mount telescopes,
     *       either as ha(dec) or as alt(dec).
     *     - Updated README file and included a screenshot of Visplot.
     *     - Added footer with misc. information and links to GitHub.
     *     - Changed UT to UTC, since that is what we are using.
     *     - Telescope name and default AM are now saved upon serialization.
     *     - Each telescope now has its own background image.
     *
     * 2.6 - Updated collision map for HJST.
     *     - Added the possibility of observing over-the-axis in equatorial
     *       mount telescopes.
     *     - Telescope lowest limit now enforced in the scheduling algorithm.
     */
    this.version = "2.6";
    helper.LogSuccess(`Hello, this is Visplot version ${this.version}`);

    /* HTML5 canvas, context and Graph class - related variables */
    this.canvas = document.getElementById("canvasFrame");
    this.context = this.canvas.getContext("2d");
    this.graph = new Graph(this.canvas, this.context);

    this.skyCanvas = document.getElementById("canvasSkycam");
    this.skyContext = this.skyCanvas.getContext("2d");
    this.skyGraph = new SkyGraph(this.skyCanvas, this.skyContext);

    this.rescaleCanvas(this.canvas, this.context);
    this.rescaleCanvas(this.skyCanvas, this.skyContext);

    /* Aladin object */
    this.objAladin = null;
    this.aladinInitialized = false;

    /* OB queue - related */
    this.ob = false;            // Whether or not the page is a referral from the OB queue
    this.obdata = null;         // Actual JSON-decoded object containing OB info
    this.obprocessed = false;   // OB info is processed automatically only once, upon page load

    // Night, targets, planning
    this.nightInitialized = false;
    this.scheduleMode = false;
    this.rescheduling = false;
    this.night = null;
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
            token: 'comment',
        }]
    });
    this.CMeditor = CodeMirror.fromTextArea($("#targets")[0], {
        lineNumbers: true,
        mode: "simplemode",
        styleActiveLine: { nonEmpty: false },
        extraKeys: {
            Tab: function () {
                driver.targets.validateAndFormatTargets();
                $("#plotTargets").focus();
            },
        }
    });

    // "global" variables to track various browser events
    this.reObj = null;   // Object that is being moved/rescheduled on the RHS
    this.reY = null;     // Tracking of mouse y-position during said rescheduling
    this.mouseInsideObject = -1;

    /* Update footer */
    $("#footer-year").text((new Date()).getUTCFullYear());
    $("#footer-version").text(this.version);
    $("#footer-version").attr("href", `https://github.com/egafton/visplot/tree/v${this.version}`);
    fetch(`https://api.github.com/repos/egafton/visplot/commits/tags/v${this.version}`)
        .then(res => res.json())
        .then(res => {
            $("#footer-date").text(`, committed on ${res.commit.author.date.replace("T", " at ").slice(0, 19)} UTC`);
        })
        .catch(error => {});
}

/**
 * @memberof Driver
 */
Driver.prototype.ParseOBInfoIfAny = function () {
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
                Driver.telescopeName = this.obdata.Telescope;
            }
        } else {
            helper.LogError("Error 35: Could not decode JSON object. Falling back to standard (non-OB) visplot...");
            this.ob = false;
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.Callback_SetDate = function (obj) {
    this.night.setEphemerides();
    this.nightInitialized = true;
    this.Refresh();
    helper.LogEntry("Done.");

    if (this.ob && !this.obprocessed) {
        helper.LogEntry("Processing the targets from the OB queue...");
        const ntargets = this.obdata.nTargets;
        helper.LogEntry(`${helper.plural(ntargets, "target")} found.`);
        let constraint;
        let lines = [];
        for (let i = 1; i <= ntargets; i += 1) {
            obj = this.obdata.Targets[`target${i}`];
            if ("LST1" in obj && "LST2" in obj) {
                constraint = `LST[${obj.LST1}-${obj.LST2}]`;
            } else {
                constraint = obj.Constraint;
            }
            const line = obj.Name + " " + obj.RA + (parseFloat(obj.PM.RA) === 0.0 ? "" : "/" + parseFloat(obj.PM.RA)) + " " + obj.Dec + (parseFloat(obj.PM.Dec) === 0.0 ? "" : "/" + parseFloat(obj.PM.Dec)) + " " + parseInt(obj.Epoch) + " " + obj.ObsTime + " " + obj.Proposal + " " + constraint + " " + obj.Type + " " + `${obj.Instrument}:${obj.Mode}:${obj.GroupID}:${obj.BlockID}`;
            lines.push(line);
        }
        this.obprocessed = true;
        this.CMeditor.setValue(lines.join("\n"));
        if (this.targets.validateAndFormatTargets()) {
            $("#plotTargets").trigger("click");
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.Callback_SetTargets = function (obj) {
    helper.LogEntry("Done.");
    if (this.RequestedScheduleType === 1) {
        this.targets.addTargets(obj.split(/\r?\n/));
    } else {
        this.targets.setTargets(obj.split(/\r?\n/));
    }
    this.Callback_UpdateSchedule();
};

/**
 * @memberof Driver
 */
Driver.prototype.Callback_UpdateSchedule = function () {
    if (this.RequestedScheduleType === 1) {
        helper.LogEntry("Updating schedule. Please wait...");
        this.targets.updateSchedule(this.targets.Targets);
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
};

/**
 * @memberof Driver
 */
Driver.prototype.BtnEvt_SetDate = function () {
    const year = helper.filterInt($("#dateY").val());
    const month = helper.filterInt($("#dateM").val());
    const day = helper.filterInt($("#dateD").val());
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        helper.LogError(`Error 36: Invalid date (${year}-${month}-${day}).`);
        return;
    }
    if (year < 1988 || year > 2100) {
        helper.LogError(`Error 37: Invalid year (${year}). Please enter a number between 1988 and 2100.`);
        return;
    }
    if (month < 1 || month > 12) {
        helper.LogError(`Error 38: Invalid month (${month}). Please enter a number between 1 and 12.`);
        return;
    }
    const dmax = helper.numberOfDays(year, month);
    if (day < 1 || day > dmax) {
        helper.LogError(`Error 39: Invalid day (${day}) for ${year}-${helper.padTwoDigits(month)}. Please enter a number between 1 and ${dmax}.`);
        return;
    }
    this.night = new Night(year, month, day);
    helper.LogEntry(`Initializing date to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)}...`);
    driver.Callback_SetDate();
};

/**
 * @memberof Driver
 */
Driver.prototype.BtnEvt_PlotTargets = function () {
    if (this.RequestedScheduleType < 1 || this.RequestedScheduleType > 3) {
        helper.LogError("Error 40: Unknown value for Driver.ReqestedScheduleType.");
        return;
    }
    if (!this.nightInitialized) {
        helper.LogError("Error 41: Night not initialized. Click on [Set] first!");
        return;
    }
    if (!this.targets.validateAndFormatTargets()) {
        return;
    }
    if (this.RequestedScheduleType !== 1 && this.scheduleMode) {
        if (!confirm("Are you sure you want to replot the targets?\nThe current schedule WILL BE LOST!")) {
            return;
        }
    }
    if (this.RequestedScheduleType === 1) {
        const ret = this.targets.prepareScheduleForUpdate();
        if (ret === "") { // nothing to do, since the input form has not been changed
            return;
        }
        if (ret === false) { // reschedule at will, since we are not in the middle of the night
            this.RequestedScheduleType = 2;
        } else { // we are in the middle of the night...
            if (ret === true) { // ... but there are no new targets; just redo the schedule and replot
                this.Callback_UpdateSchedule();
            } else { // ... and there are new targets;
                helper.LogEntry("Calculating altitudes for the new targets. Please wait...");
                driver.Callback_SetTargets($("#added_targets").val());
            }
        }
    }
    if (this.RequestedScheduleType !== 1) {
        if (this.RequestedScheduleType === 2 && !(this.targets.inputHasChanged($("#targets_actual").val(), this.targets.ComputedTargets))) {
            helper.LogEntry("No need to recompute altitudes. Proceeding to scheduling.");
            this.Callback_UpdateSchedule();
        } else {
            helper.LogEntry("Calculating altitudes for all targets. Please wait...");
            driver.Callback_SetTargets($("#targets_actual").val());
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrame_MouseMove = function (e) {
    if (this.targets.Ntargets === 0) {
        return;
    }
    let x = e.offsetX || e.layerX;
    let y = e.offsetY || e.layerY;
    x -= 12;
    y -= 12;
    if (this.rescheduling) {
        if (x > this.graph.targetsx) {
            for (let i = 0; i < this.targets.nTargets; i += 1) {
                const obj = this.targets.Targets[i];
                if (y >= obj.ystart && y <= obj.yend) {
                    this.reY = (y <= 0.5 * (obj.ystart + obj.yend) ? obj.ystart : obj.yend) + 1.5;
                    break;
                }
            }
        } else {
            this.reY = null;
        }
        this.graph.drawRHSofSchedule();
        return;
    }
    for (let i = 0; i < this.targets.nTargets; i += 1) {
        const obj = this.targets.Targets[i];
        if (this.insideObject(x, y, obj)) {
            if (this.mouseInsideObject !== i) {
                this.mouseInsideObject = i;
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.graph.drawTargets(this.targets.Targets);
                this.graph.highlightTarget(obj);
                this.graph.drawEphemerides();
                this.graph.drawBackground();
                if (this.scheduleMode) {
                    this.graph.drawSchedule();
                } else {
                    this.graph.drawTargetNames(this.targets.Targets);
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
};

/**
 * @memberof Driver
 */
Driver.prototype.insideObject = function (x, y, obj) {
    if (this.targets.nTargets === 0) {
        return false;
    }
    // xlab, ylab: where the objid is in the plot when it is not scheduled (at highest altitude)
    // xmid, ymid: where the objid is when it is scheduled (above the scheduled time)
    // rxmid, rymid: where the objid is on the right in schedulemode
    return (this.scheduleMode && obj.Scheduled && helper.PointInsideCircle(x, y, obj.xmid, obj.ymid, this.graph.CircleSizeSq)) || ((!this.scheduleMode || (this.scheduleMode && !obj.Scheduled)) && helper.PointInsideCircle(x, y, obj.xlab, obj.ylab, this.graph.CircleSizeSq)) || (helper.PointInsideCircle(x, y, obj.rxmid, obj.rymid, this.graph.CircleSizeSq));
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrame_MouseDown = function (e) {
    if (this.targets.Ntargets === 0 || !this.scheduleMode) {
        return;
    }
    let x = e.offsetX || e.layerX;
    let y = e.offsetY || e.layerY;
    x -= 12;
    y -= 12;
    if (x > this.graph.targetsx) {
        for (let i = 0; i < this.targets.nTargets; i += 1) {
            if (y >= this.targets.Targets[i].ystart && y <= this.targets.Targets[i].yend) {
                this.reObj = i;
                this.rescheduling = true;
                this.graph.drawRHSofSchedule();
            }
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrame_MouseUp = function (e) {
    if (this.targets.Ntargets === 0 || !this.scheduleMode) {
        return;
    }
    let x = e.offsetX || e.layerX;
    let y = e.offsetY || e.layerY;
    x -= 12;
    y -= 12;
    if (x > this.graph.targetsx) {
        if (!this.rescheduling) {
            return;
        } else {
            this.rescheduling = false;
            this.reY = null;
            let dropped = false;
            let le, ri;
            for (let i = 0; i < this.targets.nTargets; i += 1) {
                let llim = this.targets.Targets[i].ystart;
                let rlim = this.targets.Targets[i].yend;
                if (i === 0) {
                    llim -= 20;
                }
                if (i == this.targets.nTargets - 1) {
                    rlim += 50;
                }
                if (y >= llim && y <= rlim) {
                    if (y <= 0.5 * (this.targets.Targets[i].ystart + this.targets.Targets[i].yend)) {
                        le = i - 1;
                        ri = i;
                    } else {
                        le = i;
                        ri = i + 1;
                    }
                    if (le != this.reObj && ri != this.reObj) {
                        dropped = true;
                    }
                    break;
                }
            }
            if (dropped) {
                // reObj must come between le and ri
                let newscheduleorder = [];
                for (let i = 0; i < this.targets.nTargets; i += 1) {
                    if (i == this.reObj) {
                        continue;
                    }
                    if (ri == i) {
                        newscheduleorder.push(this.reObj);
                    }
                    newscheduleorder.push(i);
                    if (i == this.targets.nTargets - 1 && le == i) {
                        newscheduleorder.push(this.reObj);
                    }
                }
                helper.LogEntry("Rescheduling the observing night. Please wait...");
                this.targets.scheduleAndOptimize_givenOrder(newscheduleorder);
                helper.LogEntry("Done.");
                this.scheduleMode = true;
                this.Refresh();
            }
            this.graph.drawRHSofSchedule();
        }
    } else {
        if (this.rescheduling) {
            this.rescheduling = false;
            this.reY = null;
            this.graph.drawRHSofSchedule();
            return;
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrame_Click = function (e) {
    if (this.targets.Ntargets === 0) {
        return;
    }
    const x = (e.offsetX || e.layerX) - 12;
    const y = (e.offsetY || e.layerY) - 12;
    for (let i = 0; i < this.targets.nTargets; i += 1) {
        let obj = this.targets.Targets[i];
        if (this.insideObject(x, y, obj)) {
            let moonHasSet = obj.Scheduled ? (this.night.ymoon[helper.EphemTimeToIndex(obj.ScheduledMidTime)] < 0) : false;
            let LunarPhase = moonHasSet ? "D" :
                    (this.night.MoonIllumination <= 40 ? "D" : (
                            this.night.MoonIllumination <= 70 ? (obj.MinMoonDistance <= 90 ? "G" : "D")
                            : (obj.MinMoonDistance <= 60 ? "N" : "G")
                            ));
            $("#details_title").html(obj.Name);
            let info = `<h2 class="h2-instr">Object details</h2>` +
                `<p class="pp">Proposal: <b>${obj.ProjectNumber}</b></p>` +
                `<p class="pp">Type: <span style="margin-top:-2px;color:${obj.LabelFillColor}">&#11044;</span>&nbsp;<b>${obj.FullType}</b></p>` +
                `<p class="pp">RA: <b>${obj.RA}</b></p>` +
                `<p class="pp">Dec: <b>${obj.Dec.replace("-", "–")}</b></p>` +
                `<p class="pp">Epoch: <b>${obj.Epoch == "1950" ? "B1950" : "J2000"}</b></p>` +
                `<p class="pp">Moon Distance: <span title="${helper.LunarPhaseExplanation(LunarPhase)}"><b>${obj.MinMoonDistance}°</b> (${LunarPhase})</span></p>` +
                `<p class="pp">Moon Closest At: <b>${helper.EphemDateToHM(obj.MinMoonDistanceTime)} UTC</p>` +
                `<p class="pp">Obstime: <b>${obj.ExptimeSeconds.toFixed(0)} s</b> (${obj.ExptimeHM})</p>` +
                (obj.ExtraInfo === null
                    ? ""
                    : `<p class="pp">Instrument/Mode: <b>${obj.ExtraInfo}</b></p>`) +
                (obj.BacklinkToOBQueue === null
                    ? ""
                    : `<p class="pp"><a href="${obj.BacklinkToOBQueue}" target="_blank">Backlink to OB queue</a></p>`) +
                (this.scheduleMode || obj.Scheduled || obj.Observed
                    ? `<div style="height:5px; padding-top: 15px"></div><h2 class="h2-instr">Scheduling</h2>`
                    : "") +
                (this.scheduleMode
                    ? (obj.Scheduled
                        ? `<p class="pp">Suggested UTC: <b>${helper.EphemDateToHM(obj.ScheduledStartTime)}–${helper.EphemDateToHM(obj.ScheduledEndTime)}</b></p>`
                        : `<p class="pp">Not scheduled for observation.</p>`)
                      + `<p class="pp2"><span style="display:inline-block;width:80px">Started:</span><input type="text" class="inpshort" id="actual_start" /></p>`
                      + `<p class="pp2"><span style="display:inline-block;width:80px">Finished:</span><input type="text" class="inpshort" id="actual_end" /></p>`
                      + `<p class="pp2"><span style="display:inline-block;width:80px">Comments:</span><textarea id="popcomm"></textarea></p>`
                    : "") +
                ((obj.Scheduled)
                    ? (`<input type="hidden" id="id_of_observed" value="${i}" />`
                      + (obj.Observed
                        ? `<input id="unmark_as_observed" type="button" value="Remove the Observed tag" onclick="driver.markAsObserved(false);" />`
                        : `<input id="mark_as_observed" type="button" value="Mark as Observed" onclick="driver.markAsObserved(true);" />`))
                    : "");
            $("#details_info").html(info);
            if (this.scheduleMode) {
                $("#actual_start").val(obj.ObservedStartTime);
                $("#actual_end").val(obj.ObservedEndTime);
                $("#popcomm").val(obj.Comments);
            }

            let ra = obj.J2000[0] * sla.r2d;
            let dec = obj.J2000[1] * sla.r2d;
            let instrument = obj.Instrument;
            if (!(instrument in config[Driver.telescopeName].instruments)) {
                /* Got a weird instrument? Just show the default FoV*/
                instrument = config[Driver.telescopeName].defaultInstrument;
            }
            const fov = config[Driver.telescopeName].instruments[instrument].fov / 60;
            const surveyName = config[Driver.telescopeName].instruments[instrument].type == "optical"
                ? "P/DSS2/color"
                : "P/2MASS/color";
            $("#details_map_hang").html(surveyName);
            if (this.aladinInitialized) {
                this.objAladin.setImageSurvey(surveyName);
                this.objAladin.setFov(fov)
                this.objAladin.gotoRaDec(ra, dec);
            } else {
                this.objAladin = A.aladin("#details_map", {
                    target: `${ra} ${dec}`,
                    survey: surveyName,
                    fov: fov,
                    reticle: true,
                    showZoomControl: true,
                    showFullscreenControl: false,
                    showLayersControl: false,
                    showGotoControl: false,
                    reticleColor: "rgb(144, 238, 144)"
                });
                this.aladinInitialized = true;
            }
            $("a#inline").trigger("click");
            break;
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtFrame_Drop = function (e) {
    if (!this.nightInitialized) {
        return;
    }
    e.preventDefault();
    const dropped = e.originalEvent.dataTransfer.getData("Text");
    const numberPattern = /[+\-]?\d+(\.\d+)?/g;
    const floats = dropped.match(numberPattern).map(function (v) {
        return parseFloat(v);
    });
    if (floats.length == 6) {
        this.CMeditor.setValue(`Object ${floats.join(" ")}`);
        $("#plotTargets").trigger("click");
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.InitializeDate = function () {
    let year, month, day, datemsg;
    if (this.ob) {
        helper.LogEntry(`Date string provided by the OB queue: ${this.obdata.Date}`);
        year = parseInt(this.obdata.Date.substr(0, 4));
        month = parseInt(this.obdata.Date.substr(4, 2));
        day = parseInt(this.obdata.Date.substr(6, 2));
        datemsg = `Date set to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)}, as provided by the OB queue.`;
    } else {
        let now = new Date();
        helper.LogEntry(`Today is ${now.toUTCString()}, timezone set to UTC${helper.timezone(config[Driver.telescopeName].timezone)}`);
        day = now.getUTCDate();
        month = now.getUTCMonth() + 1;
        year = now.getUTCFullYear();
        if ((now.getUTCHours() + config[Driver.telescopeName].timezone) % 24 < 12) {
            if (day == 1) {
                let dd = helper.numberOfDays(year, month - 1);
                if (month === 0) {
                    year = year - 1;
                    month = 11;
                    day = dd;
                } else {
                    month = month - 1;
                    day = dd;
                }
            } else {
                day--;
            }
            datemsg = `Default date set to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)} (last night), since we are still in the morning.`;
        } else {
            datemsg = `Default date set to ${year}-${helper.padTwoDigits(month)}-${helper.padTwoDigits(day)}.`;
        }
    }
    $("#dateY").val(year);
    $("#dateM").val(helper.padTwoDigits(month));
    $("#dateD").val(helper.padTwoDigits(day));
    helper.LogEntry(datemsg);
    helper.LogSuccess("Page initialized.");
    $("#dateSet").trigger("click");
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtSkycm_Click = function () {
    this.skyGraph.reload();
    this.skyGraph.startTimer();
    $.fancybox.open({
        src: "#skycamblock",
        type: "inline",
        touch: false,
        beforeClose: function () {
            driver.skyGraph.stopTimer();
        }
    });
    this.skyGraph.setup(false);
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtSkycm_MouseMove = function (e, jQthis) {
    let pos_x, pos_y;
    if (e.pageX === undefined && e.pageY === undefined) {
        pos_x = 320;
        pos_y = 240;
    } else {
        pos_x = e.pageX - jQthis.offset().left;
        pos_y = e.pageY - jQthis.offset().top;
    }
    if ((pos_x < 0) || (pos_x >= this.skyGraph.imx) || (pos_y < 0) || (pos_y >= this.skyGraph.imy)) {
        this.skyGraph.display_coords(null);
        this.skyGraph.lastazalt = null;
    } else {
        //const azalt = helper.getCoordinates(320, 240, pos_x, pos_y, 280, this.skyGraph.lst);
        const azalt = helper.getCoordinates(this.skyGraph.cx, this.skyGraph.cy, pos_x, pos_y, 280, this.skyGraph.lst);
        this.skyGraph.display_coords(azalt);
        this.skyGraph.lastazalt = azalt;
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.EvySkycm_MouseOut = function () {
    this.skyGraph.display_coords(null);
    this.skyGraph.lastazalt = null;
};

/**
 * @memberof Driver
 */
Driver.prototype.BindEvents = function () {
    // Allow the current date to be changed with a simple Enter key
    $("#dateD").keydown(function (e) {
        if (e.which == 13) {
            $("#dateSet").trigger("click");
        }
    });
    $("#dateM").keydown(function (e) {
        if (e.which == 13) {
            $("#dateSet").trigger("click");
        }
    });
    $("#dateY").keydown(function (e) {
        if (e.which == 13) {
            $("#dateSet").trigger("click");
        }
    });
    $("#def_epoch").keydown(function (e) {
        if (e.which == 13) {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_project").keydown(function (e) {
        if (e.which == 13) {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_type").keydown(function (e) {
        if (e.which == 13) {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_maxam").keydown(function (e) {
        if (e.which == 13) {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_obstime").keydown(function (e) {
        if (e.which == 13) {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    });
    $("#def_telescope").on("keydown", function (e) {
        if (e.which == 13) {
            $("#configsubmit").val("true");
            $.fancybox.close();
        }
    }).on("click", function (e) {
        $(this).focus();
    });

    // Help button
    $("#helpBtn").click(function () {
        $.fancybox.open({
            src: "#help-container",
            type: "inline",
            touch: false
        });
    });

    // Sample targets and target box
    $("#targetBlanks").click(function () {
        driver.CMeditor.setValue(Driver.BlankFields);
        driver.targets.validateAndFormatTargets();
    });
    $("#targets").blur(function () {
        driver.targets.validateAndFormatTargets();
    });
    $("#tcsExport").click(function () {
        driver.targets.ExportTCSCatalogue();
    });
    $("#configBtn").click(function () {
        driver.EvtClick_Config();
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
        driver.EvtFrame_Drop(e);
    });
    $("#canvasFrame").on("mousemove", function (e) {
        driver.EvtFrame_MouseMove(e);
    });
    $("#canvasFrame").on("mousedown", function (e) {
        driver.EvtFrame_MouseDown(e);
    });
    $("#canvasFrame").on("mouseup", function (e) {
        driver.EvtFrame_MouseUp(e);
    });
    $("#canvasFrame").on("click", function (e) {
        driver.EvtFrame_Click(e);
    });
    // SkyCam div
    $("#showSkyCam").on("click", function (e) {
        driver.EvtSkycm_Click();
    });
    $("#canvasSkycam").on("mousemove", function (e) {
        driver.EvtSkycm_MouseMove(e, $(this));
    });
    $("#canvasSkycam").on("mouseout", function (e) {
        driver.EvySkycm_MouseOut();
    });

    for (let k in Driver.FillColors) {
        $(`#def_col_${k.replace("-", "_")}`).addClass("inpshort");
        $(`#def_tcol_${k.replace("-", "_")}`).addClass("inpshort");
        $(`#def_col_${k.replace("-", "_")}`).keydown(function (e) {
            if (e.which == 13) {
                $("#configsubmit").val("true");
                $.fancybox.close();
            }
        });
        $(`#def_tcol_${k.replace("-", "_")}`).keydown(function (e) {
            if (e.which == 13) {
                $("#configsubmit").val("true");
                $.fancybox.close();
            }
        });
    }

    // Save and Load document events
    serializer.BindEvents();
};

/**
 * @memberof Driver
 */
Driver.prototype.EvtClick_Config = function () {
    $("#configsubmit").val("false");
    $("#def_epoch").val(Driver.defaultEpoch);
    $("#def_project").val(Driver.defaultProject);
    $("#def_type").val(Driver.defaultType);
    $("#def_maxam").val(Driver.defaultAM);
    $("#def_obstime").val(Driver.defaultObstime);
    for (let k in Driver.FillColors) {
        $(`#def_col_${k.replace("-", "_")}`).val(Driver.FillColors[k]);
        $(`#def_tcol_${k.replace("-", "_")}`).val(Driver.TextColors[k]);
    }
    $.fancybox.open({
        src: "#config-container",
        type: "inline",
        touch: false,
        beforeClose: function () {
            driver.CallbackUpdateDefaults();
        }
    });
};

/**
 * @memberof Driver
 */
Driver.prototype.CallbackUpdateDefaults = function () {
    if ($("#configsubmit").val() === "false") {
        return;
    }
    let re, k, resetTel = false, resetCol = false;
    helper.LogEntry("Updating default parameters...");
    re = $("#def_telescope").val().trim();
    if (re !== Driver.telescopeName) {
        if ($.inArray(re, Object.keys(config)) !== -1) {
            Driver.telescopeName = re;
            // Recalculate ephemerides
            driver.Callback_SetDate();
            helper.LogSuccess(`<i>Telescope name</i> set to <i>${re}</i>.`);
            resetTel = true;
        } else {
            helper.LogError("Error 49: <i>Telescope name</i> was not updated since the input was invalid.");
        }
    }
    re = $("#def_epoch").val().trim();
    if (re !== Driver.defaultEpoch) {
        if (re === "1950" || re === "2000") {
            Driver.defaultEpoch = re;
            helper.LogSuccess(`Default <i>Epoch</i> set to <i>${re}</i>.`);
        } else {
            helper.LogError("Error 50: Default <i>Epoch</i> was not updated since the input was invalid (must be 1950 or 2000).");
        }
    }
    re = $("#def_project").val().trim();
    if (re !== Driver.defaultProject) {
        if (re.length !== 6 || helper.notInt(re.substr(0, 2)) || helper.notInt(re.substr(3, 3)) || re.substr(2, 1) != "-") {
            helper.LogError("Error 51: Default <i>Proposal ID</i> was not updated since the input was invalid (must have the form NN-NNN).");
        } else {
            Driver.defaultProject = re;
            helper.LogSuccess(`Default <i>Proposal ID</i> set to <i>${re}</i>.`);
        }
    }
    re = $("#def_type").val().trim();
    if (re !== Driver.defaultType) {
        let reok = true;
        if ($.inArray(re, ["Monitor", "ToO", "SoftToO", "Payback", "Fast-Track", "Service", "CATService", "Visitor", "Staff"]) === -1) {
            let wl = re.length;
            if (re.indexOf("Staff/") !== 0 || (re.indexOf("Staff/") === 0 && (wl < 8 || wl > 9))) {
                reok = false;
            }
        }
        if (reok) {
            Driver.defaultType = re;
            helper.LogSuccess(`Default <i>Observation type</i> set to <i>${re}</i>.`);
        } else {
            helper.LogError("Error 52: Default <i>Observation type</i> was not updated since the input was invalid (must be one of the following: <i>Monitor</i>, <i>ToO</i>, <i>SoftToO</i>, <i>Payback</i>, <i>Fast-Track</i>, <i>Service</i>, <i>CATService</i>, <i>Visitor</i>, <i>Staff</i>)");
        }
    }
    re = $("#def_maxam").val().trim();
    if (re !== Driver.defaultAM) {
        if (helper.notFloat(re)) {
            helper.LogError("Error 53: Default <i>Maximum airmass</i> was not updated since the input was invalid (must be a float).");
        } else {
            Driver.defaultAM = re;
            helper.LogSuccess(`Default <i>Maximum airmass</i> set to <i>${re}</i>.`);
        }
    }
    re = $("#def_obstime").val().trim();
    if (re !== Driver.defaultObstime) {
        if (helper.notInt(re)) {
            helper.LogError("Error 54: Default <i>Observing time</i> was not updated since the input was invalid (must be an integer).");
        } else {
            Driver.defaultObstime = re;
            helper.LogSuccess(`Default <i>Observing time</i> set to <i>${re}</i>.`);
        }
    }
    for (k in Driver.FillColors) {
        re = $(`#def_col_${k.replace("-", "_")}`).val().trim();
        if (re !== Driver.FillColors[k]) {
            if (helper.validColour(re)) {
                Driver.FillColors = [k, re];
                helper.LogSuccess(`<i>${k}/fill colour</i> has been set to <i>${re}</i>.`);
                resetCol = true;
            } else {
                helper.LogError(`Error 55: Input for <i>${k}/fill colour</i> is not a valid CSS colour (<i>${re}</i>).`);
            }
        }
        re = $(`#def_tcol_${k.replace("-", "_")}`).val().trim();
        if (re !== Driver.TextColors[k]) {
            if (helper.validColour(re)) {
                Driver.TextColors = [k, re];
                helper.LogSuccess(`<i>${k}/text colour</i> has been set to <i>${re}</i>.`);
                resetCol = true;
            } else {
                helper.LogError(`Error 56: Input for <i>${k}/text colour</i> is not a valid CSS colour (<i>${re}</i>).`);
            }
        }
        if (resetCol) {
            for (k = 0; k < this.targets.nTargets; k += 1) {
                this.targets.Targets[k].resetColours();
            }
        }
        if (resetCol || resetTel) {
            this.Refresh();
        }
    }

    helper.LogDebug("Saving new configuration to the browser...");
    localStorage.setItem("visplot", true);
    localStorage.setItem("telescopeName", Driver.telescopeName);
    localStorage.setItem("defaultEpoch", Driver.defaultEpoch);
    localStorage.setItem("defaultProject", Driver.defaultProject);
    localStorage.setItem("defaultType", Driver.defaultType);
    localStorage.setItem("defaultAM", Driver.defaultAM);
    localStorage.setItem("defaultObstime", Driver.defaultObstime);
    helper.LogEntry("Done.");
};

/**
 * @memberof Driver
 */
Driver.prototype.Callback_ShowCurrentTime = function () {
    if (!this.nightInitialized) {
        return;
    }
    let now = new Date();
    if (now < this.night.DateSunset || now > this.night.DateSunrise) {
        return;
    }
    this.Refresh();
};

/**
 * @memberof Driver
 */
Driver.prototype.Refresh = function () {
    document.title = `${Driver.telescopeName}/Visplot`;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.graph.drawTargets(this.targets.Targets);
    this.graph.drawEphemerides();
    if (this.nightInitialized) {
        this.graph.drawBackground();
        if (this.scheduleMode) {
            this.graph.drawSchedule();
        } else {
            if (this.targets.nTargets > 0) {
                this.graph.drawTargetNames(this.targets.Targets);
            }
        }
    }
};

/**
 * @memberof Driver
 */
Driver.prototype.markAsObserved = function (observed) {
    let id_of_observed = $("#id_of_observed").val();
    let obj = this.targets.Targets[id_of_observed];
    obj.Observed = observed;
    obj.ObservedStartTime = $("#actual_start").val();
    obj.ObservedEndTime = $("#actual_end").val();
    obj.Comments = $("#popcomm").val();
    obj.resetColours()
    this.Refresh();
    helper.LogSuccess(`Object <i>${obj.Name}</i> ${observed ? "" : "is no longer "}marked as <i>Observed</i>.`);
    $.fancybox.close();
};

/**
 * @memberof Driver
 */
Driver.prototype.rescaleCanvas = function (cnv, ctx) {
    // Query the various pixel ratios
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
    let ratio = devicePixelRatio / backingStoreRatio;

    // Upscale the canvas if the two ratios do not match
    if ((typeof auto === "undefined" ? true : auto) && devicePixelRatio !== backingStoreRatio) {
        let oldWidth = cnv.width;
        let oldHeight = cnv.height;

        cnv.width = oldWidth * ratio;
        cnv.height = oldHeight * ratio;

        cnv.style.width = `${oldWidth}px`;
        cnv.style.height = `${oldHeight}px`;

        // Now scale the context to counter the fact that we have manually scaled our canvas element
        ctx.scale(ratio, ratio);
    }
};

/**
 * @memberof Driver
 */
Driver._fillObj = {
    "Monitor": "orange",
    "ToO": "#FF9900",
    "SoftToO": "#FFFF99",
    "Payback": "blue",
    "Fast-Track": "blue",
    "Service": "blue",
    "CATService": "blue",
    "Visitor": "blue",
    "Staff": "blue"
};

/**
 * @memberof Driver
 */
Driver._textObj = {
    "Monitor": "black",
    "ToO": "black",
    "SoftToO": "black",
    "Payback": "white",
    "Fast-Track": "white",
    "Service": "white",
    "CATService": "white",
    "Visitor": "white",
    "Staff": "white"
};

/**
 * @memberof Driver
 */
Object.defineProperties(Driver, {
    "telescopeName": {
        get: function() {
            return this._telescopeName || "NOT";
        }, set: function(val) {
            /* Only update if we have a config entry for the telescope */
            if ($.inArray(val, Object.keys(config)) !== -1) {
                this._telescopeName = val;
                $("#def_telescope").val(val);
                $("#canvasFrame").css("background-image", 'url(' + config[val].background + ')');
                // Recalculate Skycam constants
                driver.skyGraph.updateTelescope();
            }
        }},
    "updSchedText": {
        get: function () {
            return "Update schedule";
        }},
    "obs_lat_deg": {
        get: function () {
            return config[this.telescopeName].latitude;
        }},
    "obs_lon_deg": {
        get: function () {
            return config[this.telescopeName].longitude;
        }},
    "obs_lat_rad": {
        get: function () {
            return helper.deg2rad(Driver.obs_lat_deg);
        }},
    "obs_lon_rad": {
        get: function () {
            return helper.deg2rad(Driver.obs_lon_deg);
        }},
    "obs_timezone": {
        get: function () {
            return config[this.telescopeName].timezone;
        }},
    "obs_alt": {
        get: function () {
            return config[this.telescopeName].altitude;
        }},
    "current_dut": {
        get: function () {
            //reported in milliseconds -> Julian days
            return 68.9677 / (1000*sla.d2s);
        }},
    "obs_lowestLimit": {
        get: function () {
            return config[this.telescopeName].lowestLimit;
        }},
    "obs_lowerHatch": {
        get: function () {
            return config[this.telescopeName].vignetteLimit;
        }},
    "plotTitle": {
        get: function () {
            return `Altitudes at ${this.telescopeName}, ` +
                   config[this.telescopeName].site + ", " +
                    (this.obs_lon_deg < 0 ? 360+this.obs_lon_deg : this.obs_lon_deg).toFixed(4) + "E +" +
                    this.obs_lat_deg.toFixed(4) + ", " + this.obs_alt.toFixed(0) + " m above sea level";
        }},
    "plotCopyright": {
        get: function () {
            return `© 2016-${new Date().getFullYear()} ega (NOT/ING)`;
        }},
    "defaultEpoch": {
        get: function () {
            return this._defaultEpoch || "2000";
        }, set: function (val) {
            this._defaultEpoch = val;
        }},
    "defaultObstime": {
        get: function () {
            return this._defaultObstime || "600";
        }, set: function (val) {
            this._defaultObstime = val;
        }},
    "defaultProject": {
        get: function () {
            return this._defaultProject || "54-199";
        }, set: function (val) {
            this._defaultProject = val;
        }},
    "defaultAM": {
        get: function () {
            return this._defaultAM || "2.0";
        }, set: function (val) {
            this._defaultAM = val;
        }},
    "defaultType": {
        get: function () {
            return this._defaultType || "Staff";
        }, set: function (val) {
            this._defaultType = val;
        }},
    "defaultOBInfo": {
        get: function () {
            return this._defaultOBInfo || "default";
        }, set: function (val) {
            this._defaultOBInfo = val;
        }},
    "skyCamLink": {
        get: function () {
            return "http://www.gtc.iac.es/multimedia/netcam/camaraAllSky.jpg?t=";
        }},
    "FillColors": {
        get: function () {
            return this._fillObj;
        }, set: function (val) {
            this._fillObj[val[0]] = val[1];
        }},
    "TextColors": {
        get: function () {
            return this._textObj;
        }, set: function (val) {
            this._textObj[val[0]] = val[1];
        }},
    "BlankFields": {
        get: function () {
            return `Blank00+07      00:24:00        +07:54:00
                    Blank01+12      01:21:00        +12:00:00
                    Blank01+02      01:47:40        +02:20:00
                    Blank02+13      02:21:00        +13:12:00
                    Blank03+31      03:33:00        +31:03:00
                    Blank04+25      04:42:00        +25:33:00
                    Blank05-02      05:45:00        -02:09:00
                    Blank06+42      06:51:00        +42:24:00
                    Blank07+64      07:48:00        +64:30:00
                    Blank08+37      08:45:00        +37:12:00
                    Blank09-07      09:12:00        -07:50:50
                    Blank09+46      09:10:28        +46:26:23
                    Blank09+66      09:24:00        +66:42:00
                    Blank10+58      10:24:00        +58:36:00
                    Blank10+57      10:52:00        +57:36:00
                    Blank11+51      11:09:00        +51:48:00
                    Blank12+54      12:21:00        +54:12:00
                    Blank12+02      12:29:20        +02:01:00
                    Blank13+29      13:07:00        +29:35:00
                    Blank13+63      13:21:00        +63:48:00
                    Blank13+62      13:36:20        +62:14:00
                    Blank13+05      13:48:20        +05:38:00
                    Blank14+17      14:12:00        +17:39:00
                    Blank15+53      15:27:00        +53:45:00
                    Blank16+55      16:24:30        +55:44:00
                    Blank16-15      16:50:53        -15:21:45
                    Blank17+34      17:27:00        +34:03:00
                    Blank17+66      17:59:40        +66:21:00
                    Blank19+59      19:15:00        +59:33:00
                    Blank20-09      20:45:00        -09:06:00
                    Blank21+11      21:24:00        +11:30:00
                    Blank21-08      21:29:30        -08:38:00
                    Blank22-08      22:36:00        -08:33:00
                    Blank23+11      23:15:50        +11:27:00
                    Blank23+09      23:39:00        +09:30:00
                    Blank23+00      23:47:00        +00:57:00
                `.split("\n").map(function(e) {
                    return e.trim()
                }).filter(Boolean).join("\n");
        }}
});
