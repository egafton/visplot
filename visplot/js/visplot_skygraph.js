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
        this.fontFamily = config.graphFont;
        this.cardinalLabels = ["N", "E", "S", "W"];
        this.lastAltaz = null;
        this.cursorPx = null;
        this.lst = helper.stl(helper.getMJD(new Date()));
        this.timer = null;
        this.tcsPointing = null;
        this.skyImg = new Image();
        this.skyImgOK = false;
        this.skyImg.onload = () => {
            this.skyImgOK = true;
            this.redraw(this.ctx);
        };
        this.skyImg.onerror = () => {
            this.skyImgOK = false;
            helper.LogError("Sky image failed to load");
        };
        this.refreshRemote();
        $("#canvasSkycam").on("mousemove", function (e) {
            driver.skyGraph.EvtMouseMove(e);
        });
        $("#canvasSkycam").on("mouseout", function () {
            driver.skyGraph.EvtMouseOut();
        });
        $(document).keydown(function (e) {
            driver.skyGraph.EvtKeyDown(e);
        });
    } catch (ex) {
        helper.LogException(ex);
    }
}

/**
 *
 */
SkyGraph.prototype.updateTelescope = function () {
    try {
        this.params = telescopes[Driver.telescopeName].skycamParams || null;
        this.refreshRemote();
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.startTimer = function () {
    try {
        this.timer = setInterval(function () {
            driver.skyGraph.refreshRemote();
        }, config.skycamImageRefreshInterval);
    } catch (ex) {
        helper.LogException(ex);
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
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.redraw = function (ctx, img=null) {
    try {
        ctx.save();
        ctx.clearRect(0, 0, config.skycamImageSizeX, config.skycamImageSizeY);
        if (this.params === null) {
            // Background: neutral light gray
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(0, 0, config.skycamImageSizeX, config.skycamImageSizeY);
            ctx.fillStyle = "#e57373"; // soft red
            ctx.fillRect(0, 0, config.skycamImageSizeX, 6);
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.font = `bold 14pt ${this.fontFamily}`;
            ctx.fillStyle = "#c62828";
            ctx.fillText("No sky camera configured for the selected telescope", config.skycamImageSizeX/2, config.skycamImageSizeY/2);
            return;
        }
        if (img === null) {
            if (this.skyImgOK) {
                ctx.drawImage(this.skyImg, 0, 0, config.skycamImageSizeX, config.skycamImageSizeY);
            }
        } else {
            ctx.drawImage(img, 0, 0, config.skycamImageSizeX, config.skycamImageSizeY);
        }
        this.drawAxes(ctx);
        this.drawTicks(ctx);
        this.drawPointing(ctx);
        this.drawCursor(ctx);
        if (driver.nightInitialized) {
            this.drawStars(ctx);
        }
        this.displayTime(ctx);
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * Draw user cursor marker (red crosshair)
 */
SkyGraph.prototype.drawCursor = function (ctx) {
    if (this.params === null || this.cursorPx === null) {
        return;
    }
    this.xhair(ctx, this.cursorPx.x, this.cursorPx.y, "", "red");
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.refreshRemote = function () {
    if (this.params === null) {
        return;
    }
    try {
        const t = new Date().getTime();
        this.skyImg.src = config.skycamProxy(this.params.url, t);
        $.get({
            url: `${window.baseurl}pointing.php`,
            data: {
                telescope: Driver.telescopeName,
                t: t
            },
            timeout: config.skycamTcsTimeout,
            success: function (obj) {
                if (helper.notFloat(obj.alt) || helper.notFloat(obj.az)) {
                    driver.skyGraph.tcsPointing = null;
                } else {
                    driver.skyGraph.tcsPointing = driver.skyGraph.altaz2px(sla.d2r * obj.alt, sla.d2r * obj.az);
                }
            }
        });
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.xhair = function (ctx, x, y, name, color) {
    try {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 3, y);
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y - 3);
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, y + 3);
        ctx.stroke();
        ctx.font = "8pt " + this.fontFamily;
        ctx.fillStyle = color;
        ctx.fillText(name, x + 5, y - 5);
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawAxes = function (ctx) {
    if (this.params === null) {
        return;
    }
    try {
        ctx.save();
        ctx.rect(0, 0, config.skycamImageSizeX, config.skycamImageSizeY);
        ctx.clip();
        ctx.strokeStyle = "gray";
        for (let i = 90; i >= 0; i -= 30) {
            const r = this.params.radius * Math.pow(1 - i / 90, this.params.distortPower);
            ctx.beginPath();
            ctx.arc(this.params.zenithX, this.params.zenithY, r, 0, sla.d2pi, false);
            ctx.stroke();
        }
        ctx.beginPath();
        const nspokes = 24;
        const dr = 360 / nspokes;
        for (let i = 0; i < nspokes; i += 1) {
            const az = sla.d2r * (-90 - this.params.rotation - i * dr);
            ctx.moveTo(this.params.zenithX, this.params.zenithY);
            ctx.lineTo(this.params.zenithX + this.params.radius * Math.cos(az), this.params.zenithY + this.params.radius * Math.sin(az));
        }
        ctx.stroke();
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawTicks = function (ctx) {
    if (this.params === null) {
        return;
    }
    try {
        ctx.save();
        ctx.rect(0, 0, config.skycamImageSizeX, config.skycamImageSizeY);
        ctx.clip();
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = `13pt ${this.fontFamily}`;
        const rcard = 15;
        for (let i = 0; i < 4; i += 1) {
            const az = sla.d2r * (-90 - this.params.rotation - i * 90);
            // Find first radius inside the image
            let r = this.params.radius;
            let x, y;
            while (true) {
                x = this.params.zenithX + r * Math.cos(az);
                y = this.params.zenithY + r * Math.sin(az);
                if (x > rcard && y > rcard && x+rcard <= config.skycamImageSizeX && y+rcard <= config.skycamImageSizeY) {
                    break;
                }
                r -= 1;
            }
            ctx.beginPath();
            ctx.arc(x, y, rcard, 0, sla.d2pi, false);
            ctx.lineTo(x, y);
            ctx.closePath();
            ctx.fillStyle = "blue";
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.fillText(this.cardinalLabels[i], x, y);
        }
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawPointing = function (ctx) {
    if (this.params === null || this.tcsPointing === null) {
        return;
    }
    try {
        ctx.save();
        const x = this.tcsPointing.x;
        const y = this.tcsPointing.y;
        ctx.strokeStyle = config.skycamTcsCrosshairColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6);
        ctx.lineTo(x - 2, y - 2);
        ctx.moveTo(x + 6, y + 6);
        ctx.lineTo(x + 2, y + 2);
        ctx.moveTo(x - 6, y + 6);
        ctx.lineTo(x - 2, y + 2);
        ctx.moveTo(x + 6, y - 6);
        ctx.lineTo(x + 2, y - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, sla.d2pi, false);
        ctx.stroke();
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.drawStars = function (ctx) {
    if (this.params === null) {
        return;
    }
    try {
        if (driver.targets.nTargets === 0) {
            return;
        }
        let last = null;
        for (let i = 0; i < driver.targets.nTargets; i += 1) {
            const obj = driver.targets.Targets[i];
            const altaz = sla.de2h(this.lst - obj.raRad, obj.decRad, Driver.obsLatRad);
            if (altaz.el > 0) {
                const px = this.altaz2px(altaz.el, altaz.az);
                if (this.tcsPointing !== null && Math.abs(this.tcsPointing.x - px.x) <= 2 && Math.abs(this.tcsPointing.y - px.y) <= 2) {
                    last = [px.x, px.y, obj.Name, config.skycamTcsCrosshairColor];
                } else {
                    this.xhair(ctx, px.x, px.y, obj.Name, obj.LabelFillColor);
                }
            }
        }
        if (last !== null) {
            this.xhair(ctx, last[0], last[1], last[2], last[3]);
        }
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.displayCoords = function (ctx) {
    if (this.params === null) {
        return;
    }
    try {
        ctx.save();
        ctx.clearRect(0, config.skycamImageSizeY, this.canvasWidth / 2, this.canvasHeight - config.skycamImageSizeY);
        if (this.lastAltaz !== null) {
            ctx.fillStyle = "black";
            ctx.textBaseline = "top";
            ctx.textAlign = "left";
            ctx.font = `10pt ${this.fontFamily}`;
            ctx.fillText("Az:", 0, config.skycamImageSizeY + 6);
            ctx.fillText("Alt:", 51, config.skycamImageSizeY + 6);
            ctx.fillText("RA", 100, config.skycamImageSizeY + 6);
            ctx.fillText("Dec", 208, config.skycamImageSizeY + 6);
            ctx.fillStyle = "blue";
            ctx.fillText(Math.round(sla.r2d*this.lastAltaz.az), 20, config.skycamImageSizeY + 6);
            const altDeg = Math.round(sla.r2d*this.lastAltaz.alt);
            ctx.fillText(altDeg > 10 ? altDeg : "low", 74, config.skycamImageSizeY + 6);
            const hadec = sla.dh2e(this.lastAltaz.az, this.lastAltaz.alt, Driver.obsLatRad);
            ctx.fillText(helper.HMS(sla.rtoh * sla.dranrm(this.lst-hadec.ha), "h", "m", "s"), 121, config.skycamImageSizeY + 6);
            ctx.fillText(helper.HMS(sla.r2d * hadec.dec, "°", "'", '"'), 235, config.skycamImageSizeY + 6);
        }
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
    }
};

/**
 * @memberof SkyGraph
 */
SkyGraph.prototype.displayTime = function (ctx) {
    try {
        ctx.save();
        const lt = moment.tz(Driver.timezoneName);
        const utc = lt.clone().tz("UTC");
        const mjd = helper.getMJD(lt);
        this.lst = helper.stl(mjd);
        const UTtext = `UTC ${utc.format("YYYY-MM-DD HH:mm:ss")}`;
        const LTtext = `LT ${lt.format("YYYY-MM-DD HH:mm:ss")}`;
        const MJDtext = `MJD ${mjd.toFixed(5)}`;
        const STtext = `LST ${helper.HMS(sla.rtoh * this.lst, ":", ":", "")}`;
        ctx.clearRect(this.canvasWidth / 2, config.skycamImageSizeY, this.canvasWidth / 2, this.canvasHeight - config.skycamImageSizeY);
        ctx.font = `10pt ${this.fontFamily}`;
        ctx.fillStyle = "gray";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillText(UTtext, config.skycamImageSizeX / 2 + 40, config.skycamImageSizeY + 6);
        ctx.fillText(LTtext, config.skycamImageSizeX / 2 + 40, config.skycamImageSizeY + 24);
        ctx.textAlign = "right";
        ctx.fillText(MJDtext, config.skycamImageSizeX, config.skycamImageSizeY + 6);
        ctx.fillText(STtext, config.skycamImageSizeX, config.skycamImageSizeY + 24);
        if (this.lastAltaz !== null) {
            this.displayCoords(ctx);
        }
    } catch (ex) {
        helper.LogException(ex);
    } finally {
        ctx.restore();
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
    if (this.params === null) {
        return null;
    }
    try {
        const dx = x - this.params.zenithX;
        const dy = y - this.params.zenithY;
        const rho = Math.sqrt(dx*dx + dy*dy);
        return {
            'alt': sla.pihalf * (1-Math.pow(rho/this.params.radius, 1/this.params.distortPower)),
            'az': sla.dranrm(Math.atan2(dy, -dx) + sla.d2r * (90 - this.params.rotation))
        };
    } catch (ex) {
        helper.LogException(ex);
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
    if (this.params === null) {
        return null;
    }
    try {
        const rho = this.params.radius * Math.pow(1 - alt / sla.pihalf, this.params.distortPower);
        const theta = az - sla.d2r * (90 - this.params.rotation);
        return {
            'x': this.params.zenithX - rho * Math.cos(theta),
            'y': this.params.zenithY + rho * Math.sin(theta)
        };
    } catch (ex) {
        helper.LogException(ex);
    }
};

SkyGraph.prototype.EvtKeyDown = function (e) {
    if (this.params === null || this.cursorPx === null) {
        return;
    }

    const step = 2; // pixels per keypress
    let mustRedraw = false;
    switch (e.key) {
    case "ArrowLeft":
        this.cursorPx.x -= step;
        mustRedraw = true;
        break;
    case "ArrowUp":
        this.cursorPx.y -= step;
        mustRedraw = true;
        break;
    case "ArrowRight":
        this.cursorPx.x += step;
        mustRedraw = true;
        break;
    case "ArrowDown":
        this.cursorPx.y += step;
        mustRedraw = true;
        break;
    case "s":
        // Save as pdf
        serializer.saveSkyGraph();
        break;
    default:
        return;
    }

    if (!mustRedraw) {
        return;
    }

    // Clamp to image bounds
    this.cursorPx.x = Math.max(0, Math.min(config.skycamImageSizeX, this.cursorPx.x));
    this.cursorPx.y = Math.max(0, Math.min(config.skycamImageSizeY, this.cursorPx.y));

    // Update derived alt/az
    this.lastAltaz = this.px2altaz(this.cursorPx.x, this.cursorPx.y);
    this.redraw(this.ctx);
};

/**
 * @memberof Driver
 */
SkyGraph.prototype.EvtMouseMove = function (e) {
    if (this.params === null) {
        return;
    }
    try {
        if (typeof e.pageX === "undefined" || typeof e.pageY === "undefined") {
            return;
        }
        const canvas = $("#canvasSkycam");
        const posX = e.pageX - canvas.offset().left;
        const posY = e.pageY - canvas.offset().top;
        if ((posX < 0) || (posX >= config.skycamImageSizeX) || (posY < 0) || (posY >= config.skycamImageSizeY)) {
            this.lastAltaz = null;
            this.cursorPx = null;
        } else {
            this.lastAltaz = this.px2altaz(posX, posY);
            this.cursorPx = { x: posX, y: posY };
        }
        this.redraw(this.ctx);
    } catch (ex) {
        helper.LogException(ex);
    }
};

/**
 * @memberof Driver
 */
SkyGraph.prototype.EvtMouseOut = function () {
    if (this.params === null) {
        return;
    }
    try {
        this.lastAltaz = null;
        this.cursorPx = null;
        this.redraw(this.ctx);
    } catch (ex) {
        helper.LogException(ex);
    }
};
