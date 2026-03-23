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
function SkyGraph(_canvas, _context) {
    try {
        this.params = null;
        this.canvas = _canvas;
        this.ctx = _context;
        this.canvasWidth = _canvas.width;
        this.canvasHeight = _canvas.height;
        this.fontFamily = "Ubuntu, sans-serif";
        this.cardinalLabels = ["N", "E", "S", "W"];
        this.lastAltaz = null;
        this.cursorPx = null;
        const mjd = helper.getMJD(new Date());
        this.lst = sla.dranrm(sla.gmst(mjd) + Driver.obs_lon_rad + sla.eqeqx(mjd));
        this.timer = null;
        this.tcsPointing = null;
        this.skyImg = new Image();
        this.reload();
        $("#canvasSkycam").on("mousemove", function (e) {
            driver.skyGraph.EvtMouseMove(e, $(this));
        });
        $("#canvasSkycam").on("mouseout", function () {
            driver.skyGraph.EvtMouseOut();
        });
        $(document).keydown(function (e) {
            driver.skyGraph.EvtKeyDown(e);
        });
    } catch (e) {
        helper.LogException(e);
    }
}

/**
 *
 */
SkyGraph.prototype.updateTelescope = function () {
    try {
        this.params = config[Driver.telescopeName].skycamParams || null;
        if (this.params === null) {
            $("#canvasSkycam").hide();
            $("#skycam_placeholder").addClass("active");
        } else {
            $("#skycam_placeholder").removeClass("active");
            $("#canvasSkycam").show();
        }
        this.reload();
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.startTimer = function () {
    try {
        this.timer = setInterval(function () {
            driver.skyGraph.reload();
        }, 30000);
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.stopTimer = function () {
    try {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.setup = function () {
    if (this.params === null) return;
    try {
        this.ctx.clearRect(0, 0, this.params.imageSizeX, this.params.imageSizeY);
        this.ctx.drawImage(this.skyImg, 0, 0);
        this.drawAxes();
        this.drawTicks();
        this.drawPointing();
        this.drawCursor();
        if (driver.nightInitialized) {
            this.drawStars();
        }
        this.displayCoords();
        this.displayTime();
        $.get({
            url: "pointing.php",
            data: {telescope: Driver.telescopeName},
            success: function (obj) {
                if (helper.notFloat(obj.alt) || helper.notFloat(obj.az)) {
                    driver.skyGraph.tcsPointing = null;
                } else {
                    driver.skyGraph.tcsPointing = driver.skyGraph.altaz2px(sla.d2r * obj.alt, sla.d2r * obj.az);
                }
            },
            error: function (msg) {
                helper.LogError(msg);
            }
        });
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Draw user cursor marker (red crosshair)
 */
SkyGraph.prototype.drawCursor = function () {
    if (this.params === null) return;
    if (this.cursorPx === null) return;

    this.xhair(this.cursorPx.x, this.cursorPx.y, "", "red");
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.reload = function () {
    if (this.params === null) return;
    try {
        this.skyImg.src = `${this.params.url}?t=${new Date().getTime()}`;
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.xhair = function (x, y, name, color) {
    try {
        this.ctx.save();
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
    } catch (e) {
        helper.LogException(e);
    } finally {
        this.ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawAxes = function () {
    if (this.params === null) return;
    try {
        this.ctx.save();
        this.ctx.strokeStyle = "gray";
        for (let i = 90; i >= 0; i -= 30) {
            const r = this.params.radius * Math.pow(1 - i / 90, this.params.distortPower);
            this.ctx.beginPath();
            this.ctx.arc(this.params.zenithX, this.params.zenithY, r, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        }
        this.ctx.beginPath();
        const nspokes = 24;
        const dr = 360 / nspokes;
        for (let i = 0; i < nspokes; i += 1) {
            const az = sla.d2r * (-90 - this.params.rotation - i * dr);
            this.ctx.moveTo(this.params.zenithX, this.params.zenithY);
            this.ctx.lineTo(this.params.zenithX + this.params.radius * Math.cos(az),
                this.params.zenithY + this.params.radius * Math.sin(az));
        }
        this.ctx.stroke();
    } catch (e) {
        helper.LogException(e);
    } finally {
        this.ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawTicks = function () {
    if (this.params === null) return;
    try {
        this.ctx.save();
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "center";
        this.ctx.font = `13pt ${this.fontFamily}`;
        const rcard = 15;
        for (let i = 0; i < 4; i += 1) {
            const az = sla.d2r * (-90 - this.params.rotation - i * 90);
            // Find first radius inside the image
            let r = this.params.radius;
            let x, y;
            while (true) {
                x = this.params.zenithX + r * Math.cos(az);
                y = this.params.zenithY + r * Math.sin(az);
                if (x > rcard && y > rcard && x+rcard <= this.params.imageSizeX && y+rcard <= this.params.imageSizeY) {
                    break;
                }
                r -= 1;
            }
            this.ctx.beginPath();
            this.ctx.arc(x, y, rcard, 0, sla.d2pi, false);
            this.ctx.lineTo(x, y);
            this.ctx.closePath();
            this.ctx.fillStyle = "blue";
            this.ctx.fill();
            this.ctx.fillStyle = "white";
            this.ctx.fillText(this.cardinalLabels[i], x, y);
        }
    } catch (e) {
        helper.LogException(e);
    } finally {
        this.ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawPointing = function () {
    if (this.params === null) return;
    if (this.tcsPointing === null) return;
    try {
        this.ctx.save();
        const x = this.tcsPointing.x;
        const y = this.tcsPointing.y;
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
    } catch (e) {
        helper.LogException(e);
    } finally {
        this.ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawStars = function () {
    if (this.params === null) return;
    try {
        if (driver.targets.nTargets === 0) {
            return;
        }
        let last = null;
        for (let i = 0; i < driver.targets.nTargets; i += 1) {
            const obj = driver.targets.Targets[i];
            const altaz = sla.de2h(this.lst - obj.raRad, obj.decRad, Driver.obs_lat_rad);
            if (altaz.el > 0) {
                const px = this.altaz2px(altaz.el, altaz.az);
                if (this.tcsPointing !== null && Math.abs(this.tcsPointing.x - px.x) <= 2 && Math.abs(this.tcsPointing.y - px.y) <= 2) {
                    last = [px.x, px.y, obj.Name, "#9f3"];
                } else {
                    this.xhair(px.x, px.y, obj.Name, obj.LabelFillColor);
                }
            }
        }
        if (last !== null) {
            this.xhair(last[0], last[1], last[2], last[3]);
        }
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.displayCoords = function () {
    if (this.params === null) return;
    try {
        this.ctx.save();
        this.ctx.clearRect(0, this.params.imageSizeY, this.canvasWidth / 2, this.canvasHeight - this.params.imageSizeY);
        if (this.lastAltaz !== null) {
            this.ctx.fillStyle = "black";
            this.ctx.textBaseline = "top";
            this.ctx.textAlign = "left";
            this.ctx.font = `10pt ${this.fontFamily}`;
            this.ctx.fillText("Az:", 0, this.params.imageSizeY + 6);
            this.ctx.fillText("Alt:", 51, this.params.imageSizeY + 6);
            this.ctx.fillText("RA", 100, this.params.imageSizeY + 6);
            this.ctx.fillText("Dec", 208, this.params.imageSizeY + 6);
            this.ctx.fillStyle = "blue";
            this.ctx.fillText(Math.round(sla.r2d*this.lastAltaz.az), 20, this.params.imageSizeY + 6);
            const altDeg = Math.round(sla.r2d*this.lastAltaz.alt);
            this.ctx.fillText(altDeg > 10 ? altDeg : "low", 74, this.params.imageSizeY + 6);
            const hadec = sla.dh2e(this.lastAltaz.az, this.lastAltaz.alt, Driver.obs_lat_rad);
            this.ctx.fillText(helper.HMS(sla.rtoh * sla.dranrm(this.lst-hadec.ha), "h", "m", "s"), 121, this.params.imageSizeY + 6);
            this.ctx.fillText(helper.HMS(sla.r2d * hadec.dec, "°", "'", '"'), 235, this.params.imageSizeY + 6);
        }
    } catch (e) {
        helper.LogException(e);
    } finally {
        this.ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.displayTime = function () {
    if (this.params === null) return;
    try {
        this.ctx.save();
        const tim = new Date();
        const mjd = helper.getMJD(tim);
        this.lst = sla.dranrm(sla.gmst(mjd) + Driver.obs_lon_rad + sla.eqeqx(mjd));
        const ut = helper.utc(tim) * 24;
        const mm = helper.padTwoDigits(tim.getUTCMonth() + 1);
        const dd = helper.padTwoDigits(tim.getUTCDate());
        const UTtext = `UTC ${tim.getUTCFullYear()}-${mm}-${dd} ${helper.HMS(ut, ":", ":", "")}`;
        const MJDtext = `MJD ${helper.getMJD(tim).toFixed(5)}`;
        const STtext = `LST ${helper.HMS(sla.rtoh * this.lst, ":", ":", "")}`;
        this.ctx.clearRect(this.canvasWidth / 2, this.params.imageSizeY, this.canvasWidth / 2, this.canvasHeight - this.params.imageSizeY);
        this.ctx.font = `10pt ${this.fontFamily}`;
        this.ctx.fillStyle = "gray";
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";
        this.ctx.fillText(UTtext, this.params.imageSizeX / 2 + 40, this.params.imageSizeY + 6);
        this.ctx.fillText(MJDtext, this.params.imageSizeX / 2 + 40, this.params.imageSizeY + 24);
        this.ctx.textAlign = "right";
        this.ctx.fillText(STtext, this.params.imageSizeX, this.params.imageSizeY + 6);
        if (this.lastAltaz !== null) {
            this.displayCoords();
        }
    } catch (e) {
        helper.LogException(e);
    } finally {
        this.ctx.restore();
    }
};

/**
 * Convert pixel coordinates in a SkyCam image to Az/Alt, using
 * the configured telescope-specific transformation parameters.
 *
 * @param {Number} x - X coordinate of the target pixel.
 * @param {Number} y - Y coordinate of the target pixel.
 * @returns {Object|null} An object containing the altitude and azimuth as returned
 * by the telescope-specific function, or null if no suitable telescope routine exists.
 */
SkyGraph.prototype.px2altaz = function(x, y) {
    if (this.params === null) return null;
    try {
        const dx = x - this.params.zenithX;
        const dy = y - this.params.zenithY;
        const rho = Math.sqrt(dx*dx + dy*dy);
        return {
            'alt': Math.PI/2 * (1-Math.pow(rho/this.params.radius, 1/this.params.distortPower)),
            'az': sla.dranrm(Math.atan2(dy, -dx) + sla.d2r * (90 - this.params.rotation))
        };
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * Convert pixel coordinates in a SkyCam image to Az/Alt, using
 * the configured telescope-specific transformation parameters.
 *
 * @param {Number} alt - Altitude in radians.
 * @param {Number} az - Azimuth in radians.
 * @returns {Object|null} An object containing x, y in pixels as returned
 * by the telescope-specific function, or null if no suitable telescope routine exists.
 */
SkyGraph.prototype.altaz2px = function(alt, az) {
    if (this.params === null) return null;
    try {
        const rho = this.params.radius * Math.pow(1 - alt / (Math.PI / 2), this.params.distortPower);
        const theta = az - sla.d2r * (90 - this.params.rotation);
        return {
            'x': this.params.zenithX - rho * Math.cos(theta),
            'y': this.params.zenithY + rho * Math.sin(theta)
        };
    } catch (e) {
        helper.LogException(e);
    }
};

SkyGraph.prototype.EvtKeyDown = function (e) {
    if (this.params === null) return;
    if (this.cursorPx === null) return;

    const step = 2; // pixels per keypress

    switch (e.which) {
    case 37: // left
        this.cursorPx.x -= step;
        break;
    case 38: // up
        this.cursorPx.y -= step;
        break;
    case 39: // right
        this.cursorPx.x += step;
        break;
    case 40: // down
        this.cursorPx.y += step;
        break;
    default:
        return;
    }

    // Clamp to image bounds
    this.cursorPx.x = Math.max(0, Math.min(this.params.imageSizeX, this.cursorPx.x));
    this.cursorPx.y = Math.max(0, Math.min(this.params.imageSizeY, this.cursorPx.y));

    // Update derived alt/az
    this.lastAltaz = this.px2altaz(this.cursorPx.x, this.cursorPx.y);
    this.setup();
};

/**
 * @memberof Driver
 */
SkyGraph.prototype.EvtMouseMove = function (e, jQthis) {
    if (this.params === null) return;
    try {
        if (e.pageX === undefined && e.pageY === undefined) return;
        const posX = e.pageX - jQthis.offset().left;
        const posY = e.pageY - jQthis.offset().top;
        if ((posX < 0) || (posX >= this.params.imageSizeX) || (posY < 0) || (posY >= this.params.imageSizeY)) {
            this.lastAltaz = null;
            this.cursorPx = null;
        } else {
            this.lastAltaz = this.px2altaz(posX, posY);
            this.cursorPx = { x: posX, y: posY };
        }
        this.setup();
    } catch (e) {
        helper.LogException(e);
    }
};

/**
 * @memberof Driver
 */
SkyGraph.prototype.EvtMouseOut = function () {
    if (this.params === null) return;
    try {
        this.lastAltaz = null;
        this.cursorPx = null;
        this.setup();
    } catch (e) {
        helper.LogException(e);
    }
};
