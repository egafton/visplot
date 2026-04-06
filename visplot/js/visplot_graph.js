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
        this.xleftlabels = 15;
        this.xstart = 157;
        this.ystart = 92;
        this.xleftarrows = this.xstart - 50;
        this.tickLength = 7;
        this.fontFamily = config.graphFont;
        this.maxLenTgtName = 14;
        this.CircleSize = 8;
        this.CircleSizeSq = this.CircleSize**2;
        this.doubleTargets = true;
        this.ratio = 1.42;
        this.minwidth = 1200;
        this.minheight = this.minwidth / this.ratio;
        this.badWolfColor = "red";
        this.markDSTColor = "red";
        this.currentTimeColor = "red";
        this.lastStartColor = "red";
        this.noLimitsColor = "red";
    } catch (ex) {
        helper.LogException(ex);
    }
}

Graph.prototype.Resize = function (_canvas, _context) {
    try {
        this.canvasWidth = _canvas.width / window.ratio;
        this.canvasHeight = _canvas.height / window.ratio;
        _context.font = `${this.pt(11)} ${this.fontFamily}`;
        const w1 = _context.measureText("30°").width;
        _context.font = `${this.pt(9)} ${this.fontFamily}`;
        const w2 = _context.measureText("Closed lower hatch").width;
        const w3 = _context.measureText("–›").width;
        this.xstart = this.xleftlabels + w1 + w2 + 10 + w3 + this.tickLength + 5;
        this.xleftarrows = this.xleftlabels + w2 + 10;
        this.xend = this.canvasWidth - this.scale(200);
        this.width = this.xend - this.xstart;
        this.ystart = this.scale(70);
        this.yend = this.canvasHeight - this.scale(50);
        this.height = this.yend - this.ystart;
        this.degree = this.height / 90;
        this.xmid = this.canvasWidth / 2;
        this.CircleSize = this.scale(8);
        this.CircleSizeSq = this.CircleSize**2;
    } catch (ex) {
        helper.LogException(ex);
    }
};

Graph.prototype.pt = function (_pt) {
    try {
        // return `${(1+Math.max(12, _pt * (1 + ((this.canvasWidth - 975) / 975) * 0.7))).toFixed(1)}pt`;
        return `${this.scale(_pt).toFixed(1)}pt`;
    } catch (ex) {
        helper.LogException(ex);
    }
};

Graph.prototype.scale = function (_dist) {
    try {
        return _dist * (this.canvasHeight/700);
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
        ctx.lineWidth = this.scale(lw);
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
        ctx.lineWidth = this.scale(lw);
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
        const fontSize = this.pt(8);
        ctx.setLineDash([]);
        let lastyend = null;
        for (let i = 0; i < Targets.length; i += 1) {
            const obj = Targets[i];
            const beingMoved = driver.rescheduling && driver.reObj === obj;
            obj.rxmid = this.targetsx;
            obj.rymid = y - 6.5;
            obj.ystart = obj.rymid - this.scale(8);
            if (lastyend !== null && obj.ystart < lastyend) {
                obj.ystart = lastyend;
            }
            if (obj.Scheduled) {
                if (this.doubleTargets) {
                    this.plotText(ctx, obj.Name.substr(0, this.maxLenTgtName), fontSize, beingMoved ? "blue" : "black", obj.rxmid + this.scale(15), obj.rymid - 1, "left", "middle");
                } else {
                    this.plotText(ctx, `${obj.Name.substr(0, this.maxLenTgtName)} (${obj.ProjectNumber}; ${helper.MJDToHM(obj.ScheduledStartTime, "UTC", true)})`, fontSize, beingMoved ? "blue" : "black", obj.rxmid + this.scale(15), obj.rymid - 1, "left", "middle");
                }
                ctx.strokeStyle = obj.LabelStrokeColor;
                ctx.fillStyle = obj.LabelFillColor;
                ctx.beginPath();
                ctx.arc(obj.rxmid, obj.rymid, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                this.plotText(ctx, obj.Label, fontSize, obj.LabelTextColor, obj.rxmid, obj.rymid, "center", "middle");
            } else {
                this.plotText(ctx, obj.Name, fontSize, beingMoved ? "blue" : "black", obj.rxmid + this.scale(15), obj.rymid - 1, "left", "middle");
                ctx.strokeStyle = "black";
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(obj.rxmid, obj.rymid, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                ctx.stroke();
                this.plotText(ctx, obj.Label, fontSize, "black", obj.rxmid, obj.rymid, "center", "middle");
            }
            if (this.doubleTargets) {
                if (obj.Scheduled) {
                    this.plotText(ctx, `(${obj.ProjectNumber}; ${helper.MJDToHM(obj.ScheduledStartTime, "UTC", false)}–${helper.MJDToHM(obj.ScheduledEndTime, "UTC", true)})`, this.pt(8), beingMoved ? "blue" : "black", obj.rxmid + this.scale(15), obj.rymid + this.targetsyskip - 1, "left", "middle");
                } else {
                    this.plotText(ctx, `(${obj.ProjectNumber})`, this.pt(8), beingMoved ? "blue" : "black", obj.rxmid + this.scale(15), obj.rymid + this.targetsyskip - 1, "left", "middle");
                }
                y += this.targetsyskip;
                obj.yend = obj.rymid + this.targetsyskip + this.scale(8);
            } else {
                obj.yend = obj.rymid + this.scale(8);
            }
            lastyend = obj.yend;
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
        const targets = driver.targets;
        ctx.setLineDash([]);
        ctx.save();
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        ctx.lineWidth = this.scale(5);
        ctx.strokeStyle = "black";
        for (let i = 0; i < targets.nTargets; i += 1) {
            if (targets.Targets[i].Scheduled === false) {
                continue;
            }
            const obj = targets.Targets[i];
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
        ctx.lineWidth = this.scale(1.2);
        for (let i = 0; i < targets.nTargets; i += 1) {
            const obj = targets.Targets[i];
            if (obj.Scheduled) {
                ctx.strokeStyle = obj.LabelStrokeColor;
                ctx.fillStyle = obj.LabelFillColor;
                ctx.beginPath();
                ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                this.plotText(ctx, obj.Label, this.pt(8), obj.LabelTextColor, obj.xlab, obj.ylab, "center", "middle");
            } else {
                ctx.strokeStyle = "black";
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, sla.d2pi, false);
                ctx.fill();
                ctx.stroke();
                this.plotText(ctx, obj.Label, this.pt(8), "black", obj.xlab, obj.ylab, "center", "middle");
            }
        }
        ctx.restore();

        ctx.lineWidth = this.scale(4);
        for (let i = 0; i < targets.nTargets; i += 1) {
            if (targets.Targets[i].Scheduled === false) {
                continue;
            }
            const obj = targets.Targets[i];
            const iScheduledStartTime = helper.MJDToIndex(obj.ScheduledStartTime);
            const iScheduledEndTime = helper.MJDToIndex(obj.ScheduledEndTime);
            ctx.strokeStyle = obj.LabelStrokeColor;
            ctx.beginPath();
            ctx.moveTo(this.xaxis[iScheduledStartTime], this.yend + 2.6);
            ctx.lineTo(this.xaxis[iScheduledEndTime], this.yend + 2.6);
            ctx.stroke();
        }
        for (let i = 0; i < targets.BadWolfStart.length; i += 1) {
            ctx.strokeStyle = this.badWolfColor;
            ctx.beginPath();
            ctx.moveTo(this.transformXLocation(targets.BadWolfStart[i]), this.yend + 2.6);
            ctx.lineTo(this.transformXLocation(targets.BadWolfEnd[i]), this.yend + 2.6);
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
        this.targetsyskip = this.scale(15);
        this.doubleTargets = ntargets <= Math.floor(0.5 * this.height / this.targetsyskip);
        this.targetsy = this.ystart;
        this.targetsx = this.xend + this.scale(30);

        if (!this.doubleTargets) {
            this.targetsyskip = (this.yend - this.targetsy) / ntargets;
        }
        const individualheight = this.targetsyskip * (this.doubleTargets ? 2 : 1);
        if (individualheight < this.CircleSize * 2) {
            const circlesize = Math.ceil(individualheight / (this.doubleTargets ? 2 : 1) / 2);
            this.CircleSize = circlesize;
            this.CircleSizeSq = circlesize**2;
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
        ctx.lineWidth = this.scale(2);
        ctx.moveTo(this.xaxis[0], this.transformYLocation(target.Graph[0]));
        for (let j = 1; j < target.Graph.length; j += 1) {
            ctx.lineTo(this.xaxis[j], this.transformYLocation(target.Graph[j]));
        }
        ctx.stroke();
        if ($("#opt_show_lastobstime").is(":checked")) {
            if (target.ObservableTonight !== false) {
                ctx.beginPath();
                ctx.arc(this.transformXLocation(target.LastPossibleTime), this.transformYLocation(target.Graph[target.iLastPossibleTime]), 5, 0, sla.d2pi, false);
                ctx.fillStyle = this.lastStartColor;
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
            const x = this.xaxis[j];
            const y = this.yend - this.degree * target.Graph[j];
            if (typeof target.MoonDistance !== "undefined") { // for older versions
                this.plotText(ctx, `☽︎ ${Math.round(target.MoonDistance[j])}°`, this.pt(9), target.LabelStrokeColor, x, y + this.scale(15), "center", "top");
            }
            if (typeof target.PAngles !== "undefined") { // for older versions
                this.plotText(ctx, `∡ ${Math.round(target.PAngles[j])}°`, this.pt(9), target.LabelStrokeColor, x, y + this.scale(30), "center", "top");
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
            ctx.lineWidth = this.scale(lws[obs]);
            ctx.beginPath();
            ctx.moveTo(this.xaxis[0], this.transformYLocation(obj.Graph[0]));
            for (let j = 1; j < obj.Graph.length; j += 1) {
                if (obs !== obj.observable[j]) {
                    ctx.lineTo(this.xaxis[j], this.transformYLocation(obj.Graph[j]));
                    ctx.stroke();
                    obs = obj.observable[j];
                    ctx.strokeStyle = strokes[obs];
                    ctx.setLineDash(dashes[obs]);
                    ctx.lineWidth = this.scale(lws[obs]);
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
                    ctx.fillStyle = this.lastStartColor;
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
            const dyleg = this.scale(14);
            let x = xleg;
            let y = yleg;

            for (let ii = 1; ii <= 3; ii += 1) {
                ctx.strokeStyle = strokes[ii];
                ctx.setLineDash(dashes[ii]);
                ctx.lineWidth = this.scale(lws[ii]);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + this.scale(22), y);
                ctx.stroke();
                this.plotText(ctx, legtext[ii], this.pt(8), "black", x + this.scale(25), y, "left", "middle");

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
        ctx.lineWidth = this.scale(1);
        ctx.rect(this.xstart, this.ystart, this.width, this.height);
        ctx.clip();
        for (const obj of Targets) {
            ctx.strokeStyle = "black";
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(obj.xlab, obj.ylab, this.CircleSize, 0, sla.d2pi, false);
            ctx.fill();
            ctx.stroke();
            this.plotText(ctx, obj.Label, this.pt(8), "black", obj.xlab, obj.ylab, "center", "middle");
        }
        ctx.restore();
        let y = this.targetsy;
        for (const obj of Targets) {
            obj.rxmid = this.targetsx;
            obj.rymid = y - 6.5;
            this.plotText(ctx, obj.Name, this.pt(8), "black", obj.rxmid + this.scale(15), obj.rymid - 1, "left", "middle");
            ctx.strokeStyle = "black";
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(obj.rxmid, obj.rymid, this.CircleSize, 0, sla.d2pi, false);
            ctx.fill();
            ctx.stroke();
            this.plotText(ctx, obj.Label, this.pt(8), "black", obj.rxmid, obj.rymid, "center", "middle");
            if (this.doubleTargets) {
                this.plotText(ctx, `(${obj.ProjectNumber})`, this.pt(8), "black", obj.rxmid + this.scale(15), obj.rymid + this.targetsyskip - 1, "left", "middle");
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
        const night = driver.night;
        this.xaxis = [];
        for (let i = 0; i < night.Nx; i += 1) {
            this.xaxis.push(this.xstart + this.width * (night.xaxis[i] - night.Sunset) / night.wnight);
        }
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        // Plot the full hour UTC and ST labels (8 UTC, 9 UTC, etc) below and above the plot, respectively
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const integerOffset = parseFloat(Driver.obsTimezoneE) === parseInt(Driver.obsTimezoneE);
        for (let i = 0; i < night.UTCtimes.length; i += 1) {
            const xnight = night.UTCtimes[i];
            const xplot = this.transformXLocation(xnight);
            if (integerOffset) {
                if ((Driver.isUTC && night.UTClabels[i] === "24") || (!Driver.isUTC && night.LocalTimelabels[i] === "24")) {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [], 1.6);
                } else {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [1, 2], 1);
                }
            } else {
                ctx.strokeStyle = "#aaaaaa";
                this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [1, 3], 1);
                ctx.strokeStyle = "black";
            }
            if (Driver.isUTC) {
                ctx.font = `${this.pt(11)} ${this.fontFamily}`;
                ctx.fillText(night.UTClabels[i], xplot, this.canvasHeight - this.scale(36));
            } else {
                ctx.font = `${this.pt(8)} ${this.fontFamily}`;
                ctx.fillText(night.UTClabels[i], xplot, this.canvasHeight - this.scale(40));
            }
        }
        let lastLabel = null;
        let jumped = false;
        for (let i = 0; i < night.LocalTimetimes.length; i += 1) {
            const xnight = night.LocalTimetimes[i];
            const xplot = this.transformXLocation(xnight);
            if (!integerOffset) {
                if (night.LocalTimelabels[i] === "24") {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [], 1.6);
                } else {
                    this.plotVerticalLine(ctx, this.ystart, this.yend, xplot, [1, 2], 1);
                }
            }
            const label = parseInt(night.LocalTimelabels[i]);
            if (!Driver.isUTC) {
                ctx.font = `${this.pt(11)} ${this.fontFamily}`;
                const ok = lastLabel === null || (lastLabel === 24 && label === 1) || label === lastLabel + 1;
                lastLabel = label;
                if (!ok) {
                    jumped = true;
                }
                if (jumped) {
                    ctx.fillStyle = this.markDSTColor;
                }
                ctx.fillText(night.LocalTimelabels[i], xplot, this.canvasHeight - this.scale(27));
                if (jumped) {
                    ctx.fillStyle = "black";
                }
            }
            ctx.font = `${this.pt(8)} ${this.fontFamily}`;
            ctx.fillText(night.LSTlabels[i], xplot, this.scale(40));
        }
        // Print the LST, S.set and S.rise labels
        ctx.font = `${this.pt(8)} ${this.fontFamily}`;
        ctx.textAlign = "right";
        ctx.fillText("LST   –›", this.xstart - 28, this.scale(40));
        if (!Driver.isUTC) {
            ctx.fillText(`${Driver.obsTimezoneAbbrE}   –›`, this.xstart - 28, this.scale(62));
            if (Driver.hasDST) {
                ctx.fillStyle = this.markDSTColor;
                ctx.fillText(`${Driver.obsTimezoneAbbrM}   –›`, this.transformXLocation(night.MAstTwilight) - 28, this.scale(62));
                ctx.fillStyle = "black";
            }
            ctx.textAlign = "left";
            ctx.fillText("UTC   –›", this.xstart - 60, this.canvasHeight - this.scale(41));
        }
        ctx.textAlign = "center";
        ctx.fillText("S.set", this.xstart, this.scale(51));
        ctx.fillText("S.rise", this.xend, this.scale(51));
        // Plot the sunset and sunrise times
        ctx.fillText(helper.MJDToHM(night.Sunset, "local"), this.xstart, this.scale(62));
        if (Driver.hasDST) {
            ctx.fillStyle = this.markDSTColor;
        }
        ctx.fillText(helper.MJDToHM(night.Sunrise, "local"), this.xend, this.scale(62));
        if (Driver.hasDST) {
            ctx.fillStyle = "black";
        }
        // Plot the twilights labels and corresponding dashed vertical lines
        const twiStyle = [6, 5];
        let xtemp, textxtemp;
        xtemp = this.transformXLocation(night.ENauTwilight);
        textxtemp = this.transformXLocation(0.5*(night.Sunset + night.EAstTwilight)); // make a bit of room
        ctx.fillText("Nau", textxtemp, this.scale(51));
        ctx.fillText(helper.MJDToHM(night.ENauTwilight, "local"), textxtemp, this.scale(62));
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        xtemp = this.transformXLocation(night.MNauTwilight);
        textxtemp = this.transformXLocation(0.5*(night.MAstTwilight + night.Sunrise)); // make a bit of room
        ctx.fillText("Nau", textxtemp, this.scale(51));
        if (Driver.hasDST) {
            ctx.fillStyle = this.markDSTColor;
        }
        ctx.fillText(helper.MJDToHM(night.MNauTwilight, "local"), textxtemp, this.scale(62));
        if (Driver.hasDST) {
            ctx.fillStyle = "black";
        }
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        xtemp = this.transformXLocation(night.EAstTwilight);
        ctx.fillText("Ast", xtemp, this.scale(51));
        ctx.fillText(helper.MJDToHM(night.EAstTwilight, "local"), xtemp + 4, this.scale(62));
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        xtemp = this.transformXLocation(night.MAstTwilight);
        ctx.fillText("Ast", xtemp, this.scale(51));
        if (Driver.hasDST) {
            ctx.fillStyle = this.markDSTColor;
        }
        ctx.fillText(helper.MJDToHM(night.MAstTwilight, "local"), xtemp - 1, this.scale(62));
        if (Driver.hasDST) {
            ctx.fillStyle = "black";
        }
        this.plotVerticalLine(ctx, this.ystart, this.yend, xtemp, twiStyle, 1.2);
        ctx.textAlign = "center";

        // Plot the gray-shaded rectangles corresponding to the twilights (vertical) and to airmass=2 (horizontal)
        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "gray";
        const wENT = this.transformXWidth(night.ENauTwilight - night.Sunset);
        const wMNT = this.transformXWidth(night.Sunrise - night.MNauTwilight);
        ctx.rect(this.xstart, this.ystart, this.transformXWidth(night.EAstTwilight - night.Sunset), this.height);
        ctx.rect(this.xend, this.ystart, -this.transformXWidth(night.Sunrise - night.MAstTwilight), this.height);
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
        ctx.lineWidth = this.scale(1.2);
        ctx.moveTo(this.xaxis[0], this.transformYLocation(night.ymoon[0]));
        for (let i = 1; i < night.ymoon.length; i += 1) {
            ctx.lineTo(this.xaxis[i], this.transformYLocation(night.ymoon[i]));
        }
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "black";
        // Plot the x-axis label
        ctx.font = `${this.pt(11)} ${this.fontFamily}`;
        if (Driver.isUTC) {
            ctx.fillText(`Coordinated Universal Time (UTC), starting night ${night.year}-` + `${helper.padTwoDigits(night.month)}-${helper.padTwoDigits(night.day)}`, this.xmid, this.canvasHeight - this.scale(14));
        } else if (Driver.hasDST) {
            ctx.fillText(`Local Time (${Driver.obsTimezoneDescriptionE} / ${Driver.obsTimezoneDescriptionM}), starting night ${night.year}-` + `${helper.padTwoDigits(night.month)}-${helper.padTwoDigits(night.day)}`, this.xmid, this.canvasHeight - this.scale(11));
        } else {
            ctx.fillText(`Local Time (${Driver.obsTimezoneDescriptionE}), starting night ${night.year}-` + `${helper.padTwoDigits(night.month)}-${helper.padTwoDigits(night.day)}`, this.xmid, this.canvasHeight - this.scale(11));
        }

        // Moon illumination text
        ctx.font = `${this.pt(8.5)} ${this.fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if ((night.MoonIllStart === 0 && night.MoonIllEnd === 0) ||
            night.Moonset < night.Sunset ||
            night.Moonrise > night.Sunrise) {
            ctx.fillText("Moonless night.", this.xleftlabels, this.transformYLocation(77));
        } else {
            ctx.fillText("Moon illumination:", this.xleftlabels, this.transformYLocation(77));
            ctx.fillText(night.MoonIlluminationString, this.xleftlabels, this.transformYLocation(75));
            if ((night.Moonrise >= night.Sunset) && (night.Moonrise <= night.Sunrise)) {
                ctx.fillText("Moon rises:", this.xleftlabels, this.transformYLocation(71));
                ctx.fillText(helper.MJDToHM(night.Moonrise, "local", true), this.xleftlabels, this.transformYLocation(69));
            } else if ((night.Moonset >= night.Sunset) && (night.Moonset <= night.Sunrise)) {
                ctx.fillText("Moon sets:", this.xleftlabels, this.transformYLocation(71));
                ctx.fillText(helper.MJDToHM(night.Moonset, "local", true), this.xleftlabels, this.transformYLocation(69));
            }
        }

        this.drawCurrentTime(ctx);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Graph
 */
Graph.prototype.drawCurrentTime = function (ctx) {
    try {
        const now = new Date();
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
        ctx.fillStyle = this.currentTimeColor;
        ctx.fill();
        ctx.strokeStyle = this.currentTimeColor;
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
            ctx.lineWidth = 2;
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
            ctx.textBaseline = (i > 0 || Driver.isUTC) ? "middle" : "bottom";
            ctx.fillText(`${i}°`, this.xstart - this.tickLength, this.transformYLocation(i));
        }
        /*
        The 90° tick label should be drawn separately, a little lower than usual,
        so as to leave enough space for the sunset time label
        */
        ctx.fillText("90°", this.xstart - this.tickLength, this.transformYLocation(89));
        // Tick labels on the right-hand side (corresponding to the airmass ticks)
        for (let i = 10; i <= 85; i += 5) {
            this.plotRotatedText(ctx, helper.AltitudeToAirmass(i).toFixed(2), this.pt(8), this.xend + this.scale(1.3) * this.tickLength, this.transformYLocation(i), "center", "middle");
        }
        // Airmass and altitude text
        this.plotRotatedText(ctx, "Airmass", this.pt(9), this.xend + this.scale(1.3) * this.tickLength, this.yend - 3, "left", "middle");
        this.plotRotatedText(ctx, "Altitude", this.pt(11), this.xstart - this.scale(40), 0.5 * (this.ystart + this.yend), "center", "middle");

        // Warning, if applicable
        if (Driver.obsLowestLimit === null && Driver.obsHighestLimit === null && Driver.obsLowerHatch === null && Driver.obsDeclinationLimit === null) {
            ctx.fillStyle = this.noLimitsColor;
            this.plotRotatedText(ctx, "No telescope-specific altitude or collision limits are defined.", this.pt(9), this.xleftlabels + 10, this.transformYLocation(0), "left", "middle");
            this.plotRotatedText(ctx, "Schedule may include unsafe pointings. Use with caution!", this.pt(9), this.xleftlabels + 10 + this.scale(16), this.transformYLocation(0), "left", "middle");
            ctx.fillStyle = "black";
        }

        // Lower hatch and opening limits text
        ctx.font = `${this.pt(8.5)} ${this.fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "black";
        // Closed lower hatch, 0% vignetting
        if (Driver.obsLowerHatch !== null) {
            ctx.fillText("Closed lower hatch", this.xleftlabels, this.transformYLocation(Driver.obsLowerHatch));
            ctx.fillText("0% vignetting", this.xleftlabels, this.transformYLocation(Driver.obsLowerHatch - 2));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(Driver.obsLowerHatch));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(Driver.obsLowerHatch), [1, 2, 3, 2], 1);
        }
        // Closed lower hatch, 50% vignetting (only for NOT)
        if (Driver.telescopeName === "NOT") {
            const NOT50v = 20;
            ctx.fillText("Closed lower hatch", this.xleftlabels, this.transformYLocation(NOT50v));
            ctx.fillText("50% vignetting", this.xleftlabels, this.transformYLocation(NOT50v - 2));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(NOT50v));
        }
        // Lowest observing altitude
        if (Driver.obsLowestLimit !== null) {
            ctx.fillText(`${Driver.telescopeName} lowest limit`, this.xleftlabels, this.transformYLocation(Driver.obsLowestLimit));
            ctx.fillText(`(${Driver.obsLowestLimit.toFixed(Driver.telescopeName === "HET" ? 1 : 0)}°)`, this.xleftlabels, this.transformYLocation(Driver.obsLowestLimit - 2));
            ctx.fillText("–›", this.xleftarrows + (Driver.telescopeName === "HET" ? 23 : 0), this.transformYLocation(Driver.obsLowestLimit));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(Driver.obsLowestLimit), [1, 2, 3, 2], 1);
        }
        // Highest observing altitude
        if (Driver.obsHighestLimit !== null) {
            ctx.fillText(`${Driver.telescopeName} highest limit`, this.xleftlabels, this.transformYLocation(Driver.obsHighestLimit));
            ctx.fillText(`(${Driver.obsHighestLimit.toFixed(Driver.telescopeName === "HET" || Driver.telescopeName === "WHT" ? 1 : 0)}°)`, this.xleftlabels, this.transformYLocation(Driver.obsHighestLimit -2));
            ctx.fillText("–›", this.xleftarrows, this.transformYLocation(Driver.obsHighestLimit));
            this.plotHorizontalLine(ctx, this.xstart, this.xend, this.transformYLocation(Driver.obsHighestLimit), [1, 2, 3, 2], 1);
        }
        // Constant altitude for HET
        if (Driver.telescopeName === "HET") {
            const HETalt = 55;
            ctx.fillText(`${Driver.telescopeName} altitude`, this.xleftlabels, this.transformYLocation(HETalt));
            ctx.fillText(`(${HETalt.toFixed(0)}°)`, this.xleftlabels, this.transformYLocation(HETalt - 2));
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
            ctx.lineWidth = 2;
            ctx.rect(this.xstart, this.ystart, this.width, this.height);
            ctx.stroke();
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};
