<?php
/**
 * Copyright (c) 2016-2026 ega, irl.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
$version = "4.2";
/*
* Version history (with brief changelog):
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
*
* 2.7 - Added support for different TCS catalogue formats.
*     - Target list in TCS format can now be exported to disk.
*     - Added support for different skycams, and simplified & improved
*       the spherical geometry calculations mapping pixels to alt/az.
*     - Observations can now be scheduled between sunset/sunrise,
*       between nautical twilights, or between astronomical twilights.
*
* 3.0 - Redesigned user interface: only the plot is visible by default,
*       while all the settings are available in a collapsible sidebar.
*     - The sidebar can be resized at will ("split pane"), while the
*       plot will adjust to fill the remaining space.
*     - Stopped logging milliseconds.
*     - Fixed some minor bugs.
*     - Major changes to the AladinLite applet, which now allows arbitrary
*       sky PAs and flipping in x/y.
*     - Added legend for over-the-axis observations.
*     - All options are now saved between sessions, including checkboxes.
*     - Added support for RA/Dec input in decimal degrees.
*
* 3.1 - Now displaying two backlinks to the NOT OB queue (staff and
*       public).
*     - Added support for the HET.
*
* 3.2 - First version hosted at https://www.visplot.com
*
* 3.3 - Merged pull request that adds the CAHA 2.2m telescope.
*
* 3.4 - Added OAJ observatory.
*
* 3.5 - Fixed morning twilights during DST change.
*
* 3.6 - Added Subaru telescope.
*
* 3.7 - Replaced MSZT with Local Time (DST included if applicable),
*       using Moment.js.
*
* 3.8 - Can now retrieve coordinates and proper motions from SIMBAD.
*     - Now providing a Dockerfile and docker-compose.yml for easy testing.
*
* 3.9 - Added Kennon Observatory.
*
* 3.10 - Added Dark Sky Observatory.
*      - Fixed initial default instrument list.
*
* 3.11 - Added Clarence T. Jones Observatory.
*
* 3.12 - Added Catalina Sky Survey 1.5m telescope.
*
* 3.13 - Added VLT. New lists of blanks (https://doi.org/10.1111/j.1365-2966.2012.21883.x)
*        and spectrophotometric standards, for the Northern and Southern hemispheres.
*
* 4.0  - Expanded list of telescopes; added a map and replaced the dropdown
*        with an incremental search box. Simplified telescope configuration
*        objects (null values need not be provided any more). Fixed some bugs.
*
* 4.1  - Showing W/E in telescope longitude; added more observatories.
*
* 4.2  - Added title in sidebar.
*/
session_start();
if (isset($_SESSION["obinfo"])) {
    $_POST["obinfo"] = $_SESSION["obinfo"];
    $_SERVER["REQUEST_METHOD"] = "POST";
    unset($_SESSION["obinfo"]);
}
if ($_SERVER["REQUEST_METHOD"] === "POST" and
    isset($_POST["obinfo"]) and !empty($_POST["obinfo"])) {
    if (function_exists("get_magic_quotes_gpc") && get_magic_quotes_gpc()) {
        $obinfo = stripslashes($_POST["obinfo"]);
    } else {
        $obinfo = $_POST["obinfo"];
    }
    $obpost = TRUE;
    if (json_decode($obinfo) === NULL) {
        $obpost = FALSE;
    }
} else {
    $obpost = FALSE;
}
?><!DOCTYPE HTML>
<html lang="en">

<head>
    <title>NOT/Visplot</title>
    <link rel="icon" type="image/x-icon" href="img/favicon.ico">
    <meta name="description" content="Visibility plot and observation scheduling tool.">
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.css" type="text/css" media="screen" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.59.4/codemirror.min.css" type="text/css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" type="text/css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" type="text/css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" type="text/css" />
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css" type="text/css" />
    <link rel="stylesheet" href="css/aladin.min.css" type="text/css" />
    <link rel="stylesheet" href="css/visplot.css?v=<?php echo($version);?>" type="text/css" />
    <script type="text/javascript">window.version = "<?php echo($version);?>";</script>
</head>

<body class="fixed-left">
    <div id="toggle-sidebar">
        <img src="img/sidebar.png" />
    </div>
    <div style="display:flex">
        <div id="sidebar">
            <div id="sidebarpad">
                <div id="vpname"><img src="img/visplot.png" /></div>
                <div id="left_upper">
                    <div id="upperBtnDiv">
                        <input type="button" value="Configuration" id="configBtn" />
                        <input type="button" value="Help" id="helpBtn" />
                    </div>
                    Date:
                    <input type="text" id="dateY" /> &ndash; <input type="text" id="dateM" /> &ndash; <input type="text" id="dateD" />
                    <input type="button" value="Set" id="dateSet" /><br/><br/>
                    <span class="middle">Predefined targets:<br/>
                        <span class="middlesep">Blank fields:</span>
                        <input type="button" value="Northern" id="targetBlanksNorth" />
                        <input type="button" value="Southern" id="targetBlanksSouth" />
                        <br/>
                        <span class="middlesep">Spectrophotometric standards:</span>
                        <input type="button" value="Northern" id="targetStandardsNorth" />
                        <input type="button" value="Southern" id="targetStandardsSouth" />
                    </span><br/>
                    <textarea id="targets"></textarea><br/>
                    <input type="hidden" id="targets_actual" /><input type="hidden" id="added_targets" />
                    <input type="button" value="Plot targets" id="plotTargets" />
                    <input type="button" value="Schedule observations" id="planNight" /><br/><br/>
                </div> <!-- #left_upper -->
                <div id="left_lower">
                    <div id="buttons">
                        <div id="lb_skycm"><input type="button" value="Show SkyCam" id="showSkyCam" /></div>
                        <div id="lb_exprt"><input type="button" value="Export PNG" id="pngExport" /></div>
                        <div id="lb_tcsex"><input type="button" value="TCS format" id="tcsExport" /></div>
                        <div id="lb_svdoc"><input type="button" value="Save" id="saveDoc" /></div>
                        <div id="lb_lddoc"><span class="middle">&nbsp;<label for="loadDoc">Load: <input type="file" value="Load" id="loadDoc" /></label></span></div>
                    </div>
                </div> <!-- #left_lower -->
                <pre id="logger"><span class="loggerEntry">Waiting for the page to load...</span></pre>
                <div id="footer">
                    <div id="footer-inner">
                    ©2016–<span id="footer-year"></span> ega, irl.
                    Running Visplot version <a target="_blank" id="footer-version"></a><span id="footer-date"></span>.
                    Released under the <a target="_blank" href="https://github.com/egafton/visplot/blob/master/LICENSE.md">GNU General Public License v3.0</a>.
                    Please see the <a target="_blank" href="https://visplot.readthedocs.io/">documentation</a>.
                    Report bugs and feature requests in the <a target="_blank" href="https://github.com/egafton/visplot/issues"><i>Issues</i> section</a> on GitHub.
                    </div> <!-- #footer-inner -->
                </div> <!-- #footer -->
            </div> <!-- #sidebarpad -->
        </div> <!-- #sidebar -->
        <div id="divider"></div>
        <div id="canvas-wrapper">
            <canvas id="canvasFrame"></canvas>
        </div> <!-- #canvas-wrapper -->
    </div> <!-- div style="display:flex" -->
    <a id="inline" href="#details" style="display:none"></a>
    <div style="display:none">
        <div id="details">
            <div id="details_title" class="fancyhead"></div>
            <div id="details_info"></div>
            <div id="details_map"><span id="details_map_hang"></span></div>
        </div> <!-- #details -->
        <div id="skycamblock">
            <canvas id="canvasSkycam" width="640" height="518"></canvas>
        </div> <!-- #skycamblock -->
        <div id="tcscat">
            <h2 class="fancyhead">Targets in TCS catalogue format</h2>
            <pre id="tcspre"></pre>
            <input type="button" value="Save file" id="tcsSave" />
        </div> <!-- #tcscat -->
        <div id="config-container">
            <h2 class="fancyhead">Configure Visplot</h2>
            <div id="map-container">
                <div id="mapDiv">
                    <div id="map">
                        <button id="viewall">View all</button>
                    </div>
                </div>
            </div><!-- #map-container --><div id="config">
            <div id="config-left">
                <span class="middle"><span class="llbl">Telescope name:</span>
                    <select id="def_telescope" name="def_telescope"></select>
                </span>
                <br/>
                <span class="middle"><span class="llbl">Default epoch:</span><input type="text" id="def_epoch"/></span><br/>
                <span class="defdetails">Must be <code>1950</code> or <code>2000</code>.</span>

                <span class="middle"><span class="llbl">Default observing time:</span><input type="text" id="def_obstime"/></span><br/>
                <span class="defdetails">Must be an integer.</span>

                <span class="middle"><span class="llbl">Default proposal ID:</span><input type="text" id="def_project"/></span><br/>
                <span class="defdetails">Must have the form <code>NN-NNN</code> (for NOT), <code>NNN-27NN</code> (for HJST), <code>NNN-21NN</code> (for OST), <code>UTNNN-NNN</code> (for HET).</span>

                <span class="middle"><span class="llbl">Default maximum airmass:</span><input type="text" id="def_maxam"/></span><br/>
                <span class="defdetails">Must be a float.</span>

                <span class="middle"><span class="llbl">Default observation type:</span><input type="text" id="def_type"/></span><br/>
                <span class="defdetails">Must be one of the following: <code>Monitor</code>, <code>ToO</code>, <code>SoftToO</code>, <code>Payback</code>, <code>Fast-Track</code>, <code>Service</code>, <code>CATService</code>, <code>Visitor</code>, or <code>Staff</code>.</span>

                <span class="middle"><span class="llbl">Default instrument:</span>
                    <select id="def_instrument" name="def_instrument"></select>
                </span>
                <br/>

                <span class="middle"><span class="llbl">Default colours:</span><span class="rlbl">Monitor</span><input type="text" id="def_col_Monitor" /><input type="text" id="def_tcol_Monitor" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">ToO</span><input type="text" id="def_col_ToO" /><input type="text" id="def_tcol_ToO" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">SoftToO</span><input type="text" id="def_col_SoftToO" /><input type="text" id="def_tcol_SoftToO" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">Payback</span><input type="text" id="def_col_Payback" /><input type="text" id="def_tcol_Payback" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">Fast-Track</span><input type="text" id="def_col_Fast_Track" /><input type="text" id="def_tcol_Fast_Track" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">Service</span><input type="text" id="def_col_Service" /><input type="text" id="def_tcol_Service" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">CATService</span><input type="text" id="def_col_CATService" /><input type="text" id="def_tcol_CATService" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">Visitor</span><input type="text" id="def_col_Visitor" /><input type="text" id="def_tcol_Visitor" /></span><br/>
                <span class="middle"><span class="llbl"></span><span class="rlbl">Staff</span><input type="text" id="def_col_Staff" /></span><input type="text" id="def_tcol_Staff" /></span><br/>
                <span class="defdetails">First column: fill colour; second column: text colour. Input accepts any valid CSS colour specification (e.g., <code>blue</code>, <code>rgb(0, 0, 255)</code>, <code>#0000ff</code>, or <code>#00f</code>).</span>
            </div> <!-- #config-left -->
            <div id="config-right">
                <h2 class="h2-instr">Scheduling algorithm</h2><br/>
                <span class="middle"><label for="opt_reschedule_later"><input type="checkbox" name="opt_reschedule_later" id="opt_reschedule_later" checked="checked" /> Do not schedule in the past during an observing night</label></span><br/>
                <span class="middle"><label for="opt_maintain_order"><input type="checkbox" name="opt_maintain_order" id="opt_maintain_order" /> Always schedule targets in their input order</label></span><br/>
                <span class="middle"><label for="opt_reorder_targets"><input type="checkbox" name="opt_reorder_targets" id="opt_reorder_targets" checked="checked" /> Relabel targets according to the schedule order</label></span><br/>
                <span class="middle"><label for="opt_allow_over_axis"><input type="checkbox" name="opt_allow_over_axis" id="opt_allow_over_axis" /> Allow observations over-the-axis (equatorial mounts only)</label></span><br/>
                <span class="middle">Schedule observations between:</label></span><br/>
                    <input type="radio" id="sunset-sunrise" name="opt_schedule_between" value="sunset-sunrise"><label for="sunset-sunrise">Sunset / Sunrise</label><br/>
                    <input type="radio" id="nautical" name="opt_schedule_between" value="nautical" checked="checked"><label for="nautical">Nautical twilights</label><br/>
                    <input type="radio" id="astronomical" name="opt_schedule_between" value="astronomical"><label for="astronomical">Astronomical twilights</label><br/>
                <br/>
                <h2 class="h2-instr">Display settings</h2><br/>
                <span class="middle"><label for="opt_show_lastobstime"><input type="checkbox" name="opt_show_lastobstime" id="opt_show_lastobstime" /> Mark last possible starting time</label></span><br/>
            </div></div> <!-- #config-right, #config -->
            <span style="text-align: right; width: 100%; display: block">
                <input type="hidden" id="configsubmit"/><input type="button" value="Apply settings" id="configapply" />
            </span>
        </div> <!-- #config-container -->
        <div id="help-container"><div id="help">
            <div id="help-left">
                <span class="sh1"><b>Note:</b> This is a minimal description of how to use Visplot. For the full documentation, please visit our <a target="_blank" href="https://visplot.readthedocs.io/">Read the Docs page</a>.</span>
                <br/>

                <span class="sh0">Workflow</span>
                • Set the observing date in the <i>Date</i> field and press <i>Set</i>. This will populate the graph with the ephemerides for that night. By default, the page is pre-loaded for today's observing night (after noon) or for last night (before noon).<br/>
                • Fill in the list of targets according to the rules given below (alternatively, the list of targets may be pre-filled by the OB generator if the page is accessed from there) and press <i>Plot targets</i>.<br/>
                • Choose the scheduling and rendering options from the checkbox list and press <i>Schedule observations</i>.
                The software will then attempt to schedule as many targets as possible, each at the best possible airmass, while taking into account all specified and implicit constraints.<br/>
                • Once the night is scheduled, the visibility plot will be refreshed and the UTC range of observation for each target will be marked by a thick, coloured line.<br/>
                • After scheduling the night, you can always click on the number corresponding to an object to see the details of the observation (UTC range, total observing time, etc.) and the finding chart (loaded automatically from Aladin).
                It is also possible to <i>Mark the object as observed</i>, in which case it will be redrawn in green.<br/>
                • After scheduling the night for the first time, the <i>Schedule observations</i> button will change into <i>Update schedule</i>. From that point onwards, any change to the input list of targets will update the schedule (e.g., targets marked as <i>Observed</i> remain observed and are no longer moved around or rescheduled) as opposed to completely resetting it.
                If a complete reset of the schedule is desired, press first the <i>Plot targets</i> button, and then <i>Schedule observations</i>; be warned that this will result in all previous changes being lost (e.g., observed targets will be marked as unobserved).<br/>
                • After the software has suggested an observing order, it is possible to reorder the targets manually, by dragging and dropping them on the right-hand side of the plot.
                The program may then reschedule some or all of the other targets so that all of them continue to fit their respective constraints, in their new order. In rare cases, a manual reordering may results in one or few targets becoming de-scheduled, which normally means that with the new order it is not possible for all the targets to be observed according to their respective (UTC, airmass, altitude, etc.) constraints.<br/>
                <br/>
                <span class="sh0">Input syntax</span>
                • <code>[NAME] [RA]/[pmRA] [DEC]/[pmDEC] [EPOCH] [OBSTIME] [PROJECT] [CONSTRAINTS] [TYPE] [OBINFO] [SKYPA]</code>,

                <span class="sh1">where:</span>
                • <code>[NAME]</code> is the object name, without spaces;<br/>
                • <code>[RA]</code>   is the right ascension, given either with spaces (<code>23 34 34.7</code>) or with colons (<code>23:34:34.7</code>); optionally, one can append to it the proper motion given in arcsec/year <code>[pmRA]</code>, which is otherwise assumed to be <code>0.0</code>; if provided, <code>[pmRA]</code> must already include the cosine of declination;<br/>
                • <code>[DEC]</code>  is the declination, given in the same format as the RA; optionally, one can append to it a proper motion given in arcsec/year <code>[pmDEC]</code>, which is otherwise assumed to be <code>0.0</code>;<br/>
                • <code>[EPOCH]</code> is the epoch of the coordinates; the only valid options are <code>2000</code> (corresponding to J2000) and <code>1950</code> (corresponding to B1950);<br/>
                • <code>[OBSTIME]</code>  is the total observing time (<b>including overheads</b>) in seconds;<br/>
                  Alternatively, <code>[OBSTIME]</code> can be <code>*</code> if <code>[CONSTRAINTS]</code> is a UTC/LST range, in which case the object will be scheduled with absolute priority for the entire time interval (useful for, e.g., time-critical monitoring);<br/>
                • <code>[PROJECT]</code> is the project number (used for accounting purposes, but also for priority-based scheduling);<br/>
                • <code>[CONSTRAINTS]</code>  are the observing constraints, either airmass (a float, e.g., <code>2.0</code>), a UTC range (<code>UTC[20:00-23:30]</code>) or an LST range (<code>LST[2-4:30]</code>); integers, floats, <code>HH:MM</code> syntax, or a mix of them are all allowed for the range components (e.g., <code>LST[2:00-4.5]</code>;<br/>
                • <code>[TYPE]</code> is the type of observation, and can be one of the following: <code>Monitor</code>, <code>ToO</code>, <code>SoftToO</code>, <code>Payback</code>, <code>Fast-Track</code>, <code>Service</code>, <code>CATService</code>, <code>Visitor</code>, and <code>Staff</code>.
                Iff <code>[TYPE]</code> is set to <code>Staff</code>, it is allowed to add a slash and 2-3 initials to identify for which member of the staff the observations are taken (e.g., <code>Staff/JHT</code>, <code>Staff/TP</code>, etc.).<br/>
                • <code>[OBINFO]</code> is information passed automatically when the page is loaded from an OB queue; it allows Visplot to generate backlinks to the OB queue, as well as show additional information about each target. At the moment the system is only integrated with the NOT OB queue. Alternatively, one can pass an instrument name in this field (e.g., <code>GCMS</code>). In all other cases, the value should be <code>default</code>.<br/>
                • <code>[SKYPA]</code> is the Sky Position Angle in degrees, with 0=North up, 90=East up, etc. Used for the orientation of the finding chart only.<br/>
            </div> <!-- #help-left -->
            <div id="help-right">
                <span class="sh1"><b>Note:</b> The fields <code>[EPOCH]</code>, <code>[OBSTIME]</code>, <code>[PROJECT]</code>, <code>[CONSTRAINTS]</code>, <code>[TYPE]</code>, <code>[OBINFO]</code> and <code>[SKYPA]</code> are optional, and will be filled with default values (i.e., <code>2000 600 54-199 2.0 Staff default 0</code>) if missing.</span><br/>

                <span class="sh1"><b>Examples of valid input formats:</b></span>
                • <code>EQPsc 23 34 34 -01 19 36</code><br/>
                  This will fill the extra fields with the default values.<br/>

                • <code>EQPsc 23 34 34.70 -01 19 36.01 2000 2600 54-321 2.0 Monitor default</code><br/>
                  This is the most frequent way of filling the input field, and is also used by the OB generator.<br/>

                • <code>EQPsc 23:34:34.70 -01:19:36.01 2000 2600 54-321 2.0 Monitor default</code><br/>
                  Sometimes, observers prefer to use colon-separated RA and Dec, which is fine.<br/>

                • <code>HD84937 09 46 12.06/0.373 13 59 17.44/-0.774 1950 414 54-501 1.5 ToO</code><br/>
                  For this object the proper motion is appended to the RA and Dec values, and the coordinate epoch is given as B1950.<br/>

                • <code>EQPsc 23 34 34.70 -01 19 36.01 2000 1800 54-321 UTC[22:00-24:00] Staff</code><br/>
                  In this case the program will schedule EQPsc for 30 min between UTC 22 and 24.<br/>

                • <code>EQPsc 23:34:34.70 -01:19:36.01 2000 * 54-321 UTC[20:00-20:30] Staff default</code><br/>
                  In this case EQPsc will be scheduled for the entire half hour between UTC 20:00 and 20:30. Highest priority.<br/>
                <br/>
                Note: It is possible to separate groups of targets by blank lines, which will be ignored by the software.<br/>
                Note: It is also possible to comment out a target by adding a hashtag (<code>#</code>) at the beginning of the line. In this case, the software will not plot or schedule that target. The line can always be uncommented later on.<br/>
                <br/>
                <span class="sh0">Alternative (TCS catalogue) syntax</span>
                The software accepts the NOT TCS catalogue syntax as input format (Name RA DEC Epoch pmRA pmDec Mag; see the <i>Enter-Object</i> entry on the <a target="_blankTCS" href="http://www.not.iac.es/telescope/tcs/commands.txt">TCS commands page</a>), but it will automatically convert it to the Visplot format described above, and the magnitude value will be lost (since at the moment it is not used by Visplot).<br/>
                Because this compatibility is built into Visplot, a valid Visplot target list can be exported to a TCS source catalogue using the <i>TCS format</i> button, and can then be loaded to the NOT system <a target="_blankTCS" href="http://www.not.iac.es/observing/forms/catalog/">here</a>.<br/>
                <br/>
                <span class="sh0">Alternative syntax for non-schedulable time</span>
                The software can avoid scheduling observations in a given interval (e.g., when the telescope is offline due to bad weather or technical problems, or for the visitor's half of a shared night, etc.).<br/>
                The syntax to add an offline period is:<br/>
                • <code>Offline UT[20:30-22:30]</code><br/>
                • <code>Offline LST[23-3.5]</code><br/>
                In this example, the system will not schedule any observations in the given UTC or LST range. One can define as many such intervals as desired.<br/>
                <br/>
                <span class="sh0">SkyCam</span>
                The button <i>Show SkyCam</i> will open a lightbox window showing SkyCam and the current UTC and LST (these refresh automatically).
                If a valid list of targets is loaded (i.e., the <i>Plot</i> button has been pressed), the targets will be shown on SkyCam, and their positions will be automatically refreshed every few seconds.
                It is particularly advisable to use this feature when the sky is partially cloudy, as it will allow the observer to schedule observations through patches of clear sky.<br/>
                <br/>
                <span class="sh0">Save/Load</span>
                The <i>Save</i> feature can be used to download a compressed file of all the data currently loaded in Visplot, including the list of targets, the current schedule, and the user-defined settings.
                This file can then be loaded again using the <i>Load</i> feature (even on a different computer), which will restore the state of Visplot and allow the user to resume the work at a later time (e.g., make a preliminary schedule at home and load it at the telescope before the observing night starts).<br/><br/>
                Note: Since at the moment <i>Visplot</i> is being updated at very high cadence, it may happen that old files will cease to be compatible with the program in the near future, although we are trying to avoid that situation as much as possible. Once Visplot will become stable and fully functional, the Visplot file format will (hopefully) remain unchanged.<br/>
            </div> <!-- #help-right -->
        </div></div> <!-- #help, #help-container -->
    </div>
    <!-- Cloud-hosted, 3rd party libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.7/jquery.fancybox.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.59.4/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.59.4/addon/selection/active-line.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.59.4/addon/mode/simple.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
    <script src='https://api.mapbox.com/mapbox.js/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js'></script>
    <!-- Locally-hosted, 3rd party libraries -->
    <script src="js/aladin.min.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/jsplitter.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/moment-timezone-with-data.min.js?v=<?php echo($version);?>"></script>
    <!-- Configuration files -->
    <script src="js/config.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <!-- Main JS code -->
    <script src="js/visplot_slacoeffs.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_sla.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_driver.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_night.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_graph.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_targets.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_helper.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_serializer.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <script src="js/visplot_skygraph.js?v=<?php echo($version);?>" type="text/javascript" charset="utf-8"></script>
    <?php include '.ga'; ?>
    <!-- OB data goes in its own hidden variables -->
    <?php if ($obpost) { echo '<input type="hidden" id="obinfo" value="'.rawurlencode($obinfo).'" /> '; } ?>
</body>
</html>
