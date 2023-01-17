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
 * @function
 */
$(document).ready(function () {
    /*
     * Available error IDs: 61+
     */

    /* Perform the unit tests for slalib */
    sla.performUnitTests();

    /* The one and only global variable */
    window.driver = new Driver();

    $("body").toggle();

    /* Catch resize events */
    window.addEventListener("resize", driver.Refresh);
    //window.jsplitterSettings.maxleftwidth = window.outerWidth - driver.graph.minwidth - 5;

    /* Sidebar toggle button */
    $("#toggle-sidebar").click(function() {
        $("#sidebar").toggle();
        $("#divider").toggle();
        const visible = $("#sidebar").is(":visible");
        if (visible) {
            /* Create the panel divider */
            $("#divider").jSplitter({
                "leftdiv": "sidebar",
                "rightdiv": "canvasFrame",
                "flex": true,
                "persist": true,
                "cookie": "jSplitter",
                "minleftwidth": 250
            });
        }
        localStorage.visplotSidebarVisible = visible;
        if (driver.night !== null) {
            driver.Refresh();
        }
    });

    /* Show the sidebar if the user had it open */
    if ("visplotSidebarVisible" in localStorage) {
        if (localStorage.visplotSidebarVisible === "true") {
            $("#toggle-sidebar").trigger("click");
        }
    }

    // Populate the telescope select input
    for (const key in config) {
        $("#def_telescope").append(new Option(config[key].name, key));
    }

    /*
     * If there is a configuration saved in localStorage (this is a nice
     * feature of modern browsers), copy its entries over on to the default
     * config.
     */
    if ("visplot" in localStorage) {
        helper.LogEntry("Found existing visplot configuration in the browser, restoring...");
        if ("telescopeName" in localStorage) {
            helper.LogEntry(`Restoring telescope name to <i>${localStorage.telescopeName}</i>`);
            Driver.telescopeName = localStorage.telescopeName;
            driver.UpdateInstrumentList();
        }
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
        if ("defaultOBInfo" in localStorage) {
            helper.LogEntry(`Restoring default instrument name to <i>${localStorage.defaultOBInfo}</i>`);
            Driver.defaultOBInfo = localStorage.defaultOBInfo;
        }
        if ("opt_reschedule_later" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_reschedule_later</i> to <i>${localStorage.opt_reschedule_later}</i>`);
            $("#opt_reschedule_later").prop("checked", localStorage.opt_reschedule_later === "true");
        }
        if ("opt_away_from_zenith" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_away_from_zenith</i> to <i>${localStorage.opt_away_from_zenith}</i>`);
            $("#opt_away_from_zenith").prop("checked", localStorage.opt_away_from_zenith === "true");
        }
        if ("opt_maintain_order" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_maintain_order</i> to <i>${localStorage.opt_maintain_order}</i>`);
            $("#opt_maintain_order").prop("checked", localStorage.opt_maintain_order === "true");
        }
        if ("opt_reorder_targets" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_reorder_targets</i> to <i>${localStorage.opt_reorder_targets}</i>`);
            $("#opt_reorder_targets").prop("checked", localStorage.opt_reorder_targets === "true");
        }
        if ("opt_allow_over_axis" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_allow_over_axis</i> to <i>${localStorage.opt_allow_over_axis}</i>`);
            $("#opt_allow_over_axis").prop("checked", localStorage.opt_allow_over_axis === "true");
        }
        if ("opt_schedule_between" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_schedule_between</i> to <i>${localStorage.opt_schedule_between}</i>`);
            $(`#${localStorage.opt_schedule_between}`).prop("checked", true);
        }
        if ("opt_show_lastobstime" in localStorage) {
            helper.LogEntry(`Restoring <i>opt_show_lastobstime</i> to <i>${localStorage.opt_show_lastobstime}</i>`);
            $("#opt_show_lastobstime").prop("checked", localStorage.opt_show_lastobstime === "true");
        }
    } else {
        /* Default image for default telescope */
        $("#canvasFrame").css("background-image", 'url(' + config[Driver.telescopeName].background + ')');
    }

    /* Now that the driver is created, do some stuff that require it*/
    driver.skyGraph.skyImg.onload = function () {
        driver.skyGraph.setup(true);
    };
    setInterval(function () {
        driver.skyGraph.display_time();
    }, 500);   // 0.5 second update times

    helper.LogDebug("Drawing plot background...");
    driver.graph.drawBackground();

    //$("#canvasFrame").toggle();
    helper.LogDebug("Disabling buttons until the necessary quantities have been calculated...");
    $("#planNight").prop("disabled", true);
    $("#saveDoc").prop("disabled", true);
    $("#tcsExport").prop("disabled", true);

    /*
     Trigger for the "Set" current date button; this uses AJAX to call a Py script
     (through a PHP wrapper) that calculates the ephemerides, and on success it plots them.
     */
    $("#dateSet").click(function () {
        driver.BtnEvt_SetDate();
    });

    /*
     Trigger for the "Plot" targets button; this uses AJAX to call a Py script
     (through a PHP wrapper) that calculates the altitudes of the various targets at
     different times, and on success it plots them.
     */
    $("#plotTargets").click(function () {
        driver.RequestedScheduleType = 3;
        driver.BtnEvt_PlotTargets();
    });
    $("#planNight").click(function () {
        driver.RequestedScheduleType = ($("#planNight").val() === Driver.updSchedText) ? 1 : 2;
        driver.BtnEvt_PlotTargets();
    });

    driver.BindEvents();
    helper.LogEntry("Done.");

    helper.LogDebug("Calling ParseOBInfoIfAny()...");
    driver.ParseOBInfoIfAny();

    helper.LogDebug("Calling InitializeDate()...");
    driver.InitializeDate();

    setInterval(function() {
        driver.Callback_ShowCurrentTime();
    }, 5000);
});

