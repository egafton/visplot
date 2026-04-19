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
function TargetList() {
    this.nTargets = 0;
    this.Targets = [];
    this.Offline = [];
    this.InputText = "";
    this.VisibleLines = null; // Includes empty lines and comments
    this.TargetsLines = null; // Only the lines that contain proper targets
    this.FormattedLines = null; // Contains arrays or null values
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
    this.ReqLineLen = 15;
}

/**
 * @class
 * @constructor
 */
function Target(k, line) {
    try {
        this.Label = k+1;
        this.ParseFrom(line);
        this.SetExptime(this.Exptime);
        this.Scheduled = false;
        this.observable = [];

        if (this.FillSlot) {
            helper.LogEntry(`Attention: object <i>${this.Name}</i> will fill its entire time slot.`);
        }
        this.LabelFillColor = Driver.FillColors[this.Type];
        this.LabelTextColor = Driver.TextColors[this.Type];
        this.LabelStrokeColor = this.LabelFillColor;
        this.LabelFaintStrokeColor = helper.faint(this.LabelFillColor);
        this.LabelVeryFaintStrokeColor = helper.veryFaint(this.LabelFillColor);
        this.Observed = false;
        this.ObservedStartTime = null;
        this.ObservedEndTime = null;
        this.ObservedTotalTime = null;

        if (this.OBData.indexOf(":") !== -1) {
            const obArr = this.OBData.split(":");
            this.BacklinkToOBQueue = `http://www.not.iac.es/intranot/ob/ob_update.php?period=${parseInt(this.ProjectNumber.substring(0, 2))}&propID=${parseInt(this.ProjectNumber.substring(3))}&groupID=${obArr[2]}&blockID=${obArr[3]}`;
            this.BacklinkToOBQueuePublic = `http://www.not.iac.es/observing/forms/obqueue/ob_update.php?period=${parseInt(this.ProjectNumber.substring(0, 2))}&propID=${parseInt(this.ProjectNumber.substring(3))}&groupID=${obArr[2]}&blockID=${obArr[3]}`;
            this.Instrument = obArr[0];
            this.ExtraInfo = `${obArr[0]}/${obArr[1]}`;
        } else {
            this.BacklinkToOBQueue = null;
            this.BacklinkToOBQueuePublic = null;
            this.Instrument = this.OBData;
            this.ExtraInfo = null;
        }
        this.ReconstructedInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch} ${this.ExptimeSeconds} ${this.ProjectNumber} ${this.Constraints} ${this.FullType} ${this.OBData}`;
        this.ReconstructedMinimumInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch}`;
        this.Comments = null;

        const dfun = Driver.obsDeclinationLimit;
        this.DecLimitMinimumAlt = null;
        this.DecLimitMinimumAltAzEast = null;
        this.DecLimitMinimumAltAzWest = null;
        this.DecLimitMinimumHA = null;
        this.DecLimitMaximumHA = null;
        if (dfun !== null) {
            if (dfun[0] === "alt(dec)") {
                this.DecLimitMinimumAlt = dfun[1](sla.r2d * this.decRad);
            } else if (dfun[0] === "alt(az)") {
                this.DecLimitMinimumAltAzEast = dfun[1](this.Azimuth, false, this.Instrument);
                this.DecLimitMinimumAltAzWest = dfun[1](this.Azimuth, true, this.Instrument);
            } else if (dfun[0] === "ha(dec)") {
                this.DecLimitMinimumHA = dfun[1](sla.r2d * this.decRad);
                this.DecLimitMaximumHA = dfun[2](sla.r2d * this.decRad);
            }
        }
    } catch (ex) {
        helper.LogException(ex);
    }
}

/**
 * @memberof Target
 */
Target.prototype.ParseFrom = function (line) {
    // Parse an input string into a Target object
    const night = driver.night;
    const dat = helper.splitQuoted(line);
    this.Name = dat[0];
    this.ProjectNumber = dat[9];
    this.Epoch = parseFloat(dat[7]);
    this.Graph = [];
    this.Azimuth = [];
    this.MoonDistance = [];
    this.PAngles = [];
    this.FullType = dat[11];
    this.Type = (dat[11].indexOf("/") === -1 ? dat[11] : dat[11].substring(0, dat[11].indexOf("/")));
    this.OBData = dat[12];
    this.SkyPA = parseFloat(dat[13]);
    this.Priority = parseFloat(dat[14]);
    this.Constraints = dat[10];
    const rax = dat[3].split("/");
    const decx = dat[6]. split("/");
    this.RA = `${dat[1]}:${dat[2]}:${rax[0]}`;
    this.Dec = `${dat[4]}:${dat[5]}:${decx[0]}`;
    this.inputRA = this.RA.replaceAll(":", " ");
    this.inputDec = this.Dec.replaceAll(":", " ");
    const ra = sla.dtf2r(parseInt(dat[1]), parseInt(dat[2]), parseFloat(rax[0]));
    const decdeg = Math.abs(parseInt(dat[4]));
    const decneg = dat[4].substring(0, 1) === "-";
    let dec = sla.daf2r(decdeg, parseInt(dat[5]), parseFloat(decx[0]));
    if (decneg) {
        dec *= -1;
    }

    let minam = 1;
    let maxam = 9.9;
    let minmdist = 0;
    let maxmdist = 180;
    let minut = night.globalUTStart;
    let maxut = night.globalUTEnd;
    this.RestrictionTwilights = [];
    const arr = dat[10].toUpperCase().split(",");
    for (const constr of arr) {
        if (!helper.notFloat(constr)) {
            maxam = parseFloat(constr);
            continue;
        }
        if (constr.indexOf("NT") > -1 || constr.indexOf("AT") > -1 || constr.indexOf("DARK") > -1) {
            this.RestrictionTwilights = constr.split("+");
            if (constr.includes("NT")) {
                minut = night.Sunset;
                maxut = night.Sunrise;
            } else if (constr.includes("AT")) {
                minut = night.ENauTwilight;
                maxut = night.MNauTwilight;
            } else {
                minut = night.EAstTwilight;
                maxut = night.MAstTwilight;
            }
            continue;
        }
        let uts = helper.ExtractUTRange(constr, ra);
        if (uts !== null) {
            minut = Math.max(minut, uts[0]);
            maxut = Math.min(maxut, uts[1]);
        } else {
            uts = helper.ExtractAMRange(constr);
            if (uts !== null) {
                minam = Math.max(minam, uts[0]);
                maxam = Math.min(maxam, uts[1]);
            } else {
                uts = helper.ExtractMoonRange(constr);
                if (uts !== null) {
                    minmdist = Math.max(minmdist, uts[0]);
                    maxmdist = Math.min(maxmdist, uts[1]);
                } else {
                    helper.LogError(`Could not parse airmass/UTC/moon distance constraint from string <i>${dat[10]}</i> for target <i>${dat[0]}</i>. Please check the format of the input and the documentation.`);
                }
            }
        }
    }
    this.RestrictionMinAlt = helper.AirmassToAltitude(maxam);
    this.RestrictionMaxAlt = Math.min(Driver.obsHighestLimit || 90, helper.AirmassToAltitude(minam));
    this.RestrictionMinUTC = minut;
    this.RestrictionMaxUTC = maxut;
    this.RestrictionMinMoonDistance = minmdist;
    this.RestrictionMaxMoonDistance = maxmdist;

    if (dat[8] === "*") {
        this.FillSlot = true;
        this.Exptime = null;
    } else {
        this.FillSlot = false;
        this.Exptime = parseFloat(dat[8]) / sla.d2s;
    }
    let pmra, pmdec;
    if (rax.length === 1) {
        pmra = 0;
    } else {
        // Given in arcsec/year; convert to radians/year
        pmra = parseFloat(rax[1]) * sla.das2r;
        // Remove the cos(dec) for SLALIB
        pmra = pmra/Math.cos(dec);
    }
    if (decx.length === 1) {
        pmdec = 0;
    } else {
        // Given in arcsec/year; convert to radians/year
        pmdec = parseFloat(decx[1]) * sla.das2r;
    }
    /* Conversion from Besselian to Julian, if necessary */
    if (this.Epoch > 1984) {
        this.J2000 = [ra, dec];
    } else {
        let j2000;
        /* No proper motion */
        if (pmra === 0 && pmdec === 0) {
            j2000 = sla.fk45z(ra, dec, this.Epoch);
            this.J2000 = [j2000.r2000, j2000.d2000];
        } else {
            j2000 = sla.fk425(ra, dec, pmra, pmdec, 0, 0);
            this.J2000 = [j2000.r2000, j2000.d2000];
        }
    }

    let retap, retob, rd, rap, dap;
    let imax = 0;
    let altmax = 0;
    let vminmdist = 9999;
    let iminmdist = 0;
    const id = this.Name.toLowerCase();
    for (let i = 0; i < night.Nx; i += 1) {
        if (config.planets.includes(id)) {
            rd = sla.rdplan(night.xaxis[i], id, Driver.obsLonRad, Driver.obsLatRad);
            rap = rd.ra;
            dap = rd.dec;
        } else if (id in driver.resolvedEphemerides) {
            rd = helper.interpolateEphemeris(driver.resolvedEphemerides[id], night.xaxis[i]);
            retap = sla.mapqk(sla.d2r * rd.ra, sla.d2r * rd.dec, 0, 0, 0, 0, night.amprms[i]);
            rap = retap.ra;
            dap = retap.da;
        } else {
            retap = sla.mapqk(ra, dec, pmra, pmdec, 0, 0, night.amprms[i]);
            rap = retap.ra;
            dap = retap.da;
        }
        // retob contains the topocentric zd WITHOUT refraction (too slow)
        retob = sla.aopqk(rap, dap, night.aoprms[i]);
        // Approximate refracted alt
        let ell = sla.pihalf - sla.refz(retob.zob, night.ref.refa, night.ref.refb);
        if (ell > altmax) {
            imax = i;
            altmax = ell;
        }
        this.Graph.push(sla.r2d * ell);
        this.Azimuth.push(sla.r2d * sla.dranrm(retob.aob));
        // Moon distance
        let mdist = sla.r2d * sla.dsep(night.ramoon[i], night.decmoon[i], rap, dap);
        this.MoonDistance.push(mdist);
        if (mdist < vminmdist) {
            vminmdist = mdist;
            iminmdist = i;
        }
        const pa = sla.dranrm(sla.pa(night.LSTangles[i] - rap, dap, Driver.obsLatRad));
        this.PAngles.push(sla.r2d * pa);
    }
    this.ZenithTime = night.xaxis[imax];
    this.MinMoonDistance = Math.round(vminmdist);
    this.MinMoonDistanceTime = night.xaxis[iminmdist];
    this.raRad = ra;
    this.decRad = dec;
};

Target.prototype.SetExptime = function (exptime) {
    try {
        if (exptime === null) {
            return;
        }
        this.Exptime = exptime;
        this.ExptimeSeconds = Math.round(this.Exptime * sla.d2s);
        this.Exptime = Math.floor(this.Exptime / driver.night.xstep) * driver.night.xstep;
        const hrs = Math.floor(this.ExptimeSeconds / 3600);
        const min = Math.round((this.ExptimeSeconds - hrs * 3600) / 60);
        this.ExptimeHM = `${hrs > 0 ? hrs.toFixed(0) + "h " : ""}${min.toFixed(0)}m`;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.setTargetsSize = function () {
    try {
        const graph = driver.graph;
        for (const [i, tgt] of this.Targets.entries()) {
            tgt.xlab = graph.transformXLocation(tgt.LabelX);
            tgt.ylab = graph.transformYLocation(tgt.LabelY);
            tgt.rxmid = graph.targetsx;
            tgt.rymid = graph.targetsy + i * (graph.targetsyskip * (graph.doubleTargets ? 2 : 1) + 2) - 6.5;
            if (tgt.Scheduled) {
                tgt.ComputePositionSchedLabel();
            }
        }
        graph.setTargetsSize(this.nTargets);
        this.removeClusters();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.setTargets = function (lines) {
    try {
        this.nTargets = lines.length;
        this.Targets = [];
        this.resetWarnings();
        this.processOfflineTime();
        for (let i = 0; i < this.nTargets; i += 1) {
            this.Targets[i] = this.processTarget(i, lines[i]);
        }
        this.warnUnobservable();
        this.setTargetsSize();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.addTargets = function (lines) {
    try {
        const oldNobjects = this.nTargets;
        this.nTargets += lines.length;
        this.resetWarnings();
        this.processOfflineTime();
        for (let i = oldNobjects; i < this.nTargets; i += 1) {
            this.Targets[i] = this.processTarget(i, lines[i - oldNobjects]);
        }
        this.warnUnobservable();
        this.setTargetsSize();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.processTarget = function (i, line) {
    try {
        const target = new Target(i, line);
        target.preCompute();
        target.LabelX = target.ZenithTime;
        if (target.LabelX < driver.night.ENauTwilight) {
            target.LabelX = driver.night.ENauTwilight;
        } else if (target.LabelX > driver.night.MNauTwilight) {
            target.LabelX = driver.night.MNauTwilight;
        }
        target.LabelY = target.getAltitude(target.LabelX);
        return target;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.intersectingChain = function (Targets, checkedSet) {
    try {
        if (checkedSet.has(this.Label)) {
            return [];
        }
        const graph = driver.graph;
        if (this.xlab < graph.xstart || this.xlab > graph.xend || this.ylab < graph.ystart || this.ylab > graph.yend) {
            return [];
        }
        checkedSet.add(this.Label);
        const iIntersect = [];
        for (const obj of Targets) {
            if (obj === this || checkedSet.has(obj.Label)) {
                continue;
            }
            if (helper.TwoCirclesIntersect(this.xlab, this.ylab, graph.CircleSize + 0.5, obj.xlab, obj.ylab, graph.CircleSize + 0.5)) {
                iIntersect.push(obj);
            }
        }
        let chain = [this];
        for (const obj of iIntersect) {
            chain = chain.concat(obj.intersectingChain(Targets, checkedSet));
        }
        return chain;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.removeClusters = function () {
    try {
        let nIter = 0;
        let hasclusters;
        do {
            hasclusters = false;
            for (const target of this.Targets) {
                const checkedSet = new Set();
                const cluster = target.intersectingChain(this.Targets, checkedSet);
                if (cluster.length > 1) {
                    hasclusters = true;
                    cluster.sort((a, b) => a.xlab - b.xlab);
                    this.spaceOutCluster(cluster);
                }
            }
            nIter += 1;
        } while (hasclusters && nIter < 10);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.spaceOutCluster = function (cluster) {
    try {
        const graph = driver.graph;
        for (let i = 1; i < cluster.length; i += 1) {
            const obj = cluster[i];
            let moved;
            do {
                moved = false;
                for (let j = 0; j < i; j += 1) {
                    const prev = cluster[j];
                    while (helper.TwoCirclesIntersect(obj.xlab, obj.ylab, graph.CircleSize + 0.5, prev.xlab, prev.ylab, graph.CircleSize + 0.5)) {
                        obj.xlab += 1;
                        obj.LabelX = graph.reverseTransformXLocation(obj.xlab);
                        obj.LabelY = obj.getAltitude(obj.LabelX);
                        obj.ylab = graph.transformYLocation(obj.LabelY) - graph.CircleSize * 1.2;
                        moved = true;
                    }
                }
            } while (moved);
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.processOfflineTime = function () {
    try {
        this.Offline = [];
        for (let i = 0; i < this.BadWolfStart.length; i += 1) {
            this.Offline.push({Start: this.BadWolfStart[i], End: this.BadWolfEnd[i]});
        }
    } catch (ex) {
        helper.LogException(ex);
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
        helper.LogWarning("Target" + (this.Warning1.length === 1 ? "" : "s") + " <i>" + this.Warning1.join(", ") + "</i> cannot possibly be scheduled for this night, as " + (this.Warning1.length === 1 ? "it" : "they") + " will never fit the airmass/UTC constraints.");
    }
    if (this.Warning2.length > 0) {
        helper.LogWarning("Target" + (this.Warning2.length === 1 ? "" : "s") + " <i>" + this.Warning2.join(", ") + "</i> cannot possibly be scheduled for this night, as " + (this.Warning2.length === 1 ? "it" : "they") + " will not fit the airmass/UTC constraints for long enough to perform the observations.");
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.canSchedule = function (obj, start, ignoreOverlaps = false) {
    try {
        let end = start + obj.Exptime;
        let overlaps = false;
        for (const other of this.Targets) {
            if (other === obj || !other.Scheduled) {
                continue;
            }
            if (end <= other.ScheduledStartTime || start >= other.ScheduledEndTime) {
                continue;
            }
            overlaps = true;
            break;
        }
        if (overlaps && !ignoreOverlaps) {
            return false;
        }

        for (let i = 0; i < obj.nAllowed; i += 1) {
            if (start >= obj.beginAllowed[i] && end <= obj.endAllowed[i]) {
                return true;
            }
        }
        return false;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.optimizeInterchangeNeighbours = function (scheduleorder) {
    try {
        for (let i = 0; i < scheduleorder.length - 1; i += 1) {
            const obj1 = this.Targets[scheduleorder[i]];
            const obj2 = this.Targets[scheduleorder[i + 1]];
            if (obj1.Observed || obj2.Observed) {
                continue;
            }
            if (obj1.FillSlot || obj2.FillSlot) {
                continue;
            }
            if (obj1.Priority !== obj2.Priority) {
                continue;
            }
            if (this.canSchedule(obj2, obj1.ScheduledStartTime, true) === false) {
                continue;
            }
            if (this.canSchedule(obj1, obj1.ScheduledStartTime + obj2.Exptime, true) === false) {
                continue;
            }
            const alt1now = (obj1.AltStartTime + obj1.AltMidTime + obj1.AltEndTime) / 3;
            const alt2now = (obj2.AltStartTime + obj2.AltMidTime + obj2.AltEndTime) / 3;
            const alt1if = obj1.getAltitude(obj1.ScheduledStartTime + obj2.Exptime + 0.5 * obj1.Exptime);
            const alt2if = obj2.getAltitude(obj1.ScheduledStartTime + 0.5 * obj2.Exptime);
            const gain1 = alt1if - alt1now;
            const gain2 = alt2if - alt2now;
            const ratio = 1; // see below
            let exchange = false;
            if (gain1 > 0 && gain2 >= 0) {
                exchange = true;
                // If both objects get better, swap
            } else if ((gain1 > 0 && alt2if > alt1now) || (gain2 > 0 && alt1if > alt2now)) {
                // Object A gets better, and object B will not be worse than object A is now, swap
                exchange = true;
            } else if ((gain1 > 0 && Math.abs(gain1 / gain2) > ratio) || (gain2 > 0 && Math.abs(gain2 / gain1) > ratio)) {
                // If an object gets a better altitude than the other one is losing, swap
                exchange = true;
            }
            const t1 = obj1.ScheduledStartTime;
            if (exchange) {
                obj2.Schedule(t1);
                obj1.Schedule(t1 + obj2.Exptime);
                const c = scheduleorder[i];
                scheduleorder[i] = scheduleorder[i + 1];
                scheduleorder[i + 1] = c;
            }
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.optimizeMoveToLaterTimesIfRising = function () {
    try {
        let i, obj, curtime, overlaps, amif;
        for (i = this.nTargets - 1; i >= 0; i -= 1) {
            obj = this.Targets[i];
            if (obj.Observed || obj.FillSlot || !obj.Scheduled) {
                continue;
            }
            if (obj.ZenithTime <= obj.ScheduledStartTime) {
                continue;
            }
            // First scheduled object after [i] - prevent crossing
            let k = i+1;
            while (k < this.nTargets && !this.Targets[k].Scheduled) {
                k += 1;
            }
            let starttime = k === this.nTargets ? driver.night.Sunrise : this.Targets[k].ScheduledStartTime;
            let bestalt = obj.AltMidTime;
            let besttime = obj.ScheduledStartTime;
            // Move to the right as much as possible
            for (
                curtime = Math.min(starttime, obj.LastPossibleTime, driver.night.Sunset + Math.floor((obj.ZenithTime - 0.5 * obj.Exptime - driver.night.Sunset) / driver.night.xstep) * driver.night.xstep);
                curtime > obj.ScheduledStartTime;
                curtime -= driver.night.xstep
            ) {
                overlaps = false;
                for (let j = 0; j < this.nTargets; j += 1) {
                    const other = this.Targets[j];
                    if (j === i || !other.Scheduled) {
                        continue;
                    }
                    if (curtime + obj.Exptime <= other.ScheduledStartTime || curtime >= other.ScheduledEndTime) {
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
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.reorderAccordingToScheduling = function (scheduleorder) {
    try {
        const newtargets = [];
        const neworder = [];
        const graph = driver.graph;
        const relabel = $("#opt_reorder_targets").is(":checked");
        let running = 1;
        for (let i = 0; i < scheduleorder.length; i += 1) {
            const tgt = this.Targets[scheduleorder[i]];
            if (tgt.Scheduled) {
                tgt.rxmid = graph.targetsx;
                tgt.rymid = graph.targetsy + running * (graph.targetsyskip * (graph.doubleTargets ? 2 : 1) + 2) - 6.5;
                if (relabel) {
                    tgt.Label = running;
                }
                newtargets.push(tgt);
                neworder.push(i);
                running += 1;
            }
        }
        for (const tgt of this.Targets) {
            if (!tgt.Scheduled) {
                tgt.rxmid = graph.targetsx;
                tgt.rymid = graph.targetsy + running * (graph.targetsyskip * (graph.doubleTargets ? 2 : 1) + 2) - 6.5;
                if (relabel) {
                    tgt.Label = running;
                }
                newtargets.push(tgt);
                running += 1;
            }
        }
        this.Targets = newtargets;
        return neworder;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.displayScheduleStatistics = function () {
    try {
        let projtime = [];
        let timeDark = driver.night.DarkTime * sla.d2s;
        let timeNight = driver.night.NightLength * sla.d2s;
        let timeSched = 0;
        let i, obj, j, k, inserted, minproj, minloc, exch;
        let maxlen = 0;
        for (i = 0; i < this.nTargets; i += 1) {
            obj = this.Targets[i];
            if (obj.Scheduled) {
                timeSched += obj.ExptimeSeconds;
                inserted = false;
                for (j = 0; j < projtime.length; j += 1) {
                    if (projtime[j].pid === obj.ProjectNumber) {
                        projtime[j].exp += obj.ExptimeSeconds;
                        inserted = true;
                        break;
                    }
                }
                if (inserted === false) {
                    projtime.push({"pid": obj.ProjectNumber, "exp": obj.ExptimeSeconds});
                    if (obj.ProjectNumber.length > maxlen) {
                        maxlen = obj.ProjectNumber.length;
                    }
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
        let timeLost = 0, bwst, bwen;
        for (i = 0; i < this.Offline.length; i += 1) {
            bwst = Math.min(Math.max(this.Offline[i].Start, driver.night.ENauTwilight), driver.night.MNauTwilight);
            bwen = Math.max(Math.min(this.Offline[i].End, driver.night.MNauTwilight), driver.night.ENauTwilight);
            timeLost += bwen - bwst;
        }
        timeLost *= sla.d2s;
        let timeFree = timeNight - timeSched - timeLost;
        let ratioSched = Math.round(timeSched * 100 / timeNight);
        let ratioLost = Math.round(timeLost * 100 / timeNight);
        let ratioFree = timeFree > 0 ? Math.round(timeFree * 100 / timeNight) : 0;
        if (ratioSched + ratioLost + ratioFree !== 100) {
            if (timeFree > 0) {
                ratioFree = 100 - ratioSched - ratioLost;
            }
            else {
                ratioLost = 100 - ratioSched;
            }
        }
        let describeNight;
        switch ($('input[type="radio"][name="opt_schedule_between"]:checked').val()) {
        case "sunset-sunrise":
            describeNight = "SET-RIS";
            break;
        case "astronomical":
            describeNight = "EAT-MAT";
            break;
        default:
            describeNight = "ENT-MNT";
        }
        helper.LogSuccess(`Night length (${describeNight}):    ${helper.ReportSHM(timeNight)}`);
        helper.LogEntry(`Dark time (EAT-MAT):       ${helper.ReportSHM(timeDark)}`);
        if (timeSched > 0) {
            helper.LogSuccess(`Scheduled observing time:  ${helper.ReportSHM(timeSched)} (${ratioSched.toFixed(0)}%)`);
        }
        if (timeLost > 0) {
            helper.LogSuccess(`Offline (lost) time:       ${helper.ReportSHM(timeLost)} (${ratioLost.toFixed(0)}%)`);
        }
        if (timeNight - timeSched - timeLost > 0) {
            helper.LogSuccess(`Non-scheduled (free) time: ${helper.ReportSHM(timeNight - timeSched - timeLost)} (${((ratioSched + ratioLost) >= 100 ? 0 : (100 - ratioSched - ratioLost)).toFixed(0)}%)`);
        }
        if (timeSched > 0) {
            helper.LogSuccess("Breakdown of observing time per proposal:");
            for (j = 0; j < projtime.length; j += 1) {
                helper.LogSuccess(`    ${(projtime[j].pid + ':').padEnd(maxlen + 1)}  ${helper.ReportSHM(projtime[j].exp)}`);
            }
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

TargetList.prototype.scheduleWithWeights = function () {
    try {
        const targets = this.Targets;
        const wp = Driver.wPriority;
        const wu = Driver.wUrgency;
        const wa = Driver.wAltitude;
        const ws = Driver.wSlewing;
        const maxpriority = Math.max.apply(Math, targets.map(function (o) { return o.Priority; }));
        let lastra = null, lastdec = null;
        // Start scheduling
        let scheduleorder = [];
        // However, before anything else we schedule the programmes that MUST fill their entire time slot
        for (let i = 0; i < this.nTargets; i += 1) {
            const tgt = targets[i];
            if (tgt.FillSlot && tgt.nAllowed > 0) {
                tgt.Schedule(tgt.beginAllowed[0]); // Attention, this might lead to overlaps! But the user decided so!
                scheduleorder.push(i);
            }
        }
        let curidx = 0;
        while (true) {
            if (curidx >= driver.night.Nx) {
                break;
            }
            const curtime = driver.night.xaxis[curidx];
            const weights = [];
            // Get a list of all targets that can be scheduled at this time, together with their weighted priority
            for (let i = 0; i < this.nTargets; i += 1) {
                const tgt = targets[i];
                if (tgt.Observed) {
                    continue;
                }
                if (tgt.Scheduled) {
                    continue;
                }
                // Monitoring programmes that fill their slot get the highest priority, as decided by the user
                if (!this.canSchedule(tgt, curtime)) {
                    continue;
                }
                // Calculate weight
                const priority = tgt.Priority / maxpriority; // 0-1
                const urgency = 1 / (tgt.LastPossibleTime - curtime + 1); // 0-1, becomes 1 at the last possible time
                const altitude = Math.sin(sla.d2r * tgt.Graph[curidx]); // 0-1, the higher the altitude the better
                const slewing = lastra === null ? 1 : 1-sla.dsep(lastra, lastdec, tgt.raRad, tgt.decRad) / Math.PI; // 0-1, 1 if no slewing, 0 if 180 deg slewing
                weights[i] = wp * priority + wu * urgency + wa * altitude + ws * slewing;
            }
            let maxKey = null;
            let maxVal = -Infinity;
            for (const [key, val] of Object.entries(weights)) {
                if (val > maxVal) {
                    maxVal = val;
                    maxKey = Number(key);
                }
            }
            if (maxKey === null) {
                curidx += 1;
                continue;
            }
            scheduleorder.push(maxKey);
            const obj = targets[maxKey];
            obj.Schedule(curtime);
            curidx += Math.ceil(obj.Exptime / driver.night.xstep);
            lastra = obj.raRad;
            lastdec = obj.decRad;
        }
        return scheduleorder.sort(function(a, b) {
            return targets[a].ScheduledStartTime - targets[b].ScheduledStartTime;
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * Beam-search-based scheduler utilizing flexible time constraints.
 * @param {number} [beamWidth=10] - The number of parallel schedules to maintain.
 * @returns {number[]} - Array of scheduled target indices ordered by start time.
 */
TargetList.prototype.scheduleWithBeamSearch = function (beamWidth = 10) {
    try {
        const targets = this.Targets;
        const wp = Driver.wPriority;
        const wu = Driver.wUrgency;
        const wa = Driver.wAltitude;
        const ws = Driver.wSlewing;
        const maxpriority = Math.max.apply(Math, targets.map(function (o) { return o.Priority; }));
        let solution = null;

        let scheduleorder = [];
        const unscheduledIndices = [];

        // Pre-process mandatory "FillSlot" programs exactly like the original heuristic
        for (let i = 0; i < this.nTargets; i += 1) {
            const tgt = targets[i];
            if (tgt.Observed) {
                scheduleorder.push(i);
                continue;
            }
            if (tgt.FillSlot && tgt.nAllowed > 0) {
                tgt.Schedule(tgt.beginAllowed[0]);
                scheduleorder.push(i);
                continue;
            }
            tgt.Scheduled = false;
            if (tgt.nAllowed > 0) {
                unscheduledIndices.push(i);
            }
        }
        scheduleorder = scheduleorder.sort(function(a, b) {
            return targets[a].ScheduledStartTime - targets[b].ScheduledStartTime;
        });

        // Sort unscheduled targets by criticality/priority
        unscheduledIndices.sort(function(a, b) {
            return targets[a].Criticality === targets[b].Criticality ? targets[b].Priority - targets[a].Priority : targets[b].Criticality - targets[a].Criticality;
        });

        let beam = [{
            sequence: scheduleorder.slice(),
            est: scheduleorder.length === 0 ? [] : scheduleorder.map(i => targets[i].ScheduledStartTime),
            lst: scheduleorder.length === 0 ? [] : scheduleorder.map(i => targets[i].ScheduledStartTime), // yes, really
            unscheduled: new Set(unscheduledIndices),
            score: 0
        }];
        const maxdepth = unscheduledIndices.length;

        function propagate(state) {
            let unchanged = false;
            // Nothing to propagate
            if (state.sequence.length <= 1) {
                return true;
            }

            while (!unchanged) {
                unchanged = true;
                for (let i = 0; i < state.sequence.length-1; i += 1) {
                    const a = i;
                    const b = i+1;
                    const targA = targets[state.sequence[a]];
                    const Aexp = targA.Exptime;
                    const targB = targets[state.sequence[b]];
                    if (!targA.FillSlot && !targA.Observed && !targB.FillSlot && !targB.Observed) {
                        const oldAlst = state.lst[a];
                        state.lst[a] = Math.min(state.lst[a], state.lst[b] - Aexp);
                        if (oldAlst !== state.lst[a]) {
                            unchanged = false;
                        }
                        const oldBest = state.est[b];
                        state.est[b] = Math.max(state.est[b], state.est[a] + Aexp);
                        if (oldBest !== state.est[b]) {
                            unchanged = false;
                        }
                    } else if ((targA.FillSlot || targA.Observed) && (targB.FillSlot || targB.Observed)) {
                        continue;
                    } else if (targA.FillSlot || targA.Observed) {
                        const oldBest = state.est[b];
                        state.est[b] = Math.max(state.est[b], state.est[a] + Aexp);
                        if (oldBest !== state.est[b]) {
                            unchanged = false;
                        }
                    } else if (targB.FillSlot || targB.Observed) {
                        const oldAlst = state.lst[a];
                        state.lst[a] = Math.min(state.lst[a], state.lst[b] - Aexp);
                        if (oldAlst !== state.lst[a]) {
                            unchanged = false;
                        }
                    }
                    if (state.est[a] > state.lst[a]) {
                        return false;
                    }
                    if (state.est[b] > state.lst[b]) {
                        return false;
                    }
                }
            }
            return true;
        }

        function evaluateScore(state) {
            let score = 0;
            for (let i = 0; i < state.sequence.length; i += 1) {
                const item = state.sequence[i];
                const tgt = targets[item];
                // Priority
                score += wp * (tgt.Priority / maxpriority);
                // Midpoint time - approximation
                const when = 0.5 * (state.est[i] + state.lst[i]);
                const curidx = helper.MJDToIndex(when);
                // Urgency
                score += wu * 1 / (tgt.LastPossibleTime - when + 1);
                // Altitude (placeholder like your Python)
                score += wa * Math.sin(sla.d2r * tgt.Graph[curidx]);
                // Slewing (placeholder)
                score += ws * (i === 0 ? 1 : 1-sla.dsep(targets[state.sequence[i-1]].raRad, targets[state.sequence[i-1]].decRad, tgt.raRad, tgt.decRad) / Math.PI);
            }
            return score;
        }

        function insertInterval(state, targid, interval) {
            // Find the insertion point that maximizes the objective score
            let bestState = null;
            let bestScore = 0;
            for (let i = 0; i <= state.sequence.length; i += 1) {
                // Deep-ish copy
                let newstate = {
                    sequence: state.sequence.slice(),
                    est: state.est.slice(),
                    lst: state.lst.slice(),
                    unscheduled: new Set(state.unscheduled),
                    score: state.score
                };
                // Insert at position i
                newstate.sequence.splice(i, 0, targid);
                newstate.est.splice(i, 0, interval[0]);
                newstate.lst.splice(i, 0, interval[1]);
                newstate.unscheduled.delete(targid);
                // Propagate constraints
                if (propagate(newstate)) {
                    const score = evaluateScore(newstate);
                    // Evaluate score
                    newstate.score = score;
                    if (score > bestScore) {
                        // We found a better solution? Store it
                        bestState = newstate;
                        bestScore = score;
                    }
                }
            }
            return bestState;
        }

        for (let depth = 0; depth < maxdepth; depth += 1) {
            const targid = unscheduledIndices[depth];
            const target = targets[targid];
            if (target.Scheduled) {
                console.error("why is this scheduled?", target);
                continue;
            }

            const newbeam = [];
            for (const state of beam) {
                if (state.unscheduled.size === 0) {
                    solution = state;
                    break;
                }
                if (!state.unscheduled.has(targid)) {
                    console.error("why are we looking for this", targid, target);
                    continue;
                }
                for (let j = 0; j < target.nAllowed; j += 1) {
                    if (target.beginAllowed[j] + target.Exptime > target.endAllowed[j]) {
                        continue;
                    }
                    const interval = [target.beginAllowed[j], target.endAllowed[j] - target.Exptime];
                    const newstate = insertInterval(state, targid, interval);
                    if (newstate !== null) {
                        newbeam.push(newstate);
                    }
                }
            }
            if (solution !== null) {
                break;
            }
            if (newbeam.length > 0) {
                beam = newbeam.sort((a, b) => b.score - a.score).slice(0, beamWidth);
            }
        }
        if (solution === null) {
            solution = beam[0];
        }

        scheduleorder = [];
        for (let i = 0; i < solution.sequence.length; i += 1) {
            const targid = solution.sequence[i];
            const target = targets[targid];
            if (target.Observed || target.FillSlot) {
                scheduleorder.push(targid);
                continue;
            }
            target.Schedule(solution.est[i]);
            scheduleorder.push(targid);
        }
        return scheduleorder.sort(function(a, b) {
            return targets[a].ScheduledStartTime - targets[b].ScheduledStartTime;
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.scheduleAndOptimizeGivenOrder = function (newscheduleorder) {
    try {
        const targets = this.Targets;
        // Start scheduling
        let scheduleorder = [];
        for (let i = 0; i < this.nTargets; i += 1) {
            const tgt = targets[i];
            // Leave observed targets alone
            if (tgt.Observed) {
                scheduleorder.push(i);
                continue;
            }
            // Before anything else we schedule the programmes that MUST fill their entire time slot
            if (tgt.FillSlot && tgt.nAllowed > 0) {
                tgt.Schedule(tgt.beginAllowed[0]); // Attention, this might lead to overlaps! But the user decided so!
                scheduleorder.push(i);
                continue;
            }
            // The rest of them must be processed
            tgt.Scheduled = false;
        }
        // Now schedule in the given order
        let curidx = 0;
        let k = 0;
        let nmax = newscheduleorder.length;
        while (k < nmax && curidx < driver.night.Nx) {
            const j = newscheduleorder[k];
            // Find the first target that needs to be scheduled
            let tgt = targets[j];
            // Already handled?
            if (tgt.Observed || tgt.FillSlot) {
                k += 1;
                continue;
            }
            // Can we schedule it?
            const curtime = driver.night.xaxis[curidx];
            if (!this.canSchedule(tgt, curtime)) {
                curidx += 1;
                continue;
            }
            // Schedule it
            scheduleorder.push(j);
            tgt.Schedule(curtime);
            curidx += Math.ceil(tgt.Exptime / driver.night.xstep);
            k += 1;
        }
        scheduleorder = scheduleorder.sort(function(a, b) {
            return targets[a].ScheduledStartTime < targets[b].ScheduledStartTime ? -1 : 1;
        });
        this.reorderAccordingToScheduling(scheduleorder);
        this.optimizeMoveToLaterTimesIfRising();
        this.displayScheduleStatistics();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.prepareScheduleForUpdate = function () {
    try {
        helper.LogEntry("Preparing schedule for update...");
        helper.LogEntry("Checking existing targets against input...");
        let i, bFound, k;
        let unchanged = [], updated = [], updateText = [], reinserting = [], deleting = [], adding = [];
        let linesOriginal = helper.extractLines($("#targets_actual").val());
        let lines = linesOriginal.map(function (obj) {
            return obj.replace(/\s\s+/g, " ").trim();
        });
        for (i = 0; i < this.nTargets; i += 1) {
            k = lines.indexOf(this.Targets[i].ReconstructedInput);
            if (k > -1) {
                lines.splice(k, 1);
                linesOriginal.splice(k, 1);
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
                    linesOriginal.splice(k, 1);
                } else if (this.Targets[i].Observed) {
                    reinserting.push(i);
                } else {
                    deleting.push(i);
                }
            }
        }
        if (lines.length > 0) {
            for (i = 0; i < lines.length; i += 1) {
                adding.push(lines[i].substr(0, lines[i].indexOf(" ")).trim());
            }
            $("#added_targets").val(linesOriginal.join("\n"));
            helper.LogSuccess($("#added_targets").val());
        }

        if (unchanged.length === this.nTargets && updated.length === 0 && reinserting.length === 0 && deleting.length === 0 && adding.length === 0) {
            helper.LogWarning("Attention: no change detected in the input form. Leaving schedule as it is.");
            return "";
        }

        const now = new Date();
        helper.LogEntry("Current time: " + now.toUTCString());
        if (now > driver.night.DateSunset && now < driver.night.DateSunrise) {
            if ($("#opt_reschedule_later").is(":checked")) {
                helper.LogWarning("Attention: the night has already started, so we will only reschedule after the current time. The previously observed objects will NOT be affected, but objects scheduled in the past that have not yet been observed may be rescheduled in the future, if there is enough free time.");
                this.StartingAt = driver.night.Sunset + (now - driver.night.DateSunset) / 1000 / sla.d2s;
            } else {
                helper.LogWarning("We are not currently in the middle of the observing night. Scheduling as usual...");
                this.StartingAt = driver.night.Sunset;
            }
        } else {
            return false;
        }

        const fnn = function (idx) {
            return driver.targets.Targets[idx].Name;
        };
        helper.LogSuccess("Status report:");
        helper.LogEntry("  Unchanged existing targets: " + unchanged.length + (unchanged.length > 0 ? ` (<i>${unchanged.map(fnn).join(", ")}</i>)` : ""));
        helper.LogEntry("  Updated existing targets: " + updated.length + (updated.length > 0 ? ` (<i>${updated.map(fnn).join(", ")}</i>)` : ""));
        helper.LogEntry("  Deleted observed targets (must add them back): " + reinserting.length + (reinserting.length > 0 ? ` (<i>${reinserting.map(fnn).join(", ")}</i>)` : ""));
        helper.LogEntry("  Removed targets: " + deleting.length + (deleting.length > 0 ? ` (<i>${deleting.map(fnn).join(", ")}</i>)` : ""));
        helper.LogEntry("  New targets (will insert): " + adding.length + (adding.length > 0 ? ` (<i>${adding.join(", ")}</i>)` : ""));
        // Unchanged targets remain unchanged. Nothing to do
        // Then update the existing targets (no need to perform the astrometry again for them)
        if (updated.length > 0) {
            this.resetWarnings();
            let newdata, obj; // Change: first do badwolf
            for (i = 0; i < updated.length; i += 1) {
                newdata = helper.splitQuoted(updateText[i]);
                obj = this.Targets[updated[i]]; // bug?
                obj.Update(newdata.slice(8));
            }
            this.warnUnobservable();
        }
        // Then, leave the targets that must be "added back" as they are
        // Then, remove the targets that need to be removed
        if (deleting.length > 0) {
            const newTargets = [];
            for (i = 0; i < this.nTargets; i += 1) {
                if (deleting.indexOf(i) === -1) {
                    newTargets.push(this.Targets[i]);
                }
            }
            this.Targets = newTargets;
            this.nTargets = newTargets.length;
        }
        // Finally, perform the astrometry for the new targets
        if (adding.length > 0) {
            return "tgts";
        }
        return true;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.doSchedule = function (start, reorder) {
    try {
        let scheduleorder;
        switch ($('input[type="radio"][name="opt_algorithm"]:checked').val()) {
        case "greedy-heuristic":
            scheduleorder = this.scheduleWithWeights();
            break;
        case "flexible-beam":
            scheduleorder = this.scheduleWithBeamSearch();
            break;
        }
        if (reorder) {
            const neworder = this.reorderAccordingToScheduling(scheduleorder);
            this.optimizeMoveToLaterTimesIfRising();

            this.optimizeInterchangeNeighbours(neworder);
            this.reorderAccordingToScheduling(neworder);
            this.optimizeMoveToLaterTimesIfRising();
            this.displayScheduleStatistics();
        } else {
            this.scheduleAndOptimizeGivenOrder(scheduleorder);
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.plan = function () {
    try {
        if ($("#opt_reschedule_later").is(":checked")) {
            const now = new Date();
            helper.LogEntry("Current time: " + now.toUTCString());
            if (now > driver.night.DateSunset && now < driver.night.DateSunrise) {
                helper.LogWarning("Attention: the night has already started, so we will only schedule after the current time.");
                this.doSchedule(driver.night.Sunset + (now - driver.night.DateSunset) / 1000 / sla.d2s, true);
            } else {
                helper.LogWarning("We are not currently in the middle of the observing night. Scheduling as usual...");
                this.doSchedule(driver.night.Sunset, true);
            }
        } else {
            this.doSchedule(driver.night.Sunset, true);
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.updateSchedule = function () {
    try {
        this.doSchedule(this.StartingAt, false);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 */
TargetList.prototype.inputHasChanged = function (_newinput, _oldinput) {
    return (_newinput !== _oldinput);
};

TargetList.prototype.processTargetListAfterSIMBAD = function(lines) {
    try {
        this.VisibleLines = [];
        this.TargetsLines = [];
        this.FormattedLines = [];
        // Determine maximum width of the various fields
        this.MaxLen = {
            Name: 0,
            RA: 0,
            Dec: 0,
            Exp: 0,
            AM: 0,
            ProposalId: 0,
            Type: 0,
            OBData: 0,
            TCSpmra: 0,
            TCSpmdec: 0,
            Skypa: 0,
            Priority: 0
        };
        this.BadWolfStart = [];
        this.BadWolfEnd = [];
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i].trim();
            if (line === "") {
                this.FormattedLines.push(null);
                continue;
            }
            if (line[0] === "#") {
                this.FormattedLines.push([line]);
                continue;
            }
            let words;
            try {
                words = this.extractLineInfo(i + 1, lines[i].trim());
            } catch (ex) {
                helper.LogError(`(Line #${i + 1}) ${ex.message}`);
                return false;
            }
            const mLTN = driver.graph.maxLenTgtName;
            if (words[0].length > mLTN) {
                words[0] = helper.quoteIfNeeded(helper.unquote(words[0]).substr(0, mLTN));
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
            words[9] = helper.quoteIfNeeded(words[9]);
            if (words[9].length > this.MaxLen.ProposalId) {
                this.MaxLen.ProposalId = words[9].length;
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
            if (words[13].length > this.MaxLen.Skypa) {
                this.MaxLen.Skypa = words[13].length;
            }
            if (words[14].length > this.MaxLen.Priority) {
                this.MaxLen.Priority = words[14].length;
            }
            let j;
            j = (String(parseInt(words[this.ReqLineLen + 1])) + "").length + (words[this.ReqLineLen + 1] < 0 && words[this.ReqLineLen + 1] > -1 ? 1 : 0);
            if (j > this.MaxLen.TCSpmra) {
                this.MaxLen.TCSpmra = j;
            }
            j = (String(parseInt(words[this.ReqLineLen + 3])) + "").length + (words[this.ReqLineLen + 3] < 0 && words[this.ReqLineLen + 3] > -1 ? 1 : 0);
            if (j > this.MaxLen.TCSpmdec) {
                this.MaxLen.TCSpmdec = j;
            }
            this.FormattedLines.push(words);
        }
        this.InputStats = {Empty: 0, Commented: 0, BadWolf: 0, Actual: 0};
        this.TCSlines = [];
        for (let i = 0; i < this.FormattedLines.length; i += 1) {
            if (this.FormattedLines[i] === null) {
                this.VisibleLines.push("");
                this.InputStats.Empty += 1;
                continue;
            }
            if (this.FormattedLines[i][0].startsWith("#")) {
                this.VisibleLines.push(this.FormattedLines[i][0]);
                this.InputStats.Commented += 1;
                continue;
            }
            const words = this.FormattedLines[i];
            const badwolf = config.offlineStrings.includes(words[0].toLowerCase());
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
                helper.pad(words[9], this.MaxLen.ProposalId, false, " "),
                helper.pad(words[10], this.MaxLen.AM, false, " "),
                helper.pad(words[11], this.MaxLen.Type, false, " "),
                helper.pad(words[12], this.MaxLen.OBData, false, " "),
                helper.pad(words[13], this.MaxLen.Skypa, false, " "),
                helper.pad(words[14], this.MaxLen.Priority, false, " ")
            ];
            this.VisibleLines.push(padded.join(" "));
            if (!badwolf) {
                this.InputStats.Actual += 1;
                if (["NOT", "WHT", "INT"].includes(Driver.telescopeName)) {
                    this.TCSlines.push(
                        helper.pad(words[0].replace(/[^A-Za-z0-9\_\+\-]+/g, ""), this.MaxLen.Name, false, " ") + " " +
                        helper.padTwoDigits(words[1]) + ":" +
                        helper.padTwoDigits(words[2]) + ":" +
                        helper.pad(parseFloat(words[this.ReqLineLen]).toFixed(2).toString(), 5, true, "0") + " " +
                        helper.pad(helper.padTwoDigits(words[4]), 3, true, " ") + ":" +
                        helper.pad(words[5], 2, true, "0") + ":" +
                        helper.pad(parseFloat(words[this.ReqLineLen + 2]).toFixed(1).toString(), 4, true, "0") + " " +
                        helper.pad(words[7], 4, " ") + " " +
                        helper.pad(parseFloat(words[this.ReqLineLen + 1]).toFixed(2).toString(), this.MaxLen.TCSpmra + 3, true, " ") + " " +
                        helper.pad(parseFloat(words[this.ReqLineLen + 3]).toFixed(2).toString(), this.MaxLen.TCSpmdec + 3, true, " ") + " " +
                        "0.0");
                } else if (["HJST", "OST"].includes(Driver.telescopeName)) {
                    this.TCSlines.push(
                        helper.pad(this.InputStats.Actual.toString(), 2, true, " ") + " " + '"' + helper.pad(words[0].replace(/[^A-Za-z0-9\_\+\-]+/g, ""), this.MaxLen.Name, false, " ") + '" ' +
                        helper.padTwoDigits(words[1]) + " " +
                        helper.padTwoDigits(words[2]) + " " +
                        helper.pad(parseFloat(words[this.ReqLineLen]).toFixed(2).toString(), 5, true, "0") + " " +
                        helper.pad(helper.padTwoDigits(words[4]), 3, true, " ") + " " +
                        helper.pad(words[5], 2, true, "0") + " " +
                        helper.pad(parseFloat(words[this.ReqLineLen + 2]).toFixed(1).toString(), 4, true, "0") + " " +
                        helper.pad(parseFloat(words[7]).toFixed(1).toString(), 6, " ") + " " +
                        helper.pad(parseFloat(words[this.ReqLineLen + 1]).toFixed(2).toString(), this.MaxLen.TCSpmra + 3, true, " ") + " " +
                        helper.pad(parseFloat(words[this.ReqLineLen + 3]).toFixed(2).toString(), this.MaxLen.TCSpmdec + 3, true, " "));
                }
                this.TargetsLines.push(padded.join(" "));
            } else {
                this.InputStats.BadWolf += 1;
            }
        }

        if (this.InputStats.Actual === 0) {
            const parts = [];
            if (this.InputStats.Commented > 0) {
                parts.push(helper.plural(this.InputStats.Commented, "commented-out line"));
            }
            if (this.InputStats.Empty > 0) {
                parts.push(helper.plural(this.InputStats.Empty, "empty line"));
            }
            if (this.InputStats.BadWolf > 0) {
                parts.push(helper.plural(this.InputStats.BadWolf, "offline string"));
            }
            if (parts.length > 0) {
                // Combine with commas and 'and'
                let details;
                if (parts.length === 1) {
                    details = parts[0];
                } else if (parts.length === 2) {
                    details = `${parts[0]} and ${parts[1]}`;
                } else { // 3 or more
                    details = `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
                }
                helper.LogWarning(`No valid targets found (input consists of ${details}).`);
            } else {
                helper.LogError("No targets given.");
            }
            return false;
        }

        this.checkForDuplicates();

        /* Save scroll position, update, and scroll back */
        const scrollInfo = driver.CMeditor.getScrollInfo();
        driver.CMeditor.setValue(this.VisibleLines.join("\n"));
        driver.CMeditor.scrollTo(scrollInfo.left, scrollInfo.top);
        $("#targets_actual").val(this.TargetsLines.join("\n"));
        helper.LogEntry(`Done. Target list looks properly formatted (${helper.plural(this.InputStats.Actual, "target")}).`);
        this.InputText = driver.CMeditor.getValue();
        this.InputValid = true;
        $("#tcsExport").prop("disabled", false);
        return true;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 * @description Format the list of targets that already has the correct syntax
 *     by adding spaces so that the various columns fall nicely under each
 *     other.
 */
TargetList.prototype.validateAndFormatTargets = async function () {
    const thisList = this;
    // Retrieve content of #targets textarea
    const tgts = driver.CMeditor.getValue();
    if (!thisList.inputHasChanged(tgts, thisList.InputText) && thisList.InputValid) {
        helper.LogEntry("Target input list has not changed, no need to revalidate.");
        return true;
    }
    helper.LogEntry("Validating and formatting target input list...");
    $("#tcsExport").prop("disabled", true);
    thisList.InputValid = false;
    if (tgts.length === 0) {
        helper.LogDebug("No targets provided.");
        return false;
    }
    // Split it into lines
    const lines = helper.extractLines(tgts);
    const idsRdplan = [];
    const idsForSimbad = [];
    const idsForHorizons = [];
    // Check if we need to retrieve any targets from SIMBAD
    for (const line of lines) {
        if (line.trim() === "" || line.startsWith("#")) {
            continue;
        }
        const words = helper.splitQuoted(line);
        const name = helper.asIdentifier(words);
        if (name === null) {
            continue;
        }
        const nameLower = name.toLowerCase();
        if (nameLower in driver.resolvedIdentifiers) {
            helper.LogEntry(`Target <i>${name}</i> is already cached`);
        } else if (config.planets.includes(nameLower)) {
            idsRdplan.push(nameLower);
        } else if (nameLower in driver.majorBodies) {
            idsForHorizons.push(name);
        } else {
            idsForSimbad.push(name);
        }
    }
    for (const id of idsRdplan) {
        const rd = sla.rdplan(driver.night.Sunset, id, Driver.obsLonRad, Driver.obsLatRad);
        const ra = helper.HMS(sla.rtoh * rd.ra, " ", " ", "", 2);
        const dec = helper.HMS(sla.r2d * rd.dec, " ", " ", "", 1);
        driver.resolvedIdentifiers[id] = `${ra} ${dec}`;
    }
    if (idsForSimbad.length > 0) {
        helper.LogEntry(`Retrieving targets from SIMBAD: ${idsForSimbad.join(', ')}. This may take a while...`);
        const simbadResults = await Promise.all(idsForSimbad.map(async (id) => {
            try {
                const data = await $.get({
                    url: config.simbadURL(id),
                    timeout: config.simbadTimeout
                });
                return ({id, data, error: null});
            } catch (error) {
                return ({id, data: null, error});
            }
        }));
        helper.LogEntry("Results received from SIMBAD");
        for (const {id, data, error} of simbadResults) {
            if (error) {
                helper.LogError(`SIMBAD request failed for ${id} (${error})`);
                idsForHorizons.push(id);
                continue;
            }
            const resolution = helper.parseSIMBADResponse(data);
            if (resolution === null) {
                helper.LogWarning(`Target ${id} is not in SIMBAD; trying JPL Horizons.`);
                idsForHorizons.push(id);
            } else {
                driver.resolvedIdentifiers[id.toLowerCase()] = resolution;
            }
        }
    }
    if (idsForHorizons.length > 0) {
        helper.LogEntry(`Retrieving targets from JPL Horizons: ${idsForHorizons.join(', ')}. This may take a while...`);
        const horizonResults = await Promise.all(idsForHorizons.map(async (id) => {
            const idLower = id.toLowerCase();
            const idSend = idLower in driver.majorBodies ? driver.majorBodies[idLower] : id;
            try {
                const data = await $.get({
                    url: config.horizonsURL({
                        'COMMAND': `'${idSend}'`,
                        'SITE_COORD': `'${Driver.obsLonDeg},${Driver.obsLatDeg},${Driver.obsAltitude/1000}'`,
                        'START_TIME': driver.night.Sunset,
                        'STOP_TIME': driver.night.Sunrise
                    }), // you define this
                    timeout: config.horizonsTimeout
                });
                return ({id, data, error: null});
            } catch (error) {
                return ({id, data: null, error});
            }
        }));
        const stillUnresolved = [];
        helper.LogEntry("Results received from Horizons");
        for (const {id, data, error} of horizonResults) {
            if (error) {
                helper.LogError(`Horizons request failed for ${id} (${error}})`);
                stillUnresolved.push(id);
                continue;
            }
            try {
                const parsed = typeof data === "string" ? JSON.parse(data) : data;
                if (parsed && parsed.error) {
                    helper.LogWarning(`Horizons error for ${id}: ${parsed.error}`);
                    stillUnresolved.push(id);
                    continue;
                }
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Store full ephemeris (array of {mjd, ra_deg, dec_deg})
                    driver.resolvedEphemerides[id.toLowerCase()] = parsed;
                    const first = helper.interpolateEphemeris(parsed, driver.night.Sunset);
                    const ra = helper.HMS(first.ra/15, " ", " ", " ", 2);
                    const dec = helper.HMS(first.dec, " ", " ", " ", 1);
                    driver.resolvedIdentifiers[id.toLowerCase()] = `${ra} ${dec} 2000`;
                } else {
                    helper.LogWarning(`No ephemerides returned for ${id}`);
                    stillUnresolved.push(id);
                }
            } catch (ex) {
                helper.LogError(`Invalid Horizons response for ${id}: ${ex}`);
                stillUnresolved.push(id);
            }
        }
        if (stillUnresolved.length > 0) {
            helper.LogError(`Unresolved targets: ${stillUnresolved.join(', ')}`);
        }
    }
    if (!thisList.processTargetListAfterSIMBAD(lines)) {
        throw new Error("Post-processing failure");
    }
    return true;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.ExportTCSCatalogue = function () {
    try {
        helper.LogEntry("Exporting catalogue in TCS format...");
        if (!this.InputValid) {
            helper.LogError("The list of targets appears to be invalid... Aborting.");
            return;
        }
        if (this.TCSlines.length === 0) {
            helper.LogError("Catalogue contains no targets. Aborting.");
            return;
        }

        $("#tcspre").html(this.TCSlines.join("\n"));
        $.fancybox.open({
            src: "#tcscat",
            type: "inline",
            touch: false
        });

        helper.LogEntry("Done.");
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof TargetList
 * @description Extract one line of input from the input textarea; return an
 *     array containing the items.
 */
TargetList.prototype.extractLineInfo = function (linenumber, linetext) {
    // Split by white spaces and colons
    let words = helper.splitQuoted(linetext);
    // Check if this is a known identifier
    const name = helper.asIdentifier(words);
    if (name !== null) {
        const nameLower = name.toLowerCase();
        if (nameLower in driver.resolvedIdentifiers) {
            words = helper.splitQuoted(`${helper.quoteIfNeeded(name)} ${driver.resolvedIdentifiers[nameLower]}`);
        }
    }
    // Sanity check: minimum number of fields
    if (words.length <= 1) {
        throw new Error("For each object you must provide at least the Name, RA and Dec");
    }
    if (config.offlineStrings.includes(words[0].toLowerCase())) {
        if (words.length < 2 || words.length > 3) {
            throw new Error("For offline time you must provide a valid UTC or LST range");
        }
        if (words.length === 3) {
            if (words[1] !== "*") {
                throw new Error("Offline time must have '*' as the [OBSTIME] argument");
            }
        }
        const q = (words.length === 2) ? 1 : 2;
        const UTr = helper.ExtractUTRange(words[q]);
        if (UTr === null || UTr === false) {
            throw new Error("The UTC/LST range must be a valid interval (e.g., [20:00-23:00] or [1-2])");
        }
        this.BadWolfStart.push(UTr[0]);
        this.BadWolfEnd.push(UTr[1]);
        return [words[0], "", "", "", "", "", "", "", "*", "", words[q], "", "", "", ""];
    }
    if ((words.length === 6 && words[2].indexOf(":") === -1) || (words.length === 2 && words[0].indexOf(":") !== -1 && words[1].indexOf(":") !== -1 ) || (words.length === 2 && !helper.notFloat(words[0]) && !helper.notFloat(words[1]))) {
        words = [`Object${linenumber}`].concat(words);
    }
    /* Everything given in degrees? Convert to hex */
    let raArr, decArr;
    if (words.length === 3 && !helper.notFloat(words[1]) && !helper.notFloat(words[2])) {
        const RAhex = sla.dr2tf(2, sla.d2r * parseFloat(words[1]));
        const Dechex = sla.dr2af(2, sla.d2r * parseFloat(words[2]));
        raArr = [`${RAhex.sign === '+' ? '' : RAhex.sign}${RAhex.ihmsf[0]}`, `${RAhex.ihmsf[1]}`, `${RAhex.ihmsf[2]}.${RAhex.ihmsf[3]}`];
        decArr = [`${Dechex.sign === '+' ? '' : Dechex.sign}${Dechex.idmsf[0]}`, `${Dechex.idmsf[1]}`, `${Dechex.idmsf[2]}.${Dechex.idmsf[3]}`];
        words = words.slice(0, 1).concat(raArr).concat(decArr);
    }
    if (words.length < 2) {
        throw new Error("For each object you must provide at least the Name, RA and Dec");
    }
    if (words[1].indexOf(":") > -1) {
        /* Split RA into components */
        raArr = words[1].split(":");
        if (raArr.length === 2) {
            raArr.push("00");
        }
        words = words.slice(0, 1).concat(raArr).concat(words.slice(2));
    }
    if (words.length < 5) {
        throw new Error("For each object you must provide at least the Name, RA and Dec");
    }
    if (words[4].indexOf(":") > -1) {
        /* Split Dec into components */
        decArr = words[4].split(":");
        if (decArr.length === 2) {
            decArr.push("00");
        }
        words = words.slice(0, 4).concat(decArr).concat(words.slice(5));
    }
    if (words.length < 7) {
        throw new Error("For each object you must provide at least the Name, RA and Dec");
    }
    if (words.length === 11 && (parseFloat(words[7]) === 2000 || parseFloat(words[7]) === 1950) && !helper.notFloat(words[8]) && !helper.notFloat(words[9]) && !helper.notFloat(words[10])) {
        words = [words[0], words[1], words[2], words[3] + (parseFloat(words[8]) !== 0 ? "/" + words[8] : ""), words[4], words[5], words[6] + (parseFloat(words[9]) !== 0 ? "/" + words[9] : ""), words[7]].concat([Driver.defaultObstime, Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultInstrument]);
    }
    if (words.length === 7) {
        words = words.concat([Driver.defaultEpoch, Driver.defaultObstime, Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultInstrument, Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 8) {
        words = words.concat([Driver.defaultObstime, Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultInstrument, Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 9) {
        words = words.concat([Driver.defaultProject, Driver.defaultAM, Driver.defaultType, Driver.defaultInstrument, Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 10) {
        words = words.concat([Driver.defaultAM, Driver.defaultType, Driver.defaultInstrument, Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 11) {
        words = words.concat([Driver.defaultType, Driver.defaultInstrument, Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 12) {
        words = words.concat([Driver.defaultInstrument, Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 13) {
        words = words.concat([Driver.defaultSkyPA, Driver.defaultPriority]);
    } else if (words.length === 14) {
        words = words.concat([Driver.defaultPriority]);
    }
    // Sanity check: there must now be exactly this.ReqLineLen entries in the array
    if (words.length !== this.ReqLineLen) {
        throw new Error(`Incorrect number of entries, expected ${this.ReqLineLen}`);
    }
    let rax;
    // Sanity check: input syntax for all parameters
    /* RA hours, minutes must be integer */
    if (helper.notInt(words[1]) || helper.notInt(words[2])) {
        throw new Error("Non-integer value detected in [RA]");
    }
    /* RA hours between 0 and 23 */
    rax = parseInt(words[1]);
    if (rax < 0 || rax > 23) {
        throw new Error("The 'hours' part of [RA] must be an integer between 0 and 23");
    }
    /* RA minutes between 0 and 59 */
    rax = parseInt(words[2]);
    if (rax < 0 || rax > 59) {
        throw new Error("The 'minutes' part of [RA] must be an integer between 0 and 59");
    }
    /* RA seconds and proper motion */
    if (words[3].indexOf("/") > -1) {
        rax = words[3].split("/");
        if (rax.length !== 2) {
            throw new Error("Incorrect syntax for [pmRA]");
        }
        if (helper.notFloat(rax[0]) || helper.notFloat(rax[1])) {
            throw new Error("Non-float value detected in [RA]/[pmRA]");
        }
        words[this.ReqLineLen] = parseFloat(rax[0]);
        words[this.ReqLineLen + 1] = parseFloat(rax[1]);
        words[this.ReqLineLen + 1] = Math.max(-1000, Math.min(1000, words[this.ReqLineLen + 1]));
    } else if (helper.notFloat(words[3])) {
        throw new Error("Non-integer value detected in [RA]");
    } else {
        words[this.ReqLineLen] = parseFloat(words[3]);
        words[this.ReqLineLen + 1] = 0;
    }
    /* RA seconds, integer part between 0 and 59 */
    if (parseInt(words[this.ReqLineLen]) < 0 || parseInt(words[this.ReqLineLen]) > 59) {
        throw new Error("The integer part of 'seconds' in [RA] must be a number between 0 and 59");
    }
    /* Dec degrees, arcminutes must be integer */
    if (helper.notInt(words[4]) || helper.notInt(words[5])) {
        throw new Error("Non-integer value detected in [DEC]");
    }
    /* Dec degrees between -89 and +89 */
    rax = parseInt(words[4]);
    if (rax < -89 || rax > 89) {
        throw new Error("The 'degrees' part of [DEC] must be an integer between -89 and +89");
    }
    /* Dec arcminutes between 0 and 59 */
    rax = parseInt(words[5]);
    if (rax < 0 || rax > 59) {
        throw new Error("The 'minutes' part of [DEC] must be an integer between 0 and 59");
    }
    /* Dec arcseconds and proper motion */
    if (words[6].indexOf("/") > -1) {
        rax = words[6].split("/");
        if (rax.length !== 2) {
            throw new Error("Incorrect syntax for [pmDEC]");
        }
        if (helper.notFloat(rax[0]) || helper.notFloat(rax[1])) {
            throw new Error("Non-float value detected in [DEC]/[pmDEC]");
        }
        words[this.ReqLineLen + 2] = parseFloat(rax[0]);
        words[this.ReqLineLen + 3] = parseFloat(rax[1]);
        words[this.ReqLineLen + 3] = Math.max(-1000, Math.min(1000, words[this.ReqLineLen + 3]));
    } else if (helper.notFloat(words[6])) {
        throw new Error("Non-integer value detected in [DEC]");
    } else {
        words[this.ReqLineLen + 2] = parseFloat(words[6]);
        words[this.ReqLineLen + 3] = 0;
    }
    /* Dec arcseconds, integer part between 0 and 59 */
    if (parseInt(words[this.ReqLineLen + 2]) < 0 || parseInt(words[this.ReqLineLen + 2]) > 59) {
        throw new Error("The integer part of 'arcseconds' in [DEC] must be a number between 0 and 59");
    }
    if (helper.filterFloat(words[7]) !== 2000 && helper.filterFloat(words[7]) !== 1950) {
        throw new Error("[EPOCH] must be either 2000 or 1950");
    }
    /* Validate exptime */
    if (helper.notInt(words[8]) && words[8] !== "*") {
        throw new Error("Non-integer value detected in [OBSTIME]");
    }
    /* Validate constraints */
    if (helper.notFloat(words[10])) {
        const arr = words[10].toUpperCase().split(",");
        let good = true;
        let periodset = false;
        for (const constr of arr) {
            if (!helper.notFloat(constr)) {
                continue;
            }
            if (constr.startsWith("UTC[") || constr.startsWith("LST[") || constr.startsWith("HA[") || constr.startsWith("AM[") || constr.startsWith("MOON[")) {
                if (constr.slice(-1) !== "]" || constr.indexOf("-") === -1) {
                    good = false;
                    break;
                }
            } else if (constr.startsWith("AM")) {
                if (!helper.filterFloat(constr.slice(2))) {
                    good = false;
                    break;
                }
            } else if (constr.startsWith("MOON")) {
                if (!helper.filterFloat(constr.slice(4))) {
                    good = false;
                    break;
                }
            } else {
                const wrds = constr.split("+");
                for (const wrd of wrds) {
                    if (!["NT", "AT", "DARK"].includes(wrd)) {
                        good = false;
                        break;
                    }
                }
                if (good) {
                    if (!periodset) {
                        periodset = true;
                        continue;
                    }
                    throw new Error("Conflicting constraints (NT/AT/DARK specified multiple times)");
                }
                good = false;
                break;
            }
        }
        if (!good) {
            throw new Error("[CONSTRAINTS] field invalid");
        }
        if (helper.notInt(words[8]) && words[8] !== "*") {
            throw new Error("Non-integer value detected in [OBSTIME]");
        }
    }
    /* Validate observation type */
    if (!config.allowedTypes.includes(words[11])) {
        const wl = words[11].length;
        if (words[11].indexOf("Staff/") !== 0 || (words[11].indexOf("Staff/") === 0 && (wl < 8 || wl > 9))) {
            throw new Error("[TYPE] must be one of the following: " + config.allowedTypes.map(type => `<i>${type}</i>`).join(", "));
        }
    }
    /* OB info must be valid, or an instrument name, or "default" */
    if (words[12] !== Driver.defaultInstrument) {
        const arr = words[12].split(":");
        if (arr.length !== 4 && arr.length !== 1) {
            throw new Error("OB info is not valid, it should be Instrument:Mode:GroupID:BlockID");
        }
    }
    /* Sky PA must be a float */
    if (helper.notFloat(words[13])) {
        throw new Error("Non-float value detected in [SKYPA]");
    }
    /* Priority must be a float */
    if (helper.notFloat(words[14])) {
        throw new Error("Non-float value detected in [PRIORITY]");
    }
    /* Quote back the name, if necessary */
    words[0] = helper.quoteIfNeeded(words[0]);
    return words;
};

/**
 * @memberof TargetList
 */
TargetList.prototype.checkForDuplicates = function () {
    try {
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
            helper.LogWarning(`Duplicate lines detected: ${duplicateList.join(", ")}. Please check if that is what you actually intended, otherwise delete or comment out the duplicates.`);
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 * @returns 0 = cannot observe the object (gray line)
 *          1 = can observe the object (telescopes that don't have an over-the-axis mode)
 *              or can observe the object under-the-axis only
 *          2 = can observe the object over-the-axis only
 *          3 = can observe the object both over- and under-the-axis
 */
Target.prototype.canObserve = function (idx) {
    try {
        const time = driver.night.xaxis[idx];
        const altitude = this.Graph[idx];
        const moondist = this.MoonDistance[idx];

        if (Driver.obsLowestLimit !== null && altitude < Driver.obsLowestLimit) {
            return 0;
        }
        if (Driver.obsHighestLimit !== null && altitude > Driver.obsHighestLimit) {
            return 0;
        }
        if (this.RestrictionTwilights.length > 0) {
            if (!this.RestrictionTwilights.includes("NT") && (time < driver.night.ENauTwilight || time > driver.night.MNauTwilight)) {
                return 0;
            }
            if (!this.RestrictionTwilights.includes("AT") && ((time > driver.night.ENauTwilight && time < driver.night.EAstTwilight) || (time > driver.night.MAstTwilight && time < driver.night.MNauTwilight))) {
                return 0;
            }
            if (!this.RestrictionTwilights.includes("DARK") && (time > driver.night.EAstTwilight && time < driver.night.MAstTwilight)) {
                return 0;
            }
        }
        if (!(this.RestrictionMinUTC <= time && this.RestrictionMaxUTC >= time && this.RestrictionMinAlt <= altitude && this.RestrictionMaxAlt >= altitude && this.RestrictionMinMoonDistance <= moondist && this.RestrictionMaxMoonDistance >= moondist)) {
            return 0;
        }
        for (let i = 0; i < driver.targets.Offline.length; i += 1) {
            if (time >= driver.targets.Offline[i].Start && time <= driver.targets.Offline[i].End) {
                return 0;
            }
        }
        /* Special provisions for equatorial mounts */
        // Alt(Dec)
        if (this.DecLimitMinimumAlt !== null && altitude < this.DecLimitMinimumAlt) {
            return 0;
        }
        // HA(Dec)
        const ha = (time - this.ZenithTime) * 24;
        if (this.DecLimitMinimumHA !== null && ha < this.DecLimitMinimumHA) {
            return 0;
        }
        if (this.DecLimitMaximumHA !== null && ha > this.DecLimitMaximumHA) {
            return 0;
        }
        if (this.DecLimitMinimumAltAzEast === null && this.DecLimitMinimumAltAzWest === null) {
            return 1;
        }
        // Alt(Az)
        let notwest = false, noteast = false;
        if ($("#opt_allow_over_axis").is(":checked")) {
            if (this.DecLimitMinimumAltAzWest !== null && altitude < this.DecLimitMinimumAltAzWest[idx]) {
                notwest = true;
            }
        } else {
            // Do not allow observations over-the-axis
            notwest = true;
        }
        if (this.DecLimitMinimumAltAzEast !== null && altitude < this.DecLimitMinimumAltAzEast[idx]) {
            noteast = true;
        }
        if (noteast && notwest) {
            return 0;
        }
        if (!noteast && notwest) {
            return 1;
        }
        if (!notwest && noteast) {
            return 2;
        }
        return 3;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.preCompute = function () {
    try {
        // First, determine when it is allowed to observe and when not
        this.beginAllowed = [];
        this.endAllowed = [];
        this.beginForbidden = [];
        this.endForbidden = [];
        this.observable[0] = this.canObserve(0);
        let obs = (this.observable[0] > 0);
        if (!obs) {
            this.beginForbidden.push(driver.night.xaxis[0]);
        } else {
            this.beginAllowed.push(driver.night.xaxis[0]);
        }
        for (let i = 1; i < this.Graph.length - 1; i += 1) {
            this.observable[i] = this.canObserve(i);
            if (this.observable[i] > 0) {
                if (!obs) {
                    obs = true;
                    this.endForbidden.push(driver.night.xaxis[i]);
                    this.beginAllowed.push(driver.night.xaxis[i]);
                }
            } else if (obs) {
                obs = false;
                this.endAllowed.push(driver.night.xaxis[i]);
                this.beginForbidden.push(driver.night.xaxis[i]);
            }
        }
        const last = this.Graph.length - 1;
        this.observable[last] = this.canObserve(last);
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
            this.Criticality = 0;
            driver.targets.Warning1.push(this.Name);
            return;
        }
        if (this.FillSlot) {
            this.SetExptime(this.endAllowed[0] - this.beginAllowed[0]);
            this.iLastPossibleTime = helper.MJDToIndex(this.beginAllowed[0]);
            this.LastPossibleTime = driver.night.xaxis[this.iLastPossibleTime];
            this.ObservableTonight = true;
            this.Criticality = 1;
            return;
        }
        let totalWindow = 0;
        for (let i = 0; i < this.nAllowed; i += 1) {
            if (this.beginAllowed[i] + this.Exptime <= this.endAllowed[i]) {
                totalWindow += this.endAllowed[i] - this.beginAllowed[i];
            }
        }
        this.Criticality = this.Exptime / totalWindow;
        this.FirstPossibleTime = this.beginAllowed[0];
        for (let i = this.nAllowed; i >= 0; i -= 1) {
            if (this.beginAllowed[i] + this.Exptime <= this.endAllowed[i]) {
                const lpt = this.endAllowed[i] - this.Exptime;
                this.iLastPossibleTime = helper.MJDToIndex(lpt);
                this.LastPossibleTime = driver.night.Sunset + this.iLastPossibleTime * driver.night.xstep + this.ZenithTime / 1e9;
                this.ObservableTonight = true;
                return;
            }
        }
        driver.targets.Warning2.push(this.Name);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.getAltitude = function (time) {
    try {
        const ii = helper.MJDToIndex(time);
        return this.Graph[ii];
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.resetColours = function () {
    try {
        if (this.Observed) {
            this.LabelFillColor = "green";
            this.LabelStrokeColor = "green";
            this.LabelTextColor = "white";
        } else {
            this.LabelFillColor = Driver.FillColors[this.Type];
            this.LabelTextColor = Driver.TextColors[this.Type];
            this.LabelStrokeColor = this.LabelFillColor;
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.ComputePositionSchedLabel = function () {
    try {
        const graph = driver.graph;
        const slope = graph.degree * (this.AltEndTime - this.AltStartTime) / graph.transformXWidth(this.Exptime);
        const angle = Math.atan(slope);
        const dist = graph.CircleSize * 1.2;
        const xshift = dist * Math.sin(angle);
        const yshift = dist * Math.cos(angle);
        let x = graph.xaxis[helper.MJDToIndex(this.ScheduledMidTime)] - xshift;
        let y = graph.yend - graph.degree * this.Graph[helper.MJDToIndex(this.ScheduledMidTime)] - yshift;
        if (graph.xstart + graph.CircleSize > x || x > graph.xend - graph.CircleSize) {
            x = graph.xaxis[helper.MJDToIndex(this.ScheduledMidTime)] + xshift;
            y = graph.yend - graph.degree * this.Graph[helper.MJDToIndex(this.ScheduledMidTime)] + yshift;
        } else if (graph.ystart + graph.CircleSize > y && this.ScheduledStartTime < this.ZenithTime && this.ScheduledEndTime > this.ZenithTime) {
            x = graph.xaxis[helper.MJDToIndex(this.ZenithTime)];
            y = graph.yend - graph.degree * this.Graph[helper.MJDToIndex(this.ZenithTime)] + yshift + 5;
        }
        this.xlab = x;
        this.ylab = y;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.Schedule = function (start) {
    try {
        this.Scheduled = true;
        this.ScheduledStartTime = start;
        this.ScheduledEndTime = start + this.Exptime;
        this.ScheduledMidTime = start + 0.5 * this.Exptime;
        this.AltStartTime = this.Graph[helper.MJDToIndex(this.ScheduledStartTime)];
        this.AltEndTime = this.Graph[helper.MJDToIndex(this.ScheduledEndTime)];
        this.AltMidTime = this.Graph[helper.MJDToIndex(this.ScheduledMidTime)];
        this.ComputePositionSchedLabel();
        driver.targets.removeClusters();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Target
 */
Target.prototype.Update = function (obj) {
    try {
        // obj: (0=exptime, 1=project, 2=constraints, 3=type)
        this.FullType = obj[3];
        this.Type = (obj[3].indexOf("/") === -1 ? obj[3] : obj[3].substring(0, obj[3].indexOf("/")));
        this.ProjectNumber = obj[1];
        this.Constraints = obj[2];
        let isUTC;
        const UTr = helper.ExtractUTRange(obj[2]);
        let ut1, ut2;
        if (UTr === false) {
            isUTC = false;
            this.MaxAirmass = driver.defaultAM;
            this.MaxAirmass = parseFloat(obj[2]);
            this.RestrictionMinUTC = driver.night.ENauTwilight;
            this.RestrictionMaxUTC = driver.night.MNauTwilight;
        } else {
            isUTC = true;
            ut1 = Math.max(driver.night.ENauTwilight, UTr[0]);
            ut2 = Math.min(driver.night.MNauTwilight, UTr[1]);
            this.MaxAirmass = 9.9;
            this.RestrictionMinUTC = ut1;
            this.RestrictionMaxUTC = ut2;
        }
        this.RestrictionMinAlt = helper.AirmassToAltitude(this.MaxAirmass);
        this.FillSlot = isUTC && (obj[0] === "*");
        if (helper.filterInt(obj[0])) {
            this.ExptimeSeconds = parseInt(obj[0]);
            this.Exptime = Math.floor(this.ExptimeSeconds / sla.d2s / driver.night.xstep) * driver.night.xstep;
        } else {
            this.Exptime = this.FillSlot ? ut2 - ut1 : driver.defaultObstime / sla.d2s;
            this.ExptimeSeconds = Math.round(this.Exptime * sla.d2s);
            this.Exptime = Math.floor(this.Exptime / driver.night.xstep) * driver.night.xstep;
        }
        const hrs = Math.floor(this.ExptimeSeconds / 3600);
        const min = Math.round((this.ExptimeSeconds - hrs * 3600) / 60);
        this.ExptimeHM = `${hrs > 0 ? hrs.toFixed(0) + "h " : ""}${min.toFixed(0)}m`;
        if (this.FillSlot) {
            helper.LogEntry(`Attention: object <i>${this.Name}</i> will fill its entire time slot.`);
        }

        this.OBData = obj[4];
        if (this.OBData.indexOf(":") !== -1) {
            const obArr = this.OBData.split(":");
            this.BacklinkToOBQueue = `http://www.not.iac.es/intranot/ob/ob_update.php?period=${parseInt(this.ProjectNumber.substring(0, 2))}&propID=${parseInt(this.ProjectNumber.substring(3))}&groupID=${obArr[2]}&blockID=${obArr[3]}`;
            this.BacklinkToOBQueuePublic = `http://www.not.iac.es/observing/forms/obqueue/ob_update.php?period=${parseInt(this.ProjectNumber.substring(0, 2))}&propID=${parseInt(this.ProjectNumber.substring(3))}&groupID=${obArr[2]}&blockID=${obArr[3]}`;
            this.Instrument = obArr[0];
            this.ExtraInfo = `${obArr[0]}/${obArr[1]}`;
        } else {
            this.BacklinkToOBQueue = null;
            this.BacklinkToOBQueuePublic = null;
            this.Instrument = this.OBData;
            this.ExtraInfo = null;
        }

        this.ReconstructedInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch} ${this.ExptimeSeconds} ${this.ProjectNumber} ${this.Constraints} ${this.FullType} ${this.OBData}`;
        this.ReconstructedMinimumInput = `${this.Name} ${this.inputRA} ${this.inputDec} ${this.Epoch}`;

        this.preCompute();
        this.resetColours();
    } catch (ex) {
        helper.LogException(ex);
    }
};
