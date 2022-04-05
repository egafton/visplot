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
function Graph(_canvas, _context) {
    this.canvas = _canvas;
    this.ctx = _context;
    this.canvasWidth = _canvas.width;
    this.canvasHeight = _canvas.height;
    this.xmid = this.canvasWidth / 2;
    this.width = 600;
    this.degree = 6;
    this.height = 90 * this.degree;
    this.xstart = (_canvas.width - this.width) / 2 - 30;
    this.ystart = 80;
    this.xend = this.xstart + this.width;
    this.yend = this.ystart + this.height;
    this.tickLength = 7;
    this.fontFamily = "Ubuntu";
    this.maxLenTgtName = 10;
    this.CircleSize = 8;
    this.CircleSizeSq = 64;
    this.doubleTargets = true;
}

/**
 * @memberof Graph
 */
Graph.prototype.plotHorizontalLine = function (xstart, xend, y, dash, lw) {
    this.ctx.beginPath();
    this.ctx.lineWidth = lw;
    this.ctx.setLineDash(dash);
    this.ctx.moveTo(xstart, y);
    this.ctx.lineTo(xend, y);
    this.ctx.stroke();
};

/**
 * @memberof Graph
 */
Graph.prototype.plotVerticalLine = function (ystart, yend, x, dash, lw) {
    this.ctx.beginPath();
    this.ctx.lineWidth = lw;
    this.ctx.setLineDash(dash);
    this.ctx.moveTo(x, ystart);
    this.ctx.lineTo(x, yend);
    this.ctx.stroke();
};

/**
 * @memberof Graph
 */
Graph.prototype.plotText = function (text, font, color, x, y, xalign, yalign) {
    this.ctx.font = `${font} ${this.fontFamily}`;
    this.ctx.textAlign = xalign;
    this.ctx.textBaseline = yalign;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
};

/**
 * @memberof Graph
 */
Graph.prototype.plotRotatedText = function (text, font, x, y, xalign, yalign) {
    this.ctx.save();
    this.ctx.font = `${font} ${this.fontFamily}`;
    this.ctx.translate(x, y);
    this.ctx.rotate(Math.PI * 1.5);
    this.ctx.textAlign = xalign;
    this.ctx.textBaseline = yalign;
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
};

/**
 * @memberof Graph
 */
Graph.prototype.reverseTransformXLocation = function (xplot) {
    return driver.night.Sunset + (xplot - this.xstart) * driver.night.wnight / this.width;
};

/**
 * @memberof Graph
 */
Graph.prototype.transformXLocation = function (xnight) {
    return this.xstart + this.width * (xnight - driver.night.Sunset) / driver.night.wnight;
};

/**
 * @memberof Graph
 */
Graph.prototype.transformYLocation = function (ydegrees) {
    return this.yend - this.degree * ydegrees;
};

/**
 * @memberof Graph
 */
Graph.prototype.transformXWidth = function (wnight) {
    return this.width * wnight / driver.night.wnight;
};

/**
 * @memberof Graph
 */
Graph.prototype.drawRHSofSchedule = function () {
    this.ctx.clearRect(this.targetsx - 15, this.targetsy - this.targetsyskip - 5, this.canvas.width - this.targetsx + 15, this.canvas.height);
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 1.2;
    let y = this.targetsy;
    this.ctx.setLineDash([]);
    for (let i = 0; i < driver.targets.nTargets; i += 1) {
        const obj = driver.targets.Targets[i];
        obj.ystart = y - this.targetsyskip - 1;
        if (obj.Scheduled) {
            if (this.doubleTargets) {
                this.plotText(`${obj.Name.substr(0, this.maxLenTgtName)} (${obj.ProjectNumber})`,
                              "8pt",
                              (driver.reObj == i && driver.rescheduling) ? "blue" : "black",
                              this.targetsx + 15, y, "left", "bottom");
            } else {
                this.plotText(`${obj.Name.substr(0, this.maxLenTgtName)} (${obj.ProjectNumber}; UT ${helper.EphemDateToHM(obj.ScheduledStartTime)})`,
                              "8pt",
                              (driver.reObj == i && driver.rescheduling) ? "blue" : "black",
                              this.targetsx + 15, y, "left", "bottom");
            }
            this.ctx.strokeStyle = obj.LabelStrokeColor;
            this.ctx.fillStyle = obj.LabelFillColor;
            this.ctx.beginPath();
            this.ctx.arc(this.targetsx, y - 6.5, this.CircleSize, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.plotText((i + 1), "8pt", obj.LabelTextColor, this.targetsx, y, "center", "bottom");
        } else {
            this.plotText(`${obj.Name} (${obj.ProjectNumber})`,
                          "8pt",
                          (driver.reObj == i && driver.rescheduling) ? "blue" : "black",
                          this.targetsx + 15, y, "left", "bottom");
            this.ctx.strokeStyle = "black";
            this.ctx.fillStyle = "white";
            this.ctx.beginPath();
            this.ctx.arc(this.targetsx, y - 6.5, this.CircleSize, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.ctx.stroke();
            this.plotText((i + 1), "8pt", "black", this.targetsx, y, "center", "bottom");
        }
        y += this.targetsyskip;
        if (this.doubleTargets) {
            if (obj.Scheduled) {
                this.plotText(`${obj.shortRA} ${obj.shortDec} (UT ${helper.EphemDateToHM(obj.ScheduledStartTime)})`,
                              this.legendSize,
                              (driver.reObj == i && driver.rescheduling) ? "blue" : "black",
                              this.targetsx + 15, y, "left", "bottom");
            } else {
                this.plotText(`${obj.shortRA} ${obj.shortDec}`,
                              this.legendSize,
                              (driver.reObj == i && driver.rescheduling) ? "blue" : "black",
                              this.targetsx + 15, y, "left", "bottom");
            }
            y += this.targetsyskip + 2;
        } else {
            y += 2;
        }
        obj.yend = y - this.targetsyskip - 1;
    }
    this.ctx.fillStyle = "black";

    if (driver.reY !== null) {
        this.ctx.strokeStyle = "blue";
        this.ctx.beginPath();
        this.ctx.moveTo(this.targetsx + 15, driver.reY);
        this.ctx.lineTo(this.canvasWidth - 5, driver.reY);
        this.ctx.stroke();
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawSchedule = function () {
    this.ctx.setLineDash([]);
    this.ctx.save();
    this.ctx.rect(this.xstart, this.ystart, this.width, this.height);
    this.ctx.clip();
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = "black";
    for (let i = 0; i < driver.targets.nTargets; i += 1) {
        if (driver.targets.Targets[i].Scheduled === false) {
            continue;
        }
        const obj = driver.targets.Targets[i];
        this.ctx.strokeStyle = obj.LabelStrokeColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.xaxis[obj.iScheduledStartTime], this.transformYLocation(obj.Graph[obj.iScheduledStartTime]));
        for (let j = obj.iScheduledStartTime + 1; j <= obj.iScheduledEndTime; j += 1) {
            this.ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
        }
        this.ctx.stroke();
    }
    this.ctx.lineWidth = 1.2;
    for (let i = 0; i < driver.targets.nTargets; i += 1) {
        const obj = driver.targets.Targets[i];
        if (obj.Scheduled) {
            this.ctx.strokeStyle = obj.LabelStrokeColor;
            this.ctx.fillStyle = obj.LabelFillColor;
            this.ctx.beginPath();
            this.ctx.arc(obj.xmid, obj.ymid, this.CircleSize, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.plotText((i + 1), "8pt", obj.LabelTextColor, obj.xmid, obj.ymid, "center", "middle");
        } else {
            this.ctx.strokeStyle = "black";
            this.ctx.fillStyle = "white";
            this.ctx.beginPath();
            this.ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, 2 * Math.PI, false);
            this.ctx.fill();
            this.ctx.stroke();
            this.plotText((i + 1), "8pt", "black", obj.xlab, obj.ylab, "center", "middle");
        }
    }
    this.ctx.restore();

    this.ctx.lineWidth = 4;
    for (let i = 0; i < driver.targets.nTargets; i += 1) {
        if (driver.targets.Targets[i].Scheduled === false) {
            continue;
        }
        const obj = driver.targets.Targets[i];
        this.ctx.strokeStyle = obj.LabelStrokeColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.xaxis[obj.iScheduledStartTime], this.yend + 2.6);
        this.ctx.lineTo(this.xaxis[obj.iScheduledEndTime], this.yend + 2.6);
        this.ctx.stroke();
    }
    for (let i = 0; i < driver.targets.BadWolfStart.length; i += 1) {
        this.ctx.strokeStyle = "red";
        this.ctx.beginPath();
        this.ctx.moveTo(this.transformXLocation(driver.targets.BadWolfStart[i]), this.yend + 2.6);
        this.ctx.lineTo(this.transformXLocation(driver.targets.BadWolfEnd[i]), this.yend + 2.6);
        this.ctx.stroke();
    }

    this.drawRHSofSchedule();
};

/**
 * @memberof Graph
 */
Graph.prototype.setTargetsSize = function (ntargets) {
    this.doubleTargets = (ntargets <= 18);
    this.targetsy = this.ystart + 15;
    this.targetsx = this.xend + 35;
    this.targetsyskip = 15;
    let totalheight = (this.targetsyskip * (this.doubleTargets ? 2 : 1) + 2) * ntargets;
    if (this.targetsy + totalheight > this.yend + 55) {
        this.targetsy = this.ystart - 25;
        totalheight = (this.targetsyskip * (this.doubleTargets ? 2 : 1) + 2) * ntargets;
        if (this.targetsy + totalheight > this.yend + 55) {
            this.targetsyskip = (this.doubleTargets ? 0.5 : 1) * (((this.yend + 55 - this.targetsy) / ntargets) - 2);
            if (this.targetsyskip < 10) {
                this.targetsyskip = (this.doubleTargets ? 0.5 : 1) * (((this.yend + 55 - this.targetsy) / ntargets) - 2);
            }
        }
    }
    this.individualheight = (this.targetsyskip * (this.doubleTargets ? 2 : 1) + 2) * 2;
    if (this.individualheight < this.CircleSize * 2) {
        const circlesize = Math.floor(this.individualheight / 2);
        this.CircleSize = circlesize;
        this.CircleSizeSq = circlesize * circlesize;
    }
    // Update this to set size programatically...
    if (ntargets > 32) {
        this.legendSize = "6pt";
    } else {
        this.legendSize = "8pt";
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.highlightTarget = function (target) {
    this.ctx.save();
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    this.ctx.lineWidth = 0;
    this.ctx.rect(this.xstart, this.ystart, this.width, this.height);
    this.ctx.clip();
    this.ctx.setLineDash([]);
    this.ctx.beginPath();
    // Are we starting from allowed conditions?
    this.ctx.strokeStyle = target.LabelStrokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(this.xaxis[0], this.transformYLocation(target.Graph[0]));
    for (let j = 1; j < target.Graph.length; j += 1) {
        this.ctx.lineTo(this.xaxis[j], this.transformYLocation(target.Graph[j]));
    }
    this.ctx.stroke();
    if ($("#opt_show_lastobstime").is(":checked")) {
        if (target.ObservableTonight !== false) {
            this.ctx.beginPath();
            this.ctx.arc(this.transformXLocation(target.LastPossibleTime), this.transformYLocation(target.Graph[target.iLastPossibleTime]), 5, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = "red";
            this.ctx.fill();
            this.ctx.fillStyle = "black";
        }
    }
    this.ctx.restore();
};

/**
 * @memberof Graph
 */
Graph.prototype.drawTargets = function (Targets) {
    this.ctx.save();
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    this.ctx.lineWidth = 0;
    this.ctx.rect(this.xstart, this.ystart, this.width, this.height);
    this.ctx.clip();
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1.2;
    const strokes = [];
    strokes[true] = "#000";
    strokes[false] = "#aaa";

    for (let i = 0; i < Targets.length; i += 1) {
        const obj = Targets[i];
        let obs = obj.observable[0];
        this.ctx.strokeStyle = strokes[obs];
        this.ctx.beginPath();
        this.ctx.moveTo(this.xaxis[0], this.transformYLocation(obj.Graph[0]));
        for (let j = 1; j < obj.Graph.length; j += 1) {
            if (obs !== obj.observable[j]) {
                this.ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
                this.ctx.stroke();
                obs = obj.observable[j];
                this.ctx.strokeStyle = strokes[obs];
                this.ctx.beginPath();
                this.ctx.moveTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
            } else {
                this.ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
            }
        }
        this.ctx.stroke();
        if ($("#opt_show_lastobstime").is(":checked")) {
            if (obj.ObservableTonight !== false) {
                this.ctx.beginPath();
                this.ctx.arc(this.transformXLocation(obj.LastPossibleTime), this.transformYLocation(obj.Graph[obj.iLastPossibleTime]), 5, 0, 2 * Math.PI, false);
                this.ctx.fillStyle = "red";
                this.ctx.fill();
                this.ctx.fillStyle = "black";
            }
        }
    }
    this.ctx.restore();
};

/**
 * @memberof Graph
 */
Graph.prototype.drawTargetNames = function (Targets) {
    this.ctx.setLineDash([]);
    this.ctx.save();
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    this.ctx.lineWidth = 0;
    this.ctx.rect(this.xstart, this.ystart, this.width, this.height);
    this.ctx.clip();
    for (let i = 0; i < Targets.length; i += 1) {
        const obj = Targets[i];
        this.ctx.strokeStyle = "black";
        this.ctx.fillStyle = "white";
        this.ctx.beginPath();
        this.ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, 2 * Math.PI, false);
        this.ctx.fill();
        this.ctx.stroke();
        this.plotText((i + 1), "8pt", "black", obj.xlab, obj.ylab, "center", "middle");
    }
    this.ctx.restore();
    let y = this.targetsy;
    for (let i = 0; i < Targets.length; i += 1) {
        const obj = Targets[i];
        obj.rxmid = this.targetsx;
        obj.rymid = y - 6.5;
        this.plotText(`${obj.Name} (${obj.ProjectNumber})`,
                      "8pt", "black", this.targetsx + 15, y, "left", "bottom");
        this.ctx.strokeStyle = "black";
        this.ctx.fillStyle = "white";
        this.ctx.beginPath();
        this.ctx.arc(this.targetsx, y - 6.5, this.CircleSize, 0, 2 * Math.PI, false);
        this.ctx.fill();
        this.ctx.stroke();
        this.plotText((i + 1), "8pt", "black", this.targetsx, y, "center", "bottom");
        y += this.targetsyskip;
        if (this.doubleTargets) {
            this.plotText(`${obj.shortRA} ${obj.shortDec}`,
                          this.legendSize, "black", this.targetsx + 15, y, "left", "bottom");
            y += this.targetsyskip + 2;
        } else {
            y += 2;
        }
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawEphemerides = function () {
    /*
     Convert the night.xaxis array (which is in units of ephem.Date) to a graph.axis array
     (containing the corresponding HTML5 canvas positions, in (sub)pixels
     */
    this.xaxis = [];
    for (let i = 0; i < driver.night.Nx; i += 1) {
        this.xaxis.push(this.xstart + this.width * (driver.night.xaxis[i] - driver.night.Sunset) / driver.night.wnight);
    }
    this.ctx.strokeStyle = "black";
    this.ctx.fillStyle = "black";
    // Plot the full hour UT and ST labels (8UT, 9UT, etc) below and above the plot, respectively
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    for (let i = 0; i < driver.night.UTtimes.length; i += 1) {
        const xnight = driver.night.UTtimes[i];
        const xplot = this.transformXLocation(xnight);
        if ((Driver.obs_timezone === 0 && driver.night.UTlabels[i] === "24") ||
            (Driver.obs_timezone !== 0 && driver.night.MSZTlabels[i] === "24")) {
            this.plotVerticalLine(this.ystart, this.yend, xplot, [], 1.6);
        } else {
            this.plotVerticalLine(this.ystart, this.yend, xplot, [1, 2], 1);
        }
        if (Driver.obs_timezone === 0) {
            this.ctx.font = `11pt ${this.fontFamily}`;
            this.ctx.fillText(driver.night.UTlabels[i], xplot, this.yend + 15);
            this.ctx.font = `8pt ${this.fontFamily}`;
            this.ctx.fillText(driver.night.STlabels[i], xplot, this.ystart - 35);
        } else {
            this.ctx.font = `11pt ${this.fontFamily}`;
            this.ctx.fillText(driver.night.MSZTlabels[i], xplot, this.yend + 24);
            this.ctx.font = `8pt ${this.fontFamily}`;
            this.ctx.fillText(driver.night.UTlabels[i], xplot, this.yend + 10);
            this.ctx.fillText(driver.night.STlabels[i], xplot, this.ystart - 35);
        }
    }
    // Print the LST, S.set and S.rise labels
    this.ctx.font = `8pt ${this.fontFamily}`;
    this.ctx.fillText("LST   ⟶", this.xstart - 35, this.ystart - 35);
    if (Driver.obs_timezone !== 0) {
        this.ctx.fillText("UT   ⟶", this.xstart - 20, this.yend + 10);
    }
    this.ctx.fillText("S.set", this.xstart, this.ystart - 22);
    this.ctx.fillText("S.rise", this.xend, this.ystart - 22);
    // Plot the sunset and sunrise times
    this.ctx.fillText(`${driver.night.tSunset[3]}:${helper.padTwoDigits(driver.night.tSunset[4])}`, this.xstart, this.ystart - 10);
    this.ctx.fillText(`${driver.night.tSunrise[3]}:${helper.padTwoDigits(driver.night.tSunrise[4])}`, this.xend, this.ystart - 10);
    // Plot the twilights labels and corresponding dashed vertical lines
    const twiStyle = [6, 5];
    let xtemp;
    xtemp = this.transformXLocation(driver.night.ENauTwilight);
    this.ctx.fillText("Nau", xtemp, this.ystart - 22);
    this.ctx.fillText(helper.EphemDateToHM(driver.night.ENauTwilight), xtemp - 3.5, this.ystart - 10);
    this.plotVerticalLine(this.ystart, this.yend, xtemp, twiStyle, 1.2);
    xtemp = this.transformXLocation(driver.night.MNauTwilight);
    this.ctx.fillText("Nau", xtemp, this.ystart - 22);
    this.ctx.fillText(helper.EphemDateToHM(driver.night.MNauTwilight), xtemp + 1, this.ystart - 10);
    this.plotVerticalLine(this.ystart, this.yend, xtemp, twiStyle, 1.2);
    xtemp = this.transformXLocation(driver.night.EAstTwilight);
    this.ctx.fillText("Ast", xtemp, this.ystart - 22);
    this.ctx.fillText(helper.EphemDateToHM(driver.night.EAstTwilight), xtemp + 4, this.ystart - 10);
    this.plotVerticalLine(this.ystart, this.yend, xtemp, twiStyle, 1.2);
    xtemp = this.transformXLocation(driver.night.MAstTwilight);
    this.ctx.fillText("Ast", xtemp, this.ystart - 22);
    this.ctx.fillText(helper.EphemDateToHM(driver.night.MAstTwilight), xtemp - 1, this.ystart - 10);
    this.plotVerticalLine(this.ystart, this.yend, xtemp, twiStyle, 1.2);
    // Print the recommended morning and evening blank fields for flats
    this.ctx.textAlign = "left";
    this.ctx.fillText(driver.night.BestEvBlank, this.transformXLocation(driver.night.Sunset), this.yend + 31);
    this.ctx.textAlign = "right";
    this.ctx.fillText(driver.night.BestMoBlank, this.transformXLocation(driver.night.Sunrise), this.yend + 31);
    this.ctx.textAlign = "center";

    // Plot the gray-shaded rectangles corresponding to the twilights (vertical) and to airmass=2 (horizontal)
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillStyle = "gray";
    const wENT = this.transformXWidth(driver.night.ENauTwilight - driver.night.Sunset);
    const wMNT = this.transformXWidth(driver.night.Sunrise - driver.night.MNauTwilight);
    this.ctx.rect(this.xstart, this.ystart, this.transformXWidth(driver.night.EAstTwilight - driver.night.Sunset), this.height);
    this.ctx.rect(this.xend, this.ystart, -this.transformXWidth(driver.night.Sunrise - driver.night.MAstTwilight), this.height);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.globalAlpha = 0.25;
    this.ctx.rect(this.xstart, this.ystart, wENT, this.height);
    this.ctx.rect(this.xend, this.ystart, -wMNT, this.height);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.globalAlpha = 0.3;
    this.ctx.rect(this.xstart, this.yend, this.width, -this.degree * 30);
    this.ctx.fill();
    // ... and to offline time
    for (let i = 0; i < driver.targets.BadWolfStart.length; i += 1) {
        this.ctx.beginPath();
        this.ctx.globalAlpha = 0.3;
        this.ctx.rect(this.transformXLocation(driver.targets.BadWolfStart[i]), this.ystart, this.transformXLocation(driver.targets.BadWolfEnd[i]) - this.transformXLocation(driver.targets.BadWolfStart[i]), this.degree * 60);
        this.ctx.fill();
    }

    this.ctx.restore();

    // Render the moon altitude plot
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.xstart, this.ystart, this.width, this.height);
    this.ctx.clip();
    this.ctx.beginPath();
    this.ctx.lineWidth = 1.2;
    this.ctx.moveTo(this.xaxis[0], this.transformYLocation(driver.night.ymoon[0]));
    for (let i = 1; i < driver.night.ymoon.length; i += 1) {
        this.ctx.lineTo(this.xaxis[i], this.transformYLocation(driver.night.ymoon[i]));
    }
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.fillStyle = "black";
    // Plot the x-axis label
    this.ctx.font = `11pt ${this.fontFamily}`;
    if (Driver.obs_timezone === 0) {
        this.ctx.fillText(
            `Universal Time, starting night ${driver.night.year}-` +
            `${helper.padTwoDigits(driver.night.month)}-${helper.padTwoDigits(driver.night.day)}`,
            this.xmid, this.yend + 40);
    } else {
        this.ctx.fillText(
            `Mean Solar Zone Time, starting night ${driver.night.year}-` +
            `${helper.padTwoDigits(driver.night.month)}-${helper.padTwoDigits(driver.night.day)}`,
            this.xmid, this.yend + 44);
    }

    // Moon illumination text
    this.ctx.font = `8pt ${this.fontFamily}`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    if ((driver.night.MoonIllStart === 0 && driver.night.MoonIllEnd === 0) ||
        driver.night.Moonset < driver.night.Sunset ||
        driver.night.Moonrise > driver.night.Sunrise) {
        this.ctx.fillText("Moonless night.", this.xstart - 130, this.transformYLocation(77));
    } else {
        this.ctx.fillText("Moon illumination:", this.xstart - 130, this.transformYLocation(77));
        this.ctx.fillText(driver.night.MoonIlluminationString, this.xstart - 130, this.transformYLocation(75));
        if ((driver.night.Moonrise >= driver.night.Sunset) && (driver.night.Moonrise <= driver.night.Sunrise)) {
            this.ctx.fillText("Moon rises:", this.xstart - 130, this.transformYLocation(71));
            this.ctx.fillText(helper.EphemDateToHM(driver.night.Moonrise), this.xstart - 130, this.transformYLocation(69));
        } else if ((driver.night.Moonset >= driver.night.Sunset) && (driver.night.Moonset <= driver.night.Sunrise)) {
            this.ctx.fillText("Moon sets:", this.xstart - 130, this.transformYLocation(71));
            this.ctx.fillText(helper.EphemDateToHM(driver.night.Moonset), this.xstart - 130, this.transformYLocation(69));
        }
    }

    this.drawCurrentTime(new Date());
};

/**
 * @memberof Graph
 */
Graph.prototype.drawCurrentTime = function (now) {
    if (now < driver.night.DateSunset || now > driver.night.DateSunrise) {
        return false;
    }
    // Current time marker
    const xnow = this.transformXLocation(driver.night.Sunset + (now - driver.night.DateSunset) / 8.64e7);
    const klen = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(xnow, this.ystart);
    this.ctx.lineTo(xnow - 0.6 * klen, this.ystart - klen);
    this.ctx.lineTo(xnow + 0.6 * klen, this.ystart - klen);
    this.ctx.closePath();
    this.ctx.fillStyle = "red";
    this.ctx.fill();
    this.ctx.strokeStyle = "red";
    this.plotVerticalLine(this.ystart, this.yend, xnow, [], 1);
};

/**
 * @memberof Graph
 */
Graph.prototype.drawBackground = function () {
    // Draw main rectangle that contains the visibility plot
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.setLineDash([]);
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 1.2;
    this.ctx.rect(this.xstart, this.ystart, this.width, this.height);
    this.ctx.stroke();

    // Everything we draw for a while (e.g., tick marks, etc) should be clipped to the plot limits
    this.ctx.clip();

    // Draw dotted horizontal lines and tick marks every 10 degrees
    for (let i = 10; i < 90; i += 10) {
        const y = this.transformYLocation(i);
        /* Dotted horizontal lines; the INT has its limit at 20 deg, so do not
         * draw the usual horizontal lines there. */
        if (i !== 20 || Driver.telescopeName !== "INT")
            this.plotHorizontalLine(this.xstart, this.xend, y, [1, 2], 1);
        // Tick marks
        this.plotHorizontalLine(this.xstart, this.xstart + this.tickLength, y, [], 1.2);
    }
    // Draw tick marks on the right-hand side (airmass ticks)
    for (let i = 10; i <= 80; i += 5) {
        this.plotHorizontalLine(this.xend - this.tickLength, this.xend, this.transformYLocation(i), [], 1.2);
    }

    // Now draw outside the plot; first, altitude tick labels
    this.ctx.restore();
    this.ctx.fillStyle = "black";
    for (let i = 0; i < 90; i += 10) {
        this.ctx.font = `11pt ${this.fontFamily}`;
        this.ctx.textAlign = "right";
        this.ctx.textBaseline = (i > 0 || Driver.obs_timezone === 0) ? "middle" : "bottom";
        this.ctx.fillText(`${i}°`, this.xstart - this.tickLength, this.transformYLocation(i));
    }
    /*
     The 90° tick label should be drawn separately, a little lower than usual,
     so as to leave enough space for the sunset time label
     */
    this.ctx.fillText("90°", this.xstart - this.tickLength, this.transformYLocation(89));
    // Tick labels on the right-hand side (corresponding to the airmass ticks)
    for (let i = 10; i <= 80; i += 5) {
        this.plotRotatedText(helper.AltitudeToAirmass(i).toFixed(2),
                             "8pt", this.xend + 1.3 * this.tickLength, this.transformYLocation(i), "center", "middle");
    }
    // Airmass and altitude text
    this.plotRotatedText("Airmass", "8pt", this.xend + 1.3 * this.tickLength, this.yend - 3, "left", "middle");
    this.plotRotatedText("Altitude", "11pt", this.xstart - 40, 0.5 * (this.ystart + this.yend), "center", "middle");

    // Lower hatch and opening limits text
    this.ctx.font = `8pt ${this.fontFamily}`;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeStyle = "black";
    // Closed lower hatch, 0% vignetting
    this.ctx.fillText("Closed lower hatch", this.xstart - 130, this.transformYLocation(Driver.obs_lowerHatch + 2));
    this.ctx.fillText("0% vignetting", this.xstart - 130, this.transformYLocation(Driver.obs_lowerHatch));
    this.ctx.fillText("⟶", this.xstart - 50, this.transformYLocation(Driver.obs_lowerHatch));
    this.plotHorizontalLine(this.xstart, this.xend, this.transformYLocation(Driver.obs_lowerHatch), [1, 2, 3, 2], 1);
    // Closed lower hatch, 50% vignetting (only for NOT)
    if (Driver.telescopeName === "NOT") {
        this.ctx.fillText("Closed lower hatch", this.xstart - 130, this.transformYLocation(22));
        this.ctx.fillText("50% vignetting", this.xstart - 130, this.transformYLocation(20));
        this.ctx.fillText("⟶", this.xstart - 50, this.transformYLocation(20));
    }
    // Lowest observing altitude
    this.ctx.fillText(`${Driver.telescopeName} lowest limit`,
                      this.xstart - 130, this.transformYLocation(Driver.obs_lowestLimit + 2));
    this.ctx.fillText(`(${Driver.obs_lowestLimit.toFixed(0)}°)`,
                      this.xstart - 130, this.transformYLocation(Driver.obs_lowestLimit));
    this.ctx.fillText("⟶", this.xstart - 50, this.transformYLocation(Driver.obs_lowestLimit));
    this.plotHorizontalLine(this.xstart, this.xend, this.transformYLocation(Driver.obs_lowestLimit), [1, 2, 3, 2], 1);

    // Title of the plot
    this.ctx.font = `13pt ${this.fontFamily}`;
    this.ctx.textAlign = "center";
    this.ctx.fillText(Driver.plotTitle, this.xmid, 15);

    // Copyright notice
    this.ctx.font = `7pt ${this.fontFamily}`;
    this.ctx.textAlign = "left";
    this.ctx.fillText(Driver.plotCopyright, this.xstart - 130, this.canvasHeight - 6);
};
