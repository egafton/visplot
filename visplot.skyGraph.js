/**
 * Copyright (C) 2016-2018 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See COPYING.md.
 */

function SkyGraph(_canvas, _context) {
    this.canvas = _canvas;
    this.ctx = _context;
    this.canvasWidth = _canvas.width;
    this.canvasHeight = _canvas.height;
    this.xmid = this.canvasWidth / 2;
    this.fontFamily = 'Ubuntu';
    this.south = 2.3;
    this.pang = [this.south, this.south + 6, this.south + 12, this.south + 18];
    this.plab = ['S', 'W', 'N', 'E'];
    this.lastazalt = null;
    this.lst = helper.LM_Sidereal_Time(helper.julianDate(new Date()));
    this.timer = null;
    this.imx = 640;
    this.imy = 480;
    this.cx = 0.51 * this.imx;
    this.cy = 0.52 * this.imy;
    this.cr = this.imx * 0.5;
    this.tcsx = null;
    this.tcsy = null;
    this.percentClearSky = -1;
    this.skyImg = new Image();
    this.skyImg.onload = function () {
        driver.skyGraph.setup(true);
    };
    this.reload();
    setInterval(function () {
        driver.skyGraph.display_time();
    }, 500);   // 0.5 second update times
}

SkyGraph.prototype.startTimer = function () {
    this.timer = setInterval(function () {
        driver.skyGraph.reload();
    }, 5000);  // 5 second reload
};

SkyGraph.prototype.stopTimer = function () {
    if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
    }
};

SkyGraph.prototype.processImage = function () {
    var imgdata = this.ctx.getImageData(0, 0, this.imx, this.imy).data;
    var i, j, r, g, b, gray, black = 0, count = 0, row;
    var cx = 0.53 * this.imx;
    var cy = 0.52 * this.imy;
    var rad = 270;
    for (i = 0; i < this.imy; i++) {
        row = this.imx * i;
        for (j = 0; j < this.imx; j++) {
            if ((i - cy) * (i - cy) + (j - cx) * (j - cx) < rad * rad) {
                r = imgdata[(row + j) * 4];
                g = imgdata[(row + j) * 4 + 1];
                b = imgdata[(row + j) * 4 + 2];
                gray = (r + g + b) / 3;
                black += gray > 90 ? 0 : 1;
                count += 1;
            }
        }
    }
    this.percentClearSky = Math.round(black * 100 / count).toFixed(0);
};

SkyGraph.prototype.setup = function (triggered) {
    this.ctx.clearRect(0, 0, this.imx, this.imy);
    this.ctx.drawImage(this.skyImg, 0, 0);
    // Optional processing
    if (triggered) {
        this.processImage();
    }
    //this.remap();
    this.drawaxes();
    this.drawtics();
    this.drawpointing();
    if (driver.nightInitialized) {
        this.drawstars();
    }
    this.display_coords(this.lastazalt);
    this.display_time();
    /*driver.AJAX_GET('tcs.php', function (obj) {
        if (helper.notFloat(obj.alt) || helper.notFloat(obj.az)) {
            driver.skyGraph.setPointing(null);
        } else {
            driver.skyGraph.setPointing(driver.skyGraph.aatrans([obj.alt, obj.az]));
        }
    });*/
};

SkyGraph.prototype.setPointing = function (xy) {
    if (xy === null) {
        this.tcsx = null;
        this.tcsy = null;
    } else {
        this.tcsx = xy[0];
        this.tcsy = xy[1];
    }
};

SkyGraph.prototype.reload = function () {
    this.skyImg.src = 'skycam.php';
};

SkyGraph.prototype.remap = function () {
    this.imx = this.skyImg.width;
    this.imy = this.skyImg.height;
    this.cx = 0.51 * this.imx;
    this.cy = 0.52 * this.imy;
    this.cr = this.imx * 0.5;
};

SkyGraph.prototype.distort = function (zd) {
    return Math.pow(zd, 1.07);
};

SkyGraph.prototype.aatrans = function (altaz) { // convert from alt,az to ix,iy
    var ang = (this.south + 12 + altaz[1] / 15) * Math.PI / 12;   // rotate to display
    var dd = this.cr * this.distort((90 - altaz[0]) / 90);    // zenith distance in pixels
    var ix = this.cx + dd * Math.sin(ang);
    var iy = this.cy + dd * Math.cos(ang);
    return [ix, iy];
};

SkyGraph.prototype.tcsxhair = function (x, y) {
    this.ctx.strokeStyle = '#9f3';
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

SkyGraph.prototype.xhair = function (x, y, name, color) {
    //this.ctx.globalCompositeOperation = 'hue';
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
    //this.ctx.globalCompositeOperation = 'source-over';
};

SkyGraph.prototype.drawaxes = function () {
    var i;
    this.ctx.strokeStyle = "gray";
    for (i = 90; i > 0; i -= 30) {
        var r = this.cr * this.distort(i / 90);
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, r, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    }
    this.ctx.beginPath();                    // 24 spokes
    for (i = 0; i < 24; i += 1) {
        var az = (this.south + 12 + i) * Math.PI / 12;
        this.ctx.moveTo(this.cx, this.cy);
        this.ctx.lineTo(this.cx + this.cr * Math.sin(az), this.cy + this.cr * Math.cos(az));
    }
    this.ctx.stroke();
};

SkyGraph.prototype.drawtics = function () {
    var i;
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.textAlign = 'start';
    this.ctx.font = "10pt " + this.fontFamily;
    for (i = 0; i < 4; i += 1) {
        var ang = this.pang[i] * Math.PI / 12;
        var xx1 = this.cx + this.cr * Math.sin(ang);
        var yy1 = this.cy + this.cr * Math.cos(ang);
        var xl = [-7, -5, -2, 1], yl = [-2, +4, +7, 0];
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, 0.85 * this.cr, Math.PI / 2 - ang - 0.05, Math.PI / 2 - ang + 0.05, false);
        this.ctx.lineTo(xx1, yy1);
        this.ctx.closePath();
        this.ctx.fillStyle = 'blue';
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        xx1 = this.cx + 0.9 * this.cr * Math.sin(ang);
        yy1 = this.cy + 0.9 * this.cr * Math.cos(ang);
        this.ctx.fillText(this.plab[i], xx1 + xl[i], yy1 + yl[i]);
    }
};

SkyGraph.prototype.drawpointing = function () {
    if (this.tcsx === null || this.tcsy === null) {
        return;
    }
    this.tcsxhair(this.tcsx, this.tcsy);
};

SkyGraph.prototype.drawstars = function () {
    if (driver.targets.nTargets === 0) {
        return;
    }
    var i, obj, last = null;
    for (i = 0; i < driver.targets.nTargets; i += 1) {
        obj = driver.targets.Targets[i];
        var radeg = helper.dmstodeg(obj.RA);
        var decdeg = helper.dmstodeg(obj.Dec);
        var altaz = helper.altaz(radeg, decdeg, this.lst);
        if (altaz[0] > 0) {
            var xy = this.aatrans(altaz);
            if (this.tcsx !== null && this.tcsy !== null && Math.abs(this.tcsx - xy[0]) <= 2 && Math.abs(this.tcsy - xy[1]) <= 2) {
                last = [xy[0], xy[1], obj.Name, '#9f3'];
            } else {
                this.xhair(xy[0], xy[1], obj.Name, obj.LabelFillColor);
            }
        }
    }
    if (last !== null) {
        this.xhair(last[0], last[1], last[2], last[3]);
    }
};

SkyGraph.prototype.display_coords = function (azalt) {
    this.ctx.clearRect(0, this.imy, this.canvasWidth / 2, this.canvasHeight - this.imy);
    if (azalt === null) {
        return;
    } else {
        this.ctx.fillStyle = 'black';
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
        this.ctx.font = "10pt " + this.fontFamily;
        this.ctx.fillText('Az:', 0, this.imy + 6);
        this.ctx.fillText('Alt:', 51, this.imy + 6);
        this.ctx.fillText('RA', 100, this.imy + 6);
        this.ctx.fillText('Dec', 208, this.imy + 6);
        this.ctx.fillStyle = 'blue';
        this.ctx.fillText(azalt[1], 20, this.imy + 6);
        this.ctx.fillText(azalt[0], 74, this.imy + 6);
        this.ctx.fillText(azalt[2], 121, this.imy + 6);
        this.ctx.fillText(azalt[3], 235, this.imy + 6);
    }
};

SkyGraph.prototype.display_time = function () {
    var tim = new Date();
    this.lst = helper.LM_Sidereal_Time(helper.julianDate(tim));
    var ut = helper.utc(tim) * 24;
    var mm = (tim.getUTCMonth() + 1).toFixed();
    if (mm.length < 2) {
        mm = "0" + mm;
    }
    var dd = tim.getUTCDate().toFixed();
    if (dd.length < 2) {
        dd = "0" + dd;
    }
    var UTtext = "UTC " + tim.getUTCFullYear() + "-" + mm + "-" + dd + " " + helper.HMS(ut, false, '', '', '');
    var STtext = "LST " + helper.HMS(this.lst, false, '', '', '');
    this.ctx.clearRect(this.canvasWidth / 2, this.imy, this.canvasWidth / 2, this.canvasHeight - this.imy);
    this.ctx.font = "10pt " + this.fontFamily + " Mono";
    this.ctx.fillStyle = 'gray';
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(UTtext, this.imx / 2 + 75, this.imy + 6);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(STtext, this.imx, this.imy + 6);
    if (this.percClearSky !== -1) {
        this.ctx.fillStyle = 'black';
        this.ctx.font = "10pt " + this.fontFamily;
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Percentage of clear, dark sky (experimental): ' + this.percentClearSky + '%', this.imx, this.imy + 23);
    }
};
