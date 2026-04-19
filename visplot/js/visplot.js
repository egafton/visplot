/**
 * @copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
"use strict";

/**
 * @function
 */
$(document).ready(function () {
    try {
        /* Perform the unit tests for slalib */
        sla.performUnitTests();

        /* The one and only global variable */
        window.driver = new Driver();

        $("body").toggle();

        /* Catch resize events */
        window.addEventListener("resize", function() {
            driver.Refresh(true);
        });

        /* Create the panel divider */
        $("#divider").jSplitter({
            "leftdiv": "sidebar",
            "rightdiv": "canvasFrame",
            "flex": true,
            "persist": true,
            "cookie": "jSplitter",
            "minleftwidth": 400
        }).on("mousedown", function() {
            document.body.classList.add("resizing");
        });
        $(document).on("mouseup", function () {
            document.body.classList.remove("resizing");
        });

        // Populate the telescope select input
        Object.entries(telescopes)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .forEach(([key, value]) => {
                $("#def_telescope").append(new Option(`${value.name}${value.site ? ', ' + value.site : ''} (${value.location})`, key));
            });
        $("#num_telescopes").html(Object.keys(telescopes).length);

        // Restore autosaved content, if any
        if ("autosaved" in localStorage && localStorage.autosaved !== null) {
            driver.CMeditor.setValue(localStorage.autosaved);
        }
        window.addEventListener("beforeunload", () => {
            driver.autosave();
        });

        /*
        * If there is a configuration saved in localStorage, retrieve it.
        */
        /* Override telescope name if specified via GET */
        let forcetel = null;
        if ($("#default_telescope").length) {
            forcetel = $("#default_telescope").val();
            helper.LogEntry(`Telescope <i>${forcetel}</i> specified via GET`);
        }
        if ("visplot" in localStorage) {
            helper.LogEntry("Found existing visplot configuration in the browser, restoring...");
            if ("telescopeName" in localStorage) {
                if (forcetel === null || localStorage.telescopeName === forcetel) {
                    helper.LogEntry(`Restoring telescope name to <i>${localStorage.telescopeName}</i>`);
                    driver.setTelescopeName(localStorage.telescopeName, true).then(function() {
                        driver.UpdateInstrumentList();

                        if ("defaultEpoch" in localStorage) {
                            helper.LogEntry(`Restoring default epoch to <i>${localStorage.defaultEpoch}</i>`);
                            Driver.defaultEpoch = localStorage.defaultEpoch;
                        }
                        if ("defaultProject" in localStorage) {
                            helper.LogEntry(`Restoring default proposal ID to <i>${localStorage.defaultProject}</i>`);
                            Driver.defaultProject = localStorage.defaultProject;
                        }
                        if ("defaultType" in localStorage) {
                            helper.LogEntry(`Restoring default observation type to <i>${localStorage.defaultType}</i>`);
                            Driver.defaultType = localStorage.defaultType;
                        }
                        if ("defaultAM" in localStorage) {
                            helper.LogEntry(`Restoring default maximum airmass to <i>${localStorage.defaultAM}</i>`);
                            Driver.defaultAM = localStorage.defaultAM;
                        }
                        if ("defaultObstime" in localStorage) {
                            helper.LogEntry(`Restoring default observing time to <i>${localStorage.defaultObstime}</i>`);
                            Driver.defaultObstime = localStorage.defaultObstime;
                        }
                        if ("defaultInstrument" in localStorage) {
                            helper.LogEntry(`Restoring default instrument name to <i>${localStorage.defaultInstrument}</i>`);
                            Driver.defaultInstrument = localStorage.defaultInstrument;
                        }
                        if ("wPriority" in localStorage) {
                            helper.LogEntry(`Restoring <i>Priority</i> weight to <i>${localStorage.wPriority}</i>`);
                            Driver.wPriority = localStorage.wPriority;
                        }
                        if ("wUrgency" in localStorage) {
                            helper.LogEntry(`Restoring <i>Urgency</i> weight to <i>${localStorage.wUrgency}</i>`);
                            Driver.wUrgency = localStorage.wUrgency;
                        }
                        if ("wAltitude" in localStorage) {
                            helper.LogEntry(`Restoring <i>Altitude</i> weight to <i>${localStorage.wAltitude}</i>`);
                            Driver.wAltitude = localStorage.wAltitude;
                        }
                        if ("wSlewing" in localStorage) {
                            helper.LogEntry(`Restoring <i>Slewing</i> weight to <i>${localStorage.wSlewing}</i>`);
                            Driver.wSlewing = localStorage.wSlewing;
                        }
                        for (const k in Driver.FillColors) {
                            const key = `fill_${k}`;
                            if (key in localStorage) {
                                helper.LogEntry(`Restoring <i>${k}/fill colour</i> to <i>${localStorage[key]}</i>`);
                                Driver.FillColors = [k, localStorage[key]];
                            }
                        }
                        for (const k in Driver.TextColors) {
                            const key = `text_${k}`;
                            if (key in localStorage) {
                                helper.LogEntry(`Restoring <i>${k}/text colour</i> to <i>${localStorage[key]}</i>`);
                                Driver.TextColors = [k, localStorage[key]];
                            }
                        }
                        if ("opt_reschedule_later" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_reschedule_later</i> to <i>${localStorage.opt_reschedule_later}</i>`);
                            $("#opt_reschedule_later").prop("checked", localStorage.opt_reschedule_later === "true");
                        }
                        if ("opt_reorder_targets" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_reorder_targets</i> to <i>${localStorage.opt_reorder_targets}</i>`);
                            $("#opt_reorder_targets").prop("checked", localStorage.opt_reorder_targets === "true");
                        }
                        if ("opt_allow_over_axis" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_allow_over_axis</i> to <i>${localStorage.opt_allow_over_axis}</i>`);
                            $("#opt_allow_over_axis").prop("checked", localStorage.opt_allow_over_axis === "true");
                        }
                        if ("opt_algorithm" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_algorithm</i> to <i>${localStorage.opt_algorithm}</i>`);
                            $(`#${localStorage.opt_algorithm}`).prop("checked", true);
                        }
                        if ("opt_schedule_between" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_schedule_between</i> to <i>${localStorage.opt_schedule_between}</i>`);
                            $(`#${localStorage.opt_schedule_between}`).prop("checked", true);
                        }
                        if ("opt_show_lastobstime" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_show_lastobstime</i> to <i>${localStorage.opt_show_lastobstime}</i>`);
                            $("#opt_show_lastobstime").prop("checked", localStorage.opt_show_lastobstime === "true");
                        }
                        if ("opt_colour_targets" in localStorage) {
                            helper.LogEntry(`Restoring <i>opt_colour_targets</i> to <i>${localStorage.opt_colour_targets}</i>`);
                            $("#opt_colour_targets").prop("checked", localStorage.opt_colour_targets === "true");
                        }
                        postInitialization();
                    });
                } else {
                    helper.LogEntry(`Saved telescope (${localStorage.telescopeName}) differs from telescope specified with GET (${forcetel}). Overriding browser settings`);
                    driver.setTelescopeName(forcetel, true).then(function() {
                        driver.UpdateInstrumentList();
                        postInitialization();
                    });
                }
            }
        } else {
            if (forcetel === null) {
                forcetel = Driver.telescopeName;
            }
            /* Set default telescope telescope */
            helper.LogEntry(`Default telescope is <i>${forcetel}</i>`);
            driver.setTelescopeName(forcetel, true).then(function() {
                driver.UpdateInstrumentList();
                postInitialization();
            });
        }
    } catch (ex) {
        helper.LogException(ex);
    }
});

function postInitialization() {
    try {
        /* Now that the driver is created, do some stuff that require it*/
        setInterval(function () {
            driver.skyGraph.displayTime(driver.skyContext);
        }, config.skycamTimeRefreshInterval);

        helper.LogDebug("Drawing plot background...");
        driver.graph.drawBackground(driver.context);

        helper.LogDebug("Disabling buttons until the necessary quantities have been calculated...");
        $("#planNight").prop("disabled", true);
        $("#saveDoc").prop("disabled", true);
        $("#tcsExport").prop("disabled", true);

        /*
        Trigger for the "Set" current date button; this calculates the ephemerides
        and plots them.
        */
        $("#dateSet").click(function (e) {
            driver.BtnEvtSetDate(e);
        });

        /*
        Trigger for the "Plot" targets button; this calculates the altitudes of
        the various targets at different times and plots them.
        */
        $("#plotTargets").click(function () {
            driver.RequestedScheduleType = 3;
            driver.BtnEvtPlotTargets();
        });
        $("#planNight").click(function () {
            driver.RequestedScheduleType = ($("#planNight").val() === Driver.updSchedText) ? 1 : 2;
            driver.BtnEvtPlotTargets();
        });

        driver.BindEvents();
        helper.LogEntry("Done.");

        helper.LogDebug("Calling ParseOBInfoIfAny()...");
        driver.ParseOBInfoIfAny();

        helper.LogDebug("Calling InitializeDate()...");
        driver.InitializeDate();

        setInterval(function() {
            driver.CallbackShowCurrentTime();
        }, config.graphCurrentTimeRefreshInterval);

        /*
        Set up the map.
        */
        driver.SetupMap();
    } catch (ex) {
        helper.LogException(ex);
    }
}
