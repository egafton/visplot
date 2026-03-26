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
function Graph() {
    try {
        this.xleftlabels = 25;
        this.xstart = 157;
        this.ystart = 92;
        this.xleftarrows = this.xstart - 50;
        this.tickLength = 7;
        this.fontFamily = config.graphFont;
        this.maxLenTgtName = 14;
        this.CircleSize = 8;
        this.CircleSizeSq = 64;
        this.doubleTargets = true;
        this.ratio = 1.4;
        this.minheight = 400;
        this.minwidth = this.minheight * this.ratio;
    } catch (ex) {
        helper.LogException(ex);
    }
}

Graph.prototype.Resize = function (_canvas) {
    try {
        this.canvasWidth = _canvas.width / window.ratio;
        this.canvasHeight = _canvas.height / window.ratio;
        this.xend = this.canvasWidth - 218;
        this.width = this.xend - this.xstart;
        this.height = (this.canvasHeight - 156);
        this.degree = this.height / 90;
        this.xmid = this.canvasWidth / 2;
        this.yend = this.ystart + this.height;
    } catch (ex) {
        helper.LogException(ex);
    }
};

Graph.prototype.pt = function (_pt) {
    try {
        return `${Math.max(8, _pt * (1 + ((this.canvasWidth - 975) / 975) * 0.7)).toFixed(1)}pt`;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.plotHorizontalLine = function (ctx, xstart, xend, y, dash, lw) {
    try {
        ctx.beginPath();
        ctx.lineWidth = lw;
        ctx.setLineDash(dash);
        ctx.moveTo(xstart, y);
        ctx.lineTo(xend, y);
        ctx.stroke();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.plotVerticalLine = function (ctx, ystart, yend, x, dash, lw) {
    try {
        ctx.beginPath();
        ctx.lineWidth = lw;
        ctx.setLineDash(dash);
        ctx.moveTo(x, ystart);
        ctx.lineTo(x, yend);
        ctx.stroke();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.plotText = function (ctx, text, font, color, x, y, xalign, yalign) {
    try {
        ctx.font = `${font} ${this.fontFamily}`;
        ctx.textAlign = xalign;
        ctx.textBaseline = yalign;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.plotRotatedText = function (ctx, text, font, x, y, xalign, yalign) {
    try {
        ctx.save();
        ctx.font = `${font} ${this.fontFamily}`;
        ctx.translate(x, y);
        ctx.rotate(Math.PI * 1.5);
        ctx.textAlign = xalign;
        ctx.textBaseline = yalign;
        ctx.fillText(text, 0, 0);
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.reverseTransformXLocation = function (xplot) {
    try {
        return driver.night.Sunset + (xplot - this.xstart) * driver.night.wnight / this.width;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.transformXLocation = function (xnight) {
    try {
        return this.xstart + this.width * (xnight - driver.night.Sunset) / driver.night.wnight;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.transformYLocation = function (ydegrees) {
    try {
        return this.yend - this.degree * ydegrees;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.transformXWidth = function (wnight) {
    try {
        return this.width * wnight / driver.night.wnight;
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawRHSofSchedule = function (ctx) {
    try {
        ctx.clearRect(this.targetsx - 15, this.targetsy - this.targetsyskip - 5, this.canvasWidth - this.targetsx + 15, this.canvasHeight);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.2;
        let y = this.targetsy;
        const Targets = driver.targets.Targets;
        ctx.setLineDash([]);
        for (let i = 0; i < Targets.length; i += 1) {
            const obj = Targets[i];
            obj.rxmid = this.targetsx;
            obj.rymid = y - 6.5;
            obj.ystart = y - this.targetsyskip - 1;
            if (obj.Scheduled) {
                if (this.doubleTargets) {
                    this.plotText(ctx, `${obj.Name.substr(0, this.maxLenTgtName)} (${obj.ProjectNumber})`, "8pt", (driver.reObj === i && driver.rescheduling) ? "blue" : "black", obj.rxmid + 15, obj.rymid - 1, "left", "middle");
                } else {
                    this.plotText(ctx, `${obj.Name.substr(0, this.maxLenTgtName)} (${obj.ProjectNumber}; UTC ${helper.MJDToHM(obj.ScheduledStartTime)})`, "8pt", (driver.reObj === i && driver.rescheduling) ? "blue" : "black", obj.rxmid + 15, obj.rymid - 1, "left", "middle");
                }
                ctx.strokeStyle = obj.LabelStrokeColor;
                ctx.fillStyle = obj.LabelFillColor;
                ctx.beginPath();
                ctx.arc(obj.rxmid, obj.rymid, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                this.plotText(ctx, String(i+1), "8pt", obj.LabelTextColor, obj.rxmid, obj.rymid, "center", "middle");
            } else {
                this.plotText(ctx, `${obj.Name} (${obj.ProjectNumber})`, "8pt", (driver.reObj === i && driver.rescheduling) ? "blue" : "black", obj.rxmid + 15, obj.rymid - 1, "left", "middle");
                ctx.strokeStyle = "black";
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(obj.rxmid, obj.rymid, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                ctx.stroke();
                this.plotText(ctx, String(i+1), "8pt", "black", obj.rxmid, obj.rymid, "center", "middle");
            }
            if (this.doubleTargets) {
                if (obj.Scheduled) {
                    this.plotText(ctx, `${obj.shortRA} ${obj.shortDec} (UTC ${helper.MJDToHM(obj.ScheduledStartTime)})`, this.legendSize, (driver.reObj === i && driver.rescheduling) ? "blue" : "black", obj.rxmid + 15, obj.rymid + this.targetsyskip - 1, "left", "middle");
                } else {
                    this.plotText(ctx, `${obj.shortRA} ${obj.shortDec}`, this.legendSize, (driver.reObj === i && driver.rescheduling) ? "blue" : "black", obj.rxmid + 15, obj.rymid + this.targetsyskip - 1, "left", "middle");
                }
                y += this.targetsyskip;
            }
            obj.yend = y + 1;
            y += this.targetsyskip + 2;
        }
        ctx.fillStyle = "black";

        if (driver.reY !== null) {
            ctx.strokeStyle = "blue";
            ctx.beginPath();
            ctx.moveTo(this.targetsx + 15, driver.reY);
            ctx.lineTo(this.canvasWidth - 5, driver.reY);
            ctx.stroke();
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawSchedule = function (ctx) {
    try {
        ctx.setLineDash([]);
        ctx.save();
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";
        for (let i = 0; i < driver.targets.nTargets; i += 1) {
            if (driver.targets.Targets[i].Scheduled === false) {
                continue;
            }
            const obj = driver.targets.Targets[i];
            const iScheduledStartTime = helper.MJDToIndex(obj.ScheduledStartTime);
            const iScheduledEndTime = helper.MJDToIndex(obj.ScheduledEndTime);

            ctx.strokeStyle = obj.LabelStrokeColor;
            ctx.beginPath();
            ctx.moveTo(this.xaxis[iScheduledStartTime], this.transformYLocation(obj.Graph[iScheduledStartTime]));
            for (let j = iScheduledStartTime + 1; j <= iScheduledEndTime; j += 1) {
                ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
            }
            ctx.stroke();
        }
        ctx.lineWidth = 1.2;
        for (let i = 0; i < driver.targets.nTargets; i += 1) {
            const obj = driver.targets.Targets[i];
            if (obj.Scheduled) {
                ctx.strokeStyle = obj.LabelStrokeColor;
                ctx.fillStyle = obj.LabelFillColor;
                ctx.beginPath();
                ctx.arc(obj.xmid, obj.ymid, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                this.plotText(ctx, String(i+1), "8pt", obj.LabelTextColor, obj.xmid, obj.ymid, "center", "middle");
            } else {
                ctx.strokeStyle = "black";
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                ctx.stroke();
                this.plotText(ctx, String(i+1), "8pt", "black", obj.xlab, obj.ylab, "center", "middle");
            }
        }
        ctx.restore();

        ctx.lineWidth = 4;
        for (let i = 0; i < driver.targets.nTargets; i += 1) {
            if (driver.targets.Targets[i].Scheduled === false) {
                continue;
            }
            const obj = driver.targets.Targets[i];
            const iScheduledStartTime = helper.MJDToIndex(obj.ScheduledStartTime);
            const iScheduledEndTime = helper.MJDToIndex(obj.ScheduledEndTime);
            ctx.strokeStyle = obj.LabelStrokeColor;
            ctx.beginPath();
            ctx.moveTo(this.xaxis[iScheduledStartTime], this.yend + 2.6);
            ctx.lineTo(this.xaxis[iScheduledEndTime], this.yend + 2.6);
            ctx.stroke();
        }
        for (let i = 0; i < driver.targets.BadWolfStart.length; i += 1) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(this.transformXLocation(driver.targets.BadWolfStart[i]), this.yend + 2.6);
            ctx.lineTo(this.transformXLocation(driver.targets.BadWolfEnd[i]), this.yend + 2.6);
            ctx.stroke();
        }

        this.drawRHSofSchedule(ctx);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.setTargetsSize = function (ntargets) {
    try {
        this.targetsyskip = 15;
        const maxsingle = parseInt(Math.floor(0.5 * this.height / this.targetsyskip));

        this.doubleTargets = (ntargets <= maxsingle);
        this.targetsy = this.ystart + 15;
        this.targetsx = this.xend + 35;

        let totalheight = (this.targetsyskip * (this.doubleTargets ? 2 : 1) + 2) * ntargets;
        if (this.targetsy + totalheight > this.yend) {
            this.targetsy = this.ystart - 25;
            totalheight = (this.targetsyskip * (this.doubleTargets ? 2 : 1) + 2) * ntargets;
            if (this.targetsy + totalheight > this.yend) {
                this.targetsyskip = (this.doubleTargets ? 0.5 : 1) * (((this.yend - this.targetsy) / ntargets) - 2);
                if (this.targetsyskip < 10) {
                    this.targetsyskip = (this.doubleTargets ? 0.5 : 1) * (((this.yend - this.targetsy) / ntargets) - 2);
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
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.highlightTarget = function (ctx, target) {
    try {
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        ctx.setLineDash([]);
        ctx.beginPath();
        // Are we starting from allowed conditions?
        ctx.strokeStyle = target.LabelStrokeColor;
        ctx.lineWidth = 2;
        ctx.moveTo(this.xaxis[0], this.transformYLocation(target.Graph[0]));
        for (let j = 1; j < target.Graph.length; j += 1) {
            ctx.lineTo(this.xaxis[j], this.transformYLocation(target.Graph[j]));
        }
        ctx.stroke();
        if ($("#opt_show_lastobstime").is(":checked")) {
            if (target.ObservableTonight !== false) {
                ctx.beginPath();
                ctx.arc(this.transformXLocation(target.LastPossibleTime), this.transformYLocation(target.Graph[target.iLastPossibleTime]), 5, 0, sla.d2pi, false);
                ctx.fillStyle = "red";
                ctx.fill();
                ctx.fillStyle = "black";
            }
        }
        let addedSymbols = 0;
        // Add moon distances
        for (let j = 0; j < target.Graph.length; j += 1) {
            if (target.Graph[j] < 10) {
                continue;
            }
            const x = driver.graph.xaxis[j];
            const y = driver.graph.yend - driver.graph.degree * target.Graph[j];
            if (typeof target.MoonDistance !== "undefined") { // for older versions
                this.plotText(ctx, `☽︎ ${Math.round(target.MoonDistance[j])}°`, "10pt", target.LabelStrokeColor, x, y + 20, "center", "top");
            }
            if (typeof target.PAngles !== "undefined") { // for older versions
                this.plotText(ctx, `∡ ${Math.round(target.PAngles[j])}°`, "10pt", target.LabelStrokeColor, x, y + 40, "center", "top");
            }
            addedSymbols += 1;
            j += 100;
        }
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.font = `${this.pt(8)} ${this.fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if (addedSymbols > 0) {
            let legendAlt = 64;
            if (Driver.telescopeName === "HET") {
                legendAlt = 34;
            }
            ctx.fillText(`Numbers below curve`, this.xleftlabels, this.transformYLocation(legendAlt));
            ctx.fillText(`are Moon distance (☽︎)`, this.xleftlabels, this.transformYLocation(legendAlt-2));
            ctx.fillText(`and P.A. (∡) at the`, this.xleftlabels, this.transformYLocation(legendAlt-4));
            ctx.fillText(`corresponding times`, this.xleftlabels, this.transformYLocation(legendAlt-6));
        }
        ctx.restore();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawTargets = function (ctx, Targets, grayedOut = false) {
    try {
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        ctx.setLineDash([]);
        const strokes = [], dashes = [], lws = [];
        if (grayedOut) {
            strokes[0] = "rgba(170, 170, 170, 0.3)";
            strokes[1] = "rgba(0, 0, 0, 0.3)";
            strokes[2] = "rgba(255, 85, 85, 0.3)";
            strokes[3] = "rgba(0, 0, 0, 0.3)";
        } else {
            strokes[0] = "rgb(170, 170, 170)";
            strokes[1] = "rgb(0, 0, 0)";
            strokes[2] = "rgb(255, 85, 85)";
            strokes[3] = "rgb(0, 0, 0)";
        }
        dashes[0] = [];
        dashes[1] = [];
        dashes[2] = [1, 3];
        dashes[3] = [2, 2];
        lws[0] = 1.2;
        lws[1] = 1.2;
        lws[2] = 3.2;
        lws[3] = 3.2;

        for (let i = 0; i < Targets.length; i += 1) {
            const obj = Targets[i];
            let obs = obj.observable[0];
            ctx.strokeStyle = strokes[obs];
            ctx.setLineDash(dashes[obs]);
            ctx.lineWidth = lws[obs];
            ctx.beginPath();
            ctx.moveTo(this.xaxis[0], this.transformYLocation(obj.Graph[0]));
            for (let j = 1; j < obj.Graph.length; j += 1) {
                if (obs !== obj.observable[j]) {
                    ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
                    ctx.stroke();
                    obs = obj.observable[j];
                    ctx.strokeStyle = strokes[obs];
                    ctx.setLineDash(dashes[obs]);
                    ctx.lineWidth = lws[obs];
                    ctx.beginPath();
                    ctx.moveTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
                } else {
                    ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
                }
            }
            ctx.stroke();
            if ($("#opt_show_lastobstime").is(":checked")) {
                if (obj.ObservableTonight !== false) {
                    ctx.beginPath();
                    ctx.arc(this.transformXLocation(obj.LastPossibleTime), this.transformYLocation(obj.Graph[obj.iLastPossibleTime]), 5, 0, sla.d2pi, false);
                    ctx.fillStyle = "red";
                    ctx.fill();
                    ctx.fillStyle = "black";
                }
            }
        }

        /* If over-the-axis observations are possible, show a legend */
        if (Targets.length > 0 && Driver.telescopeName === "HJST" && $("#opt_allow_over_axis").is(":checked")) {
            ctx.restore();
            const legtext = {
                1: "tube-east only",
                2: "tube-west only",
                3: "both modes possible"
            };

            const xleg = this.targetsx;
            const yleg = this.yend + 20;
            const dxleg = 0;
            const dyleg = 15;
            let x = xleg;
            let y = yleg;

            for (let ii = 1; ii <= 3; ii += 1) {
                ctx.strokeStyle = strokes[ii];
                ctx.setLineDash(dashes[ii]);
                ctx.lineWidth = lws[ii];
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 30, y);
                ctx.stroke();
                this.plotText(ctx, legtext[ii], "8pt", "black", x + 35, y, "left", "middle");

                x += dxleg;
                y += dyleg;
            }
        }
        ctx.restore();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawTargetNames = function (ctx, Targets) {
    try {
        ctx.setLineDash([]);
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        for (let i = 0; i < Targets.length; i += 1) {
            const obj = Targets[i];
            ctx.strokeStyle = "black";
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, sla.d2pi, false);
            ctx.fill();
            ctx.stroke();
            this.plotText(ctx, String(i+1), "8pt", "black", obj.xlab, obj.ylab, "center", "middle");
        }
        ctx.restore();
        let y = this.targetsy;
        for (let i = 0; i < Targets.length; i += 1) {
            const obj = Targets[i];
            obj.rxmid = this.targetsx;
            obj.rymid = y - 6.5;
            this.plotText(ctx, `${obj.Name} (${obj.ProjectNumber})`, "8pt", "black", obj.rxmid + 15, obj.rymid - 1, "left", "middle");
            ctx.strokeStyle = "black";
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(obj.rxmid, obj.rymid, this.CircleSize, 0, sla.d2pi, false);
            ctx.fill();
            ctx.stroke();
            this.plotText(ctx, String(i+1), "8pt", "black", obj.rxmid, obj.rymid, "center", "middle");
            if (this.doubleTargets) {
                this.plotText(ctx, `${obj.shortRA} ${obj.shortDec}`, this.legendSize, "black", obj.rxmid + 15, obj.rymid + this.targetsyskip - 1, "left", "middle");
                y += this.targetsyskip;
            }
            y += this.targetsyskip + 2;
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawEphemerides = function (ctx) {
    try {
        /*
        Convert the night.xaxis array (which is in MJD) to a graph.axis array
        (containing the corresponding HTML5 canvas positions, in (sub)pixels
        */
        this.xaxis = [];
        for (let i = 0; i < driver.night.Nx; i += 1) {
            this.xaxis.push(this.xstart + this.width * (driver.night.xaxis[i] - driver.night.Sunset) / driver.night.wnight);
        }
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        // Plot the full hour UTC and ST labels (8 UTC, 9 UTC, etc) below and above the plot, respectively
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const integerOffset = parseFloat(Driver.obs_timezone) === parseInt(Driver.obs_timezone);
        for (let i = 0; i < driver.night.UTCtimes.length; i += 1) {
            const xnight = driver.night.UTCtimes[i];
            const xplot = this.transformXLocation(xnight);
            if (integerOffset) {
                if ((Driver.obs_timezone === 0 && driver.night.UTClabels[i] === "24") || (Driver.obs_timezone !== 0 && driver.night.LocalTimelabels[i] === "24")) {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [], 1.6);
                } else {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [1, 2], 1);
                }
            } else {
                ctx.strokeStyle = "#aaaaaa";
                this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [1, 3], 1);
                ctx.strokeStyle = "black";
            }
            if (Driver.obs_timezone === 0) {
                ctx.font = `${this.pt(11)} ${this.fontFamily}`;
                ctx.fillText(driver.night.UTClabels[i], xplot, this.yend + 15);
            } else {
                ctx.font = `${this.pt(8)} ${this.fontFamily}`;
                ctx.fillText(driver.night.UTClabels[i], xplot, this.yend + 12);
            }
        }
        for (let i = 0; i < driver.night.LocalTimetimes.length; i += 1) {
            const xnight = driver.night.LocalTimetimes[i];
            const xplot = this.transformXLocation(xnight);
            if (!integerOffset) {
                if (driver.night.LocalTimelabels[i] === "24") {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [], 1.6);
                } else {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [1, 2], 1);
                }
            }
            if (Driver.obs_timezone !== 0) {
                ctx.font = `${this.pt(11)} ${this.fontFamily}`;
                ctx.fillText(driver.night.LocalTimelabels[i], xplot, this.yend + 26);
            }
            ctx.font = `${this.pt(8)} ${this.fontFamily}`;
            ctx.fillText(driver.night.LSTlabels[i], xplot, this.ystart - 35);
        }
        // Print the LST, S.set and S.rise labels
        ctx.font = `${this.pt(8)} ${this.fontFamily}`;
        ctx.textAlign = "right";
        ctx.fillText("LST   –›", this.xstart - 25, this.ystart - 35);
        if (Driver.obs_timezone !== 0) {
            ctx.fillText(`${Driver.obs_timezone_abbr}   –›`, this.xstart - 25, this.ystart - 10);
            ctx.textAlign = "left";
            ctx.fillText("UTC   –›", this.xstart - 60, this.yend + 10);
        }
        ctx.textAlign = "center";
        ctx.fillText("S.set", this.xstart, this.ystart - 22);
        ctx.fillText("S.rise", this.xend, this.ystart - 22);
        // Plot the sunset and sunrise times
        ctx.fillText(helper.MJDToHMLocal(driver.night.Sunset, Driver.obs_timezone), this.xstart, this.ystart - 10);
        ctx.fillText(helper.MJDToHMLocal(driver.night.Sunrise, Driver.obs_timezone), this.xend, this.ystart - 10);
        // Plot the twilights labels and corresponding dashed vertical lines
        const twiStyle = [6, 5];
        let xtemp;
        xtemp = this.transformXLocation(driver.night.ENauTwilight);
        ctx.fillText("Nau", xtemp, this.ystart - 22);
        ctx.fillText(helper.MJDToHMLocal(driver.night.ENauTwilight, Driver.obs_timezone), xtemp - 3.5, this.ystart - 10);
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        xtemp = this.transformXLocation(driver.night.MNauTwilight);
        ctx.fillText("Nau", xtemp, this.ystart - 22);
        ctx.fillText(helper.MJDToHMLocal(driver.night.MNauTwilight, Driver.obs_timezone), xtemp + 1, this.ystart - 10);
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        xtemp = this.transformXLocation(driver.night.EAstTwilight);
        ctx.fillText("Ast", xtemp, this.ystart - 22);
        ctx.fillText(helper.MJDToHMLocal(driver.night.EAstTwilight, Driver.obs_timezone), xtemp + 4, this.ystart - 10);
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        xtemp = this.transformXLocation(driver.night.MAstTwilight);
        ctx.fillText("Ast", xtemp, this.ystart - 22);
        ctx.fillText(helper.MJDToHMLocal(driver.night.MAstTwilight, Driver.obs_timezone), xtemp - 1, this.ystart - 10);
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        ctx.textAlign = "center";

        // Plot the gray-shaded rectangles corresponding to the twilights (vertical) and to airmass=2 (horizontal)
        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "gray";
        const wENT = this.transformXWidth(driver.night.ENauTwilight - driver.night.Sunset);
        const wMNT = this.transformXWidth(driver.night.Sunrise - driver.night.MNauTwilight);
        ctx.rect(this.xstart, this.ystart, this.transformXWidth(driver.night.EAstTwilight - driver.night.Sunset), this.height);
        ctx.rect(this.xend, this.ystart, -this.transformXWidth(driver.night.Sunrise - driver.night.MAstTwilight), this.height);
        ctx.fill();
        ctx.beginPath();
        ctx.globalAlpha = 0.25;
        ctx.rect(this.xstart, this.ystart, wENT, this.height);
        ctx.rect(this.xend, this.ystart, -wMNT, this.height);
        ctx.fill();
        ctx.beginPath();
        ctx.globalAlpha = 0.3;
        ctx.rect(this.xstart, this.yend, this.width, -this.degree * 30);
        ctx.fill();
        // ... and to offline time
        for (let i = 0; i < driver.targets.BadWolfStart.length; i += 1) {
            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            ctx.rect(this.transformXLocation(driver.targets.BadWolfStart[i]), this.ystart, this.transformXLocation(driver.targets.BadWolfEnd[i]) - this.transformXLocation(driver.targets.BadWolfStart[i]), this.degree * 60);
            ctx.fill();
        }

        ctx.restore();

        // Render the moon altitude plot
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        ctx.moveTo(this.xaxis[0], this.transformYLocation(driver.night.ymoon[0]));
        for (let i = 1; i < driver.night.ymoon.length; i += 1) {
            ctx.lineTo(this.xaxis[i], this.transformYLocation(driver.night.ymoon[i]));
        }
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "black";
        // Plot the x-axis label
        ctx.font = `${this.pt(11)} ${this.fontFamily}`;
        if (Driver.obs_timezone === 0) {
            ctx.fillText(`Coordinated Universal Time (UTC), starting night ${driver.night.year}-` + `${helper.padTwoDigits(driver.night.month)}-${helper.padTwoDigits(driver.night.day)}`, this.xmid, this.yend + 40);
        } else {
            ctx.fillText(`Local Time (${Driver.obs_timezone_description}), starting night ${driver.night.year}-` + `${helper.padTwoDigits(driver.night.month)}-${helper.padTwoDigits(driver.night.day)}`, this.xmid, this.yend + 46);
        }

        // Moon illumination text
        ctx.font = `${this.pt(8)} ${this.fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if ((driver.night.MoonIllStart === 0 && driver.night.MoonIllEnd === 0) ||
            driver.night.Moonset < driver.night.Sunset ||
            driver.night.Moonrise > driver.night.Sunrise) {
            ctx.fillText("Moonless night.", this.xleftlabels, this.transformYLocation(77));
        } else {
            ctx.fillText("Moon illumination:", this.xleftlabels, this.transformYLocation(77));
            ctx.fillText(driver.night.MoonIlluminationString, this.xleftlabels, this.transformYLocation(75));
            if ((driver.night.Moonrise >= driver.night.Sunset) && (driver.night.Moonrise <= driver.night.Sunrise)) {
                ctx.fillText("Moon rises:", this.xleftlabels, this.transformYLocation(71));
                if (driver.obs_timezone === 0) {
                    ctx.fillText(`${helper.MJDToHM(driver.night.Moonrise)} UTC`, this.xleftlabels, this.transformYLocation(69));
                } else {
                    ctx.fillText(`${helper.MJDToHMLocal(driver.night.Moonrise, Driver.obs_timezone)} ${Driver.obs_timezone_abbr}`, this.xleftlabels, this.transformYLocation(69));
                }
            } else if ((driver.night.Moonset >= driver.night.Sunset) && (driver.night.Moonset <= driver.night.Sunrise)) {
                ctx.fillText("Moon sets:", this.xleftlabels, this.transformYLocation(71));
                if (driver.obs_timezone === 0) {
                    ctx.fillText(`${helper.MJDToHM(driver.night.Moonset)} UTC`, this.xleftlabels, this.transformYLocation(69));
                } else {
                    ctx.fillText(`${helper.MJDToHMLocal(driver.night.Moonset, Driver.obs_timezone)} ${Driver.obs_timezone_abbr}`, this.xleftlabels, this.transformYLocation(69));
                }
            }
        }

        this.drawCurrentTime(ctx, new Date());
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawCurrentTime = function (ctx, now) {
    try {
        if (now < driver.night.DateSunset || now > driver.night.DateSunrise) {
            return false;
        }
        // Current time marker
        const xnow = this.transformXLocation(driver.night.Sunset + (now - driver.night.DateSunset) / 8.64e7);
        const klen = 5;
        ctx.beginPath();
        ctx.moveTo(xnow, this.ystart);
        ctx.lineTo(xnow - 0.6 * klen, this.ystart - klen);
        ctx.lineTo(xnow + 0.6 * klen, this.ystart - klen);
        ctx.closePath();
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.strokeStyle = "red";
        this.plotVerticalLine(ctx, this.ystart, this.yend, xnow, [], 1);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawBackground = function (ctx, rectangleLast = false) {
    try {
        ctx.save();
        if (!rectangleLast) {
            // Draw main rectangle that contains the visibility plot
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1.2;
            ctx.rect(this.xstart, this.ystart, this.width, this.height);
            ctx.stroke();
        } else {
            ctx.strokeStyle = "black";
        }

        // Everything we draw for a while (e.g., tick marks, etc) should be clipped to the plot limits
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();

        // Draw dotted horizontal lines and tick marks every 10 degrees
        for (let i = 10; i < 90; i += 10) {
            const y = this.transformYLocation(i);
            /* Dotted horizontal lines; the INT has its limit at 20 deg, so do not
            * draw the usual horizontal lines there. */
            if (i !== 20 || Driver.telescopeName !== "INT") {
                this.plotHorizontalLine(ctx, this.xstart, this.xend, y, [1, 2], 1);
            }
            // Tick marks
            this.plotHorizontalLine(ctx, this.xstart, this.xstart + this.tickLength, y, [], 1.2);
        }
        // Draw tick marks on the right-hand side (airmass ticks)
        for (let i = 10; i <= 85; i += 5) {
            this.plotHorizontalLine(ctx, this.xend - this.tickLength, this.xend, this.transformYLocation(i), [], 1.2);
        }

        // Now draw outside the plot; first, altitude tick labels
        ctx.restore();
        ctx.fillStyle = "black";
        for (let i = 0; i < 90; i += 10) {
            ctx.font = `${this.pt(11)} ${this.fontFamily}`;
            ctx.textAlign = "right";
            ctx.textBaseline = (i > 0 || Driver.obs_timezone === 0) ? "middle" : "bottom";
            ctx.fillText(`${i}°`, this.xstart - this.tickLength, this.transformYLocation(i));
        }
        /*
        The 90° tick label should be drawn separately, a little lower than usual,
        so as to leave enough space for the sunset time label
        */
        ctx.fillText("90°", this.xstart - this.tickLength, this.transformYLocation(89));
        // Tick labels on the right-hand side (corresponding to the airmass ticks)
        for (let i = 10; i <= 85; i += 5) {
            this.plotRotatedText(ctx, helper.AltitudeToAirmass(i).toFixed(2), this.pt(8), this.xend + 1.3 * this.tickLength, this.transformYLocation(i), "center", "middle");
        }
        // Airmass and altitude text
        this.plotRotatedText(ctx, "Airmass", this.pt(8), this.xend + 1.3 * this.tickLength, this.yend - 3, "left", "middle");
        this.plotRotatedText(ctx, "Altitude", this.pt(11), this.xleftarrows + 10, 0.5 * (this.ystart + this.yend), "center", "middle");

        // Warning, if applicable
        if (Driver.obs_lowestLimit === null && Driver.obs_highestLimit === null && Driver.obs_lowerHatch === null && Driver.obs_declinationLimit === null) {
            ctx.fillStyle = "red";
            this.plotRotatedText(ctx, "No telescope-specific altitude or collision limits are defined.", this.pt(10), this.xleftlabels + 10, this.transformYLocation(0), "left", "middle");
            this.plotRotatedText(ctx, "Schedule may include unsafe pointings. Use with caution!", this.pt(10), this.xleftlabels + 32, this.transformYLocation(0), "left", "middle");
            ctx.fillStyle = "black";
        }

        // Lower hatch and opening limits text
        ctx.font = `${this.pt(8)} ${this.fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "black";
        // Closed lower hatch, 0% vignetting
        if (Driver.obs_lowerHatch !== null) {
            ctx.fillText("Closed lower hatch", this.xleftlabels, this.transformYLocation(Driver.obs_lowerHatch + 2));
            ctx.fillText("0% vignetting", this.xleftlabels, this.transformYLocation(Driver.obs_lowerHatch));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(Driver.obs_lowerHatch));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(Driver.obs_lowerHatch), [1, 2, 3, 2], 1);
        }
        // Closed lower hatch, 50% vignetting (only for NOT)
        if (Driver.telescopeName === "NOT") {
            ctx.fillText("Closed lower hatch", this.xleftlabels, this.transformYLocation(22));
            ctx.fillText("50% vignetting", this.xleftlabels, this.transformYLocation(20));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(20));
        }
        // Lowest observing altitude
        if (Driver.obs_lowestLimit !== null) {
            ctx.fillText(`${Driver.telescopeName} lowest limit`, this.xleftlabels, this.transformYLocation(Driver.obs_lowestLimit + 2));
            ctx.fillText(`(${Driver.obs_lowestLimit.toFixed(Driver.telescopeName === "HET" ? 1 : 0)}°)`, this.xleftlabels, this.transformYLocation(Driver.obs_lowestLimit));
            ctx.fillText("–›", this.xleftarrows + (Driver.telescopeName === "HET" ? 23 : 0), this.transformYLocation(Driver.obs_lowestLimit));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(Driver.obs_lowestLimit), [1, 2, 3, 2], 1);
        }
        // Highest observing altitude
        if (Driver.obs_highestLimit !== null) {
            ctx.fillText(`${Driver.telescopeName} highest limit`, this.xleftlabels, this.transformYLocation(Driver.obs_highestLimit + 2));
            ctx.fillText(`(${Driver.obs_highestLimit.toFixed(Driver.telescopeName === "HET" || Driver.telescopeName === "WHT" ? 1 : 0)}°)`, this.xleftlabels, this.transformYLocation(Driver.obs_highestLimit));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(Driver.obs_highestLimit));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(Driver.obs_highestLimit), [1, 2, 3, 2], 1);
        }
        // Constant altitude for HET
        if (Driver.telescopeName === "HET") {
            const HETalt = 55;
            ctx.fillText(`${Driver.telescopeName} altitude`, this.xleftlabels, this.transformYLocation(HETalt + 2));
            ctx.fillText(`(${HETalt.toFixed(0)}°)`, this.xleftlabels, this.transformYLocation(HETalt));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(HETalt));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(HETalt), [5, 0, 0], 1);
        }

        // Title of the plot
        ctx.font = `${this.pt(13)} ${this.fontFamily}`;
        ctx.textAlign = "center";
        ctx.fillText(Driver.plotTitle, this.xmid, 27);

        // Copyright notice
        ctx.font = `${this.pt(7)} ${this.fontFamily}`;
        ctx.textAlign = "left";
        ctx.fillText(config.graphCopyright, this.xleftlabels, this.canvasHeight - 18);

        if (rectangleLast) {
            // Draw main rectangle that contains the visibility plot
            ctx.beginPath();
            ctx.setLineDash([]);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1.2;
            ctx.rect(this.xstart, this.ystart, this.width, this.height);
            ctx.stroke();
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};
