<!DOCTYPE HTML>
<?php
/**
 * Copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */
$_DEBUG = TRUE;
 session_start();
 if (isset($_SESSION['obinfo'])) {
    $_POST['obinfo'] = $_SESSION['obinfo'];
    $_SERVER['REQUEST_METHOD'] = 'POST';
    unset($_SESSION['obinfo']);
 }
 if ($_SERVER['REQUEST_METHOD'] === 'POST' and
     isset($_POST['obinfo']) and !empty($_POST['obinfo'])) {
    if (get_magic_quotes_gpc()) {
      $obinfo = stripslashes($_POST['obinfo']);
    } else {
      $obinfo = $_POST['obinfo'];
    }
    $obpost = TRUE;
    if (json_decode($obinfo) === NULL) {
        $obpost = FALSE;
    }
} else {
    $obpost = FALSE;
}
?>
<html lang="en">

<head>
    <title>NOT/Visplot</title>
    <meta name="description" content="New visibility plot and observing night scheduling tool for the NOT/ING.">
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.6/css/jquery.fancybox.min.css" type="text/css" media="screen" />
    <link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/codemirror/5.24.2/codemirror.min.css" type="text/css" />
    <link rel="stylesheet" href="http://aladin.u-strasbg.fr/AladinLite/api/v2/latest/aladin.min.css" type="text/css" />
    <link rel="stylesheet" href="style.css" type="text/css" />
</head>

<body>
    <div id="container">
        <div id="leftblock">
            <div id="left_upper">
                <div id="helpbtnDiv">
                    <input type="button" value="Set defaults" id="setDefaults" />
                    <input type="button" value="Help" id="helpBtn" />
                </div>
                Date:<br/>
                <input type="text" id="dateY" /> &ndash; <input type="text" id="dateM" /> &ndash; <input type="text" id="dateD" />
                <input type="button" value="Set" id="dateSet" /><br/><br/>
                <span class="middle">Targets:
                    <input type="button" value="Blank fields" id="targetBlanks" />
                </span><br/>
                <textarea id="targets"></textarea><br/>
                <input type="hidden" id="targets_actual" /><input type="hidden" id="added_targets" />
                <input type="button" value="Plot targets" id="plotTargets" /><br/><br/> 
            </div>
            <div id="left_lower">
                <span class="middle"><label for="opt_reschedule_later"><input type='checkbox' name="opt_reschedule_later" id="opt_reschedule_later" checked="checked" /> Do not schedule in the past during an observing night</label></span><br/>
                <span class="middle"><label for="opt_id_next_line"><input type='checkbox' name="opt_id_next_line" id="opt_id_next_line" checked="checked" /> Place object ID next to its line (not on top)</label></span><br/>
                <span class="middle"><label for="opt_away_from_zenith"><input type='checkbox' name="opt_away_from_zenith" id="opt_away_from_zenith" checked="checked" /> Do not observe closer than 2° from zenith</label></span><br/>
                <span class="middle"><label for="opt_maintain_order"><input type='checkbox' name="opt_maintain_order" id="opt_maintain_order" /> Always schedule targets in their input order</label></span><br/>
                <span class="middle"><label for="opt_show_lastobstime"><input type='checkbox' name="opt_show_lastobstime" id="opt_show_lastobstime" /> Mark last possible starting time</label></span><br/>
                <div id="buttons">
                    <div id="lb_sched"><input type="button" value="Schedule observations" id="planNight" /></div>
                    <div id="lb_skycm"><input type="button" value="Show SkyCam" id="showSkyCam" /></div>
                    <div id="lb_exprt"><input type="button" value="Export PNG" id="pngExport" /></div>
                    <div id="lb_tcsex"><input type="button" value="TCS format" id="tcsExport" /></div>
                    <div id="lb_svdoc"><input type="button" value="Save" id="saveDoc" /></div>
                    <div id="lb_lddoc"><span class="middle">&nbsp;<label for="loadDoc">Load: <input type="file" value="Load" id="loadDoc" /></label></span></div>
                </div>
                <pre id="logger"><span class="loggerEntry">Waiting for the page to load...</span></pre>
            </div>
        </div>
        <div id="contentblock">
            <canvas id="canvasFrame" width="951" height="672"></canvas>
        </div>
    </div>
    <a id="inline" href="#details" style="display:none"></a>
    <div style="display:none">
        <div id="details">
            <div id="details_title"></div>
            <div id="details_info"></div>
            <div id="details_map"><span id="details_map_hang"></span></div>
        </div>
        <div id="skycamblock">
            <canvas id="canvasSkycam" width="640" height="518"></canvas>
        </div>
        <div id="tcscat"><h2>Targets in TCS catalogue format</h2><pre id="tcspre"></pre></div>
        <div id="defaultsdiv"><h2>Change the default settings</h2>
            <span class="middle"><span class="llbl">Telescope name:</span>
                <input type="radio" name="def_telescope" value="NOT" checked />NOT
                <input type="radio" name="def_telescope" value="WHT" />WHT
                <input type="radio" name="def_telescope" value="INT" />INT</span>
            <br/>
            <span class="middle"><span class="llbl">Default epoch:</span><input type="text" id="def_epoch"/></span><br/>
            <span class="defdetails">Must be <code>1950</code> or <code>2000</code>.</span>
            
            <span class="middle"><span class="llbl">Default proposal ID:</span><input type="text" id="def_project"/></span><br/>
            <span class="defdetails">Must have the form <code>NN-NNN</code>.</span>
            
            <span class="middle"><span class="llbl">Default observation type:</span><input type="text" id="def_type"/></span><br/>
            <span class="defdetails">Must be one of the following: <code>Monitor</code>, <code>ToO</code>, <code>SoftToO</code>, <code>Payback</code>, <code>Fast-Track</code>, <code>Service</code>, <code>Visitor</code>, or <code>Staff</code>.</span>
            
            <span class="middle"><span class="llbl">Default maximum airmass:</span><input type="text" id="def_maxam"/></span><br/>
            <span class="defdetails">Must be a float.</span>
            
            <span class="middle"><span class="llbl">Default observing time:</span><input type="text" id="def_obstime"/></span><br/>
            <span class="defdetails">Must be an integer.</span>
            
            <span class="middle"><span class="llbl">Default colours:</span><span class="rlbl">Monitor</span><input type="text" id="def_col_Monitor" /><input type="text" id="def_tcol_Monitor" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">ToO</span><input type="text" id="def_col_ToO" /><input type="text" id="def_tcol_ToO" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">SoftToO</span><input type="text" id="def_col_SoftToO" /><input type="text" id="def_tcol_SoftToO" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">Payback</span><input type="text" id="def_col_Payback" /><input type="text" id="def_tcol_Payback" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">Fast-Track</span><input type="text" id="def_col_Fast_Track" /><input type="text" id="def_tcol_Fast_Track" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">Service</span><input type="text" id="def_col_Service" /><input type="text" id="def_tcol_Service" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">Visitor</span><input type="text" id="def_col_Visitor" /><input type="text" id="def_tcol_Visitor" /></span><br/>
            <span class="middle"><span class="llbl"></span><span class="rlbl">Staff</span><input type="text" id="def_col_Staff" /></span><input type="text" id="def_tcol_Staff" /></span><br/>
            <span class="defdetails">First column: fill colour; second column: text colour. Input accepts any valid CSS colour specification (e.g., <code>blue</code>, <code>rgb(0,0,255)</code>, <code>#0000ff</code>, or <code>#00f</code>).</span>
            
            <input type="hidden" id="defsubmit"/><input type="button" value="Apply" id="defapply" />
        </div>
        <div id="help">
            <span class="sh0">Workflow</span>
            • Set the observing date in the <i>Date</i> field and press <i>Set</i>. This will populate the graph with the ephemerides for that night. By default, the page is pre-loaded for today's observing night (after 12:00 UT) or for last night (before 12:00 UT).<br/>
            • Fill in the list of targets according to the rules given below (alternatively, the list of targets may be pre-filled by the OB generator if the page is accessed from there) and press <i>Plot targets</i>.<br/>
            • Choose the scheduling and rendering options from the checkbox list and press <i>Schedule observations</i>. 
            The software will then attempt to schedule as many targets as possible, each at the best possible airmass, while taking into account all specified and implicit constraints.<br/>
            • Once the night is scheduled, the visibility plot will be refreshed and the UT range of observation for each target will be marked by a thick, coloured line.<br/>
            • After scheduling the night, you can always click on the number corresponding to an object to see the details of the observation (UT range, total observing time, etc.) and the finding chart (loaded automatically from Aladin). 
            It is also possible to <i>Mark the object as observed</i>, in which case it will be redrawn in green.<br/>
            • After scheduling the night for the first time, the <i>Schedule observations</i> button will change into <i>Update schedule</i>. From that point onwards, any change to the input list of targets will update the schedule (e.g., targets marked as <i>Observed</i> remain observed and are no longer moved around or rescheduled) as opposed to completely resetting it. 
            If a complete reset of the schedule is desired, press first the <i>Plot targets</i> button, and then <i>Schedule observations</i>; be warned that this will result in all previous changes being lost (e.g., observed targets will be marked as unobserved).<br/>
            • After the software has suggested an observing order, it is possible to reorder the targets manually, by dragging and dropping them on the right-hand side of the plot. 
            The program may then reschedule some or all of the other targets so that all of them continue to fit their respective constraints, in their new order. In rare cases, a manual reordering may results in one or few targets becoming de-scheduled, which normally means that with the new order it is not possible for all the targets to be observed according to their respective (UT, airmass, altitude, etc.) constraints.<br/>
            <br/>
            <span class="sh0">Input syntax</span>
            • <code>[NAME] [RA]/[pmRA] [DEC]/[pmDEC] [EPOCH] [OBSTIME] [PROJECT] [CONSTRAINTS] [TYPE]</code>,

            <span class="sh1">where:</span>
            • <code>[NAME]</code> is the object name, without spaces;<br/>
            • <code>[RA]</code>   is the right ascension, given either with spaces (<code>23 34 34.7</code>) or with colons (<code>23:34:34.7</code>); optionally, one can append to it the proper motion given in arcsec/year <code>[pmRA]</code>, which is otherwise assumed to be <code>0.0</code>;<br/>
            • <code>[DEC]</code>  is the declination, given in the same format as the RA; optionally, one can append to it a proper motion given in arcsec/year <code>[pmDEC]</code>, which is otherwise assumed to be <code>0.0</code>;<br/>
            • <code>[EPOCH]</code> is the epoch of the coordinates; the only valid options are <code>2000</code> (corresponding to J2000) and <code>1950</code> (corresponding to B1950);<br/>
            • <code>[OBSTIME]</code>  is the total observing time (<b>including overheads</b>) in seconds;<br/>
                    Alternatively, <code>[OBSTIME]</code> can be <code>*</code> if <code>[CONSTRAINTS]</code> is a UT/LST range, in which case the object will be scheduled with absolute
                    priority for the entire time interval (useful for, e.g., time-critical monitoring);<br/>
            • <code>[PROJECT]</code> is the project number (used for accounting purposes, but also for priority-based scheduling);<br/>
            • <code>[CONSTRAINTS]</code>  are the observing constraints, either airmass (a float, e.g., <code>2.0</code>), a UT range (<code>UT[20:00-23:30]</code>) or an LST range (<code>LST[2-4:30]</code>);<br/>
            • <code>[TYPE]</code> is the type of observation, and can be one of the following: <code>Monitor</code>, <code>ToO</code>, <code>SoftToO</code>, <code>Payback</code>, <code>Fast-Track</code>, <code>Service</code>, <code>Visitor</code>, and <code>Staff</code>.
            Iff <code>[TYPE]</code> is set to <code>Staff</code>, it is allowed to add a slash and 2-3 initials to identify for which member of the staff the observations are taken (e.g., <code>Staff/JHT</code>, <code>Staff/TP</code>, etc.).<br/><br/>

            <span class="sh1">Note: Fields <code>[EPOCH]</code>, <code>[OBSTIME]</code>, <code>[PROJECT]</code> and <code>[CONSTRAINTS]</code> are optional, and will be filled with default values
                (i.e., <code>2000 600 54-199 2.0 Staff</code>) if missing.</span><br/>

            <span class="sh1"><b>Examples of valid input formats:</b></span>
            • <code>EQPsc 23 34 34 -01 19 36</code><br/>
                This will fill the extra fields with the default values.<br/>

            • <code>EQPsc 23 34 34.70 -01 19 36.01 2000 2600 54-321 2.0 Monitor</code><br/>
                This is the most frequent way of filling the input field, and is also used by the OB generator.<br/>

            • <code>EQPsc 23:34:34.70 -01:19:36.01 2000 2600 54-321 2.0 Monitor</code><br/>
                Sometimes, observers prefer to use colon-separated RA and Dec, which is fine.<br/>
            
            • <code>HD84937 09:46:12.00/0.03 13:59:17.00/-0.79 1950 414 54-501 1.5 ToO</code><br/>
                For this object the proper motion is appended to the RA and Dec values, and the coordinate epoch is given as B1950.<br/>

            • <code>EQPsc 23 34 34.70 -01 19 36.01 2000 1800 54-321 UT[22:00-24:00] Staff</code><br/>
                In this case the program will schedule EQPsc for 30 min between UT 22 and 24.<br/>

            • <code>EQPsc 23:34:34.70 -01:19:36.01 2000 * 54-321 UT[20:00-20:30] Staff</code><br/>
                In this case EQPsc will be scheduled for the entire half hour between UT 20:00 and 20:30. Highest priority.<br/>
            <br/>
            Note: It is possible to separate groups of targets by blank lines, which will be ignored by the software.<br/>
            Note: It is also possible to comment out a target by adding a hashtag (<code>#</code>) at the beginning of the line. In this case, the software will not plot or schedule that target. The line can always be uncommented later on.<br/>
            <br/>
            <span class="sh0">Alternative (TCS catalogue) syntax</span>
            The software accepts the NOT TCS catalogue syntax as input format (Name RA DEC Epoch pmRA pmDec Mag; see the <i>Enter-Object</i> entry on the <a target='_blankTCS' href="http://www.not.iac.es/telescope/tcs/commands.txt">TCS commands page</a>), but it will automatically convert it to the Visplot format described above, and the magnitude value will be lost (since at the moment it is not used by Visplot).<br/>
            Because this compatibility is built into Visplot, a valid Visplot target list can be exported to a TCS source catalogue using the <i>TCS format</i> button, and can then be loaded to the NOT system <a target='_blankTCS' href="http://www.not.iac.es/observing/forms/catalog/">here</a>.<br/>
            <br/>
            <span class="sh0">Alternative syntax for non-schedulable time</span>
            The software can avoid scheduling observations in a given interval (e.g., when the telescope is offline due to bad weather or technical problems, or for the visitor's half of a shared night, etc.).<br/>
            The syntax to add an offline period is:<br/>
            • <code>Offline UT[20:30-22:30]</code><br/>
            • <code>Offline LST[23-3]</code><br/>
            In this example, the system will not schedule any observations in the given UT or LST range. One can define as many such intervals as desired.<br/>
            <br/>
            <span class="sh0">SkyCam</span>
            The button <i>Show SkyCam</i> will open a lightbox window showing SkyCam and the current UT and LST (these refresh automatically). 
            If a valid list of targets is loaded (i.e., the <i>Plot</i> button has been pressed), the targets will be shown on SkyCam, and their positions will be automatically refreshed every few seconds.
            It is particularly advisable to use this feature when the sky is partially cloudy, as it will allow the observer to schedule observations through patches of clear sky.<br/>
            <br/>
            <span class="sh0">Save/Load</span>
            The <i>Save</i> feature can be used to download a compressed file of all the data currently loaded in Visplot, including the list of targets, the current schedule, and the user-defined settings. 
            This file can then be loaded again using the <i>Load</i> feature (even on a different computer), which will restore the state of Visplot and allow the user to resume the work at a later time (e.g., make a preliminary schedule at home and load it at the telescope before the observing night starts).<br/><br/> 
            Note: Since at the moment <i>Visplot</i> is being updated at very high cadence, it may happen that old files will cease to be compatible with the program in the near future, although we are trying to avoid that situation as much as possible. Once Visplot will become stable and fully functional, the Visplot file format will (hopefully) remain unchanged.<br/>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.6/js/jquery.fancybox.min.js"></script>  
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.24.2/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js"></script>
    <script src="http://aladin.u-strasbg.fr/AladinLite/api/v2/latest/aladin.min.js" type="text/javascript" charset="utf-8"></script>
    <script src="visplot.js" type="text/javascript"></script>
    <script src="visplot_driver.js" type="text/javascript"></script>
    <script src="visplot_slacoeffs.js" type="text/javascript"></script>
    <script src="visplot_sla.js" type="text/javascript"></script>
    <script src="visplot_night.js" type="text/javascript"></script>
    <script src="visplot_graph.js" type="text/javascript"></script>
    <script src="visplot_targets.js" type="text/javascript"></script>
    <script src="visplot_helper.js" type="text/javascript"></script>
    <script src="visplot_serializer.js" type="text/javascript"></script>
    <script src="visplot_skygraph.js" type="text/javascript"></script>
    <?php if ($obpost) { echo '<input type="hidden" id="obinfo" value="'.rawurlencode($obinfo).'" /> '; } ?>
</body>
</html>
