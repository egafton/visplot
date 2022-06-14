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
function Night(y, m, d) {
    this.day = d;
    this.month = m;
    this.year = y;
    /* Size of all time series (e.g., altitude curves) */
    /* ALL time series begin at sunset and end at sunrise */
    this.Nx = 1000;
    /* Time series arrays */
    this.xaxis = [];   /* UTC times in MJD format, from sunset to sunrise */
    this.ymoon = [];   /* Refracted moon altitude in degrees */
    this.rmoon = [];   /* Apparent moon radius in degrees */
    this.ramoon = [];  /* RA of moon */
    this.decmoon = []; /* Dec of moon */
    this.aoprms = [];  /* Apparent to observed parameters, SLALIB */
    this.amprms = [];  /* Mean to apparent parameters, SLALIB */
    /* Other arrays, not of length Nx */
    this.UTCtimes = [];                     // Position of full hours (8UT, 9UT, etc) in terms of MJD-UTC
    this.UTClabels = [];                    // UTC labels corresponding to UTCtimes ("8", "9", etc)
    this.MSZTlabels = [];                   // Mean Solar Zone Time labels corresponding to UTCtimes ("8", "9", etc)
    this.LSTlabels = [];                    // LST labels corresponding to UTCtimes
}

/**
 * @memberof Night
 */
Night.prototype.setEphemerides = function (obj) {
    /**
     * First, pre-compute certain SLALIB parameters for this night
     */
    // Compute UTC, UT1 and TT values (expressed in MJD format) of Midnight (UT);
    // Since we assume certain quantities to be constant throughout
    // the night (equation of equinoxes, TT-UTC, etc.), precompute them.
    this.utcMidnight = sla.cldj(this.year, this.month, this.day) + 1 - Driver.obs_timezone / 24;
    this.ut1Midnight = this.utcMidnight + Driver.current_dut;
    this.dut = sla.dtt(this.utcMidnight) / sla.d2s;
    this.ttMidnight = this.utcMidnight + this.dut;
    this.eqeqx = sla.eqeqx(this.ttMidnight);

    /* How is refraction handled? */
    /* For setting/rising: NAO uses a refraction value of 34 arcminutes at the horizon,
     * which is approximately equal to what SLALIB gives at sea-level.
     * However, at high altitude (low pressure) this can be smaller by about 10 arcminutes, so that
     * needs to be adjusted */
    const stdPres = 1013.25; // hPa
    const stdTemp = 298.15;  // K, 15 deg
    const sitePres = stdPres * Math.exp(-9.80665 * 0.0289644 * Driver.obs_alt / stdTemp / 8.31447)
    const siteTemp = stdTemp-0.0065*Driver.obs_alt; // 15 deg at sea level, use TLR to reduce temperature
    const siteWvlen = 0.55;
    const siteHum = 0.2;
    this.ref = sla.refco(Driver.obs_alt, siteTemp, sitePres, siteHum, siteWvlen, Driver.obs_lat_rad, 0.0065);
    this.RefractionAtHorizon = sla.refro(0.5*Math.PI, Driver.obs_alt, siteTemp, sitePres, siteHum, siteWvlen,
                                         Driver.obs_lat_rad, 0.0065, 1e-8);
    this.HorizonDip = Math.acos(sla.a0 / (Driver.obs_alt + sla.a0));
    /* For target altitude curves:
     * Since sla.aopqk would be extremely slow beyond zd of 76 deg, the apparent
     * topocentric zds are computed without refraction. Then, sla.refz is called
     * and the zd is increased accordingly.
     */

    // Previous noon; sunset; evening twilights
    let stl = helper.stl(this.utcMidnight-0.5, this.eqeqx);
    let ret = sla.rdplan(this.ttMidnight-0.5, "Sun", Driver.obs_lon_rad, Driver.obs_lat_rad);
    let tsouth = ((12 - Driver.obs_timezone) - sla.drange(stl - ret.ra) * sla.r2d / 15) % 24;
    let ut1 = helper.utarc(-0.5*ret.diam - this.RefractionAtHorizon - this.HorizonDip, tsouth, ret.dec, "+");
    let ut2 = helper.utarc(-12*sla.dd2r, tsouth, ret.dec, "+");
    let ut3 = helper.utarc(-18*sla.dd2r, tsouth, ret.dec, "+");
    let utczero = Math.floor(this.utcMidnight);
    while (this.utcMidnight - (utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2])) < 0) {
        utczero -= 1;
    }
    this.Sunset = utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2]);
    let next = sla.djcl(this.Sunset);
    this.tSunset = [next.iy, next.im, next.id, ut1[0], ut1[1], parseFloat(ut1[2]+"."+ut1[3])];
    this.ENauTwilight = utczero + sla.dtf2d(ut2[0], ut2[1], ut2[2]);
    this.EAstTwilight = utczero + sla.dtf2d(ut3[0], ut3[1], ut3[2]);
    let sret = sla.rdplan(this.Sunset + this.dut, "Sun", Driver.obs_lon_rad, Driver.obs_lat_rad);
    let mret = sla.rdplan(this.Sunset + this.dut, "Moon", Driver.obs_lon_rad, Driver.obs_lat_rad);
    let sep = sla.dsep(sret.ra, sret.dec, mret.ra, mret.dec);
    this.moonra = mret.ra;
    this.moondec = mret.dec;
    this.MoonIllStart = (1 - Math.cos(sep)) * 0.5 * 100;
    this.stlSunset = helper.stl(this.Sunset, this.eqeqx);

    // Next noon; sunrise; morning twilight
    stl = helper.stl(this.utcMidnight+0.5, this.eqeqx);
    ret = sla.rdplan(this.ttMidnight+0.5, "Sun", Driver.obs_lon_rad, Driver.obs_lat_rad);
    tsouth = ((12 - Driver.obs_timezone) - sla.drange(stl - ret.ra) * sla.r2d / 15) % 24;
    ut1 = helper.utarc(-0.5*ret.diam - this.RefractionAtHorizon - this.HorizonDip, tsouth, ret.dec, "-");
    ut2 = helper.utarc(-12*sla.dd2r, tsouth, ret.dec, "-");
    ut3 = helper.utarc(-18*sla.dd2r, tsouth, ret.dec, "-");
    utczero = Math.floor(this.utcMidnight);
    while ((utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2])) - this.utcMidnight < 0) {
        utczero += 1;
    }
    this.Sunrise = utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2]);
    next = sla.djcl(this.Sunrise);
    this.tSunrise = [next.iy, next.im, next.id, ut1[0], ut1[1], parseFloat(ut1[2]+"."+ut1[3])];
    this.MNauTwilight = utczero + sla.dtf2d(ut2[0], ut2[1], ut2[2]);
    this.MAstTwilight = utczero + sla.dtf2d(ut3[0], ut3[1], ut3[2]);
    sret = sla.rdplan(this.Sunrise + this.dut, "Sun", Driver.obs_lon_rad, Driver.obs_lat_rad);
    mret = sla.rdplan(this.Sunrise + this.dut, "Moon", Driver.obs_lon_rad, Driver.obs_lat_rad);
    sep = sla.dsep(sret.ra, sret.dec, mret.ra, mret.dec);
    this.MoonIllEnd = (1 - Math.cos(sep)) * 0.5 * 100;
    this.stlSunrise = helper.stl(this.Sunrise, this.eqeqx);


    switch ($('input[type="radio"][name="opt_schedule_between"]:checked').val()) {
        case "sunset-sunrise":
            this.global_UTstart = this.Sunset;
            this.global_UTend = this.Sunrise;
            break;
        case "astronomical":
            this.global_UTstart = this.EAstTwilight;
            this.global_UTend = this.MAstTwilight;
            break;
        default:
            this.global_UTstart = this.ENauTwilight;
            this.global_UTend = this.MNauTwilight;
    }

    this.wnight = this.Sunrise - this.Sunset;   // Length of the night in days
    this.xstep = this.wnight / this.Nx;         // Resolution of the time array
    let aop;

    this.xaxis = [];
    this.ymoon = [];
    this.rmoon = [];
    this.ramoon = [];
    this.decmoon = [];
    for (let i = 0; i < this.Nx; i += 1) {          // ... and its initialization
        const ut = this.Sunset + this.xstep * i;
        this.xaxis.push(ut);
        if (i === 0) {
            aop = sla.aoppa(ut, this.dut*sla.d2s, Driver.obs_lon_rad, Driver.obs_lat_rad,
                            Driver.obs_alt, 0, 0, siteTemp, 0, siteHum, siteWvlen, 0.0065);
        } else {
            sla.aoppat(ut, aop);
        }
        this.aoprms[i] = Object.assign({}, aop);
        this.amprms[i] = sla.mappa(2000, ut + this.dut);
        // Apparent RA, Dec of Moon
        ret = sla.rdplan(ut + this.dut, "Moon", Driver.obs_lon_rad, Driver.obs_lat_rad);
        this.ramoon.push(ret.ra);
        this.decmoon.push(ret.dec);
        const diam = ret.diam;
        // Topocentric zd of Moon WITHOUT refraction
        ret = sla.aopqk(ret.ra, ret.dec, aop);
        // Approximate refracted alt
        const ell = 0.5*Math.PI - sla.refz(ret.zob, this.ref.refa, this.ref.refb);
        this.ymoon.push(helper.rad2deg(ell));
        this.rmoon.push(0.5*diam);
    }
    this.DateSunset = new Date(Date.UTC(this.tSunset[0], this.tSunset[1]-1, this.tSunset[2], this.tSunset[3], this.tSunset[4], this.tSunset[5], 0));
    this.DateSunrise = new Date(Date.UTC(this.tSunrise[0], this.tSunrise[1]-1, this.tSunrise[2], this.tSunrise[3], this.tSunrise[4], this.tSunrise[5], 0));
    this.DarkTime = (this.MAstTwilight - this.EAstTwilight);
    this.NightLength = (this.global_UTend - this.global_UTstart);
    let firstUTC = this.tSunset[3]+1;
    let stopUTC = this.tSunrise[3];
    if (this.tSunrise[4] !== 0) {
        stopUTC += 1;
    }
    utczero = sla.djcl(this.Sunset);
    let djutc = sla.cldj(utczero.iy, utczero.im, utczero.id) + sla.dtf2d(firstUTC, 0, 0);
    this.UTCtimes = [];
    this.UTClabels = [];
    this.MSZTlabels = [];
    this.LSTlabels = [];
    while (firstUTC != stopUTC) {
        if (firstUTC == 25) {
            firstUTC = 1;
        }
        this.UTCtimes.push(djutc);
        this.UTClabels.push(firstUTC.toString());
        if (Driver.obs_timezone != 0) {
            let mszt = (firstUTC + Driver.obs_timezone + 24) % 24;
            this.MSZTlabels.push(mszt == 0 ? "24" : mszt.toString());
        }
        stl = sla.dr2tf(1, sla.dranrm(sla.gmst(djutc) + Driver.obs_lon_rad) + this.eqeqx);
        this.LSTlabels.push(`${stl.ihmsf[0]}:${stl.ihmsf[1] < 10 ? "0" : ""}${stl.ihmsf[1].toFixed(0)}`);
        firstUTC += 1;
        djutc += 1/24;
    }
    this.BestEvBlank = "";
    this.BestMoBlank = "";
    this.MoonIllMin = Math.max(Math.floor(Math.min(this.MoonIllStart, this.MoonIllEnd)), 0);
    this.MoonIllMax = Math.min(Math.ceil(Math.max(this.MoonIllStart, this.MoonIllEnd)), 100);
    this.MoonIllumination = Math.max(this.MoonIllStart, this.MoonIllEnd);   // Maximum moon illumination throughout the night
    if (this.MoonIllMin === this.MoonIllMax) {
        this.MoonIlluminationString = `${this.MoonIllMin}%`;
    } else {
        this.MoonIlluminationString = `${this.MoonIllMin} – ${this.MoonIllMax}%`;
    }
    this.Moonrise = 0;
    const lim = helper.rad2deg(- this.HorizonDip);
    if (this.ymoon[0] < lim-sla.r2d*this.rmoon[0]) {
        // will rise
        for (let i = 1; i < this.Nx; i += 1) {
            if (this.ymoon[i] > lim-sla.r2d*this.rmoon[i]) {
                // secant method
                this.Moonrise = this.xaxis[i-1];
                this.Moonrise = this.xaxis[i] + (lim-sla.r2d*this.rmoon[i] - this.ymoon[i])*(this.xaxis[i]-this.xaxis[i-1])/(this.ymoon[i]-this.ymoon[i-1]);
                break;
            }
        }
    }
    if (this.ymoon[this.Nx-1] < lim) {
        // will set
        for (let i = this.Nx-2; i>=0; i--) {
            if (this.ymoon[i] > lim) {
                this.Moonset = this.xaxis[i+1];
                this.Moonset = this.xaxis[i+1] + (lim-sla.r2d*this.rmoon[i]- this.ymoon[i+1])*(this.xaxis[i+1]-this.xaxis[i])/(this.ymoon[i+1]-this.ymoon[i]);
                break;
            }
        }
    }
    driver.targets.StartingAt = this.Sunset;
};
