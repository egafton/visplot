/**
 * @author ega
 * @copyright (c) 2016-2021 ega, NOT/ING.
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
     * Available error IDs: 60+
     */

    /* The one and only global variable */
    window.driver = new Driver();

    /* Perform the unit tests for slalib */
    sla.performUnitTests();

    /* Now that the driver is created, do some stuff that require it*/
    driver.skyGraph.skyImg.onload = function () {
        driver.skyGraph.setup(true);
    };
    setInterval(function () {
        driver.skyGraph.display_time();
    }, 500);   // 0.5 second update times
    // Populate the telescope select input
    for (const key in config) {
        $("#def_telescope").append(new Option(config[key].name, key));
    }

    helper.LogDebug("Drawing plot background...");
    driver.graph.drawBackground();

    $("#canvasFrame").toggle();
    helper.LogDebug("Disabling buttons until the necessary quantities have been calculated...");
    $("#planNight").prop("disabled", true);
    $("#pngExport").prop("disabled", true);
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

