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
function TargetList() {
    this.nTargets = 0;
    this.Targets = [];
    this.Offline = [];
    this.InputText = null;
    this.VisibleLines = null;   // including empty lines and comments
    this.TargetsLines = null;   // only the lines that contain proper targets
    this.FormattedLines = null; // contains arrays or null values
    this.TCSlines = null;
    this.MaxLen = null;
    this.InputStats = null;
    this.InputValid = false;
    this.ComputedTargets = null;
    this.BadWolfStart = [];
    this.BadWolfEnd = [];
    this.StartingAt = null;
    this.Warning1 = [];
    this.Warning2 = [];
}

/**
 * @class
 * @constructor
 */
function Target(k, obj) {
    this.Index = k;
    this.Name = obj.name;
    this.RA = obj.ra;
    this.Dec = obj.dec;
    this.RA_rad = obj.RA_rad;
    this.Dec_rad = obj.Dec_rad;
    this.Epoch = obj.epoch;
    this.shortRA = (obj.ra.indexOf(".") > -1) ? obj.ra.substr(0, obj.ra.indexOf(".")) : obj.ra;
    this.shortDec = (obj.dec.indexOf(".") > -1) ? obj.dec.substr(0, obj.dec.indexOf(".")) : obj.dec;
    this.J2000 = obj.J2000;
    this.Exptime = obj.exptime;
    this.ExptimeSeconds = Math.round(this.Exptime * 86400);
    this.Exptime = Math.floor(this.Exptime / driver.night.xstep) * driver.night.xstep;
    let hrs = Math.floor(this.ExptimeSeconds / 3600);
    let min = Math.round((this.ExptimeSeconds - hrs * 3600) / 60);
    this.ExptimeHM = `${hrs > 0 ? hrs.toFixed(0) + "h " : ""}${min.toFixed(0)}m`;
    this.ZenithTime = obj.zenithtime;
    this.Graph = obj.line;
    this.FullType = obj.type;
    this.Type = (obj.type.indexOf("/") === -1 ? obj.type : obj.type.substring(0, obj.type.indexOf("/")));
    this.MinMoonDistance = Math.round(obj.mdist);
    this.MinMoonDistanceTime = obj.mdisttime;
    this.ProjectNumber = obj.project;
    this.RestrictionMaxAlt = $("#opt_away_from_zenith").is(":checked")
        ? 90 - config[Driver.telescopeName].zenithLimit
        : 90;
    this.MaxAirmass = obj.airmass;
    this.RestrictionMinAlt = helper.AirmassToAltitude(this.MaxAirmass);
    this.RestrictionMinUT = obj.UTstart; //night.ENauTwilight;
    this.RestrictionMaxUT = obj.UTend;   //night.MNauTwilight;
    this.observable = [];
    this.Scheduled = false;
    this.FillSlot = obj.fillslot;
    this.Constraints = obj.constraints;
    this.inputRA = obj.inputRA;
    this.inputDec = obj.inputDec;
    if (this.FillSlot) {
        helper.LogEntry(`Attention: object <i>${this.Name}</i> will fill its entire time slot.`);
    }
    this.LabelFillColor = Driver.FillColors[this.Type];
    this.LabelTextColor = Driver.TextColors[this.Type];
    this.LabelStrokeColor = this.LabelFillColor;
    this.Observed = false;
    this.ObservedStartTime = null;
    this.ObservedEndTime = null;
    this.ObservedTotalTime = null;
    this.OBData = obj.obdata;
    if (obj.obdata !== Driver.defaultOBInfo) {
        let ob_arr = this.OBData.split(":");
        this.BacklinkToOBQueue = `http://www.not.iac.es/intranot/ob/ob_update.php?period=${parseInt(this.ProjectNumber.substring(0, 2))}&propID=${parseInt(this.ProjectNumber.substring(3))}&groupID=${ob_arr[2]}&blockID=${ob_arr[3]}`;
        this.Instrument = ob_arr[0];
        this.ExtraInfo = `${ob_arr[0]}/${ob_arr[1]}`;
    } else {
        this.BacklinkToOBQueue = null;
        this.Instrument = null;
        this.ExtraInfo = null;
    }
    this.ReconstructedInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch} ${this.ExptimeSeconds} ${this.ProjectNumber} ${this.Constraints} ${this.FullType} ${this.OBData}`;
    this.ReconstructedMinimumInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch}`;
    this.Comments = null;

    let dfun = config[Driver.telescopeName].declinationLimit;
    this.DecLimit_MinimumAlt = null;
    this.DecLimit_MinimumHA = null;
    this.DecLimit_MaximumHA = null;
    if (dfun !== null) {
        if (dfun[0] == "alt(dec)") {
            this.DecLimit_MinimumAlt = dfun[1](this.Dec_rad * sla.r2d);
        } else if (dfun[0] == "ha(dec)") {
            this.DecLimit_MinimumHA = dfun[1](this.Dec_rad * sla.r2d);
            this.DecLimit_MaximumHA = dfun[2](this.Dec_rad * sla.r2d);
        }
    }
}

/**
 * @memberof TargetList
 */
TargetList.prototype.targetStringToJSON = function (line) {
    // Parse an input string into a Target object
    let night = driver.night;
    let dat = line.split(/\s+/);
    let obj = {};
    obj.name = dat[0];
    obj.airmass = parseFloat(dat[10]);
    if (isNaN(obj.airmass)) {
        let uts = helper.ExtractUTRange(dat[10]);
        obj.UTstart = Math.max(night.ENauTwilight, uts[0]);
        obj.UTend = Math.min(night.MNauTwilight, uts[1]);
        obj.airmass = 9.9;
        obj.fillslot = dat[8] == "*";
        if (obj.fillslot) {
            obj.exptime = obj.UTend - obj.UTstart;
        } else {
            obj.exptime = parseFloat(dat[8])/86400.0;
        }
    } else {
        obj.UTstart = night.ENauTwilight;
        obj.UTend = night.MNauTwilight;
        obj.fillslot = false;
        obj.exptime = parseFloat(dat[8])/86400.0;
    }
    obj.project = dat[9];
    obj.epoch = parseFloat(dat[7]);
    obj.line = Array();
    obj.type = dat[11];
    obj.obdata = dat[12];
    obj.constraints = dat[10];
    let rax = dat[3].split("/");
    let decx = dat[6]. split("/");
    obj.ra = `${dat[1]}:${dat[2]}:${rax[0]}`;
    obj.dec = `${dat[4]}:${dat[5]}:${decx[0]}`;
    obj.inputRA = obj.ra.replaceAll(":", " ");
    obj.inputDec = obj.dec.replaceAll(":", " ");
    let ra = sla.dtf2r(parseInt(dat[1]), parseInt(dat[2]), parseFloat(rax[0]));
    let decdeg = Math.abs(parseInt(dat[4]));
    let decneg = dat[4].substring(0, 1) === "-";
    let dec = sla.daf2r(decdeg, parseInt(dat[5]), parseFloat(decx[0]));
    if (decneg) {
        dec *= -1;
    }
    let minmdist = 9999;
    let iminmdist = 0;
    for (let i=0; i<night.Nx; i+=1) {
        let mdist = sla.r2d * sla.dsep(night.ramoon[i], night.decmoon[i], ra, dec);
        if (mdist < minmdist) {
            minmdist = mdist;
            iminmdist = i;
        }
    }
    obj.mdist = minmdist;
    obj.mdisttime = night.xaxis[iminmdist];
    let pmra, pmdec;
    if (rax.length === 1) {
        pmra = 0;
    } else {
        // Given in arcsec/year;
        // convert to radians/year
        pmra = parseFloat(rax[1]) * sla.das2r;
        // Remove the cos(dec) for SLALIB
        pmra = pmra/Math.cos(dec);
    }
    if (decx.length === 1) {
        pmdec = 0;
    } else {
        // convert to radians/year
        pmdec = parseFloat(decx[1]) * sla.das2r;
    }
    /* Conversion from Besselian to Julian, if necessary */
    if (obj.epoch > 1984) {
        obj.J2000 = [ra, dec];
    } else {
        let j2000;
        /* No proper motion */
        if (pmra == 0 && pmdec == 0) {
            j2000 = sla.fk45z(ra, dec, obj.epoch);
            obj.J2000 = [j2000.r2000, j2000.d2000];
        } else {
            j2000 = sla.fk425(ra, dec, pmra, pmdec, 0, 0);
            obj.J2000 = [j2000.r2000, j2000.d2000];
        }
    }

    let retap, retob;
    let imax = 0;
    let altmax = 0;
    for (let i=0; i<night.Nx; i+=1) {
        retap = sla.mapqk(ra, dec, pmra, pmdec, 0, 0, night.amprms[i]);
        retob = sla.aopqk(retap.ra, retap.da, night.aoprms[i]);
        // Approximate refracted alt
        let ell = 0.5*Math.PI - sla.refz(retob.zob, night.ref.refa, night.ref.refb);
        if (ell > altmax) {
            imax = i;
            altmax = ell;
        }
        obj.line.push(helper.rad2deg(ell));
    }
    obj.zenithtime = night.xaxis[imax];
    obj.RA_rad = ra;
    obj.Dec_rad = dec;
    return obj;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.setTargets = function (obj) {
    const res = obj.map(function (x) {
        return this.targetStringToJSON (x);
    }, this);
    this.nTargets = res.length;
    this.Targets = [];
    this.resetWarnings();
    this.processOfflineTime();
    for (let i = 0; i < this.nTargets; i += 1) {
        this.Targets[i] = this.processTarget(i, res[i]);
    }
    this.warnUnobservable();
    driver.graph.setTargetsSize(this.nTargets);
    this.removeClusters();
};

/**
 * @memberof TargetList
 */
TargetList.prototype.addTargets = function (obj) {
    const res = obj.map(function (x) {
        return this.targetStringToJSON (x);
    }, this);
    let oldNobjects = this.nTargets;
    this.nTargets += res.length;
    this.resetWarnings();
    this.processOfflineTime();
    for (let i = oldNobjects; i < this.nTargets; i += 1) {
        this.Targets[i] = this.processTarget(i, res[i - oldNobjects]);
    }
    this.warnUnobservable();
    driver.graph.setTargetsSize(this.nTargets);
};

/**
 * @memberof TargetList
 */
TargetList.prototype.processTarget = function (i, obj) {
    const target = new Target(i, obj);
    target.preCompute();
    target.LabelX = target.ZenithTime;
    if (target.LabelX < driver.night.ENauTwilight) {
        target.LabelX = driver.night.ENauTwilight;
    } else if (target.LabelX > driver.night.MNauTwilight) {
        target.LabelX = driver.night.MNauTwilight;
    }
    target.LabelY = target.getAltitude(target.LabelX);
    target.xlab = driver.graph.transformXLocation(target.LabelX);
    target.ylab = driver.graph.transformYLocation(target.LabelY);
    return target;
};

/**
 * @memberof Target
 */
Target.prototype.intersectingChain = function (Targets, checked) {
    let len, iIntersect = [], i, j, chain = [this.Index], rc;
    if (checked.indexOf(this.Index) > -1) {
        return [];
    }
    if (this.xlab < driver.graph.xstart || this.xlab > driver.graph.xstart + driver.graph.width ||
            this.ylab > driver.graph.yend) {
        return [];
    }
    checked.push(this.Index);
    for (j = 0, len = Targets.length; j < len; j += 1) {
        if (j === this.Index || checked.indexOf(j) > -1) {
            continue;
        }
        if (helper.TwoCirclesIntersect(this.xlab, this.ylab, driver.graph.CircleSize + 0.5, Targets[j].xlab, Targets[j].ylab, driver.graph.CircleSize + 0.5)) {
            iIntersect.push(j);
        }
    }
    for (i in iIntersect) {
        j = iIntersect[i];
        chain = chain.concat(Targets[j].intersectingChain(Targets, checked));
    }
    return chain;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.removeClusters = function () {
    let checked = [], i, cluster, hasclusters, nIter = 0;
    do {
        hasclusters = false;
        for (i = 0; i < this.nTargets; i += 1) {
            cluster = this.Targets[i].intersectingChain(this.Targets, checked);
            if (cluster.length > 1) {
                hasclusters = true;
                this.spaceOutCluster(cluster);
            }
        }
        nIter += 1;
    } while (hasclusters || nIter < 10);
};

/**
 * @memberof TargetList
 */
TargetList.prototype.spaceOutCluster = function (cluster) {
    let i, obj, prev;
    for (i = 1; i < cluster.length; i += 1) {
        prev = this.Targets[cluster[i - 1]];
        obj = this.Targets[cluster[i]];
        obj.xlab = Math.max(prev.xlab, obj.xlab);
        do {
            obj.xlab += 1;
            obj.LabelX = driver.graph.reverseTransformXLocation(obj.xlab);
            obj.LabelY = obj.getAltitude(obj.LabelX);
            obj.ylab = driver.graph.transformYLocation(obj.LabelY);
        } while (helper.TwoCirclesIntersect(obj.xlab, obj.ylab, driver.graph.CircleSize + 0.5, prev.xlab, prev.ylab, driver.graph.CircleSize + 0.5));
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.processOfflineTime = function () {
    let i, len = this.BadWolfStart.length;
    this.Offline = [];
    for (i = 0; i < len; i += 1) {
        this.Offline.push({Start: this.BadWolfStart[i], End: this.BadWolfEnd[i]});
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.resetWarnings = function () {
    this.Warning1 = [];
    this.Warning2 = [];
};

/**
 * @memberof TargetList
 */
TargetList.prototype.warnUnobservable = function () {
    if (this.Warning1.length > 0) {
        helper.LogWarning("Warning: Target" + (this.Warning1.length === 1 ? "" : "s") + " <i>" + this.Warning1.join(", ") + "</i> cannot possibly be scheduled for this night, as " + (this.Warning1.length === 1 ? "it" : "they") + " will never fit the airmass/UT constraints.");
    }
    if (this.Warning2.length > 0) {
        helper.LogWarning("Warning: Target" + (this.Warning2.length === 1 ? "" : "s") + " <i>" + this.Warning2.join(", ") + "</i> cannot possibly be scheduled for this night, as " + (this.Warning2.length === 1 ? "it" : "they") + " will not fit the airmass/UT constraints for long enough to perform the observations.");
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.canSchedule = function (obj, start) {
    let end = start + obj.Exptime;
    let overlaps = false, i, other;
    for (i = 0; i < this.nTargets; i += 1) {
        if (i === this.Index) {
            continue;
        }
        other = this.Targets[i];
        if (!other.Scheduled) {
            continue;
        }
        if (end <= other.ScheduledStartTime || start >= other.ScheduledEndTime) {
            continue;
        }
        overlaps = true;
        break;
    }
    if (overlaps) {
        return false;
    }

    for (i = 0; i < obj.nAllowed; i += 1) {
        if (start >= obj.beginAllowed[i] && end <= obj.endAllowed[i]) {
            return true;
        }
    }
    return false;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.optimize_interchangeNeighbours = function (scheduleorder) {
    let i, obj1, obj2, am1now, am2now, am1if, am2if, exchange, t1, c;
    for (i = 0; i < scheduleorder.length - 1; i += 1) {
        obj1 = this.Targets[scheduleorder[i]];
        obj2 = this.Targets[scheduleorder[i + 1]];
        if (obj1.Observed || obj2.Observed) {
            continue;
        }
        if (obj1.FillSlot || obj2.FillSlot) {
            continue;
        }
        if (this.canSchedule(obj2, obj1.ScheduledStartTime) === false) {
            continue;
        }
        if (this.canSchedule(obj1, obj1.ScheduledStartTime + obj2.Exptime) === false) {
            continue;
        }
        am1now = (obj1.AltStartTime + obj1.AltMidTime + obj1.AltEndTime) / 3;
        am2now = (obj2.AltStartTime + obj2.AltMidTime + obj2.AltEndTime) / 3;
        am1if = obj1.getAltitude(obj1.ScheduledStartTime + obj2.Exptime + 0.5 * obj1.Exptime);
        am2if = obj2.getAltitude(obj1.ScheduledStartTime + 0.5 * obj2.Exptime);
        exchange = false;
        if (((am1now < am2now) && (am2if > am1now) && (am1if > am1now)) ||
                ((am2now < am1now) && (am1if > am2now) && (am2if > am2now))) {
            exchange = true;
        }
        t1 = obj1.ScheduledStartTime;
        if (exchange) {
            obj2.Schedule(t1);
            obj1.Schedule(t1 + obj2.Exptime);
            c = scheduleorder[i];
            scheduleorder[i] = scheduleorder[i + 1];
            scheduleorder[i + 1] = c;
        }
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.optimize_moveToLaterTimesIfRising = function (scheduleorder, crossOtherObjects) {
    let i, obj, j, kj, curtime, overlaps, amif;
    for (i = scheduleorder.length - 1; i >= 0; i -= 1) {
        obj = this.Targets[scheduleorder[i]];
        if (obj.Observed) {
            continue;
        }
        if (obj.FillSlot) {
            continue;
        }
        if (obj.ZenithTime <= obj.ScheduledStartTime) {
            continue;
        }
        let bestalt = obj.AltMidTime;
        let besttime = obj.ScheduledStartTime;
        // Move to the right as much as possible
        for (curtime = Math.min(((i == scheduleorder.length - 1 || crossOtherObjects) ? driver.night.Sunrise : this.Targets[scheduleorder[i + 1]].ScheduledStartTime), obj.LastPossibleTime, driver.night.Sunset + Math.floor((2 * obj.ZenithTime - obj.ScheduledMidTime - driver.night.Sunset) / driver.night.xstep) * driver.night.xstep);
                curtime > obj.ScheduledStartTime;
                curtime -= driver.night.xstep) {
            overlaps = false;
            for (j = 0; j < scheduleorder.length; j += 1) {
                if (j == i) {
                    continue;
                }
                kj = scheduleorder[j];
                if (this.Targets[kj].Scheduled === false) {
                    continue;
                }
                if (curtime + obj.Exptime <= this.Targets[kj].ScheduledStartTime ||
                        curtime >= this.Targets[kj].ScheduledEndTime) {
                    continue;
                }
                overlaps = true;
                break;
            }
            if (overlaps) {
                continue;
            }
            if (this.canSchedule(obj, curtime)) {
                amif = obj.getAltitude(curtime + 0.5 * obj.Exptime);
                if (amif > bestalt) {
                    bestalt = amif;
                    besttime = curtime;
                }
            }
        }
        if (besttime > obj.ScheduledStartTime) {
            obj.Schedule(besttime);
        }
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.reorder_accordingToScheduling = function (scheduleorder) {
    let newtargets = [], i, j, k, imin, tmin, tj;
    for (i = 0; i < scheduleorder.length - 1; i += 1) {
        imin = i;
        tmin = this.Targets[scheduleorder[i]].ScheduledStartTime;
        for (j = i + 1; j < scheduleorder.length; j += 1) {
            tj = this.Targets[scheduleorder[j]].ScheduledStartTime;
            if (tj < tmin) {
                imin = j;
                tmin = tj;
            }
        }
        if (imin > i) {
            k = scheduleorder[i];
            scheduleorder[i] = scheduleorder[imin];
            scheduleorder[imin] = k;
        }
    }
    let running = 0;
    for (i = 0; i < scheduleorder.length; i += 1) {
        k = scheduleorder[i];
        this.Targets[k].rxmid = driver.graph.targetsx;
        this.Targets[k].rymid = driver.graph.targetsy + running * (driver.graph.targetsyskip * (driver.graph.doubleTargets ? 2 : 1) + 2) - 6.5;
        this.Targets[k].Index = running;
        running += 1;
        newtargets.push(this.Targets[scheduleorder[i]]);
    }
    for (i = 0; i < this.nTargets; i += 1) {
        if (this.Targets[i].Scheduled === false) {
            this.Targets[i].rxmid = driver.graph.targetsx;
            this.Targets[i].rymid = driver.graph.targetsy + running * (driver.graph.targetsyskip * (driver.graph.doubleTargets ? 2 : 1) + 2) - 6.5;
            this.Targets[i].Index = running;
            running += 1;
            newtargets.push(this.Targets[i]);
        }
    }
    this.Targets = newtargets;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.display_scheduleStatistics = function () {
    let projtime = [];
    let time_dark = driver.night.DarkTime * 86400;
    let time_night = driver.night.NightLength * 86400;
    let time_sched = 0;
    let i, obj, j, k, inserted, minproj, minloc, exch;
    for (i = 0; i < this.nTargets; i += 1) {
        obj = this.Targets[i];
        if (obj.Scheduled) {
            time_sched += obj.ExptimeSeconds;
            inserted = false;
            for (j = 0; j < projtime.length; j += 1) {
                if (projtime[j].pid == obj.ProjectNumber) {
                    projtime[j].exp += obj.ExptimeSeconds;
                    inserted = true;
                    break;
                }
            }
            if (inserted === false) {
                projtime.push({"pid": obj.ProjectNumber, "exp": obj.ExptimeSeconds});
            }
        }
    }
    for (j = 0; j < projtime.length - 1; j += 1) {
        minproj = projtime[j].pid;
        minloc = j;
        for (k = j + 1; k < projtime.length; k += 1) {
            if (projtime[k].pid < minproj) {
                minproj = projtime[k].pid;
                minloc = k;
            }
        }
        if (minloc > j) {
            exch = projtime[j];
            projtime[j] = projtime[minloc];
            projtime[minloc] = exch;
        }
    }
    let time_lost = 0, bwst, bwen;
    for (i = 0; i < this.Offline.length; i += 1) {
        bwst = Math.min(Math.max(this.Offline[i].Start, driver.night.ENauTwilight), driver.night.MNauTwilight);
        bwen = Math.max(Math.min(this.Offline[i].End, driver.night.MNauTwilight), driver.night.ENauTwilight);
        time_lost += bwen - bwst;
    }
    time_lost *= 86400;
    let time_free = time_night - time_sched - time_lost;
    let ratio_sched = Math.round(time_sched * 100 / time_night);
    let ratio_lost = Math.round(time_lost * 100 / time_night);
    let ratio_free = time_free > 0 ? Math.round(time_free * 100 / time_night) : 0;
    if (ratio_sched + ratio_lost + ratio_free !== 100) {
        if (time_free > 0) {
            ratio_free = 100 - ratio_sched - ratio_lost;
        }
        else {
            ratio_lost = 100 - ratio_sched;
        }
    }
    helper.LogSuccess(`Night length (ENT-MNT):    ${helper.ReportSHM(time_night)}`);
    helper.LogEntry(`Dark time (EAT-MAT):       ${helper.ReportSHM(time_dark)}`);
    if (time_sched > 0) {
        helper.LogSuccess(`Scheduled observing time:  ${helper.ReportSHM(time_sched)} (${ratio_sched.toFixed(0)}%)`);
    }
    if (time_lost > 0) {
        helper.LogSuccess(`Offline (lost) time:       ${helper.ReportSHM(time_lost)} (${ratio_lost.toFixed(0)}%)`);
    }
    if (time_night - time_sched - time_lost > 0) {
        helper.LogSuccess(`Non-scheduled (free) time: ${helper.ReportSHM(time_night - time_sched - time_lost)} (${((ratio_sched + ratio_lost) > 100 ? 0 : (100 - ratio_sched - ratio_lost)).toFixed(0)}%)`);
    }
    if (time_sched > 0) {
        helper.LogSuccess("Breakdown of observing time per proposal:");
        for (j = 0; j < projtime.length; j += 1) {
            helper.LogSuccess(`    ${projtime[j].pid}:  ${helper.ReportSHM(projtime[j].exp)}`);
        }
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.schedule_inOriginalOrder = function (startingAt) {
    let order = [];
    let prevschedule = [];
    let i, j = 0, k, obj;
    for (i = 0; i < this.nTargets; i += 1) {
        if (this.Targets[i].Observed) {
            prevschedule.push(i);
            continue;
        }
        this.Targets[i].Scheduled = false;
        if (this.Targets[i].ObservableTonight === false) {
            continue;
        }
        order[j++] = i;
    }
    let SchedulableObjects = j;

    // Start the earliest possible
    let firstSchedulableTime = driver.night.Sunrise;
    let lastSchedulableTime = driver.night.Sunset;
    for (i = 0; i < SchedulableObjects; i += 1) {
        k = order[i];
        if (this.Targets[k].FirstPossibleTime < firstSchedulableTime) {
            firstSchedulableTime = this.Targets[k].FirstPossibleTime;
        }
        if (this.Targets[k].LastPossibleTime > lastSchedulableTime) {
            lastSchedulableTime = this.Targets[k].LastPossibleTime;
        }
    }
    if (firstSchedulableTime < startingAt) {
        firstSchedulableTime = startingAt;
    }
    // Start scheduling
    let scheduleorder = [];
    // However, before anything else we schedule the monitoring programmes that have highest priority and MUST fill their entire time slot
    for (i = 0; i < SchedulableObjects; i += 1) {
        k = order[i];
        if (this.Targets[k].FillSlot === true) {
            obj = this.Targets[k];
            obj.Schedule(obj.RestrictionMinUT);
            scheduleorder.push(k);
        }
    }

    // Now go through all the other objects
    let curtime = firstSchedulableTime;
    i = 0;
    while (true) {
        if ((scheduleorder.length >= SchedulableObjects) || (curtime >= lastSchedulableTime)) {
            break;
        }

        k = order[i];
        obj = this.Targets[k];
        if (obj.Scheduled === true) {
            i += 1;
            continue;
        }
        if (this.canSchedule(obj, curtime)) {
            obj.Schedule(curtime);
            curtime += obj.Exptime;
            scheduleorder.push(k);
            i += 1;
            continue;
        } else {
            curtime += driver.night.xstep;
        }
    }
    console.log("inOriginalOrder: ", scheduleorder);
    return prevschedule.concat(scheduleorder);
};

/**
 * @memberof TargetList
 */
TargetList.prototype.schedule_inOrderOfSetting = function (startingAt) {
    let EndTimes = [];
    let temporder = [];
    let prevschedule = [];
    let i, j = 0, k, obj;
    for (i = 0; i < this.nTargets; i += 1) {
        if (this.Targets[i].Observed) {
            prevschedule.push(i);
            continue;
        }
        this.Targets[i].Scheduled = false;
        if (this.Targets[i].ObservableTonight === false) {
            continue;
        }
        temporder[j] = i;
        EndTimes[j++] = this.Targets[i].LastPossibleTime;
    }
    let SchedulableObjects = j;
    // Sort object by end time (argsort in python...)
    let mapped = EndTimes.map(function (el, i) {
        return {index: i, value: el};
    });
    mapped.sort(function (a, b) {
        return +(a.value > b.value) || +(a.value === b.value) - 1;
    });
    let maporder = mapped.map(function (el) {
        return el.index;
    });
    let order = [];
    for (i = 0; i < SchedulableObjects; i += 1) {
        order[i] = temporder[maporder[i]];
    }

    // Start the earliest possible
    let firstSchedulableTime = driver.night.Sunrise;
    let lastSchedulableTime = driver.night.Sunset;
    for (i = 0; i < SchedulableObjects; i += 1) {
        k = order[i];
        if (this.Targets[k].FirstPossibleTime < firstSchedulableTime) {
            firstSchedulableTime = this.Targets[k].FirstPossibleTime;
        }
        if (this.Targets[k].LastPossibleTime > lastSchedulableTime) {
            lastSchedulableTime = this.Targets[k].LastPossibleTime;
        }
    }
    if (firstSchedulableTime < startingAt) {
        firstSchedulableTime = startingAt;
    }
    // Start scheduling
    let scheduleorder = [];
    // However, before anything else we schedule the monitoring programmes that have highest priority and MUST fill their entire time slot
    for (i = 0; i < SchedulableObjects; i += 1) {
        k = order[i];
        if (this.Targets[k].FillSlot === true) {
            obj = this.Targets[k];
            obj.Schedule(obj.RestrictionMinUT);
            scheduleorder.push(k);
        }
    }

    // Now go through all the other objects
    let curtime = firstSchedulableTime;
    while (true) {
        i = 0;
        while (i < SchedulableObjects) {
            k = order[i];
            obj = this.Targets[k];
            if (obj.Scheduled === true) {
                i += 1;
                continue;
            }
            if (this.canSchedule(obj, curtime)) {
                obj.Schedule(curtime);
                curtime += obj.Exptime;
                scheduleorder.push(k);
                i = 0;
            } else {
                i += 1;
            }
        }
        if ((scheduleorder.length < SchedulableObjects) && (curtime < lastSchedulableTime)) {
            curtime += driver.night.xstep;
        } else {
            break;
        }
    }
    console.log("inOrderOfSetting: ", scheduleorder);
    return prevschedule.concat(scheduleorder);
};

/**
 * @memberof TargetList
 */
TargetList.prototype.scheduleAndOptimize_givenOrder = function (newscheduleorder) {
    let scheduleorder = [], i, k, obj;
    for (i = 0; i < this.nTargets; i += 1) {
        if (this.Targets[i].Observed) { // attention here. more work to be done!
            continue;
        }
        this.Targets[i].Scheduled = false;
    }
    for (i = 0; i < this.nTargets; i += 1) {
        if (this.Targets[i].FillSlot === true) {
            obj = this.Targets[i];
            obj.Schedule(obj.RestrictionMinUT);
        }
    }
    let curtime = driver.night.Sunset;
    i = 0;
    while (i < this.nTargets && curtime <= driver.night.Sunrise) {
        k = newscheduleorder[i];
        if (this.Targets[k].FillSlot === true) {
            scheduleorder.push(k);
            i += 1;
            continue;
        }
        if (curtime > this.Targets[k].LastPossibleTime) {
            i += 1;
            continue;
        }
        obj = this.Targets[k];
        if (this.canSchedule(obj, curtime)) {
            obj.Schedule(curtime);
            scheduleorder.push(k);
            curtime += obj.Exptime;
            i += 1;
        } else {
            curtime += driver.night.xstep;
        }
    }

    this.optimize_moveToLaterTimesIfRising(scheduleorder, false);
    this.reorder_accordingToScheduling(scheduleorder);
    this.display_scheduleStatistics();
};

/**
 * @memberof TargetList
 */
TargetList.prototype.prepareScheduleForUpdate = function () {
    helper.LogEntry("Preparing schedule for update...");
    helper.LogEntry("Checking existing targets against input...");
    let i, bFound, k;
    let unchanged = [], updated = [], updateText = [], reinserting = [], deleting = [], adding = [];
    let lines_original = helper.extractLines($("#targets_actual").val());
    let lines = lines_original.map(function (obj) {
        return obj.replace(/\s\s+/g, " ").trim();
    });
    for (i = 0; i < this.nTargets; i += 1) {
        k = lines.indexOf(this.Targets[i].ReconstructedInput);
        if (k > -1) {
            lines.splice(k, 1);
            lines_original.splice(k, 1);
            unchanged.push(i);
        }
    }
    if (unchanged.length !== this.nTargets) {
        for (i = 0; i < this.nTargets; i += 1) {
            if (unchanged.indexOf(i) > -1) {
                continue;
            }
            bFound = false;
            for (k = 0; k < lines.length; k += 1) {
                if (lines[k].indexOf(this.Targets[i].ReconstructedMinimumInput) > -1) {
                    bFound = true;
                    break;
                }
            }
            if (bFound) {
                updated.push(i);
                updateText.push(lines[k]);
                lines.splice(k, 1);
                lines_original.splice(k, 1);
            } else {
                if (this.Targets[i].Observed) {
                    reinserting.push(i);
                } else {
                    deleting.push(i);
                }
            }
        }
    }
    if (lines.length > 0) {
        for (i = 0; i < lines.length; i += 1) {
            adding.push(lines[i].substr(0, lines[i].indexOf(" ")).trim());
        }
        $("#added_targets").val(lines_original.join("\n"));
        helper.LogSuccess($("#added_targets").val());
    }

    if (unchanged.length == this.nTargets && updated.length === 0 && reinserting.length === 0 && deleting.length === 0 && adding.length === 0) {
        helper.LogWarning("Attention: no change detected in the input form. Leaving schedule as it is.");
        return "";
    }

    if ($("#opt_reschedule_later").is(":checked")) {
        let now = new Date();
        helper.LogEntry("Current time: " + now.toUTCString());
        if (now > driver.night.DateSunset && now < driver.night.DateSunrise) {
            helper.LogWarning("Attention: the night has already started, so we will only reschedule after the current time. The previously observed objects will NOT be affected, but objects scheduled in the past that have not yet been observed may be rescheduled in the future, if there is enough free time.");
            this.StartingAt = driver.night.Sunset + (now - driver.night.DateSunset) / 1000 / 86400;
        } else {
            helper.LogWarning("We are not currently in the middle of the observing night. Scheduling as usual...");
            return false;
        }
    } else {
        this.StartingAt = driver.night.Sunset;
    }

    let fnn = function (idx) {
        return driver.targets.Targets[idx].Name;
    };
    helper.LogSuccess("Status report:");
    helper.LogEntry("  Unchanged existing targets: " + unchanged.length +
            (unchanged.length > 0 ? ` (<i>${unchanged.map(fnn).join(", ")}</i>)` : ""));
    helper.LogEntry("  Updated existing targets: " + updated.length +
            (updated.length > 0 ? ` (<i>${updated.map(fnn).join(", ")}</i>)` : ""));
    helper.LogEntry("  Deleted observed targets (must add them back): " + reinserting.length +
            (reinserting.length > 0 ? ` (<i>${reinserting.map(fnn).join(", ")}</i>)` : ""));
    helper.LogEntry("  Removed targets: " + deleting.length +
            (deleting.length > 0 ? ` (<i>${deleting.map(fnn).join(", ")}</i>)` : ""));
    helper.LogEntry("  New targets (will insert): " + adding.length +
            (adding.length > 0 ? ` (<i>${adding.join(", ")}</i>)` : ""));
    // Unchanged targets remain unchanged. Nothing to do
    // Then update the existing targets (no need to call the ajax script for that)
    if (updated.length > 0) {
        this.resetWarnings();
        let newdata, obj; // change: first do badwolf
        for (i = 0; i < updated.length; i += 1) {
            newdata = updateText[i].trim().split(" ");
            obj = this.Targets[updated[i]];
            obj.Update(newdata.slice(8));
        }
        this.warnUnobservable();
    }
    // Then, leave the targets that must be "added back" as they are
    // Then, remove the targets that need to be removed
    if (deleting.length > 0) {
        let newTargets = [];
        for (i = 0; i < this.nTargets; i += 1) {
            if (deleting.indexOf(i) == -1) {
                newTargets.push(this.Targets[i]);
            }
        }
        this.Targets = newTargets;
        this.nTargets = newTargets.length;
    }
    // Finally, call the ajax script to get the altitudes for the new targets
    if (adding.length > 0) {
        return "tgts";
    } else {
        return true;
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.doSchedule = function (start, reorder) {
    let scheduleorder;
    let maintainorder = $("#opt_maintain_order").is(":checked");
    if (maintainorder) {
        scheduleorder = this.schedule_inOriginalOrder(start);
    } else {
        scheduleorder = this.schedule_inOrderOfSetting(start);
        this.optimize_interchangeNeighbours(scheduleorder);
    }
    if (reorder) {
        this.optimize_moveToLaterTimesIfRising(scheduleorder, !maintainorder);
        if (!maintainorder) {
            this.optimize_interchangeNeighbours(scheduleorder);
        }
        this.reorder_accordingToScheduling(scheduleorder);
        this.display_scheduleStatistics();
    } else {
        this.scheduleAndOptimize_givenOrder(scheduleorder);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.plan = function () {
    this.doSchedule(driver.night.Sunset, true);
};

/**
 * @memberof TargetList
 */
TargetList.prototype.updateSchedule = function (Targets) {
    this.doSchedule(this.StartingAt, false);
};

/**
 * @memberof TargetList
 */
TargetList.prototype.inputHasChanged = function (_newinput, _oldinput) {
    return (_newinput !== _oldinput);
};

/**
 * @memberof TargetList
 * @description Format the list of targets that already has the correct syntax
 *     by adding spaces so that the various columns fall nicely under each
 *     other.
 */
TargetList.prototype.validateAndFormatTargets = function () {
    // Retrieve content of #targets textarea
    const tgts = driver.CMeditor.getValue();
    if (!this.inputHasChanged(tgts, this.InputText) && this.InputValid) {
        helper.LogEntry("Target input list has not changed, no need to revalidate.");
        return true;
    } else {
        helper.LogEntry("Validating and formatting target input list...");
    }
    $("#tcsExport").prop("disabled", true);
    this.InputValid = false;
    if (tgts.length === 0) {
        helper.LogError("Error 1: Please fill in the <i>Targets</i> field.");
        return false;
    }
    // Split it into lines
    const lines = helper.extractLines(tgts);
    this.VisibleLines = [];
    this.TargetsLines = [];
    this.FormattedLines = [];
    // Determine maximum width of the various fields
    this.MaxLen = {Name: 0, RA: 0, Dec: 0, Exp: 0, AM: 0, Type: 0, OBData: 0, TCSpmra: 0, TCSpmdec: 0};
    this.BadWolfStart = [];
    this.BadWolfEnd = [];
    for (let i = 0; i < lines.length; i += 1) {
        if (lines[i].trim() === "") {
            this.FormattedLines.push(null);
            continue;
        }
        const words = this.extractLineInfo(i + 1, lines[i].trim());
        if (words === false) {
            return false; // Does not validate
        }
        const mLTN = driver.graph.maxLenTgtName + (words[0][0] == "#" ? 1 : 0);
        if (words[0].length > mLTN) {
            words[0] = words[0].substr(0, mLTN);
        }
        if (words[0].length > this.MaxLen.Name) {
            this.MaxLen.Name = words[0].length;
        }
        if (words[3].length > this.MaxLen.RA) {
            this.MaxLen.RA = words[3].length;
        }
        if (words[6].length > this.MaxLen.Dec) {
            this.MaxLen.Dec = words[6].length;
        }
        if (words[8].length > this.MaxLen.Exp) {
            this.MaxLen.Exp = words[8].length;
        }
        if (words[10].length > this.MaxLen.AM) {
            this.MaxLen.AM = words[10].length;
        }
        if (words[11].length > this.MaxLen.Type) {
            this.MaxLen.Type = words[11].length;
        }
        if (words[12].length > this.MaxLen.OBData) {
            this.MaxLen.OBData = words[12].length;
        }
        let j;
        j = (parseInt(words[14]) + "").length + (words[14] < 0 && words[14] > -1 ? 1 : 0);
        if (j > this.MaxLen.TCSpmra) {
            this.MaxLen.TCSpmra = j;
        }
        j = (parseInt(words[16]) + "").length + (words[16] < 0 && words[16] > -1 ? 1 : 0);
        if (j > this.MaxLen.TCSpmdec) {
            this.MaxLen.TCSpmdec = j;
        }
        this.FormattedLines.push(words);
    }
    this.InputStats = {Empty: 0, Commented: 0, Actual: 0};
    this.TCSlines = [];
    for (let i = 0; i < this.FormattedLines.length; i += 1) {
        if (this.FormattedLines[i] === null) {
            this.VisibleLines.push("");
            this.InputStats.Empty += 1;
            continue;
        }
        const words = this.FormattedLines[i];
        const badwolf = $.inArray(words[0], helper.offlineStrings) !== -1;
        const padded = [
            helper.pad(words[0], this.MaxLen.Name, false, " "),
            helper.pad(words[1], 2, true, badwolf ? " " : "0"),
            helper.pad(words[2], 2, true, badwolf ? " " : "0"),
            helper.pad(words[3], this.MaxLen.RA, false, " "),
            helper.pad(badwolf ? words[4] : helper.padTwoDigits(words[4]), 3, true, " "),
            helper.pad(words[5], 2, true, badwolf ? " " : "0"),
            helper.pad(words[6], this.MaxLen.Dec, false, " "),
            helper.pad(words[7], 4, true, " "),
            helper.pad(words[8], this.MaxLen.Exp, true, " "),
            helper.pad(words[9], 6, false, " "),
            helper.pad(words[10], this.MaxLen.AM, false, " "),
            helper.pad(words[11], this.MaxLen.Type, false, " "),
            helper.pad(words[12], this.MaxLen.OBData, false, " ")
        ];
        this.VisibleLines.push(padded.join(" "));
        if (words[0][0] == "#") {
            this.InputStats.Commented += 1;
            continue;
        }
        if (!badwolf) {
            this.TCSlines.push(helper.pad(words[0].replace(/[^A-Za-z0-9\_\+\-]+/g, ""), this.MaxLen.Name, false, " ") + " " +
                    helper.padTwoDigits(words[1]) + ":" +
                    helper.padTwoDigits(words[2]) + ":" +
                    helper.pad(parseFloat(words[13]).toFixed(2).toString(), 5, true, "0") + " " +
                    helper.pad(helper.padTwoDigits(words[4]), 3, true, " ") + ":" +
                    helper.pad(words[5], 2, true, "0") + ":" +
                    helper.pad(parseFloat(words[15]).toFixed(1).toString(), 4, true, "0") + " " +
                    helper.pad(words[7], 4, " ") + " " +
                    helper.pad(parseFloat(words[14]).toFixed(2).toString(), this.MaxLen.TCSpmra + 3, true, " ") + " " +
                    helper.pad(parseFloat(words[16]).toFixed(2).toString(), this.MaxLen.TCSpmdec + 3, true, " ") + " " +
                    "0.0");
            this.InputStats.Actual += 1;
            this.TargetsLines.push(padded.join(" "));
        }
    }

    if (this.InputStats.Actual === 0) {
        if (this.InputStats.Commented > 0 || this.InputStats.Empty > 0) {
            helper.LogError("Error 2: no valid targets found (input consists of " +
                    (this.InputStats.Commented > 0 ? helper.plural(this.InputStats.Commented, "commented-out line") + (this.InputStats.Empty > 0 ? " and " : "") : "") +
                    (this.InputStats.Empty > 0 ? helper.plural(this.InputStats.Empty, "empty line") : "") + ").");
        } else {
            helper.LogError("Error 3: no targets given.");
        }
        return false;
    }

    this.checkForDuplicates();

    /* Save scroll position, update, and scroll back */
    let scrollInfo = driver.CMeditor.getScrollInfo();
    driver.CMeditor.setValue(this.VisibleLines.join("\n"));
    driver.CMeditor.scrollTo(scrollInfo.left, scrollInfo.top);
    $("#targets_actual").val(this.TargetsLines.join("\n"));
    let nt = this.TargetsLines.length;
    helper.LogEntry(`Done. Target list looks properly formatted (${helper.plural(this.InputStats.Actual, "target")}).`);
    this.InputText = driver.CMeditor.getValue();
    this.InputValid = true;
    $("#tcsExport").prop("disabled", false);
    return true;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.ExportTCSCatalogue = function () {
    helper.LogEntry("Exporting catalogue in TCS format...");
    if (!this.InputValid) {
        helper.LogError("Error 4: the list of targets appears to be invalid... Aborting.");
        return;
    }
    if (this.TCSlines.length === 0) {
        helper.LogError("Error 5: catalogue contains no targets. Aborting.");
        return;
    }

    $("#tcspre").html(this.TCSlines.join("\n"));
    $.fancybox.open({
        src: "#tcscat",
        type: "inline",
        touch: false
    });

    helper.LogEntry("Done.");
};

/**
 * @memberof TargetList
 * @description Extract one line of input from the input textarea; return an
 *     array containing the items.
 */
TargetList.prototype.extractLineInfo = function (linenumber, linetext) {
    // Split by white spaces and colons
    let words = linetext.split(/\s+/g);
    // Sanity check: minimum number of fields
    if (words.length <= 1) {
        helper.LogError(`Error 6: Incorrect syntax on Line #${linenumber}; for each object you must provide at least the Name, RA and Dec!`);
        return false;
    }
    if ($.inArray(words[0], helper.offlineStrings) !== -1) {
        if (words.length < 2 || words.length > 3) {
            helper.LogError(`Error 7: Incorrect syntax on Line #${linenumber}; for offline time you must provide a valid UT range!`);
            return false;
        }
        if (words.length == 3) {
            if (words[1] != "*") {
                helper.LogError(`Error 8: Incorrect syntax on Line #${linenumber}; offline time must take "*" as [OBSTIME] argument!`);
                return false;
            }
        }
        let q = (words.length == 2) ? 1 : 2;
        /* Ignore if commented */
        if (!words[0].startsWith("#")) {
            let UTr = helper.ExtractUTRange(words[q]), ut1, ut2;
            if (UTr === false) {
                helper.LogError(`Error 9: Incorrect syntax in [CONSTRAINTS] on line #${linenumber}: the UT range must be a valid interval (e.g., [20:00-23:00] or [1-2])!`);
                return false;
            } else {
                this.BadWolfStart.push(UTr[0]);
                this.BadWolfEnd.push(UTr[1]);
            }
        }
        return [words[0], "", "", "", "", "", "", "", "*", "", words[q], "", ""];
    }
    if (words.length == 6 && words[2].indexOf(":") == -1) {
        words = [`Object${linenumber}`].concat(words);
    }
    if (words.length < 2) {
        helper.LogError(`Error 10: Incorrect syntax on Line #${linenumber}; for each object you must provide at least the Name, RA and Dec!`);
        return false;
    }
    if (words[1].indexOf(":") > -1) {
        /* Split RA into components */
        let ra_arr = words[1].split(":");
        if (ra_arr.length == 2) {
            ra_arr.push("00");
        }
        words = words.slice(0, 1).concat(ra_arr).concat(words.slice(2));
    }
    if (words.length < 5) {
        helper.LogError(`Error 11: Incorrect syntax on Line #${linenumber}; for each object you must provide at least the Name, RA and Dec!`);
        return false;
    }
    if (words[4].indexOf(":") > -1) {
        /* Split Dec into components */
        let dec_arr = words[4].split(":");
        if (dec_arr.length == 2) {
            dec_arr.push("00");
        }
        words = words.slice(0, 4).concat(dec_arr).concat(words.slice(5));
    }
    if (words.length < 7) {
        helper.LogError(`Error 12: Incorrect syntax on Line #${linenumber}; for each object you must provide at least the Name, RA and Dec!`);
        return false;
    }
    if (words.length === 11 && (parseFloat(words[7]) == 2000 || parseFloat(words[7]) == 1950) && !helper.notFloat(words[8]) && !helper.notFloat(words[9]) && !helper.notFloat(words[10])) {
        words = [words[0], words[1], words[2], words[3] + (parseFloat(words[8]) !== 0 ? "/" + words[8] : ""), words[4], words[5], words[6] + (parseFloat(words[9]) !== 0 ? "/" + words[9] : ""), words[7]].concat([Driver.defaultObstime, Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultOBInfo]);
    }
    if (words.length == 7) {
        words = words.concat([Driver.defaultEpoch, Driver.defaultObstime, Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultOBInfo]);
    } else if (words.length == 8) {
        words = words.concat([Driver.defaultObstime, Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultOBInfo]);
    } else if (words.length == 9) {
        words = words.concat([Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultOBInfo]);
    } else if (words.length == 10) {
        words = words.concat([Driver.defaultAM, Driver.defaultType, Driver.defaultOBInfo]);
    } else if (words.length == 11) {
        words = words.concat([Driver.defaultType, Driver.defaultOBInfo]);
    } else if (words.length == 12) {
        words = words.concat([Driver.defaultOBInfo]);
    }
    // Sanity check: there must now be exactly 13 entries in the array
    if (words.length !== 13) {
        helper.LogError(`Error 13: Incorrect syntax: the number of entries on line #${linenumber} is incorrect: ${words}!`);
        return false;
    }
    let rax;
    // Sanity check: input syntax for all parameters
    /* RA hours, minutes must be integer */
    if (helper.notInt(words[1]) || helper.notInt(words[2])) {
        helper.LogError(`Error 14: Incorrect syntax: non-integer value detected in [RA] on line #${linenumber}!`);
        return false;
    }
    /* RA hours between 0 and 23 */
    rax = parseInt(words[1]);
    if (rax < 0 || rax > 23) {
        helper.LogError(`Error 15: Incorrect syntax: the "hours" part of [RA] must be an integer between 0 and 23 on line #${linenumber}!`);
        return false;
    }
    /* RA minutes between 0 and 59 */
    rax = parseInt(words[2]);
    if (rax < 0 || rax > 59) {
        helper.LogError(`Error 16: Incorrect syntax: the "minutes" part of [RA] must be an integer between 0 and 59 on line #${linenumber}!`);
        return false;
    }
    /* RA seconds and proper motion */
    if (words[3].indexOf("/") > -1) {
        rax = words[3].split("/");
        if (rax.length !== 2) {
            helper.LogError(`Error 17: Incorrect syntax for [pmRA] on line #${linenumber}!`);
            return false;
        } else {
            if (helper.notFloat(rax[0]) || helper.notFloat(rax[1])) {
                helper.LogError(`Error 18: Incorrect syntax: non-float value detected in [RA]/[pmRA] on line #${linenumber}!`);
                return false;
            }
        }
        words[13] = parseFloat(rax[0]);
        words[14] = parseFloat(rax[1]);
        words[14] = Math.max(-1000, Math.min(1000, words[14]));
    } else if (helper.notFloat(words[3])) {
        helper.LogError(`Error 19: Incorrect syntax: non-integer value detected in [RA] on line #${linenumber}!`);
        return false;
    } else {
        words[13] = parseFloat(words[3]);
        words[14] = 0;
    }
    /* RA seconds, integer part between 0 and 59 */
    if (parseInt(words[13]) < 0 || parseInt(words[13]) > 59) {
        helper.LogError(`Error 20: Incorrect syntax: the integer part of "seconds" in [RA] must be a number between 0 and 59 on line #${linenumber}!`);
        return false;
    }
    /* Dec degrees, arcminutes must be integer */
    if (helper.notInt(words[4]) || helper.notInt(words[5])) {
        helper.LogError(`Error 21: Incorrect syntax: non-integer value detected in [DEC] on line #${linenumber}!`);
        return false;
    }
    /* Dec degrees between -89 and +89 */
    rax = parseInt(words[4]);
    if (rax < -89 || rax > 89) {
        helper.LogError(`Error 22: Incorrect syntax: the "degrees" part of [Dec] must be an integer between -89 and +89 on line #${linenumber}!`);
        return false;
    }
    /* Dec arcminutes between 0 and 59 */
    rax = parseInt(words[5]);
    if (rax < 0 || rax > 59) {
        helper.LogError(`Error 23: Incorrect syntax: the "minutes" part of [Dec] must be an integer between 0 and 59 on line #${linenumber}!`);
        return false;
    }
    /* Dec arcseconds and proper motion */
    if (words[6].indexOf("/") > -1) {
        rax = words[6].split("/");
        if (rax.length !== 2) {
            helper.LogError(`Error 24: Incorrect syntax for [pmDEC] on line #${linenumber}!`);
            return false;
        } else {
            if (helper.notFloat(rax[0]) || helper.notFloat(rax[1])) {
                helper.LogError(`Error 25: Incorrect syntax: non-float value detected in [DEC]/[pmDEC] on line #${linenumber}!`);
                return false;
            }
        }
        words[15] = parseFloat(rax[0]);
        words[16] = parseFloat(rax[1]);
        words[16] = Math.max(-1000, Math.min(1000, words[16]));
    } else if (helper.notFloat(words[6])) {
        helper.LogError(`Error 26: Incorrect syntax: non-integer value detected in [DEC] on line #${linenumber}!`);
        return false;
    } else {
        words[15] = parseFloat(words[6]);
        words[16] = 0;
    }
    /* Dec arcseconds, integer part between 0 and 59 */
    if (parseInt(words[15]) < 0 || parseInt(words[15]) > 59) {
        helper.LogError(`Error 27: Incorrect syntax: the integer part of "arcseconds" in [Dec] must be a number between 0 and 59 on line #${linenumber}!`);
        return false;
    }
    if (helper.filterFloat(words[7]) !== 2000 && helper.filterFloat(words[7]) !== 1950) {
        helper.LogError(`Error 28: Incorrect syntax: [EPOCH] must be either 2000 or 1950 on line #${linenumber}!`);
        return false;
    }
    if (words[9].length !== 6) {
        helper.LogError(`Error 29: Incorrect syntax: [PROJECT] does not respect the NN-NNN syntax on line #${linenumber}!`);
        return false;
    }
    if (helper.notInt(words[9].substr(0, 2)) || helper.notInt(words[9].substr(3, 3)) || words[9].substr(2, 1) != "-") {
        helper.LogError(`Error 30: Incorrect syntax: [PROJECT] does not respect the NN-NNN syntax on line #${linenumber}!`);
        return false;
    }
    if (helper.notFloat(words[10])) {
        if (!(words[10].startsWith("UT[") || words[10].startsWith("LST[")) ||
            words[10].slice(-1) != "]" || words[10].indexOf("-") == -1) {
            helper.LogError(`Error 31: Incorrect syntax: [CONSTRAINTS] should either be a float (e.g., 2.0), a UT range (e.g., UT[20:00-23:00]) or an LST range (e.g. LST[2-4:30]) on line #${linenumber}!`);
            return false;
        }
        if (helper.notInt(words[8]) && words[8] != "*") {
            helper.LogError(`Error 32: Incorrect syntax: non-integer value detected in [OBSTIME] on line #${linenumber}!`);
            return false;
        }
    } else {
        if (helper.notInt(words[8])) {
            helper.LogError(`Error 33: Incorrect syntax: non-integer value detected in [OBSTIME] on line #${linenumber}!`);
            return false;
        }
    }
    if ($.inArray(words[11], ["Monitor", "ToO", "SoftToO", "Payback", "Fast-Track", "Service", "CATService", "Visitor", "Staff"]) === -1) {
        let wl = words[11].length;
        if (words[11].indexOf("Staff/") !== 0 || (words[11].indexOf("Staff/") === 0 && (wl < 8 || wl > 9))) {
            helper.LogError(`Error 34: Incorrect syntax: [TYPE] must be one of the following: <i>Monitor</i>, <i>ToO</i>, <i>SoftToO</i>, <i>Payback</i>, <i>Fast-Track</i>, <i>Service</i>, <i>CATService</i>, <i>Visitor</i>, <i>Staff</i>, on line #${linenumber}!`);
            return false;
        }
    }
    /* OB info must be valid, or default */
    if (words[12] !== Driver.defaultOBInfo) {
        let arr = words[12].split(":");
        if (arr.length !== 4) {
            helper.LogError(`Error 49: OB info is not valid on line #${linenumber}, it should be Instrument:Mode:GroupID:BlockID!`);
            return false;
        }
    }
    return words;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.checkForDuplicates = function () {
    const alreadyChecked = [];
    const duplicateList = [];
    let found;

    for (let i = 0; i < this.FormattedLines.length; i += 1) {
        if (alreadyChecked.indexOf(i) > -1) {
            continue;
        }
        if (this.VisibleLines[i] === "" || this.VisibleLines[i][0] === "#") {
            continue;
        }
        found = false;
        let duplString = "";
        for (let j = i + 1; j < this.FormattedLines.length; j += 1) {
            if (this.VisibleLines[i] === this.VisibleLines[j]) {
                found = true;
                duplString += `, #${j + 1}`;
                alreadyChecked.push(j);
            }
        }
        if (found) {
            duplicateList.push(`(#${i + 1}${duplString})`);
        }
    }
    if (duplicateList.length > 0) {
        helper.LogWarning(`Warning: Duplicate lines detected: ${duplicateList.join(", ")}. Please check if that is what you actually intended, otherwise delete or comment out the duplicates.`);
    }
};

/**
 * @memberof Target
 */
Target.prototype.canObserve = function (time, altitude) {
    if ((this.RestrictionMinUT <= time && this.RestrictionMaxUT >= time &&
            this.RestrictionMinAlt <= altitude && this.RestrictionMaxAlt >= altitude) === false) {
        return false;
    }
    for (let i = 0; i < driver.targets.Offline.length; i += 1) {
        if (time >= driver.targets.Offline[i].Start && time <= driver.targets.Offline[i].End) {
            return false;
        }
    }
    /* Special provisions for equatorial mounts */
    if (this.DecLimit_MinimumAlt !== null && altitude < this.DecLimit_MinimumAlt) {
        return false;
    }
    let ha = (time - this.ZenithTime) * 24;
    if (this.DecLimit_MinimumHA !== null && ha < this.DecLimit_MinimumHA) {
        return false;
    }
    if (this.DecLimit_MaximumHA !== null && ha > this.DecLimit_MaximumHA) {
        return false;
    }
    return true;
};

/**
 * @memberof Target
 */
Target.prototype.preCompute = function () {
    // First, determine when it is allowed to observe and when not
    this.beginAllowed = [];
    this.endAllowed = [];
    this.beginForbidden = [];
    this.endForbidden = [];
    let obs = (this.canObserve(driver.night.xaxis[0], this.Graph[0]));
    this.observable[0] = obs;
    if (!obs) {
        this.beginForbidden.push(driver.night.xaxis[0]);
    } else {
        this.beginAllowed.push(driver.night.xaxis[0]);
    }
    for (let i = 1; i < this.Graph.length - 1; i += 1) {
        if (this.canObserve(driver.night.xaxis[i], this.Graph[i])) {
            if (!obs) {
                obs = true;
                this.endForbidden.push(driver.night.xaxis[i]);
                this.beginAllowed.push(driver.night.xaxis[i]);
            }
            this.observable[i] = true;
        } else {
            if (obs) {
                obs = false;
                this.endAllowed.push(driver.night.xaxis[i]);
                this.beginForbidden.push(driver.night.xaxis[i]);
            }
            this.observable[i] = false;
        }
    }
    let last = this.Graph.length - 1;
    this.observable[last] = this.canObserve(driver.night.xaxis[last], this.Graph[last]);
    if (this.beginForbidden.length !== this.endForbidden.length) {
        this.endForbidden.push(driver.night.xaxis[last]);
    } else {
        this.endAllowed.push(driver.night.xaxis[last]);
    }
    if (this.beginAllowed.length !== this.endAllowed.length || this.beginForbidden.length !== this.endForbidden.length) {
        helper.LogError("Bug report: safety check failed in @Target.prototype.preCompute. Please report this bug.");
    }
    this.nAllowed = this.beginAllowed.length;
    if (this.nAllowed === 0) {
        this.ObservableTonight = false;
        this.iLastPossibleTime = 0;
        this.LastPossibleTime = driver.night.Sunset;
        driver.targets.Warning1.push(this.Name);
        return;
    }
    this.FirstPossibleTime = this.beginAllowed[0];
    for (let i = this.nAllowed; i >= 0; i--) {
        if (this.beginAllowed[i] + this.Exptime <= this.endAllowed[i]) {
            const lpt = this.endAllowed[i] - this.Exptime;
            this.iLastPossibleTime = helper.EphemTimeToIndex(lpt);
            this.LastPossibleTime = driver.night.Sunset + this.iLastPossibleTime * driver.night.xstep + this.ZenithTime / 1e9;
            this.ObservableTonight = true;
            return;
        }
    }
    driver.targets.Warning2.push(this.Name);
};

/**
 * @memberof Target
 */
Target.prototype.getAltitude = function (time) {
    let ii = helper.EphemTimeToIndex(time);
    return this.Graph[ii];
};

/**
 * @memberof Target
 */
Target.prototype.resetColours = function () {
    if (this.Observed) {
        this.LabelFillColor = "green";
        this.LabelStrokeColor = "green";
        this.LabelTextColor = "white";
    } else {
        this.LabelFillColor = Driver.FillColors[this.Type];
        this.LabelTextColor = Driver.TextColors[this.Type];
        this.LabelStrokeColor = this.LabelFillColor;
    }
};

/**
 * @memberof Target
 */
Target.prototype.ComputePositionSchedLabel = function () {
    let xshift, yshift;
    const slope = driver.graph.degree * (this.AltEndTime - this.AltStartTime) / driver.graph.transformXWidth(this.Exptime);
    const angle = Math.atan(slope);
    const dist = driver.graph.CircleSize * 1.2;
    xshift = dist * Math.sin(angle);
    yshift = dist * Math.cos(angle);
    this.xmid = driver.graph.xaxis[this.iScheduledMidTime] - xshift;
    this.ymid = driver.graph.yend - driver.graph.degree * this.Graph[this.iScheduledMidTime] - yshift;
};

/**
 * @memberof Target
 */
Target.prototype.Schedule = function (start) {
    this.Scheduled = true;
    this.ScheduledStartTime = start;
    this.ScheduledEndTime = start + this.Exptime;
    this.ScheduledMidTime = start + 0.5 * this.Exptime;
    this.iScheduledStartTime = helper.EphemTimeToIndex(this.ScheduledStartTime);
    this.iScheduledEndTime = helper.EphemTimeToIndex(this.ScheduledEndTime);
    this.iScheduledMidTime = helper.EphemTimeToIndex(this.ScheduledMidTime);
    this.AltStartTime = this.Graph[this.iScheduledStartTime];
    this.AltEndTime = this.Graph[this.iScheduledEndTime];
    this.AltMidTime = this.Graph[this.iScheduledMidTime];
    this.ComputePositionSchedLabel();
};

/**
 * @memberof Target
 */
Target.prototype.Update = function (obj) {
    // obj: (0=exptime, 1=project, 2=constraints, 3=type)
    this.FullType = obj[3];
    this.Type = (obj[3].indexOf("/") === -1 ? obj[3] : obj[3].substring(0, obj[3].indexOf("/")));
    this.ProjectNumber = obj[1];
    this.Constraints = obj[2];
    let isUT;
    const UTr = helper.ExtractUTRange(obj[2]);
    let ut1, ut2;
    if (UTr === false) {
        isUT = false;
        this.MaxAirmass = driver.defaultAM;
        this.MaxAirmass = parseFloat(obj[2]);
        this.RestrictionMinUT = driver.night.ENauTwilight;
        this.RestrictionMaxUT = driver.night.MNauTwilight;
    } else {
        isUT = true;
        ut1 = Math.max(night.ENauTwilight, UTr[0]);
        ut2 = Math.min(night.MNauTwilight, UTr[1]);
        this.MaxAirmass = 9.9;
        this.RestrictionMinUT = ut1;
        this.RestrictionMaxUT = ut2;
    }
    this.RestrictionMinAlt = helper.AirmassToAltitude(this.MaxAirmass);
    this.FillSlot = isUT && (obj[0] === "*");
    if (helper.filterInt(obj[0])) {
        this.ExptimeSeconds = parseInt(obj[0]);
        this.Exptime = Math.floor(this.ExptimeSeconds / 86400 / driver.night.xstep) * driver.night.xstep;
    } else {
        this.Exptime = this.FillSlot ? ut2 - ut1 : driver.defaultObstime / 86400;
        this.ExptimeSeconds = Math.round(this.Exptime * 86400);
        this.Exptime = Math.floor(this.Exptime / driver.night.xstep) * driver.night.xstep;
    }
    const hrs = Math.floor(this.ExptimeSeconds / 3600);
    const min = Math.round((this.ExptimeSeconds - hrs * 3600) / 60);
    this.ExptimeHM = `${hrs > 0 ? hrs.toFixed(0) + "h " : ""}${min.toFixed(0)}m`;
    if (this.FillSlot) {
        helper.LogEntry(`Attention: object <i>${this.Name}</i> will fill its entire time slot.`);
    }

    this.OBData = obj[4];
    if (this.OBData !== Driver.defaultOBInfo) {
        let ob_arr = this.OBData.split(":");
        this.BacklinkToOBQueue = `http://www.not.iac.es/intranot/ob/ob_update.php?period=${parseInt(this.ProjectNumber.substring(0, 2))}&propID=${parseInt(this.ProjectNumber.substring(3))}&groupID=${ob_arr[2]}&blockID=${ob_arr[3]}`;
        this.Instrument = ob_arr[0];
        this.ExtraInfo = `${ob_arr[0]}/${ob_arr[1]}`;
    } else {
        this.BacklinkToOBQueue = null;
        this.Instrument = null;
        this.ExtraInfo = null;
    }

    this.ReconstructedInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch} ${this.ExptimeSeconds} ${this.ProjectNumber} ${this.Constraints} ${this.FullType} ${this.OBData}`;
    this.ReconstructedMinimumInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch}`;

    this.preCompute();
    this.resetColours();
};
