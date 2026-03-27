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
function Night(y, m, d) {
    try {
        this.day = d;
        this.month = m;
        this.year = y;
        /* Size of all time series (e.g., altitude curves) */
        /* ALL time series begin at sunset and end at sunrise */
        this.Nx = config.graphResolutionTimeAxis;
        /* Time series arrays */
        this.xaxis = []; // UTC times in MJD format, from sunset to sunrise
        this.ymoon = []; // Refracted moon altitude in degrees
        this.rmoon = []; // Apparent moon radius in degrees
        this.ramoon = []; // RA of moon
        this.decmoon = []; // Dec of moon
        this.aoprms = []; // Apparent to observed parameters, SLALIB
        this.amprms = []; // Mean to apparent parameters, SLALIB
        /* Other arrays, not of length Nx */
        this.UTCtimes = []; // Position of full hours (8UT, 9UT, etc) in terms of MJD-UTC
        this.UTClabels = []; // UTC labels corresponding to UTCtimes ("8", "9", etc)
        this.LocalTimetimes = []; // Position of full hours (8LT, 9LT, etc) in terms of MJD-UTC
        this.LocalTimelabels = []; // Local Time labels corresponding to UTCtimes ("8", "9", etc)
        this.LSTangles = []; // LST angles corresponding to UTCtimes
        this.LSTlabels = []; // LST labels corresponding to UTCtimes
    } catch (ex) {
        helper.LogException(ex);
    }
}

/**
 * @memberof Night
 */
Night.prototype.setEphemerides = function () {
    try {
        /**
         * First, pre-compute certain SLALIB parameters for this night
         */
        // Compute UTC, UT1 and TT values (expressed in MJD format) of Midnight (UT);
        // Since we assume certain quantities to be constant throughout
        // the night (equation of equinoxes, TT-UTC, etc.), precompute them.

        // Midnight tonight at the telescope
        const telMidnight = moment.tz(`${this.year}-${helper.padTwoDigits(this.month)}-${helper.padTwoDigits(this.day)}`, Driver.timezoneName).add(1, "days");
        // Convert it to UTC
        const utcMidnight = telMidnight.clone().tz("UTC");
        // Convert it to MJD (include the fractional day)
        this.utcMidnight = sla.cldj(utcMidnight.year(), utcMidnight.month() + 1, utcMidnight.date()) + utcMidnight.hour() / 24;
        this.ut1Midnight = this.utcMidnight + Driver.currentDut;
        this.dut = sla.dtt(this.utcMidnight) / sla.d2s;
        this.ttMidnight = this.utcMidnight + this.dut;
        this.eqeqx = sla.eqeqx(this.ttMidnight);

        /* How is refraction handled? */
        /* For setting/rising: typical quoted value is 34 arcminutes at the horizon,
        * which is approximately equal to what SLALIB gives at sea-level.
        * However, at high altitude (low pressure) this can be smaller by about 10 arcminutes, so that
        * needs to be adjusted */
        const stdPres = config.stdPressure;
        const stdTemp = config.stdTemperature;
        const sitePres = stdPres * Math.exp(-config.gravAcceleration * config.molarMass * Driver.obsAltitude / stdTemp / config.gasConstant);
        const siteTemp = stdTemp + config.refractionTLR*Driver.obsAltitude; // 15 deg at sea level, use TLR to reduce temperature
        const siteWvlen = config.refractionWavelength;
        const siteHum = config.refractionHumidity;
        this.ref = sla.refco(Driver.obsAltitude, siteTemp, sitePres, siteHum, siteWvlen, Driver.obsLatRad, config.refractionTLR);
        this.RefractionAtHorizon = sla.refro(sla.pihalf, Driver.obsAltitude, siteTemp, sitePres, siteHum, siteWvlen, Driver.obsLatRad, config.refractionTLR, 1e-8);
        this.HorizonDip = Math.acos(sla.a0 / (Driver.obsAltitude + sla.a0));
        /* For target altitude curves:
        * Since sla.aopqk would be extremely slow beyond zd of 76 deg, the apparent
        * topocentric zds are computed without refraction. Then, sla.refz is called
        * and the zd is increased accordingly.
        */

        // Previous noon; sunset; evening twilights
        let transit = helper.findTransit(this.utcMidnight-0.5, this.dut, "Sun", this.eqeqx);
        let ut1 = helper.utarc(-0.5*transit.ret.diam - this.RefractionAtHorizon - this.HorizonDip, transit.tsouth, transit.ret.dec, "+");
        let ut2 = helper.utarc(-12*sla.d2r, transit.tsouth, transit.ret.dec, "+");
        let ut3 = helper.utarc(-18*sla.d2r, transit.tsouth, transit.ret.dec, "+");
        let utczero = Math.floor(this.utcMidnight);
        while (this.utcMidnight - (utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2])) < 0) {
            utczero -= 1;
        }
        this.Sunset = utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2]);
        let next = sla.djcl(this.Sunset);
        this.tSunset = [next.iy, next.im, next.id, ut1[0], ut1[1], parseFloat(ut1[2]+"."+ut1[3])];
        this.ENauTwilight = utczero + sla.dtf2d(ut2[0], ut2[1], ut2[2]);
        if (ut2[0] < ut1[0]) {
            this.ENauTwilight += 1;
        }
        this.EAstTwilight = utczero + sla.dtf2d(ut3[0], ut3[1], ut3[2]);
        if (ut3[0] < ut1[0]) {
            this.EAstTwilight += 1;
        }
        let sret = sla.rdplan(this.Sunset + this.dut, "Sun", Driver.obsLonRad, Driver.obsLatRad);
        let mret = sla.rdplan(this.Sunset + this.dut, "Moon", Driver.obsLonRad, Driver.obsLatRad);
        let sep = sla.dsep(sret.ra, sret.dec, mret.ra, mret.dec);
        this.MoonIllStart = (1 - Math.cos(sep)) * 0.5 * 100;
        this.stlSunset = helper.stl(this.Sunset, this.eqeqx);

        // Next noon; sunrise; morning twilight
        transit = helper.findTransit(this.utcMidnight+0.5, this.dut, "Sun", this.eqeqx);
        ut1 = helper.utarc(-0.5*transit.ret.diam - this.RefractionAtHorizon - this.HorizonDip, transit.tsouth, transit.ret.dec, "-");
        ut2 = helper.utarc(-12*sla.d2r, transit.tsouth, transit.ret.dec, "-");
        ut3 = helper.utarc(-18*sla.d2r, transit.tsouth, transit.ret.dec, "-");
        utczero = Math.floor(this.utcMidnight);
        while ((utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2])) - this.utcMidnight < 0) {
            utczero += 1;
        }
        this.Sunrise = utczero + sla.dtf2d(ut1[0], ut1[1], ut1[2]);
        next = sla.djcl(this.Sunrise);
        this.tSunrise = [next.iy, next.im, next.id, ut1[0], ut1[1], parseFloat(ut1[2]+"."+ut1[3])];
        this.MNauTwilight = utczero + sla.dtf2d(ut2[0], ut2[1], ut2[2]);
        if (ut2[0] > ut1[0]) {
            this.MNauTwilight -= 1;
        }
        this.MAstTwilight = utczero + sla.dtf2d(ut3[0], ut3[1], ut3[2]);
        if (ut3[0] > ut1[0]) {
            this.MAstTwilight -= 1;
        }
        sret = sla.rdplan(this.Sunrise + this.dut, "Sun", Driver.obsLonRad, Driver.obsLatRad);
        mret = sla.rdplan(this.Sunrise + this.dut, "Moon", Driver.obsLonRad, Driver.obsLatRad);
        sep = sla.dsep(sret.ra, sret.dec, mret.ra, mret.dec);
        this.MoonIllEnd = (1 - Math.cos(sep)) * 0.5 * 100;
        this.stlSunrise = helper.stl(this.Sunrise, this.eqeqx);

        switch ($('input[type="radio"][name="opt_schedule_between"]:checked').val()) {
        case "sunset-sunrise":
            this.globalUTStart = this.Sunset;
            this.globalUTEnd = this.Sunrise;
            break;
        case "astronomical":
            this.globalUTStart = this.EAstTwilight;
            this.globalUTEnd = this.MAstTwilight;
            break;
        default:
            this.globalUTStart = this.ENauTwilight;
            this.globalUTEnd = this.MNauTwilight;
        }

        this.wnight = this.Sunrise - this.Sunset; // Length of the night in days
        this.xstep = this.wnight / this.Nx; // Resolution of the time array
        let aop;

        this.xaxis = [];
        this.ymoon = [];
        this.rmoon = [];
        this.ramoon = [];
        this.decmoon = [];
        this.LSTangles = [];
        for (let i = 0; i < this.Nx; i += 1) { // ... and its initialization
            const ut = this.Sunset + this.xstep * i;
            this.xaxis.push(ut);
            if (i === 0) {
                aop = sla.aoppa(ut, this.dut*sla.d2s, Driver.obsLonRad, Driver.obsLatRad, Driver.obsAltitude, 0, 0, siteTemp, 0, siteHum, siteWvlen, config.refractionTLR);
            } else {
                sla.aoppat(ut, aop);
            }
            this.aoprms[i] = Object.assign({}, aop);
            this.amprms[i] = sla.mappa(2000, ut + this.dut);
            // Apparent RA, Dec of Moon
            let ret = sla.rdplan(ut + this.dut, "Moon", Driver.obsLonRad, Driver.obsLatRad);
            this.ramoon.push(ret.ra);
            this.decmoon.push(ret.dec);
            const diam = ret.diam;
            // Topocentric zd of Moon WITHOUT refraction
            ret = sla.aopqk(ret.ra, ret.dec, aop);
            // Approximate refracted alt
            const ell = sla.pihalf - sla.refz(ret.zob, this.ref.refa, this.ref.refb);
            this.ymoon.push(sla.r2d * ell);
            this.rmoon.push(0.5*diam);
            // LST angles
            const lstangle = sla.dranrm(sla.gmst(ut) + Driver.obsLonRad) + this.eqeqx;
            this.LSTangles.push(lstangle);
        }
        this.DateSunset = new Date(Date.UTC(this.tSunset[0], this.tSunset[1]-1, this.tSunset[2], this.tSunset[3], this.tSunset[4], this.tSunset[5], 0));
        this.DateSunrise = new Date(Date.UTC(this.tSunrise[0], this.tSunrise[1]-1, this.tSunrise[2], this.tSunrise[3], this.tSunrise[4], this.tSunrise[5], 0));
        this.DarkTime = (this.MAstTwilight - this.EAstTwilight);
        this.NightLength = (this.globalUTEnd - this.globalUTStart);
        // Calculate UTC labels
        this.UTCtimes = [];
        this.UTClabels = [];
        const startUTC = helper.mjdToUTCHours(this.Sunset);
        const firstUTC = Math.ceil(startUTC);
        for (let h = 0; h < 48; h += 1) {
            const hour = (firstUTC + h) % 24;
            const dayOffset = Math.floor((firstUTC + h) / 24);
            const djutc = Math.floor(this.Sunset) + dayOffset + hour / 24;
            if (djutc >= this.Sunrise) {
                break;
            }
            this.UTCtimes.push(djutc);
            this.UTClabels.push(hour === 0 ? "24" : hour.toString());
        }
        // Calculate LST labels
        this.LocalTimetimes = [];
        this.LocalTimelabels = [];
        const ltSunset = moment.tz(this.DateSunset, Driver.timezoneName);
        let ltStart = ltSunset.clone().set("minutes", 0).set("seconds", 0).set("milliseconds", 0);
        if (ltStart.unix() !== ltSunset.unix()) {
            ltStart.add(1, "hours");
        }
        while (ltStart < this.DateSunrise) {
            // Calculate Labels
            const djutc = helper.getMJD(ltStart);
            const localHour = ltStart.hour();
            // LST calculation
            const stl = sla.dr2tf(1, sla.dranrm(sla.gmst(djutc) + Driver.obsLonRad) + this.eqeqx);
            this.LSTlabels.push(`${stl.ihmsf[0]}:${stl.ihmsf[1] < 10 ? "0" : ""}${stl.ihmsf[1].toFixed(0)}`);
            this.LocalTimetimes.push(djutc);
            this.LocalTimelabels.push(localHour === 0 ? "24" : localHour.toString());
            // Advance
            ltStart.add(1, "hours");
        }
        // Moon stuff
        this.MoonIllMin = Math.max(Math.floor(Math.min(this.MoonIllStart, this.MoonIllEnd)), 0);
        this.MoonIllMax = Math.min(Math.ceil(Math.max(this.MoonIllStart, this.MoonIllEnd)), 100);
        this.MoonIllumination = Math.max(this.MoonIllStart, this.MoonIllEnd); // Maximum moon illumination throughout the night
        if (this.MoonIllMin === this.MoonIllMax) {
            this.MoonIlluminationString = `${this.MoonIllMin}%`;
        } else {
            this.MoonIlluminationString = `${this.MoonIllMin} – ${this.MoonIllMax}%`;
        }
        this.Moonrise = 0;
        const lim = -sla.r2d * this.HorizonDip;
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
            for (let i = this.Nx-2; i >= 0; i -= 1) {
                if (this.ymoon[i] > lim) {
                    this.Moonset = this.xaxis[i+1];
                    this.Moonset = this.xaxis[i+1] + (lim-sla.r2d*this.rmoon[i]- this.ymoon[i+1])*(this.xaxis[i+1]-this.xaxis[i])/(this.ymoon[i+1]-this.ymoon[i]);
                    break;
                }
            }
        }
        driver.targets.StartingAt = this.Sunset;

        // Remove cached ephemerides
        helper.LogDebug("Cleaning up cached ephemerides...");
        driver.resolvedEphemerides = {};
        driver.resolvedIdentifiers = {};
    } catch (ex) {
        helper.LogException(ex);
    }
};
