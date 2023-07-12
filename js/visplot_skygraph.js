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
function SkyGraph(_canvas, _context) {
    this.canvas = _canvas;
    this.ctx = _context;
    this.canvasWidth = _canvas.width;
    this.canvasHeight = _canvas.height;
    this.xmid = this.canvasWidth / 2;
    this.fontFamily = "Ubuntu, sans-serif";
    this.south = 2.3;
    this.pang = [this.south, this.south + 6, this.south + 12, this.south + 18];
    this.plab = ["S", "W", "N", "E"];
    this.xl = [-7, -5, -2, 1];
    this.yl = [-2, +4, +7, 0];
    this.distortPower = 1.05;
    this.labelYShift = [0, 0, 0, 0];
    this.lastazalt = null;
    this.lst = helper.LM_Sidereal_Time(helper.julianDate(new Date()));
    this.timer = null;
    this.imx = 640;
    this.imy = 480;
    this.cx = 0.51 * this.imx;
    this.cy = 0.52 * this.imy;
    this.cr = this.imx * 0.5;
    this.arcRadius = [0.85 * this.cr, 0.85 * this.cr, 0.85 * this.cr, 0.85 * this.cr];
    this.tcsx = null;
    this.tcsy = null;
    this.percentClearSky = -1;
    this.skyImg = new Image();
    this.reload();
}

/**
 * 
 */
SkyGraph.prototype.updateTelescope = function () {
    if ($.inArray(Driver.telescopeName, ["NOT", "WHT", "INT"]) >= 0) {
        this.south = 2.3;
        this.xl = [-7, -5, -2, 1];
        this.yl = [-2, +4, +7, 0];
        this.labelYShift = [0, 0, 0, 0];
        this.cx = 0.51 * this.imx;
        this.cy = 0.52 * this.imy;
        this.cr = this.imx * 0.5;
        this.arcRadius = [0.85 * this.cr, 0.85 * this.cr, 0.85 * this.cr, 0.85 * this.cr];
        this.distortPower = 1.05;
    } else if ($.inArray(Driver.telescopeName, ["HJST", "OST"]) >= 0) {
        this.south = -0.5;
        this.xl = [3, -10, -7, 2];
        this.yl = [4, +4, +16, 3];
        this.labelYShift = [-45, 0, 5, 0];
        this.cx = 0.53 * this.imx;
        this.cy = 0.53 * this.imy;
        this.cr = this.imx * 0.45;
        this.arcRadius = [0.70 * this.cr, 0.85 * this.cr, 0.80 * this.cr, 0.85 * this.cr];
        this.distortPower = 0.5;
    } else if ($.inArray(Driver.telescopeName, ["CAHA"]) >= 0) {    //CAHA   NOTE: The skycam is active only after sunset (NAU), before it gets active the image scaling appears wrongly. 
        this.south = 0.05;					    //CAHA
        this.xl = [-7, -5, -2, 1];
        this.yl = [-2, +4, +7, 0];				    //CAHA
        this.labelYShift = [-5, 0, 5, 0];			    //CAHA
        this.cx = 0.29 * this.imx;				   //CAHA
        this.cy = 0.44 * this.imy;				   //CAHA
        this.cr = this.imx * 0.29;                                   //CAHA
        this.arcRadius = [0.80 * this.cr, 0.8 * this.cr, 0.80 * this.cr, 0.8 * this.cr];  //CAHA
        this.distortPower = 0.9;					//CAHA
    }
    this.pang = [this.south, this.south + 6, this.south + 12, this.south + 18];
    this.reload();
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.startTimer = function () {
    this.timer = setInterval(function () {
        driver.skyGraph.reload();
    }, 10000);  // 10 second reload
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.stopTimer = function () {
    if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.processImage = function () {
    const imgdata = this.ctx.getImageData(0, 0, this.imx, this.imy).data;
    const cx = 0.53 * this.imx;
    const cy = 0.52 * this.imy;
    const rad = 270;
    const radsq = rad * rad;
    let black = 0;
    let count = 0;
    for (let i = 0; i < this.imy; i++) {
        const row = this.imx * i;
        for (let j = 0; j < this.imx; j++) {
            if ((i - cy) * (i - cy) + (j - cx) * (j - cx) < radsq) {
                const r = imgdata[(row + j) * 4];
                const g = imgdata[(row + j) * 4 + 1];
                const b = imgdata[(row + j) * 4 + 2];
                const gray = (r + g + b) / 3;
                black += gray > 90 ? 0 : 1;
                count += 1;
            }
        }
    }
    this.percentClearSky = Math.round(black * 100 / count).toFixed(0);
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.setup = function (triggered) {
    this.ctx.clearRect(0, 0, this.imx, this.imy);
    this.ctx.drawImage(this.skyImg, 0, 0);
    // Optional processing
    if (triggered) {
        this.processImage();
    }
    this.drawaxes();
    this.drawtics();
    this.drawpointing();
    if (driver.nightInitialized) {
        this.drawstars();
    }
    this.display_coords(this.lastazalt);
    this.display_time();
    try {
        $.get({
            url: "pointing.php",
            data: {telescope: Driver.telescopeName},
            success: function (obj) {
                if (helper.notFloat(obj.alt) || helper.notFloat(obj.az)) {
                    driver.skyGraph.setPointing(null);
                } else {
                    driver.skyGraph.setPointing(driver.skyGraph.aatrans([obj.alt, obj.az]));
                }
            },
            error: function (msg) {
                helper.LogError(`Error 57: ${msg}`);
            }
        });
    }
    catch (e) {
        helper.LogError(`Error 58: ${e.message}`);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.setPointing = function (xy) {
    if (xy === null) {
        this.tcsx = null;
        this.tcsy = null;
    } else {
        this.tcsx = xy[0];
        this.tcsy = xy[1];
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.reload = function () {
    this.skyImg.src = `skycam.php?telescope=${Driver.telescopeName}&time=${new Date().getTime()}`;
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.distort = function (zd) {
    return Math.pow(zd, this.distortPower);
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.aatrans = function (altaz) { // convert from alt, az to ix, iy
    const ang = (this.south + 12 + altaz[1] / 15) * Math.PI / 12;   // rotate to display
    const dd = this.cr * this.distort((90 - altaz[0]) / 90);    // zenith distance in pixels
    const ix = this.cx + dd * Math.sin(ang);
    const iy = this.cy + dd * Math.cos(ang);
    return [ix, iy];
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.tcsxhair = function (x, y) {
    this.ctx.strokeStyle = "#9f3";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 6, y - 6);
    this.ctx.lineTo(x - 2, y - 2);
    this.ctx.moveTo(x + 6, y + 6);
    this.ctx.lineTo(x + 2, y + 2);
    this.ctx.moveTo(x - 6, y + 6);
    this.ctx.lineTo(x - 2, y + 2);
    this.ctx.moveTo(x + 6, y - 6);
    this.ctx.lineTo(x + 2, y - 2);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(x, y, 3.5, 0, 2 * Math.PI, false);
    this.ctx.stroke();
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.xhair = function (x, y, name, color) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 8, y);
    this.ctx.lineTo(x - 3, y);
    this.ctx.moveTo(x + 8, y);
    this.ctx.lineTo(x + 3, y);
    this.ctx.moveTo(x, y - 8);
    this.ctx.lineTo(x, y - 3);
    this.ctx.moveTo(x, y + 8);
    this.ctx.lineTo(x, y + 3);
    this.ctx.stroke();
    this.ctx.font = "8pt " + this.fontFamily;
    this.ctx.fillStyle = color;
    this.ctx.fillText(name, x + 5, y - 5);
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawaxes = function () {
    this.ctx.strokeStyle = "gray";
    for (let i = 90; i > 0; i -= 30) {
        const r = this.cr * this.distort(i / 90);
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, r, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    }
    this.ctx.beginPath();                    // 24 spokes
    for (let i = 0; i < 24; i += 1) {
        const az = (this.south + 12 + i) * Math.PI / 12;
        this.ctx.moveTo(this.cx, this.cy);
        this.ctx.lineTo(this.cx + this.cr * Math.sin(az), this.cy + this.cr * Math.cos(az));
    }
    this.ctx.stroke();
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawtics = function () {
    this.ctx.textBaseline = "alphabetic";
    this.ctx.textAlign = "start";
    this.ctx.font = `10pt ${this.fontFamily}`;
    for (let i = 0; i < 4; i += 1) {
        const ang = this.pang[i] * Math.PI / 12;
        let xx1 = this.cx + this.cr * Math.sin(ang);
        let yy1 = this.cy + this.cr * Math.cos(ang);
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, this.arcRadius[i], Math.PI / 2 - ang - 0.05, Math.PI / 2 - ang + 0.05, false);
        this.ctx.lineTo(xx1, yy1);
        this.ctx.closePath();
        this.ctx.fillStyle = "blue";
        this.ctx.fill();
        this.ctx.fillStyle = "white";
        xx1 = this.cx + 0.9 * this.cr * Math.sin(ang);
        yy1 = this.cy + 0.9 * this.cr * Math.cos(ang) + this.labelYShift[i];
        this.ctx.fillText(this.plab[i], xx1 + this.xl[i], yy1 + this.yl[i]);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawpointing = function () {
    if (this.tcsx === null || this.tcsy === null) {
        return;
    }
    this.tcsxhair(this.tcsx, this.tcsy);
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawstars = function () {
    if (driver.targets.nTargets === 0) {
        return;
    }
    let last = null;
    for (let i = 0; i < driver.targets.nTargets; i += 1) {
        const obj = driver.targets.Targets[i];
        let radeg = helper.dmstodeg(obj.RA);
        let decdeg = helper.dmstodeg(obj.Dec);
        let altaz = helper.altaz(radeg, decdeg, this.lst);
        if (altaz[0] > 0) {
            let xy = this.aatrans(altaz);
            if (this.tcsx !== null && this.tcsy !== null && Math.abs(this.tcsx - xy[0]) <= 2 && Math.abs(this.tcsy - xy[1]) <= 2) {
                last = [xy[0], xy[1], obj.Name, "#9f3"];
            } else {
                this.xhair(xy[0], xy[1], obj.Name, obj.LabelFillColor);
            }
        }
    }
    if (last !== null) {
        this.xhair(last[0], last[1], last[2], last[3]);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.display_coords = function (azalt) {
    this.ctx.clearRect(0, this.imy, this.canvasWidth / 2, this.canvasHeight - this.imy);
    if (azalt === null) {
        return;
    } else {
        this.ctx.fillStyle = "black";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.font = `10pt ${this.fontFamily}`;
        this.ctx.fillText("Az:", 0, this.imy + 6);
        this.ctx.fillText("Alt:", 51, this.imy + 6);
        this.ctx.fillText("RA", 100, this.imy + 6);
        this.ctx.fillText("Dec", 208, this.imy + 6);
        this.ctx.fillStyle = "blue";
        this.ctx.fillText(azalt[1], 20, this.imy + 6);
        this.ctx.fillText(azalt[0], 74, this.imy + 6);
        this.ctx.fillText(azalt[2], 121, this.imy + 6);
        this.ctx.fillText(azalt[3], 235, this.imy + 6);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.display_time = function () {
    const tim = new Date();
    this.lst = helper.LM_Sidereal_Time(helper.julianDate(tim));
    const ut = helper.utc(tim) * 24;
    const mm = helper.padTwoDigits(tim.getUTCMonth() + 1);
    const dd = helper.padTwoDigits(tim.getUTCDate());
    const UTtext = `UTC ${tim.getUTCFullYear()}-${mm}-${dd} ${helper.HMS(ut, "", "", "")}`;
    const STtext = `LST ${helper.HMS(this.lst, "", "", "")}`;
    this.ctx.clearRect(this.canvasWidth / 2, this.imy, this.canvasWidth / 2, this.canvasHeight - this.imy);
    this.ctx.font = `10pt ${this.fontFamily} Mono`;
    this.ctx.fillStyle = "gray";
    this.ctx.textBaseline = "top";
    this.ctx.textAlign = "left";
    this.ctx.fillText(UTtext, this.imx / 2 + 75, this.imy + 6);
    this.ctx.textAlign = "right";
    this.ctx.fillText(STtext, this.imx, this.imy + 6);
    if (this.percClearSky !== -1) {
        this.ctx.fillStyle = "black";
        this.ctx.font = `10pt ${this.fontFamily}`;
        this.ctx.textAlign = "right";
        this.ctx.fillText(`Percentage of clear, dark sky (experimental): ${this.percentClearSky}%`, this.imx, this.imy + 23);
    }
};
