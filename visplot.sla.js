/**
 * @file SLALIB subroutines used by Visplot, ported to JavaScript.
 * @author Emanuel Gafton
 * 
 * @copyright 2016-2021 Emanuel Gafton, NOT/ING.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See LICENSE.md.
 */

/* @constant {Number} Earth equatorial radius (metres) */
sla.a0 = 6378140;
/* @constant {Number} Astronomical unit in metres */
sla.au = 1.49597870e11;
/* @constant {Number} Astronomical unit in km */
sla.aukm = 1.49597870e8;
/* @constant {Number} Light time for unit distance (sec) */
sla.tau = 499.004782;
/* @constant {Number} Reference spheroid flattening factor */
sla.sf = 1 / 298.257;
/* @constant {Number} Reference spheroid useful function */
sla.sb = Math.pow(1 - sla.sf, 2);
/* @constant {Number} Julian epoch of B1950 */
sla.b1950 = 1949.9997904423;
/* @constant {Number} Seconds per Julian century (86400*36525) */
sla.cj = 3155760000;
sla.spc = sla.cj;
/* @constant {Number} Two pi */
sla.d2pi = 2 * Math.PI;
/* @constant {Number} Degrees of time to radians */
sla.d2r = 0.0174532925199432957692369;
/* @constant {Number} Seconds in a day */
sla.d2s = 86400;
/* @constant {Number} Arc seconds of time to radians */
sla.das2r = 4.848136811095359935899141e-6;
/* @constant {Number} Degrees to radians */
sla.dd2r = 1.745329251994329576923691e-2;
/* @constant {Number} Days per Julian century */
sla.djc = 36525;
/* @constant {Number} Reference epoch (J2000), MJD */
sla.djm0 = 51544.5;
/* @constant {Number} Seconds of time to radians */
sla.ds2r = 7.272205216643039903848712e-5;
/* @constant {Number} Earth equatorial radius in AU (= 6378.137 / 149597870 ) */
sla.eradau = 4.2635212653763e-5;
/* @constant {Number} Mean sidereal rate (at J2000) in radians per UT1 second */
sla.sr = 7.292115855306589e-5;
/* @constant {Number} Arc seconds in a full circle */
sla.t2as = 1296000;
/* @constant {Number} Turns to radians */
sla.t2r = sla.d2pi;
/* @constant {Number} Hours to degrees * radians to turns */
sla.f = 15 / sla.t2r;
/* @constant {Number} Gaussian gravitational constant (exact) */
sla.gcon = 0.01720209895;
/* @constant {Number} Canonical days to seconds */
sla.cd2s = sla.gcon / sla.d2s;
/* @constant {Number} Sin and cos of J2000 mean obliquity (IAU 1976) */
sla.se = 0.3977771559319137;
sla.ce = 0.9174820620691818;
/* @constant {Number} Radians to degrees */
sla.r2d = 57.29577951308232;
/* @constant {Number} Gravitational radius of the Sun x 2 (2*mu/c**2, AU) */
sla.gr2 = 2 * 9.87063e-9;
/* @constant {Number} Ratio between solar and sidereal time */
sla.solsid = 1.00273790935;
/* @constant {Number} Speed of light (AU per day) */
sla.c = 173.14463331;
/* @constant {Number} Km/s to AU/year */
sla.vf = 0.21094502;

/**
 * @summary **Air Mass**
 * @param {Number} zd - Observed zenith distance (radians).
 * @returns {Number} Air mass (1 at zenith).
 * @description Air mass at given zenith distance.
 * 1. The *observed* zenith distance referred to above means “as affected by
 *    refraction”.
 * +  The routine uses Hardie’s (1962) polynomial fit to Bemporad’s data
 *    for the relative air mass, X, in units of thickness at the zenith as
 *    tabulated by Schoenberg (1929). This is adequate for all normal needs
 *    as it is accurate to better than 0.1% up to X=6.8 and better than 1%
 *    up to X=10. Bemporad’s tabulated values are unlikely to be trustworthy
 *    to such accuracy because of variations in density, pressure and other
 *    conditions in the atmosphere from those assumed in his work.
 * +  The sign of the ZD is ignored.
 * +  At zenith distances greater than about ζ=87° the air mass is held
 *    constant to avoid arithmetic overflows.
 * ----------
 * References:
 * - Hardie, R.H., 1962, in *Astronomical Techniques* ed. W.A. Hiltner,
 *   University of Chicago Press, p.180.
 * - Schoenberg, E., 1929, Hdb. d. Ap., Berlin, Julius Springer, 2, 268.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss3.html}
 */
sla.airmas = function (zd) {
    "use strict";
    var seczm1 = 1 / (Math.cos(Math.min(1.52, Math.abs(zd)))) - 1;
    return 1 + seczm1 * (0.9981833 -
            seczm1 * (0.002875 + 0.0008083 * seczm1));
};

/**
 * @summary **Apparent to Observed**
 * @param {Number} rap - geocentric apparent *α* (radians)
 * @param {Number} dap - geocentric apparent *δ* (radians)
 * @param {Number} date - UTC date/time (Modified Julian Date, JD−2400000.5)
 * @param {Number} dut - ΔUT: UT1−UTC (UTC seconds)
 * @param {Number} elongm - observer’s mean longitude (radians, east +ve)
 * @param {Number} phim - observer’s mean geodetic latitude (radians)
 * @param {Number} hm - observer’s height above sea level (metres)
 * @param {Number} xp - polar motion *x* coordinate (radians)
 * @param {Number} yp - polar motion *y* coordinate (radians)
 * @param {Number} tdk - local ambient temperature (K; std=273.15)
 * @param {Number} pmb - local atmospheric pressure (mb; std=1013.25)
 * @param {Number} rh - local relative humidity (in the range 0−1)
 * @param {Number} wl - effective wavelength (μm, e.g. 0.55)
 * @param {Number} tlr - tropospheric lapse rate (K per metre, e.g. 0.0065)
 * @returns {Object} aob - observed azimuth (radians: N=0, E=90°)
 *                   zob - observed zenith distance (radians)
 *                   hob - observed Hour Angle (radians)
 *                   dob - observed *δ* (radians)
 *                   rob - observed *α* (radians)
 * @description Apparent to observed place, for sources distant from the
 *              solar system.
 * 1. This routine returns zenith distance rather than elevation in order to
 *    reflect the fact that no allowance is made for depression of the horizon.
 * +  The accuracy of the result is limited by the corrections for refraction.
 *    Providing the meteorological parameters are known accurately and there
 *    are no gross local effects, the predicted azimuth and elevation should
 *    be within about ′′01 for ζ<70°. Even at a topocentric zenith distance of
 *    90°, the accuracy in elevation should be better than 1 arcminute; useful
 *    results are available for a further 3°, beyond which the {@link sla.refro}
 *    routine returns a fixed value of the refraction. The complementary
 *    routines {@link sla.aop} (or {@link sla.aopqk}) and {@link sla.oap} (or
 *    {@link sla.oapqk} are self-consistent to better than 1 microarcsecond all
 *    over the celestial sphere.
 * +  It is advisable to take great care with units, as even unlikely values
 *    of the input parameters are accepted and processed in accordance with
 *    the models used.
 * +  *Apparent* [*α*,*δ*] means the geocentric apparent right ascension and
 *    declination, which is obtained from a catalogue mean place by allowing
 *    for space motion, parallax, the Sun’s gravitational lens effect, annual
 *    aberration, and precession-nutation. For star positions in the FK5 system
 *    (i.e. J2000), these effects can be applied by means of the {@link sla.map}
 *    etc. routines. Starting from other mean place systems, additional
 *    transformations will be needed; for example, FK4 (i.e. B1950) mean places
 *    would first have to be converted to FK5, which can be done with the
 *    {@link sla.fk425} etc. routines.
 * +  *Observed* [*Az*,*El*] means the position that would be seen by a perfect
 *    theodolite located at the observer. This is obtained from the geocentric
 *    apparent [*α*,*δ*] by allowing for Earth orientation and diurnal
 *    aberration, rotating from equator to horizon coordinates, and then
 *    adjusting for refraction. The [*h*,*δ*] is obtained by rotating back into
 *    equatorial coordinates, using the geodetic latitude corrected for polar
 *    motion, and is the position that would be seen by a perfect equatorial
 *    located at the observer and with its polar axis aligned to the Earth’s
 *    axis of rotation (n.b. not to the refracted pole). Finally, the *α* is
 *    obtained by subtracting the *h* from the local apparent ST.
 * +  To predict the required setting of a real telescope, the observed place
 *    produced by this routine would have to be adjusted for the tilt of the
 *    azimuth or polar axis of the mounting (with appropriate corrections for
 *    mount flexures), for non-perpendicularity between the mounting axes, for
 *    the position of the rotator axis and the pointing axis relative to it,
 *    for tube flexure, for gear and encoder errors, and finally for encoder
 *    zero points. Some telescopes would, of course, exhibit other properties
 *    which would need to be accounted for at the appropriate point in the
 *    sequence.
 * +  This routine takes time to execute, due mainly to the rigorous integration
 *    used to evaluate the refraction. For processing multiple stars for one
 *    location and time, call {@link sla.aoppa} once followed by one call per
 *    star to {@link sla.aopqk}. Where a range of times within a limited period
 *    of a few hours is involved, and the highest precision is not required,
 *    call {@link sla.aoppa} once, followed by a call to {@link sla.aoppat}
 *    each time the time changes, followed by one call per star to
 *    {@link sla.aopqk}.
 * +  The DATE argument is UTC expressed as an MJD. This is, strictly speaking,
 *    wrong, because of leap seconds. However, as long as the ΔUT and the UTC
 *    are consistent there are no difficulties, except during a leap second.
 *    In this case, the start of the 61st second of the final minute should
 *    begin a new MJD day and the old pre-leap ΔUT should continue to be used.
 *    As the 61st second completes, the MJD should revert to the start of the
 *    day as, simultaneously, the ΔUT changes by one second to its post-leap
 *    new value.
 * +  The ΔUT (UT1−UTC) is tabulated in IERS circulars and elsewhere. It
 *    increases by exactly one second at the end of each UTC leap second,
 *    introduced in order to keep ΔUT within ±0.9s.
 * +  IMPORTANT − TAKE CARE WITH THE LONGITUDE SIGN CONVENTION. The longitude
 *    required by the present routine is **east-positive**, in accordance with
 *    geographical convention (and right-handed). In particular, note that
 *    the longitudes returned by the {@link sla.obs} routine are west-positive
 *    (as in the *Astronomical Almanac* before 1984) and must be reversed in
 *    sign before use in the present routine.
 * +  The polar coordinates XP,YP can be obtained from IERS circulars and
 *    equivalent publications. The maximum amplitude is about ′′03. If XP,YP
 *    values are unavailable, use XP=YP=0. See page B60 of the 1988
 *    *Astronomical Almanac* for a definition of the two angles.
 * +  The height above sea level of the observing station, HM, can be obtained
 *    from the *Astronomical Almanac* (Section J in the 1988 edition), or via
 *    the routine {@link sla.obs}. If P, the pressure in millibars, is
 *    available, an adequate estimate of HM can be obtained from the following
 *    expression:
 *        HM = -29.3 * TSL * Math.log(P / 1013.25)
 *    where TSL is the approximate sea-level air temperature in K (see
 *    *Astrophysical Quantities*, C.W.Allen, 3rd edition, §52). Similarly, if
 *    the pressure P is not known, it can be estimated from the height of the
 *    observing station, HM as follows:
 *        P = 1013.25 * Math.exp(-HM / (29.3 * TSL))
 *    Note, however, that the refraction is nearly proportional to the pressure
 *    and that an accurate P value is important for precise work.
 * +  The azimuths etc. used by the present routine are with respect to the
 *    celestial pole. Corrections to the terrestrial pole can be computed using
 *    {@link sla.polmo}.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss7.html}
 */
sla.aop = function (rap, dap, date, dut, elongm, phim, hm, xp, yp,
        tdk, pmb, rh, wl, tlr) {
    "use strict";
    /* Star-independent parameters */
    var aoprms = sla.aoppa(date, dut, elongm, phim, hm, xp, yp,
            tdk, pmb, rh, wl, tlr);
    /* Apparent to observed */
    return sla.aopqk(rap, dap, aoprms);
};

/**
 * @summary **Appt-to-Obs Parameters**
 * @param {Number} date - UTC date/time (Modified Julian Date, JD–2400000.5)
 * @param {Number} dut - \Delta UT: UT1–UTC (UTC seconds)
 * @param {Number} elongm - observer’s mean longitude (radians, east +ve)
 * @param {Number} phim - observer’s mean geodetic latitude (radians)
 * @param {Number} hm - observer’s height above sea level (metres)
 * @param {Number} xp, yp - polar motion [x,y] coordinates (radians)
 * @param {Number} tdk - local ambient temperature (K; std=273.15)
 * @param {Number} pmb - local atmospheric pressure (mb; std=1013.25)
 * @param {Number} rh - local relative humidity (in the range 0–1)
 * @param {Number} wl - effective wavelength (um, e.g. 0.55)
 * @param {Number} tlr - tropospheric lapse rate (K per metre, e.g. 0.0065)
 * @returns {Array} star-independent apparent-to-observed parameters:
 *                  [0] geodetic latitude (radians)
 *                  [1,2] sine and cosine of geodetic latitude
 *                  [3] magnitude of diurnal aberration vector
 *                  [4] height (HM)
 *                  [5] ambient temperature (TDK)
 *                  [6] pressure (PMB)
 *                  [7] relative humidity (RH)
 *                  [8] wavelength (WL)
 *                  [9] lapse rate (TLR)
 *                  [10,11] refraction constants A and B (radians)
 *                  [12] longitude + eqn of equinoxes + “sidereal dUT” (radians)
 *                  [13] local apparent sidereal time (radians)
 * @description Pre-compute the set of apparent to observed place parameters
 *              required by the “quick” routines {@link sla.aopqk} and
 *              {@link sla.oapqk}.
 * 1. It is advisable to take great care with units, as even unlikely values
 *    of the input parameters are accepted and processed in accordance with
 *    the models used.
 * +  The DATE argument is UTC expressed as an MJD. This is, strictly speaking,
 *    wrong, because of leap seconds. However, as long as the ΔUT and the UTC
 *    are consistent there are no difficulties, except during a leap second.
 *    In this case, the start of the 61st second of the final minute should
 *    begin a new MJD day and the old pre-leap ΔUT should continue to be used.
 *    As the 61st second completes, the MJD should revert to the start of the
 *    day as, simultaneously, the ΔUT changes by one second to its post-leap
 *    new value.
 * +  The ΔUT (UT1−UTC) is tabulated in IERS circulars and elsewhere. It
 *    increases by exactly one second at the end of each UTC leap second,
 *    introduced in order to keep ΔUT within ±0.9s.
 * +  IMPORTANT − TAKE CARE WITH THE LONGITUDE SIGN CONVENTION. The longitude
 *    required by the present routine is **east-positive**, in accordance with
 *    geographical convention (and right-handed). In particular, note that
 *    the longitudes returned by the {@link sla.obs} routine are west-positive
 *    (as in the *Astronomical Almanac* before 1984) and must be reversed in
 *    sign before use in the present routine.
 * +  The polar coordinates XP,YP can be obtained from IERS circulars and
 *    equivalent publications. The maximum amplitude is about ′′03. If XP,YP
 *    values are unavailable, use XP=YP=0. See page B60 of the 1988
 *    *Astronomical Almanac* for a definition of the two angles.
 * +  The height above sea level of the observing station, HM, can be obtained
 *    from the *Astronomical Almanac* (Section J in the 1988 edition), or via
 *    the routine {@link sla.obs}. If P, the pressure in millibars, is
 *    available, an adequate estimate of HM can be obtained from the following
 *    expression:
 *        HM = -29.3 * TSL * Math.log(P / 1013.25)
 *    where TSL is the approximate sea-level air temperature in K (see
 *    *Astrophysical Quantities*, C.W.Allen, 3rd edition, §52). Similarly, if
 *    the pressure P is not known, it can be estimated from the height of the
 *    observing station, HM as follows:
 *        P = 1013.25 * Math.exp(-HM / (29.3 * TSL))
 *    Note, however, that the refraction is nearly proportional to the pressure
 *    and that an accurate P value is important for precise work.
 * +  Repeated, computationally-expensive, calls to {@link sla.aoppa} for times
 *    that are very close together can be avoided by calling {@link sla.aoppa}
 *    just once and then using {@link sla.aoppat} for the subsequent times.
 *    Fresh calls to {@link sla.aoppa} will be needed only when changes in the
 *    precession have grown to unacceptable levels or when anything affecting
 *    the refraction has changed.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss8.html}
 */
sla.aoppa = function (date, dut, elongm, phim, hm, xp, yp,
        tdk, pmb, rh, wl, tlr) {
    "use strict";
    var aoprms = [];

    /* Observer's location corrected for polar motion */
    var cphim = Math.cos(phim);
    var xt = Math.cos(elongm) * cphim;
    var yt = Math.sin(elongm) * cphim;
    var zt = Math.sin(phim);
    var xc = xt - xp * zt;
    var yc = yt + yp * zt;
    var zc = xp * xt - yp * yt + zt;
    var elong;
    if (xc === 0 && yc === 0) {
        elong = 0;
    } else {
        elong = Math.atan2(yc, xc);
    }
    var phi = Math.atan2(zc, Math.sqrt(xc * xc + yc * yc));
    aoprms[0] = phi;
    aoprms[1] = Math.sin(phi);
    aoprms[2] = Math.cos(phi);

    /* Magnitude of the diurnal aberration vector */
    var ret = sla.geoc(phi, hm);
    aoprms[3] = sla.d2pi * ret.r * sla.solsid / sla.c;

    /* Copy the refraction parameters and compute the A & B constants */
    aoprms[4] = hm;
    aoprms[5] = tdk;
    aoprms[6] = pmb;
    aoprms[7] = rh;
    aoprms[8] = wl;
    aoprms[9] = tlr;
    ret = sla.refco(hm, tdk, pmb, rh, wl, phi, tlr, 1e-10);
    aoprms[10] = ret.refa;
    aoprms[11] = ret.refb;

    /* Longitude + equation of the equinoxes + sidereal equivalent of DUT
     *  (ignoring change in equation of the equinoxes between UTC and TDB) */
    aoprms[12] = elong + sla.eqeqx(date) + dut * sla.solsid * sla.ds2r;

    /* Sidereal time */
    sla.aoppat(date, aoprms);
    return aoprms;
};

/**
 * @summary **Update Appt-to-Obs Parameters**
 * @param {Number} date - UTC date/time (modified Julian Date, JD-2400000.5)
 *                        (see {@link sla.aoppa} for comments on leap seconds)
 * @param {Array} aoprms - Star-independent apparent-to-observed parameters
 *                [0-11] not required
 *                [12] longitude + eqn of equinoxes + sidereal DUT
 *                [13] not required
 * @returns {Array} Star-independent apparent-to-observed parameters:
 *                  [0-12] not changed
 *                  [13] local apparent sidereal time (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss9.html}
 * @description Recompute the sidereal time in the apparent to observed place
 *              star-independent parameter block.
 * - For more information, see {@link sla.aoppa}.
 */
sla.aoppat = function (date, aoprms) {
    "use strict";
    aoprms[13] = sla.gmst(date) + aoprms[12];
};

/**
 * @summary **Quick Appt-to-Observed**
 * @param {Number} rap - Geocentric apparent α (radians)
 * @param {Number} dap - Geocentric appanret δ (radians)
 * @param {Array} aoprms - Star-independent apparent-to-observed parameters:
 * @returns {Array} [0] aob - observed azimuth (radians)
 *                  [1] zob - observed zenith distance (radians)
 *                  [2] hob - observed Hour Angle (radians)
 *                  [3] dob - observed Declination (radians)
 *                  [4] rob - observed Right Ascension (radians)
 * @description Quick apparent to observed place (but see Note 8, below).
 * 1. This routine returns zenith distance rather than elevation in order to
 *    reflect the fact that no allowance is made for depression of the horizon.
 * +  The accuracy of the result is limited by the corrections for refraction.
 *    Providing the meteorological parameters are known accurately and there
 *    are no gross local effects, the predicted azimuth and elevation should
 *    be within about ′′01 for ζ<70°. Even at a topocentric zenith distance of
 *    90°, the accuracy in elevation should be better than 1 arcminute; useful
 *    results are available for a further 3°, beyond which the {@link sla.refro}
 *    routine returns a fixed value of the refraction. The complementary
 *    routines {@link sla.aop} (or {@link sla.aopqk}) and {@link sla.oap} (or
 *    {@link sla.oapqk} are self-consistent to better than 1 microarcsecond all
 *    over the celestial sphere.
 * +  It is advisable to take great care with units, as even unlikely values
 *    of the input parameters are accepted and processed in accordance with
 *    the models used.
 * +  *Apparent* [*α*,*δ*] means the geocentric apparent right ascension and
 *    declination, which is obtained from a catalogue mean place by allowing
 *    for space motion, parallax, the Sun’s gravitational lens effect, annual
 *    aberration, and precession-nutation. For star positions in the FK5 system
 *    (i.e. J2000), these effects can be applied by means of the {@link sla.map}
 *    etc. routines. Starting from other mean place systems, additional
 *    transformations will be needed; for example, FK4 (i.e. B1950) mean places
 *    would first have to be converted to FK5, which can be done with the
 *    {@link sla.fk425} etc. routines.
 * +  *Observed* [*Az*,*El*] means the position that would be seen by a perfect
 *    theodolite located at the observer. This is obtained from the geocentric
 *    apparent [*α*,*δ*] by allowing for Earth orientation and diurnal
 *    aberration, rotating from equator to horizon coordinates, and then
 *    adjusting for refraction. The [*h*,*δ*] is obtained by rotating back into
 *    equatorial coordinates, using the geodetic latitude corrected for polar
 *    motion, and is the position that would be seen by a perfect equatorial
 *    located at the observer and with its polar axis aligned to the Earth’s
 *    axis of rotation (n.b. not to the refracted pole). Finally, the *α* is
 *    obtained by subtracting the *h* from the local apparent ST.
 * +  To predict the required setting of a real telescope, the observed place
 *    produced by this routine would have to be adjusted for the tilt of the
 *    azimuth or polar axis of the mounting (with appropriate corrections for
 *    mount flexures), for non-perpendicularity between the mounting axes, for
 *    the position of the rotator axis and the pointing axis relative to it,
 *    for tube flexure, for gear and encoder errors, and finally for encoder
 *    zero points. Some telescopes would, of course, exhibit other properties
 *    which would need to be accounted for at the appropriate point in the
 *    sequence.
 * +  The star-independent apparent-to-observed-place parameters in AOPRMS may
 *    be computed by means of the {@link sla.aoppa} routine. If nothing has
 *    changed significantly except the time, the {@link sla.aoppat} routine may
 *    be used to perform the requisite partial recomputation of AOPRMS.
 * +  At zenith distances beyond about 76°, the need for special care with the
 *    corrections for refraction causes a marked increase in execution time.
 *    Moreover, the effect gets worse with increasing zenith distance. Adroit
 *    programming in the calling application may allow the problem to be
 *    reduced. Prepare an alternative AOPRMS array, computed for zero
 *    air-pressure; this will disable the refraction corrections and cause
 *    rapid execution. Using this AOPRMS array, a preliminary call to the
 *    present routine will, depending on the application, produce a rough
 *    position which may be enough to establish whether the full, slow
 *    calculation (using the real AOPRMS array) is worthwhile. For example,
 *    there would be no need for the full calculation if the preliminary call
 *    had already established that the source was well below the elevation
 *    limits for a particular telescope.
 * +  The azimuths etc. used by the present routine are with respect to the
 *    celestial pole. Corrections to the terrestrial pole can be computed using
 *    {@link sla.polmo}.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss10.html}
 */
sla.aopqk = function (rap, dap, aoprms) {
    "use strict";
    var zbreak = 0.242535625;
    /* Sin, cos of latitude */
    var sphi = aoprms[1];
    var cphi = aoprms[2];

    /* Local apparent sidereal time */
    var st = aoprms[13];

    /* Apparent RA,Dec to Cartesian -HA,Dec */
    var v = sla.dcs2c(rap - st, dap);
    var xhd = v[0];
    var yhd = v[1];
    var zhd = v[2];

    /* Diurnal aberration */
    var diurab = aoprms[3];
    var f = (1 - diurab * yhd);
    var xhdt = f * xhd;
    var yhdt = f * (yhd + diurab);
    var zhdt = f * zhd;

    /* Cartesian -HA,Dec to Cartesian Az,El (S=0,E=90) */
    var xaet = sphi * xhdt - cphi * zhdt;
    var yaet = yhdt;
    var zaet = cphi * xhdt + sphi * zhdt;

    /* Azimuth (N=0,E=90) */
    var azobs;
    if (xaet === 0 && yaet === 0) {
        azobs = 0;
    } else {
        azobs = Math.atan2(yaet, -xaet);
    }

    /* Topocentric zenith distance */
    var zdt = Math.atan2(Math.sqrt(xaet * xaet + yaet * yaet), zaet);
    /* Refraction */
    var zdobs = sla.refz(zdt, aoprms[10], aoprms[11]);

    /* Large zenith distance? */
    if (Math.cos(zdobs) < zbreak) {
        /* Yes: use rigorous algorithm */
        /* Initialize loop (maximum of 10 iterations) */
        var i = 0;
        var dzd = 1;
        var dref;
        while (Math.abs(dzd) > 1e-10 && i < 10) {
            /* Compute refraction using current estimate of observed ZD */
            dref = sla.refro(zdobs, aoprms[4], aoprms[5], aoprms[6],
                    aoprms[7], aoprms[8], aoprms[0], aoprms[9], 1e-8);
            /* Remaining discrepancy */
            dzd = zdobs + dref - zdt;
            /* Update the estimate */
            zdobs -= dzd;
            /* Increment the iteration counter */
            i += 1;
        }
    }

    /* To Cartesian Az/ZD */
    var ce = Math.sin(zdobs);
    var xaeo = -Math.cos(azobs) * ce;
    var yaeo = Math.sin(azobs) * ce;
    var zaeo = Math.cos(zdobs);

    /* Cartesian Az/ZD to Cartesian -HA,Dec */
    v[0] = sphi * xaeo + cphi * zaeo;
    v[1] = yaeo;
    v[2] = -cphi * xaeo + sphi * zaeo;

    /* To spherical -HA,Dec */
    var ret = sla.dcc2s(v);
    var hmobs = ret.a;
    var dcobs = ret.b;

    /* Right Ascension */
    var raobs = sla.dranrm(st + hmobs);

    /* Return the results */
    return {
        aob: azobs,
        zob: zdobs,
        hob: -hmobs,
        dob: dcobs,
        rob: raobs
    };
};

/**
 * @summary **Atmospheric Dispersion**
 * @param {Number} tdk - ambient temperature at the observer (K)
 * @param {Number} pmb - pressure at the observer (mb)
 * @param {Number} rh - relative humidity at the observer (range 0-1)
 * @param {Number} wl1 - base wavelength (um)
 * @param {Number} a1 - refraction coefficient A for wavelength WL1 (radians)
 * @param {Number} b1 - refraction coefficient B for wavelength WL1 (radians)
 * @param {Number} wl2 - wavelength for which adjusted A,B required (um)
 * @returns {Object} a2 - refraction coefficient A for wavelength WL2 (radians)
 *                   b2 - refraction coefficient B for wavelength WL2 (radians)
 * @description Apply atmospheric-dispersion adjustments to refraction
 *              coefficients.
 * 1. To use this routine, first call {@link sla.refco} specifying WL1 as the
 *    wavelength. This yields refraction coefficients A1, B1, correct for that
 *    wavelength. Subsequently, calls to {@link sla.atmdsp} specifying different
 *    wavelengths will produce new, slightly adjusted refraction coefficients
 *    A2, B2, which apply to the specified wavelength.
 * +  Most of the atmospheric dispersion happens between 0.7μm and the UV
 *    atmospheric cutoff, and the effect increases strongly towards the UV end.
 *    For this reason a blue reference wavelength is recommended, for example
 *    0.4μm.
 * +  The accuracy, for this set of conditions:
 *        height above sea level | 2000 m
 *                      latitude | 29°
 *                      pressure | 793 mb
 *                   temperature | 290 K
 *                      humidity | 0.5 (50%)
 *                    lapse rate | 0.0065 K/m
 *          reference wavelength | 0.4 μm
 *                star elevation | 15°
 *    is about 2.5 mas RMS between 0.3 and 1.0μm, and stays within 4 mas for
 *    the whole range longward of 0.3μm (compared with a total dispersion from
 *    0.3 to 20μm of about 11′′). These errors are typical for ordinary
 *    conditions; in extreme conditions values a few times this size may occur.
 * +  If either wavelength exceeds 100μm, the radio case is assumed and the
 *    returned refraction coefficients are the same as the given ones. Note that
 *    radio refraction coefficients cannot be turned into optical values using
 *    this routine, nor vice versa.
 * +  The algorithm consists of calculation of the refractivity of the air at
 *    the observer for the two wavelengths, using the methods of the
 *    {@link sla.refro} routine, and then scaling of the two refraction
 *    coefficients according to classical refraction theory. This amounts to
 *    scaling the A coefficient in proportion to (μ−1) and the B coefficient
 *    almost in the same ratio (see R.M.Green, *Spherical Astronomy*, Cambridge
 *    University Press, 1985).
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss11.html}
 */
sla.atmdsp = function (tdk, pmb, rh, wl1, a1, b1, wl2) {
    "use strict";
    /* Check for radio wavelengths */
    if (wl1 > 100 || wl2 > 100) {
        /* Radio: no dispersion */
        return {
            a2: a1,
            b2: b1
        };
    }
    /* Optical: keep arguments within safe bounds */
    var tdkok = Math.min(Math.max(tdk, 100), 500);
    var pmbok = Math.min(Math.max(pmb, 0), 10000);
    var rhok = Math.min(Math.max(rh, 0), 1);

    /* Atmosphere parameters at the observer */
    var psat = Math.pow(10, -8.7115 + 0.03477 * tdkok);
    var pw0 = rhok * psat;
    var w1 = 11.2684e-6 * pw0;

    /* Refractivity at the observer for first wavelength */
    var wlok = Math.max(wl1, 0.1);
    var wlsq = wlok * wlok;
    var w2 = 77.5317e-6 + (0.43909e-6 + 0.00367e-6 / wlsq) / wlsq;
    var dn1 = (w2 * pmbok - w1) / tdkok;
    if (dn1 === 0) {
        return {
            a2: a1,
            b2: b1
        };
    }

    /* Refractivity at the observer for second wavelength */
    wlok = Math.max(wl2, 0.1);
    wlsq = wlok * wlok;
    w2 = 77.5317e-6 + (0.43909e-6 + 0.00367e-6 / wlsq) / wlsq;
    var dn2 = (w2 * pmbok - w1) / tdkok;

    /* Scale the refraction coefficients (see Green 4.31, p.93) */
    var f = dn2 / dn1;
    var a2 = a1 * f;
    var b2 = b1 * f;
    if (dn1 !== a1) {
        b2 = b2 * (1 + dn1 * (dn1 - dn2) / (2 * (dn1 - a1)));
    }
    return {
        a2: a2,
        b2: b2
    };
};

/**
 * Gregorian Calendar to Modified Julian Date.
 * @summary Calendar to MJD
 * @param {Number} iy - Year in Gregorian calendar (-4699 or later)
 * @param {Number} im - Month in Gregorian calendar (1 to 12)
 * @param {Number} id - Day in Gregorian calendar (1 to 28-31)
 * @returns {Number} Modified Julian Date (JD-2400000.5) for 0h
 * @throws {RangeError} If the year, month, or day are out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss20.html}
 */
sla.cldj = function (iy, im, id) {
    "use strict";
    if (iy < -4699) {
        throw new RangeError("Bad year (j=1).");
    }
    if (im < 1 || im > 12) {
        throw new RangeError("Bad month (j=2).");
    }
    if (id < 1 || id > (new Date(iy, im, 0)).getDate()) {
        throw new RangeError("Bad day (j=3).");
    }
    return Math.floor((1461 * (iy - Math.floor((12 - im) / 10) + 4712)) / 4) +
            Math.floor((306 * ((im + 9) % 12) + 5) / 10) -
            Math.floor((3 * Math.floor((iy - Math.floor((12 - im) / 10) +
            4900) / 100)) / 4) + id - 2399904;
};

/**
 * Modified Julian Date to Gregorian Calendar Date, expressed in a form
 * convenient for formatting messages (namely rounded to a specified
 * precision, and with the fields stored in a single array).
 * @summary MJD to Gregorian for Output
 * @param {Number} ndp - number of decimal places of days in fraction
 * @param {Number} djm - modified Julian Date (JD-2400000.5)
 * @returns {Array} year, month, day, fraction in Gregorian calendar
 * @throws {RangeError} If the MJD is out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss45.html}
 */
sla.djcal = function (ndp, djm) {
    "use strict";
    /* Validate. */
    if (djm <= -2395520 || djm >= 1e9) {
        throw new RangeError("Date out of range (j=-1).");
    }

    /* Denominator of fraction. */
    var fd = Math.pow(10, Math.max(ndp, 0));

    /* Round date and express in units of fraction. */
    var df = Math.round(djm * fd);

    /* Separate day and fraction. */
    var f = df % fd;
    if (f < 0) {
        f += fd;
    }
    var d = (df - f) / fd;

    /* Express day in Gregorian calendar. */
    var jd = Math.round(d) + 2400001;

    var n4 = 4 * (Math.floor(jd + (Math.floor((2 * Math.floor((4 * jd -
            17918) / 146097) * 3) / 4) + 1) / 2) - 37);
    var nd10 = 10 * Math.floor(((n4 - 237) % 1461) / 4) + 5;

    return [
        Math.floor(n4 / 1461) - 4712,
        (Math.floor(nd10 / 306) + 2) % 12 + 1,
        Math.floor((nd10 % 306) / 10) + 1,
        Math.round(f)
    ];
};

/**
 * Modified Julian Date to Gregorian year, month, day, and fraction of a day.
 * @summary MJD to Year,Month,Day,Frac
 * @param {Number} djm - modified Julian Date (JD-2400000.5)
 * @returns {Object} iy - year, im - month, id - day
 *                   fd - fraction of day
 * @throws {RangeError} If the MJD is out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss46.html}
 */
sla.djcl = function (djm) {
    "use strict";
    /* Check if date is acceptable. */
    if (djm <= -2395520 || djm >= 1e9) {
        throw new RangeError("Date out of range (j=-1).");
    }

    /* Separate day and fraction. */
    var f = djm % 1;
    if (f < 0) {
        f += 1;
    }
    var d = Math.round(djm - f);

    /* Express day in Gregorian calendar. */
    var jd = Math.round(d) + 2400001;

    var n4 = 4 * (Math.floor(jd + (Math.floor((6 * Math.floor((4 * jd -
            17918) / 146097)) / 4) + 1) / 2) - 37);
    var nd10 = 10 * Math.floor(((n4 - 237) % 1461) / 4) + 5;

    return {
        iy: Math.floor(n4 / 1461) - 4712,
        im: (Math.floor(nd10 / 306) + 2) % 12 + 1,
        id: Math.floor((nd10 % 306) / 10) + 1,
        fd: f
    };
};

/**
 * Increment to be applied to Coordinated Universal Time UTC to give
 * International Atomic Time TAI.
 * @summary TAI-UTC
 * @param {Number} utc - Date as a modified JD (JD-2400000.5)
 * @returns {Number} TAI-UTC in seconds
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss31.html}
 */
sla.dat = function (utc) {
    "use strict";
    /* Add new code here on each occasion that a  *
       leap second is announced, and update the   *
       preamble comments appropriately. */

    if (utc >= 57754) { /* 2017-Jan-1 */
        return 37;
    }
    if (utc >= 57204) { /* 2015-Jul-1 */
        return 36;
    }
    if (utc >= 56109) { /* 2012-Jul-1 */
        return 35;
    }
    if (utc >= 54832) { /* 2009-Jan-1 */
        return 34;
    }
    if (utc >= 53736) { /* 2006-Jan-1 */
        return 33;
    }
    if (utc >= 51179) { /* 1999-Jan-1 */
        return 32;
    }
    if (utc >= 50630) { /* 1997-Jul-1 */
        return 31;
    }
    if (utc >= 50083) { /* 1996-Jan-1 */
        return 30;
    }
    if (utc >= 49534) { /* 1994-Jul-1 */
        return 29;
    }
    if (utc >= 49169) { /* 1993-Jul-1 */
        return 28;
    }
    if (utc >= 48804) { /* 1992-Jul-1 */
        return 27;
    }
    if (utc >= 48257) { /* 1991-Jan-1 */
        return 26;
    }
    if (utc >= 47892) { /* 1990-Jan-1 */
        return 25;
    }
    if (utc >= 47161) { /* 1988-Jan-1 */
        return 24;
    }
    if (utc >= 46247) { /* 1985-Jul-1 */
        return 23;
    }
    if (utc >= 45516) { /* 1983-Jul-1 */
        return 22;
    }
    if (utc >= 45151) { /* 1982-Jul-1 */
        return 21;
    }
    if (utc >= 44786) { /* 1981-Jul-1 */
        return 20;
    }
    if (utc >= 44239) { /* 1980-Jan-1 */
        return 19;
    }
    if (utc >= 43874) { /* 1979-Jan-1 */
        return 18;
    }
    if (utc >= 43509) { /* 1978-Jan-1 */
        return 17;
    }
    if (utc >= 43144) { /* 1977-Jan-1 */
        return 16;
    }
    if (utc >= 42778) { /* 1976-Jan-1 */
        return 15;
    }
    if (utc >= 42413) { /* 1975-Jan-1 */
        return 14;
    }
    if (utc >= 42048) { /* 1974-Jan-1 */
        return 13;
    }
    if (utc >= 41683) { /* 1973-Jan-1 */
        return 12;
    }
    if (utc >= 41499) { /* 1972-Jul-1 */
        return 11;
    }
    if (utc >= 41317) { /* 1972-Jan-1 */
        return 10;
    }
    if (utc >= 39887) { /* 1968-Feb-1 */
        return 4.213170 + (utc - 39126) * 0.0025920;
    }
    if (utc >= 39126) { /* 1966-Jan-1 */
        return 4.313170 + (utc - 39126) * 0.0025920;
    }
    if (utc >= 39004) { /* 1965-Sep-1 */
        return 3.840130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38942) { /* 1965-Jul-1 */
        return 3.740130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38820) { /* 1965-Mar-1 */
        return 3.640130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38761) { /* 1965-Jan-1 */
        return 3.540130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38639) { /* 1964-Sep-1 */
        return 3.440130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38486) { /* 1964-Apr-1 */
        return 3.340130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38395) { /* 1964-Jan-1 */
        return 3.240130 + (utc - 38761) * 0.0012960;
    }
    if (utc >= 38334) { /* 1963-Nov-1 */
        return 1.945858 + (utc - 37665) * 0.0011232;
    }
    if (utc >= 37665) { /* 1962-Jan-1 */
        return 1.845858 + (utc - 37665) * 0.0011232;
    }
    if (utc >= 37512) { /* 1961-Aug-1 */
        return 1.372818 + (utc - 37300) * 0.0012960;
    }
    if (utc >= 37300) { /* 1961-Jan-1 */
        return 1.422818 + (utc - 37300) * 0.0012960;
    }
    /* Before that */
    return 1.417818 + (utc - 37300) * 0.001296;
};

/**
 * Form the rotation matrix corresponding to a given axial vector.
 * @summary Rotation Matrix from Axial Vector
 * @param {Array} axvec - axial vector (radians)
 * @returns {Array} 3x3 rotation matrix
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss32.html}
 */
sla.dav2m = function (axvec) {
    "use strict";
    /* Rotation angle - magnitude of axial vector - and functions */
    var x = axvec[0];
    var y = axvec[1];
    var z = axvec[2];
    var phi = Math.sqrt(x * x + y * y + z * z);
    var s = Math.sin(phi);
    var c = Math.cos(phi);
    var w = 1 - c;

    /* Euler axis - direction of axial vector (perhaps null) */
    if (phi !== 0) {
        x /= phi;
        y /= phi;
        z /= phi;
    }

    /* Compute the rotation matrix */
    return [
        [x * x * w + c, x * y * w + z * s, x * z * w - y * s],
        [x * y * w - z * s, y * y * w + c, y * z * w + x * s],
        [x * z * w + y * s, y * z * w - x * s, z * z * w + c]
    ];
};

/**
 * Cartesian coordinates to spherical coordinates.
 * @summary Cartesian to Spherical
 * @param {Number} v - [x,y,z] vector
 * @returns {Object} a,b - spherical coordinates in radians
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss36.html}
 */
sla.dcc2s = function (v) {
    "use strict";
    var x = v[0];
    var y = v[1];
    var z = v[2];
    var r = Math.sqrt(x * x + y * y);
    var a = 0;
    if (r !== 0) {
        a = Math.atan2(y, x);
    }
    var b = 0;
    if (z !== 0) {
        b = Math.atan2(z, r);
    }
    return {
        a: a,
        b: b
    };
};

/**
 * Equatorial to horizon coordinates.
 * @summary h,\delta to Az,El
 * @param {Number} ha - Hour Angle in radians
 * @param {Number} dec - Declination in radians
 * @param {Number} phi - Observatory latitude in radians
 * @returns {array} [az,el] - Azimuth and elevation in radians
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss40.html}
 */
sla.de2h = function (ha, dec, phi) {
    "use strict";
    var sh = Math.sin(ha);
    var ch = Math.cos(ha);
    var sd = Math.sin(dec);
    var cd = Math.cos(dec);
    var sp = Math.sin(phi);
    var cp = Math.cos(phi);
    var x = -ch * cd * sp + sd * cp;
    var y = -sh * cd;
    var z = ch * cd * cp + sd * sp;
    var r = Math.sqrt(x * x + y * y);
    var a = 0;
    if (r !== 0) {
        a = Math.atan2(y, x);
        if (a < 0) {
            a += sla.d2pi;
        }
    }
    return {
        az: a,
        el: Math.atan2(z, r)
    };
};

/**
 * Form a rotation matrix from the Euler angles - three successive rotations
 * about specified Cartesian axes.
 * @summary Euler Angles to Rotation Matrix
 * @param {string} order - Specifies about which axes the rotations occur
 * @param {Number} phi - 1st rotation (radians)
 * @param {Number} theta - 2nd rotation (radians)
 * @param {Number} psi - 3rd rotation (radians)
 * @return {Array} Rotation matrix
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss41.html}
 */
sla.deuler = function (order, phi, theta, psi) {
    "use strict";
    /* Initialize result matrix */
    var result = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    var wm = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    /* Establish length of axis string */
    var l = order.length;
    /* Look at each character of axis string until finished */
    var n;
    var rotn;
    var angle;
    var s;
    var c;
    var axis;
    var i;
    var j;
    var k;
    var w;
    for (n = 0; n < 3; n += 1) {
        if (n > l) {
            break;
        }
        /* Pick up the appropriate Euler angle and take sine & cosine */
        if (n === 0) {
            angle = phi;
        } else if (n === 1) {
            angle = theta;
        } else {
            angle = psi;
        }
        s = Math.sin(angle);
        c = Math.cos(angle);

        /* Identify the axis */
        axis = order.substring(n, n + 1);
        if (axis === "X" || axis === "x" || axis === "1") {
            rotn = [[1, 0, 0],
                    [0, c, s],
                    [0, -s, c]];
        } else if (axis === "Y" || axis === "y" || axis === "2") {
            rotn = [[c, 0, -s],
                    [0, 1, 0],
                    [s, 0, c]];
        } else if (axis === "Z" || axis === "z" || axis === "3") {
            rotn = [[c, s, 0],
                    [-s, c, 0],
                    [0, 0, 1]];
        } else {
            break;
        }

        for (i = 0; i < 3; i += 1) {
            for (j = 0; j < 3; j += 1) {
                w = 0;
                for (k = 0; k < 3; k += 1) {
                    w += rotn[i][k] * result[k][j];
                }
                wm[i][j] = w;
            }
        }

        for (i = 0; i < 3; i += 1) {
            for (j = 0; j < 3; j += 1) {
                result[i][j] = wm[i][j];
            }
        }
    }
    return result;
};

/**
 * Approximate geocentric position and velocity of the Moon.
 * @summary: Approx Moon Pos/Vel
 * @param {Number} date - TDB (loosely ET) as a Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Array} Moon [x,y,z,\dot x,\dot y,\dot z], mean equator and
 *                  equinox of date (AU, AU/s)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss49.html}
 */
sla.dmoon = function (date) {
    "use strict";
    /* Moon's mean longitude */
    var elp0 = 270.434164;
    var elp1 = 481267.8831;
    var elp2 = -0.001133;
    var elp3 = 0.0000019;
    /* Sun's mean anomaly */
    var em0 = 358.475833;
    var em1 = 35999.0498;
    var em2 = -0.000150;
    var em3 = -0.0000033;
    /* Moon's mean anomaly */
    var emp0 = 296.104608;
    var emp1 = 477198.8491;
    var emp2 = 0.009192;
    var emp3 = 0.0000144;
    /* Moon's mean elongation */
    var d0 = 350.737486;
    var d1 = 445267.1142;
    var d2 = -0.001436;
    var d3 = 0.0000019;
    /* Mean distance of the Moon from its ascending node */
    var f0 = 11.250889;
    var f1 = 483202.0251;
    var f2 = -0.003211;
    var f3 = -0.0000003;
    /* Longitude of the Moon's ascending node */
    var om0 = 259.183275;
    var om1 = -1934.1420;
    var om2 = 0.002078;
    var om3 = 0.0000022;
    /* Coefficients for (dimensionless) E factor */
    var e1 = -0.002495;
    var e2 = -0.00000752;
    /* Coefficients for periodic variations etc. */
    var pac = 0.000233;
    var pa0 = 51.2;
    var pa1 = 20.2;
    var pbc = -0.001778;
    var pcc = 0.000817;
    var pdc = 0.002011;
    var pec = 0.003964;
    var pe0 = 346.560;
    var pe1 = 132.870;
    var pe2 = -0.0091731;
    var pfc = 0.001964;
    var pgc = 0.002541;
    var phc = 0.001964;
    var pic = -0.024691;
    var pjc = -0.004328;
    var pj0 = 275.05;
    var pj1 = -2.30;
    var cw1 = 0.0004664;
    var cw2 = 0.0000754;
    /* Coefficients for Moon position */
    /* Centuries since J1900 */
    var t = (date - 15019.5) / 36525;

    /**
     * Fundamental arguments (radians) and derivatives (radians per
     * Julian century) for the current epoch.
     */
    /* Moon's mean longitude */
    var elp = sla.d2r * ((elp0 + (elp1 + (elp2 + elp3 * t) * t) * t) % 360);
    var delp = sla.d2r * (elp1 + (2 * elp2 + 3 * elp3 * t) * t);
    /* Sun's mean anomaly */
    var em = sla.d2r * ((em0 + (em1 + (em2 + em3 * t) * t) * t) % 360);
    var dem = sla.d2r * (em1 + (2 * em2 + 3 * em3 * t) * t);
    /* Moon's mean anomaly */
    var emp = sla.d2r * ((emp0 + (emp1 + (emp2 + emp3 * t) * t) * t) % 360);
    var demp = sla.d2r * (emp1 + (2 * emp2 + 3 * emp3 * t) * t);
    /* Moon's mean elongation */
    var d = sla.d2r * ((d0 + (d1 + (d2 + d3 * t) * t) * t) % 360);
    var dd = sla.d2r * (d1 + (2 * d2 + 3 * d3 * t) * t);
    /* Mean distance of the Moon from its ascending node */
    var f = sla.d2r * ((f0 + (f1 + (f2 + f3 * t) * t) * t) % 360);
    var df = sla.d2r * (f1 + (2 * f2 + 3 * f3 * t) * t);
    /* Longitude of the Moon's ascending node */
    var om = sla.d2r * ((om0 + (om1 + (om2 + om3 * t) * t) * t) % 360);
    var dom = sla.d2r * (om1 + (2 * om2 + 3 * om3 * t) * t);
    var sinom = Math.sin(om);
    var cosom = Math.cos(om);
    var domcom = dom * cosom;

    /* Add the periodic variations */
    var theta = sla.d2r * (pa0 + pa1 * t);
    var wa = Math.sin(theta);
    var dwa = sla.d2r * pa1 * Math.cos(theta);
    theta = sla.d2r * (pe0 + (pe1 + pe2 * t) * t);
    var wb = pec * Math.sin(theta);
    var dwb = sla.d2r * pec * (pe1 + 2 * pe2 * t) * Math.cos(theta);
    elp += sla.d2r * (pac * wa + wb + pfc * sinom);
    delp += sla.d2r * (pac * dwa + dwb + pfc * domcom);
    em += sla.d2r * pbc * wa;
    dem += sla.d2r * pbc * dwa;
    emp += sla.d2r * (pcc * wa + wb + pgc * sinom);
    demp += sla.d2r * (pcc * dwa + dwb + pgc * domcom);
    d += sla.d2r * (pdc * wa + wb + phc * sinom);
    dd += sla.d2r * (pdc * dwa + dwb + phc * domcom);
    var wom = om + sla.d2r * (pj0 + pj1 * t);
    var dwom = dom + sla.d2r * pj1;
    var sinwom = Math.sin(wom);
    var coswom = Math.cos(wom);
    f += sla.d2r * (wb + pic * sinom + pjc * sinwom);
    df += sla.d2r * (dwb + pic * domcom + pjc * dwom * coswom);
    /* E-factor, and square */
    var e = 1 + (e1 + e2 * t) * t;
    var de = e1 + 2 * e2 * t;
    var esq = e * e;
    var desq = 2 * e * de;

    /**
     * Series expansions
     */
    var nl = 50;
    var nb = 45;
    var np = 31;
    var n;
    var coeff;
    var emn;
    var empn;
    var dn;
    var fn;
    var i;
    var en;
    var den;
    var dtheta;
    var ftheta;

    /* Longitude */
    var v = 0;
    var dv = 0;
    var n5;
    for (n = 0; n < nl; n += 1) {
        n5 = n * 5;
        coeff = sla.tl[n];
        emn = sla.itl[n5];
        empn = sla.itl[n5 + 1];
        dn = sla.itl[n5 + 2];
        fn = sla.itl[n5 + 3];
        i = sla.itl[n5 + 4];
        if (i === 0) {
            en = 1;
            den = 0;
        } else if (i === 1) {
            en = e;
            den = de;
        } else {
            en = esq;
            den = desq;
        }
        theta = emn * em + empn * emp + dn * d + fn * f;
        dtheta = emn * dem + empn * demp + dn * dd + fn * df;
        ftheta = Math.sin(theta);
        v += coeff * ftheta * en;
        dv += coeff * (Math.cos(theta) * dtheta * en + ftheta * den);
    }
    var el = elp + sla.d2r * v;
    var del = (delp + sla.d2r * dv) / sla.cj;

    /* Latitude */
    v = 0;
    dv = 0;
    for (n = 0; n < nb; n += 1) {
        n5 = n * 5;
        coeff = sla.tb[n];
        emn = sla.itb[n5];
        empn = sla.itb[n5 + 1];
        dn = sla.itb[n5 + 2];
        fn = sla.itb[n5 + 3];
        i = sla.itb[n5 + 4];
        if (i === 0) {
            en = 1;
            den = 0;
        } else if (i === 1) {
            en = e;
            den = de;
        } else {
            en = esq;
            den = desq;
        }
        theta = emn * em + empn * emp + dn * d + fn * f;
        dtheta = emn * dem + empn * demp + dn * dd + fn * df;
        ftheta = Math.sin(theta);
        v += coeff * ftheta * en;
        dv += coeff * (Math.cos(theta) * dtheta * en + ftheta * den);
    }
    var bf = 1 - cw1 * cosom - cw2 * coswom;
    var dbf = cw1 * dom * sinom + cw2 * dwom * sinwom;
    var b = sla.d2r * v * bf;
    var db = sla.d2r * (dv * bf + v * dbf) / sla.cj;

    /* Parallax */
    v = 0;
    dv = 0;
    for (n = 0; n < np; n += 1) {
        n5 = n * 5;
        coeff = sla.tp[n];
        emn = sla.itp[n5];
        empn = sla.itp[n5 + 1];
        dn = sla.itp[n5 + 2];
        fn = sla.itp[n5 + 3];
        i = sla.itp[n5 + 4];
        if (i === 0) {
            en = 1;
            den = 0;
        } else if (i === 1) {
            en = e;
            den = de;
        } else {
            en = esq;
            den = desq;
        }
        theta = emn * em + empn * emp + dn * d + fn * f;
        dtheta = emn * dem + empn * demp + dn * dd + fn * df;
        ftheta = Math.cos(theta);
        v += coeff * ftheta * en;
        dv += coeff * (-Math.sin(theta) * dtheta * en + ftheta * den);
    }
    var p = sla.d2r * v;
    var dp = sla.d2r * dv / sla.cj;

    /**
     * Transformation into final form
     */
    /* Parallax to distance (AU, AU/sec) */
    var sp = Math.sin(p);
    var r = sla.eradau / sp;
    var dr = -r * dp * Math.cos(p) / sp;

    /* Longitude, latitude to x,y,z (AU) */
    var sel = Math.sin(el);
    var cel = Math.cos(el);
    var sb = Math.sin(b);
    var cb = Math.cos(b);
    var rcb = r * cb;
    var rbd = r * db;
    var w = rbd * sb - cb * dr;
    var x = rcb * cel;
    var y = rcb * sel;
    var z = r * sb;
    var xd = -y * del - w * cel;
    var yd = x * del - w * sel;
    var zd = rbd * cb + sb * dr;

    /* Julian centuries since J2000 */
    t = (date - 51544.5) / 36525;

    /* Fricke equinox correction */
    var epj = 2000 + t * 100;
    var eqcor = sla.ds2r * (0.035 + 0.00085 * (epj - sla.b1950));

    /* Mean obliquity (IAU 1976) */
    var eps = sla.das2r * (84381.448 + (-46.8150 + (-0.00059 +
            0.001813 * t) * t) * t);

    /* To the equatorial system, mean of date, FK5 system */
    var sineps = Math.sin(eps);
    var coseps = Math.cos(eps);
    var es = eqcor * sineps;
    var ec = eqcor * coseps;
    return [
        x - ec * y + es * z,
        eqcor * x + y * coseps - z * sineps,
        y * sineps + z * coseps,
        xd - ec * yd + es * zd,
        eqcor * xd + yd * coseps - zd * sineps,
        yd * sineps + zd * coseps
    ];
};

/**
 * Multiply a 3-vector by a rotation matrix.
 * @summary Apply 3D Rotation
 * @param {Array} dm - 3x3 rotation matrix
 * @param {Array} va - 3-vector to be rotated
 * @returns {Array} Result 3-vector.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss51.html}
 */
sla.dmxv = function (dm, va) {
    "use strict";
    var i;
    var j;
    var w;
    var vb = [];
    for (i = 0; i < 3; i += 1) {
        w = 0;
        for (j = 0; j < 3; j += 1) {
            w += dm[i][j] * va[j];
        }
        vb[i] = w;
    }
    return vb;
};

/**
 * Convert an interval in days into hours, minutes, seconds.
 * @summary Days to Hour,Min,Sec
 * @param {Number} ndp - Number of decimal places of seconds
 * @param {Number} days - Interval in days
 * @returns {Array} [0] sign, '+' or '-'
 *                  [1-4] degrees, arcminutes, arcseconds, fraction
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss39.html}
 */
sla.dd2tf = function (ndp, days) {
    "use strict";
    var rs = 1;
    var n;
    for (n = 0; n < ndp; n += 1) {
        rs *= 10;
    }
    var rm = rs * 60;
    var rh = rm * 60;

    /* Round interval and express in smallest units required */
    var a = Math.round(rs * sla.d2s * Math.abs(days));

    /* Separate into fields */
    var ah = Math.floor(a / rh);
    a -= ah * rh;
    var am = Math.floor(a / rm);
    a -= am * rm;
    var as = Math.floor(a / rs);
    a -= as * rs;
    var sign;
    if (days >= 0) {
        sign = "+";
    } else {
        sign = "-";
    }

    return {
        sign: sign,
        ihmsf: [
            Math.max(Math.round(ah), 0),
            Math.max(Math.min(Math.round(am), 59), 0),
            Math.max(Math.min(Math.round(as), 59), 0),
            Math.max(Math.round(Math.min(a, rs - 1)), 0)
        ]
    };
};

/**
 * Convert an angle in radians to degrees, minutes, seconds, fraction.
 * @summary Radians to Hour,Min,Sec,Frac
 * @param {Number} ndp - Number of decimal places of arcseconds
 * @param {Number} angle - Angle in radians
 * @return {Array} [0] sign, '+' or '-'
 *                 [1-4] degrees, arcminutes, arcseconds, fraction
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss53.html}
 */
sla.dr2af = function (ndp, angle) {
    "use strict";
    var ret = sla.dd2tf(ndp, angle * sla.f);
    return {
        sign: ret.sign,
        idmsf: ret.ihmsf
    };
};

/**
 * Convert an angle in radians to hours, minutes, seconds, fraction.
 * @summary Radians to Hour,Min,Sec,Frac
 * @param {Number} ndp - Number of decimal places of seconds
 * @param {Number} angle - Angle in radians
 * @return {Array} [0] - sign, '+' or '-'
 *                 [1-4] - hours, minutes, seconds, fraction
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss54.html}
 */
sla.dr2tf = function (ndp, angle) {
    "use strict";
    return sla.dd2tf(ndp, angle / sla.t2r);
};

/**
 * Normalize an angle into the range -\pi - \pi.
 * @summary Put Angle into Range -\pi - \pi
 * @param {Number} angle - Angle in radians
 * @returns {Number} Angle expressed in the range -\pi - \pi
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss55.html}
 */
sla.drange = function (angle) {
    "use strict";
    var ret = angle % sla.d2pi;
    if (Math.abs(ret) >= Math.PI) {
        ret -= Math.sign(angle) * sla.d2pi;
    }
    return ret;
};

/**
 * Normalize angle into range 0 - 2 \pi.
 * @summary Put Angle into Range 0 - 2\pi
 * @param {Number} angle - Angle in radians
 * @returns {Number} Angle expressed in the range 0-2 \pi
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss56.html}
 */
sla.dranrm = function (angle) {
    "use strict";
    var ret = angle % sla.d2pi;
    if (ret < 0) {
        ret = ret + sla.d2pi;
    }
    return ret;
};

/**
 * Convert hours, minutes, seconds to days.
 * @summary Hour,Min,Sec to Days
 * @param {Number} ihour - Hours
 * @param {Number} imin - Minutes
 * @param {Number} sec - Seconds
 * @returns {Number} Interval in days
 * @throws {RangeError} If hours, minutes or seconds are out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss62.html}
 */
sla.dtf2d = function (ihour, imin, sec) {
    "use strict";
    if (sec < 0 || sec >= 60) {
        throw new RangeError("SEC outside range 0-59.999... (j=3).");
    }
    if (imin < 0 || imin > 59) {
        throw new RangeError("IMIN outside range 0-59 (j=2).");
    }
    if (ihour < 0 || ihour > 23) {
        throw new RangeError("IHOUR outside range 0-23 (j=1).");
    }
    return (60 * (60 * ihour + imin) + sec) / sla.d2s;
};

/**
 * Convert hours, minutes, seconds to radians.
 * @summary Hour,Min,Sec to Radians
 * @param {Number} ihour - Hours
 * @param {Number} imin - Minutes
 * @param {Number} sec - Seconds
 * @returns {Number} Angle in radians
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss63.html}
 */
sla.dtf2r = function (ihour, imin, sec) {
    "use strict";
    /* Convert to turns then radians */
    return sla.dtf2d(ihour, imin, sec) * sla.t2r;
};

/**
 * Convert degrees, arcminutes, arcseconds to radians.
 * @summary Deg,Arcmin,Arcsec to Radians
 * @param {Number} ideg - Degrees
 * @param {Number} iamin - Arcminutes
 * @param {Number} asec - Arcseconds
 * @returns {Number} Angle in radians
 * @throws {RangeError} If degrees, arcminutes or arcseconds are out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss29.html}
 */
sla.daf2r = function (ideg, iamin, asec) {
    "use strict";

    /* Validate arcsec, arcmin, deg */
    if (asec < 0 || asec >= 60) {
        throw new RangeError("ASEC outside of range 0-59.999... (j=3).");
    }
    if (iamin < 0 || iamin > 59) {
        throw new RangeError("IAMIN outside of range 0-59 (j=2).");
    }
    if (ideg < 0 || ideg > 359) {
        throw new RangeError("IDEG outside of range 0-359 (j=1).");
    }
    /* Compute angle */
    return sla.das2r * (60 * (60 * ideg + iamin) + asec);
};

/**
 * Compute \Delta TT, the increment to be applied to Coordinated Universal Time
 * UTC to give Terrestrial Time TT.
 * @summary TT minus UTC
 * @param {Number} utc - UTC date as a modified JD (JD-2400000.5)
 * @returns {Number} TT-UTC in seconds
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss68.html}
 */
sla.dtt = function (utc) {
    "use strict";
    return 32.184 + sla.dat(utc);
};

/**
 * Equation of the equinoxes  (IAU 1994).
 * @summary Equation of the Equinoxes
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Number} The equation of the equinoxes (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss87.html}
 */
sla.eqeqx = function (date) {
    "use strict";
    var t = (date - 51544.5) / 36525;
    var om = sla.das2r * (450160.280 + (-5 * sla.t2as - 482890.539 +
            (7.455 + 0.008 * t) * t) * t);
    var ret = sla.nutc(date);
    return ret.dpsi * Math.cos(ret.eps0) + sla.das2r * (0.00264 * Math.sin(om) +
            0.000063 * Math.sin(om + om));
};

/**
 * Conversion from universal time UT1 to Greenwich mean sidereal time.
 * @summary UT to GMST
 * @param {Number} ut1 - Universal time (strictly UT1) expressed as modified
 *                       Julian Date (JD-2400000.5).
 * @returns {Number} Greenwich mean sidereal time (radians).
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss104.html}
 */
sla.gmst = function (ut1) {
    "use strict";
    var tu = (ut1 - 51544.5) / 36525;
    return sla.dranrm((ut1 % 1) * sla.d2pi + (24110.54841 +
            (8640184.812866 + (0.093104 - 6.2e-6 * tu) * tu) * tu) * sla.ds2r);
};

/**
 * Conversion from Universal Time to Greenwich mean sidereal time,
 * with rounding errors minimized.
 * @summary UT to GMST (extra precision)
 * @param {Number} date - UT1 date as Modified Julian Date (integer part of
 *                        JD-2400000.5)
 * @param {Number} ut - UT1 time (fraction of a day)
 * @returns {Number} Greenwich mean sidereal time (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss105.html}
 */
sla.gmsta = function (date, ut) {
    "use strict";
    var d1;
    var d2;
    if (date < ut) {
        d1 = date;
        d2 = ut;
    } else {
        d1 = ut;
        d2 = date;
    }
    var t = (d1 + (d2 - 51544.5)) / 36525;
    return sla.dranrm(sla.ds2r * (24110.54841 + (8640184.812866 + (0.093104 -
            6.2e-6 * t) * t) * t + sla.d2s * (d1 % 1 + d2 % 1)));
};

/**
 * Convert geodetic position to geocentric.
 * @summary Geodetic to Geocentric
 * @param {Number} p - Latitude (geodetic, radians).
 * @param {Number} h - Height above reference spheroid (geodetic, metres).
 * @returns {Array} [0] Distance from Earth axis (AU)
 *                  [1] Distance from plane of Earth equator (AU)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss103.html}
 */
sla.geoc = function (p, h) {
    "use strict";
    var sp = Math.sin(p);
    var cp = Math.cos(p);
    var c = 1 / Math.sqrt(cp * cp + sla.sb * sp * sp);
    var s = sla.sb * c;
    return {
        r: (sla.a0 * c + h) * cp / sla.au,
        z: (sla.a0 * s + h) * sp / sla.au
    };
};

/**
 * Conversion of position & velocity in spherical coordinates to
 * Cartesian coordinates.
 * @summary Spherical Pos/Vel to Cartesian
 * @param {Number} a - longitude (radians) - for example \alpha
 * @param {Number} b - latitude (radians) - for example \delta
 * @param {Number} r - radial coordinate
 * @param {Number} ad - longitude derivative (radians per unit time)
 * @param {Number} bd - latitude derivative (radians per unit time)
 * @param {Number} rd - radial derivative
 * @returns {Array} [x,y,z,\dot x,\dot y,\dot z]
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss57.html}
 */
sla.ds2c6 = function (a, b, r, ad, bd, rd) {
    "use strict";
    /* Useful functions */
    var sa = Math.sin(a);
    var ca = Math.cos(a);
    var sb = Math.sin(b);
    var cb = Math.cos(b);
    var rcb = r * cb;
    var x = rcb * ca;
    var y = rcb * sa;
    var rbd = r * bd;
    var w = rbd * sb - cb * rd;

    /* Position and velocity */
    return [
        x,
        y,
        r * sb,
        -y * ad - w * ca,
        x * ad - w * sa,
        rbd * cb + sb * rd
    ];
};

/**
 * Multiply a 3-vector by the inverse of a rotation matrix.
 * @summary Apply 3D Reverse Rotation
 * @param {Array} dm - 3x3 rotation matrix
 * @param {Array} va - vector to be rotated
 * @returns {Array} result vector
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss44.html}
 */
sla.dimxv = function (dm, va) {
    "use strict";
    var i;
    var j;
    var w;
    var vb = [];
    /* Inverse of matrix DM * vector VA -> vector VW */
    for (i = 0; i < 3; i += 1) {
        w = 0;
        for (j = 0; j < 3; j += 1) {
            w += dm[j][i] * va[j];
        }
        vb[i] = w;
    }

    return vb;
};

/**
 * Conversion of position & velocity in Cartesian coordinates to
 * spherical coordinates.
 * @summary Cartesian 6-Vector to Spherical
 * @param {Array} v - [x,y,z,\dot x,\dot y,\dot z]
 * @returns {Object} a - longitude (radians)
 *                   b - latitude (radians)
 *                   r - radial coordinate
 *                   ad - longitude derivative (radians per unit time)
 *                   bd - latitude derivative (radians per unit time)
 *                   rd - radial derivative
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss35.html}
 */
sla.dc62s = function (v) {
    "use strict";
    /* Components of position/velocity vector */
    var x = v[0];
    var y = v[1];
    var z = v[2];
    var xd = v[3];
    var yd = v[4];
    var zd = v[5];

    /* Component of R in XY plane squared */
    var rxy2 = x * x + y * y;

    /* Modulus squared */
    var r2 = rxy2 + z * z;

    /* Protection against null vector */
    if (r2 === 0) {
        x = xd;
        y = yd;
        z = zd;
        rxy2 = x * x + y * y;
        r2 = rxy2 + z * z;
    }

    /* Position and velocity in spherical coordinates */
    var rxy = Math.sqrt(rxy2);
    var xyp = x * xd + y * yd;
    var a;
    var b;
    var ad;
    var bd;
    if (rxy2 !== 0) {
        a = Math.atan2(y, x);
        b = Math.atan2(z, rxy);
        ad = (x * yd - y * xd) / rxy2;
        bd = (zd * rxy2 - z * xyp) / (r2 * rxy);
    } else {
        a = 0;
        if (z !== 0) {
            b = Math.atan2(z, rxy);
        } else {
            b = 0;
        }
        ad = 0;
        bd = 0;
    }
    var r = Math.sqrt(r2);
    var rd;
    if (r !== 0) {
        rd = (xyp + z * zd) / r;
    } else {
        rd = 0;
    }

    return {
        a: a,
        b: b,
        r: r,
        ad: ad,
        bd: bd,
        rd: rd
    };
};

/**
 * Transform an FK5 (J2000) position and proper motion into the
 * frame of the Hipparcos catalogue.
 * @summary FK5 to Hipparcos
 * @param {Number} r5 - J2000.0 FK5 \alpha (radians)
 * @param {Number} d5 - J2000.0 FK5 \delta (radians)
 * @param {Number} dr5 - J2000.0 FK5 proper motion in \alpha
 *                       (radians per Julian year)
 * @param {Number} dd5 - J2000.0 FK5 proper motion in \delta
 *                       (radians per Julian year)
 * @returns {Object} rh - Hipparcos \alpha (radians)
 *                   dh - Hipparcos \delta (radians)
 *                   drh - Hipparcos proper motion in \alpha
 *                         (radians per Julian year)
 *                   ddh - Hipparcos proper motion in \delta
 *                         (radians per Julian year)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss96.html}
 */
sla.fk52h = function (r5, d5, dr5, dd5) {
    "use strict";
    /* FK5 to Hipparcos orientation and spin (radians, radians/year) */
    var epx = -19.9e-3 * sla.das2r;
    var epy = -9.1e-3 * sla.das2r;
    var epz = 22.9e-3 * sla.das2r;
    var omx = -0.30e-3 * sla.das2r;
    var omy = 0.60e-3 * sla.das2r;
    var omz = 0.70e-3 * sla.das2r;

    /* FK5 barycentric position/velocity 6-vector (normalized) */
    var pv5 = sla.ds2c6(r5, d5, 1, dr5, dd5, 0);

    /* FK5 to Hipparcos orientation matrix. */
    var r5h = sla.dav2m([epx, epy, epz]);

    /* Orient & spin the 6-vector into the Hipparcos frame. */
    var pvh = sla.dmxv(r5h, pv5);
    var vv = sla.dvxv(pv5, [omx, omy, omz]);
    var i;
    for (i = 0; i < 3; i += 1) {
        vv[i] += pv5[i + 3];
    }
    var pvhd = sla.dmxv(r5h, vv);

    /* Hipparcos 6-vector to spherical. */
    var ret = sla.dc62s(pvh.concat(pvhd));
    return {
        rh: sla.dranrm(ret.a),
        dh: ret.b,
        drh: ret.ad,
        ddh: ret.bd
    };
};

/**
 * Transform a Hipparcos star position and proper motion into the
 * FK5 (J2000) frame.
 * @summary Hipparcos to FK
 * @param {Number} rh - Hipparcos \alpha (radians)
 * @param {Number} dh - Hipparcos \delta (radians)
 * @param {Number} drh - Hipparcos proper motion in \alpha
 *                       (radians per Julian year)
 * @param {Number} ddh - Hipparcos proper motion in \delta
 *                       (radians per Julian year)
 * @returns {Object} r5 - J2000.0 FK5 \alpha (radians)
 *                   d5 - J2000.0 FK5 \delta (radians)
 *                   dr5 - J2000.0 FK5 proper motion in \alpha
 *                         (radians per Julian year)
 *                   dd5 - J2000.0 FK5 proper motion in \delta
 *                         (radians per Julian year)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss108.html}
 */
sla.h2fk5 = function (rh, dh, drh, ddh) {
    "use strict";
    /* FK5 to Hipparcos orientation and spin (radians, radians/year) */
    var epx = -19.9e-3 * sla.das2r;
    var epy = -9.1e-3 * sla.das2r;
    var epz = 22.9e-3 * sla.das2r;
    var omx = -0.30e-3 * sla.das2r;
    var omy = 0.60e-3 * sla.das2r;
    var omz = 0.70e-3 * sla.das2r;

    /* Hipparcos barycentric position/velocity 6-vector (normalized). */
    var pvh = sla.ds2c6(rh, dh, 1, drh, ddh, 0);

    /* FK5 to Hipparcos orientation matrix. */
    var r5h = sla.dav2m([epx, epy, epz]);

    /* Rotate the spin vector into the Hipparcos frame. */
    var sh = sla.dmxv(r5h, [omx, omy, omz]);

    /* De-orient & de-spin the 6-vector into FK5 J2000. */
    var pv5 = sla.dimxv(r5h, pvh);
    var vv = sla.dvxv(pvh, sh);
    var i;
    for (i = 0; i < 3; i += 1) {
        vv[i] = pvh[i + 3] - vv[i];
    }
    var pv5d = sla.dimxv(r5h, vv);

    /* FK5 6-vector to spherical. */
    var ret = sla.dc62s(pv5.concat(pv5d));
    return {
        r5: sla.dranrm(ret.a),
        d5: ret.b,
        dr5: ret.ad,
        dd5: ret.bd
    };
};

/**
 * Form the matrix of nutation (SF2001 theory) for a given date.
 * @summary Nutation Matrix
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5).
 * @returns {Array} 3x3 nutation matrix.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss122.html}
 */
sla.nut = function (date) {
    "use strict";
    var ret = sla.nutc(date);
    return sla.deuler("XZX", ret.eps0, -ret.dpsi, -(ret.eps0 + ret.deps));
};

/**
 * Nutation (SF2001 theory): longitude & obliquity components, and mean
 * obliquity.
 * @summary: Nutation Components
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Array} [0] Nutation in longitude (radians)
 *                  [1] Nutation in obliquity (radians)
 *                  [2] Mean obliquity (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss123.html}
 */
sla.nutc = function (date) {
    "use strict";
    /* Number of terms in the nutation model */
    var nterms = 194;

    /* Interval between fundamental epoch J2000.0 and given epoch (JC). */
    var t = (date - sla.djm0) / sla.djc;

    /* Mean anomaly of the Moon. */
    var el = 134.96340251 * sla.dd2r + (t * (1717915923.2178 + t * (31.8792 +
            t * (0.051635 + t * (-0.00024470)))) % sla.t2as) * sla.das2r;

    /* Mean anomaly of the Sun. */
    var elp = 357.52910918 * sla.dd2r + (t * (129596581.0481 + t * (-0.5532 +
            t * (0.000136 + t * (-0.00001149)))) % sla.t2as) * sla.das2r;

    /* Mean argument of the latitude of the Moon. */
    var f = 93.27209062 * sla.dd2r + (t * (1739527262.8478 + t * (-12.7512 +
            t * (-0.001037 + t * (0.00000417)))) % sla.t2as) * sla.das2r;

    /* Mean elongation of the Moon from the Sun. */
    var d = 297.85019547 * sla.dd2r + (t * (1602961601.2090 + t * (-6.3706 +
            t * (0.006539 + t * (-0.00003169)))) % sla.t2as) * sla.das2r;

    /* Mean longitude of the ascending node of the Moon. */
    var om = 125.04455501 * sla.dd2r + (t * (-6962890.5431 + t * (7.4722 +
            t * (0.007702 + t * (-0.00005939)))) % sla.t2as) * sla.das2r;

    /* Mean longitude of Venus. */
    var ve = 181.97980085 * sla.dd2r + ((210664136.433548 * t) %
            sla.t2as) * sla.das2r;

    /* Mean longitude of Mars. */
    var ma = 355.43299958 * sla.dd2r + ((68905077.493988 * t) %
            sla.t2as) * sla.das2r;

    /* Mean longitude of Jupiter. */
    var ju = 34.351518740 * sla.dd2r + ((10925660.377991 * t) %
            sla.t2as) * sla.das2r;

    /* Mean longitude of Saturn. */
    var sa = 50.077444300 * sla.dd2r + ((4399609.855732 * t) %
            sla.t2as) * sla.das2r;

    /* Geodesic nutation (Fukushima 1991) in microarcsec. */
    var dp = -153.1 * Math.sin(elp) - 1.9 * Math.sin(2 * elp);
    var de = 0;

    /* Shirai & Fukushima (2001) nutation series. */
    var i9 = 0;
    var i4 = 0;
    var j;
    var theta;
    var c;
    var s;
    for (j = 0; j < nterms; j += 1) {
        theta = sla.na[i9] * el +
                sla.na[i9 + 1] * elp +
                sla.na[i9 + 2] * f +
                sla.na[i9 + 3] * d +
                sla.na[i9 + 4] * om +
                sla.na[i9 + 5] * ve +
                sla.na[i9 + 6] * ma +
                sla.na[i9 + 7] * ju +
                sla.na[i9 + 8] * sa;
        c = Math.cos(theta);
        s = Math.sin(theta);
        dp += (sla.psi[i4] + sla.psi[i4 + 2] * t) * c +
                (sla.psi[i4 + 1] + sla.psi[i4 + 3] * t) * s;
        de += (sla.eps[i4] + sla.eps[i4 + 2] * t) * c +
                (sla.eps[i4 + 1] + sla.eps[i4 + 3] * t) * s;
        i9 += 9;
        i4 += 4;
    }
    /* Change of units, and addition of the precession correction. */
    var dpsi = (dp * 1e-6 - 0.042888 - 0.29856 * t) * sla.das2r;
    var deps = (de * 1e-6 - 0.005171 - 0.02408 * t) * sla.das2r;
    /* Mean obliquity of date (Simon et al. 1994). */
    var eps0 = (84381.412 + (-46.80927 + (-0.000152 + (0.0019989 +
            (-0.00000051 + (-0.000000025) * t) * t) * t) * t) * t) *
            sla.das2r;
    return {
        dpsi: dpsi,
        deps: deps,
        eps0: eps0
    };
};

/**
 * Transform conventional osculating orbital elements into "universal" form.
 * @summary Conventional to Universal Elements
 * @param {Number} date - Epoch (TT MJD) of osculation (Note 3)
 * @param {Number} jform - Choice of element set (1-3; Note 6)
 * @param {Number} epoch - Epoch of elements (t0 or T, TT MJD)
 * @param {Number} orbinc - Inclination (i, radians)
 * @param {Number} anode - Longitude of the ascending node (\Omega, radians)
 * @param {Number} perih - Longitude or argument of perihelion (\varpi or
 *                         \omega, radians)
 * @param {Number} aorq - Mean distance or perihelion distance (a or q, AU)
 * @param {Number} e - Eccentricity (e)
 * @param {Number} aorl - Mean anomaly or longitude (M or L, radians,
 *                        JFORM=1,2 only)
 * @param {Number} dm - Daily motion (n, radians, jform=1 only)
 * @returns {Array} Universal orbital elements (Note 1)
 *                  [0] combined mass (M+m)
 *                  [1] total energy of the orbit (\alpha)
 *                  [2] reference (osculating) epoch (t0)
 *                  [3-5] position at reference epoch (r0)
 *                  [6-8] velocity at reference epoch (v0)
 *                  [9] heliocentric distance at reference epoch
 *                  [10] r0.v0
 *                  [11] date (t)
 *                  [12] universal eccentric anomaly (\psi) of date, approx
 * @throws {RangeError} If jform, e, aorq or dm are out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss79.html}
 */
sla.el2ue = function (date, jform, epoch, orbinc, anode, perih,
        aorq, e, aorl, dm) {
    "use strict";
    if (jform < 1 || jform > 3) {
        throw new RangeError("Illegal JFORM (j=-1).");
    }
    if (e < 0 || e > 10 || (e > 1 && jform !== 3)) {
        throw new RangeError("Illegal E (j=-2).");
    }
    if (aorq < 0) {
        throw new RangeError("Illegal AORQ (j=-3).");
    }
    if (jform === 1 && dm < 0) {
        throw new RangeError("Illegal DM (j=-4).");
    }

    var pht;
    var argph;
    var q;
    var w;
    var cm;
    /* Transform elements into standard form */
    if (jform === 1) {
        /* Major planet */
        pht = epoch - (aorl - perih) / dm;
        argph = perih - anode;
        q = aorq * (1 - e);
        w = dm / sla.gcon;
        cm = w * w * aorq * aorq * aorq;
    } else if (jform === 2) {
        /* Minor planet */
        pht = epoch - aorl * Math.sqrt(aorq * aorq * aorq) / sla.gcon;
        argph = perih;
        q = aorq * (1 - e);
        cm = 1;
    } else {
        /* Comet */
        pht = epoch;
        argph = perih;
        q = aorq;
        cm = 1;
    }

    /* The universal variable alpha.  This is proportional to the total
     *  energy of the orbit:  -ve for an ellipse, zero for a parabola,
     *  +ve for a hyperbola. */
    var alpha = cm * (e - 1) / q;

    /* Speed at perihelion */
    var phs = Math.sqrt(alpha + 2 * cm / q);

    /* Functions of the Euler angles. */
    var sw = Math.sin(argph);
    var cw = Math.cos(argph);
    var si = Math.sin(orbinc);
    var ci = Math.cos(orbinc);
    var so = Math.sin(anode);
    var co = Math.cos(anode);

    /* Position at perihelion (AU) */
    var x = q * cw;
    var y = q * sw;
    var z = y * si;
    y = y * ci;
    var px = x * co - y * so;
    y = x * so + y * co;
    var py = y * sla.ce - z * sla.se;
    var pz = y * sla.se + z * sla.ce;

    /* Velocity at perihelion (AU per canonical day). */
    x = -phs * sw;
    y = phs * cw;
    z = y * si;
    y = y * ci;
    var vx = x * co - y * so;
    y = x * so + y * co;
    var vy = y * sla.ce - z * sla.se;
    var vz = y * sla.se + z * sla.ce;

    /* Time from perihelion to date (in Canonical Days: a canonical day
     *  is 58.1324409... days, defined as 1/GCON). */
    var dt = (date - pht) * sla.gcon;

    /* First approximation to the Universal Eccentric Anomaly, PSI,
     *  based on the circle (FC) and parabola (FP) values. */
    var fc = dt / q;
    w = Math.pow(3 * dt + Math.sqrt(9 * dt * dt + 8 * q * q * q), 1 / 3);
    var fp = w - 2 * q / w;
    var psi = (1 - e) * fc + e * fp;

    /* Assemble local copy of element set. */
    var ul = [cm, alpha, pht, px, py, pz, vx, vy, vz, q, 0, date, psi];

    /* Predict position+velocity at epoch of osculation. */
    var pv = sla.ue2pv(date, ul);

    /* Convert back to universal elements. */
    return sla.pv2ue(pv, date, cm - 1);
};

/**
 * Heliocentric position and velocity of a planet, asteroid or comet, starting
 * from orbital elements in the "universal variables" form.
 * @summary Pos/Vel from Universal Elements
 * @param {Number} date - Date (TT Modified Julian Date = JD-2400000.5)
 * @param {Array} u - Universal orbital elements (updated; Note 1)
 *                [0] combined mass (M+m)
 *                [1] total energy of the orbit (\alpha)
 *                [2] reference (osculating) epoch (t0)
 *                [3-5] position at reference epoch (r0)
 *                [6-8] velocity at reference epoch (v0)
 *                [9] heliocentric distance at reference epoch
 *                [10] r0.v0
 *                [11] date (t)
 *                [12] universal eccentric anomaly (\psi) of date, approx
 * @returns {Array} Heliocentric [x,y,z,\dot x,\dot y,\dot z], equatorial,
 *                  J2000 (AU, AU/s; Note 1)
 * @throws {RangeError} If radius vector is zero.
 * @throws {Error} If the algorithm fails to converge.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss180.html}
 */
sla.ue2pv = function (date, u) {
    "use strict";
    /* Unpack the parameters. */
    var test = 1e-13;
    var nitmax = 25;

    var cm = u[0];
    var alpha = u[1];
    var t0 = u[2];
    var p0 = u.slice(3, 6);
    var v0 = u.slice(6, 9);
    var r0 = u[9];
    var sigma0 = u[10];
    var t = u[11];
    var psi = u[12];

    /* Approximately update the universal eccentric anomaly. */
    psi += (date - t) * sla.gcon / r0;

    /* Time from reference epoch to date (in Canonical Days: a canonical
     *  day is 58.1324409... days, defined as 1/GCON). */
    var dt = (date - t0) * sla.gcon;

    /* Refine the universal eccentric anomaly, psi. */
    var nit = 1;
    var w = 1;
    var tol = 0;
    var n;
    var psj;
    var psj2;
    var beta;
    var s3;
    var s2;
    var s1;
    var s0;
    var ff;
    var r;
    var flast;
    var plast;
    while (Math.abs(w) > tol) {
        /* Form half angles until BETA small enough. */
        n = 0;
        psj = psi;
        psj2 = psj * psj;
        beta = alpha * psj2;
        while (Math.abs(beta) > 0.7) {
            n += 1;
            beta /= 4;
            psj /= 2;
            psj2 /= 4;
        }
        /* Calculate Universal Variables S0,S1,S2,S3 by nested series. */
        s3 = psj * psj2 * ((((((beta / 210 + 1) * beta / 156 + 1) *
                beta / 110 + 1) * beta / 72 + 1) * beta / 42 + 1) *
                beta / 20 + 1) / 6;
        s2 = psj2 * ((((((beta / 182 + 1) * beta / 132 + 1) * beta / 90 + 1) *
                beta / 56 + 1) * beta / 30 + 1) * beta / 12 + 1) / 2;
        s1 = psj + alpha * s3;
        s0 = 1 + alpha * s2;

        /* Undo the angle-halving. */
        tol = test;
        while (n > 0) {
            s3 = 2 * (s0 * s3 + psj * s2);
            s2 = 2 * s1 * s1;
            s1 = 2 * s0 * s1;
            s0 = 2 * s0 * s0 - 1;
            psj = psj + psj;
            tol = tol + tol;
            n -= 1;
        }

        /* Values of F and F' corresponding to the current value of psi. */
        ff = r0 * s1 + sigma0 * s2 + cm * s3 - dt;
        r = r0 * s0 + sigma0 * s1 + cm * s2;

        /* If first iteration, create dummy "last F". */
        if (nit === 1) {
            flast = ff;
        }

        /* Check for sign change. */
        if (ff * flast < 0) {
            /* Sign change:  get psi adjustment using secant method. */
            w = ff * (plast - psi) / (flast - ff);
        } else {
            /*  No sign change:  use Newton-Raphson method instead. */
            if (r === 0) {
                throw new RangeError("Radius vector zero (j=-1).");
            }
            w = ff / r;
        }

        /* Save the last psi and F values. */
        plast = psi;
        flast = ff;

        /* Apply the Newton-Raphson or secant adjustment to psi. */
        psi = psi - w;

        /* Next iteration, unless too many already. */
        if (nit > nitmax) {
            throw new Error("Failed to converge (j=-2).");
        }
        nit += 1;
    }

    /* Project the position and velocity vectors (scaling velocity to AU/s). */
    w = cm * s2;
    var f = 1 - w / r0;
    var g = dt - cm * s3;
    var fd = -cm * s1 / (r0 * r);
    var gd = 1 - w / r;
    var i;
    var pv = [];
    for (i = 0; i < 3; i += 1) {
        pv[i] = p0[i] * f + v0[i] * g;
        pv[i + 3] = sla.cd2s * (p0[i] * fd + v0[i] * gd);
    }

    /* Update the parameters to allow speedy prediction of PSI next time. */
    u[11] = date;
    u[12] = psi;

    return pv;
};

/**
 * Construct a universal element set based on an instantaneous position and
 * velocity.
 * @summary Position/Velocity to Universal Elements
 * @param {Array} pv - Heliocentric [x,y,z,\dot x,\dot y,\dot z], equatorial,
 *                     J2000 (AU, AU/s; Note 1)
 * @param {Number} date - Date (TT Modified Julian Date = JD-2400000.5)
 * @param {Number} pmass - Mass of the planet (Sun = 1; Note 2)
 * @returns {Array} u - Universal orbital elements (Note 3)
 *                  [0] combined mass (M+m)
 *                  [1] total energy of the orbit (α)
 *                  [2] reference (osculating) epoch (t0)
 *                  [3-5] position at reference epoch (r0)
 *                  [6-8] velocity at reference epoch (v0)
 *                  [9] heliocentric distance at reference epoch
 *                  [10] r0.v0
 *                  [11] date (t)
 *                  [12] universal eccentric anomaly (\psi) of date, approx
 * @throws {RangeError} If pmass is negative, or r or v are too small.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss148.html}
 */
sla.pv2ue = function (pv, date, pmass) {
    "use strict";
    var rmin = 1e-3;
    var vmin = 1e-3;

    /* Reference epoch. */
    var t0 = date;

    /* Combined mass (mu=M+m). */
    if (pmass < 0) {
        throw new RangeError("Illegal PMASS (j=-1).");
    }
    var cm = 1 + pmass;

    /* Unpack the state vector, expressing velocity in AU per canonical day. */
    var x = pv[0];
    var y = pv[1];
    var z = pv[2];
    var xd = pv[3] / sla.cd2s;
    var yd = pv[4] / sla.cd2s;
    var zd = pv[5] / sla.cd2s;

    /* Heliocentric distance, and speed. */
    var r = Math.sqrt(x * x + y * y + z * z);
    var v2 = xd * xd + yd * yd + zd * zd;
    var v = Math.sqrt(v2);

    /* Reject unreasonably small values. */
    if (r < rmin) {
        throw new RangeError("Too close to Sun (j=-2).");
    }
    if (v < vmin) {
        throw new RangeError("Too slow (j=-3).");
    }

    /* Total energy of the orbit. */
    var alpha = v2 - 2 * cm / r;

    /* Outward component of velocity. */
    var rdv = x * xd + y * yd + z * zd;

    /* Construct the universal-element set. */
    return [cm, alpha, t0, x, y, z, xd, yd, zd, r, rdv, t0, 0];
};

/**
 * Heliocentric position and velocity of a planet, asteroid or comet, starting
 * from orbital elements.
 * @summary Planet Position from Elements
 * @param {Number} date - Epoch (TT MJD) of observation (JD-2400000.5, Note 1)
 * @param {Number} jform - Choice of element set (1-3; Note 3)
 * @param {Number} epoch - Epoch of elements (t0 or T, TT MJD, Note 4)
 * @param {Number} orbinc - Inclination (i, radians)
 * @param {Number} anode - Longitude of the ascending node (\Omega, radians)
 * @param {Number} perih - Longitude or argument of perihelion (\varphi or
 *                         \omega, radians)
 * @param {Number} aorq - Mean distance or perihelion distance (a or q, AU)
 * @param {Number} e - Eccentricity (e)
 * @param {Number} aorl - Mean anomaly or longitude (M or L, radians,
 *                        JFORM=1,2 only)
 * @param {Number} dm - Daily motion (n, radians, jform=1 only)
 * @returns {Array} Heliocentric [x,y,z,\dot x,\dot y,\dot z], equatorial,
 *                  J2000 (AU, AU/s)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss136.html}
 */
sla.planel = function (date, jform, epoch, orbinc, anode, perih,
        aorq, e, aorl, dm) {
    "use strict";
    return sla.ue2pv(date, sla.el2ue(date, jform, epoch, orbinc, anode, perih,
            aorq, e, aorl, dm));
};

/**
 * Approximate heliocentric position and velocity of a planet.
 * @summary Planetary Ephemerides
 * @param {Number} date - Modified Julian Date (JD-2400000.5)
 * @param {Number} np - Planet:
 *                       1 = Mercury
 *                       2 = Venus
 *                       3 = Earth-Moon Barycentre
 *                       4 = Mars
 *                       5 = Jupiter
 *                       6 = Saturn
 *                       7 = Uranus
 *                       8 = Neptune
 *                       9 = Pluto
 * @returns {Array} Heliocentric [x,y,z,\dot x,\dot y,\dot z], equatorial,
 *                  J2000 (AU, AU/s)
 * @throws {RangeError} If np or date are out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss137.html}
 */
sla.planet = function (date, np) {
    "use strict";
    if (np < 1 || np > 9) {
        throw new RangeError("Unknown planet given as argument to planet.");
    }
    var t;
    var j;
    var dl;
    /* Separate algorithms for Pluto and the rest. */
    if (np !== 9) {
        /* Mercury through Neptune */
        /* Time: Julian millennia since J2000. */
        t = (date - 51544.5) / 365250;

        /* OK status unless remote epoch. */
        if (Math.abs(t) > 1) {
            throw new RangeError("Warning: date out of range (j=1).");
        }

        /* Compute the mean elements. */
        var np3 = (np - 1) * 3; // First index
        var da = sla.a[np3] + (sla.a[np3 + 1] + sla.a[np3 + 2] * t) * t;
        dl = (3600 * sla.dlm[np3] + (sla.dlm[np3 + 1] + sla.dlm[np3 + 2] *
                t) * t) * sla.das2r;
        var de = sla.e[np3] + (sla.e[np3 + 1] + sla.e[np3 + 2] * t) * t;
        var dpe = ((3600 * sla.pi[np3] + (sla.pi[np3 + 1] + sla.pi[np3 + 2] *
                t) * t) * sla.das2r) % sla.d2pi;
        var di = (3600 * sla.dinc[np3] + (sla.dinc[np3 + 1] +
                sla.dinc[np3 + 2] * t) * t) * sla.das2r;
        var dom = ((3600 * sla.omega[np3] + (sla.omega[np3 + 1] +
                sla.omega[np3 + 2] * t) * t) * sla.das2r) % sla.d2pi;

        /* Apply the trigonometric terms. */
        var dmu = 0.35953620 * t;
        var arga;
        var argl;
        var nj;
        np3 = (np - 1) * 9;
        var nq3 = (np - 1) * 10;
        for (j = 0; j < 8; j += 1) {
            arga = sla.dkp[np3 + j] * dmu;
            argl = sla.dkq[nq3 + j] * dmu;
            da += (sla.ca[np3 + j] * Math.cos(arga) + sla.sa[np3 + j] *
                    Math.sin(arga)) * 1e-7;
            dl += (sla.clo[nq3 + j] * Math.cos(argl) + sla.slo[nq3 + j] *
                    Math.sin(argl)) * 1e-7;
        }
        nj = np3 + 8;
        arga = sla.dkp[nj] * dmu;
        da += t * (sla.ca[nj] * Math.cos(arga) + sla.sa[nj] *
                Math.sin(arga)) * 1e-7;
        for (j = 8; j < 10; j += 1) {
            nj = nq3 + j;
            argl = sla.dkq[nj] * dmu;
            dl += t * (sla.clo[nj] * Math.cos(argl) + sla.slo[nj] *
                    Math.sin(argl)) * 1e-7;
        }
        dl %= sla.d2pi;

        /* Daily motion */
        var dm = sla.gcon * Math.sqrt((1 + 1 / sla.amas[np - 1]) /
                (da * da * da));
        /* Make the prediction */
        return sla.planel(date, 1, date, di, dom, dpe, da, de, dl, dm);
    } else {
        /* Pluto */
        /* Time: Julian centuries since J2000. */
        t = (date - 51544.5) / 36525;

        /* OK status unless remote epoch. */
        if (t < -1.15 || t > 1) {
            throw new RangeError("Warning: date out of range (j=1).");
        }

        /* Fundamental arguments (radians) */
        var dj = (sla.dj0 + sla.djd * t) * sla.d2r;
        var ds = (sla.ds0 + sla.dsd * t) * sla.d2r;
        var dp = (sla.dp0 + sla.dpd * t) * sla.d2r;

        /* Initialize coefficients and derivatives */
        var wlbr = [0, 0, 0];
        var wlbrd = [0, 0, 0];

        var i;
        var j3;
        var wj;
        var ws;
        var wp;
        var al;
        var ald;
        var sal;
        var cal;
        var ac;
        var bc;
        /* Term by term through Meeus Table 36.A. */
        for (j = 0; j < 43; j += 1) {
            j3 = j * 3;
            /* Argument and derivative (radians, radians per century). */
            wj = sla.ijsp[j3];
            ws = sla.ijsp[j3 + 1];
            wp = sla.ijsp[j3 + 2];
            al = wj * dj + ws * ds + wp * dp;
            ald = (wj * sla.djd + ws * sla.dsd + wp * sla.dpd) * sla.d2r;

            /* Functions of argument. */
            sal = Math.sin(al);
            cal = Math.cos(al);

            /* Periodic terms in longitude, latitude, radius vector. */
            for (i = 0; i < 3; i += 1) {
                /* A and B coefficients (deg, AU). */
                ac = sla.ab[j * 6 + i * 2];
                bc = sla.ab[j * 6 + i * 2 + 1];
                /* Periodic terms (deg, AU, deg/Jc, AU/Jc). */
                wlbr[i] += ac * sal + bc * cal;
                wlbrd[i] += (ac * cal - bc * sal) * ald;
            }
        }

        /* Heliocentric longitude and derivative (radians, radians/sec). */
        dl = (sla.dl0 + sla.dld0 * t + wlbr[0]) * sla.d2r;
        var dld = (sla.dld0 + wlbrd[0]) * sla.d2r / sla.spc;

        /* Heliocentric latitude and derivative (radians, radians/sec). */
        var db = (sla.db0 + wlbr[1]) * sla.d2r;
        var dbd = wlbrd[1] * sla.d2r / sla.spc;

        /* Heliocentric radius vector and derivative (AU, AU/sec). */
        var dr = sla.dr0 + wlbr[2];
        var drd = wlbrd[2] / sla.spc;

        /*  Functions of latitude, longitude, radius vector. */
        var sl = Math.sin(dl);
        var cl = Math.cos(dl);
        var sb = Math.sin(db);
        var cb = Math.cos(db);
        var slcb = sl * cb;
        var clcb = cl * cb;

        /* Heliocentric vector and derivative, J2000 ecliptic and equinox. */
        var x = dr * clcb;
        var y = dr * slcb;
        var z = dr * sb;
        var xd = drd * clcb - dr * (cl * sb * dbd + slcb * dld);
        var yd = drd * slcb + dr * (-sl * sb * dbd + clcb * dld);
        var zd = drd * sb + dr * cb * dbd;

        /* Transform to J2000 equator and equinox. */
        return [
            x,
            y * sla.ce - z * sla.se,
            y * sla.se + z * sla.ce,
            xd,
            yd * sla.ce - zd * sla.se,
            yd * sla.se + zd * sla.ce
        ];
    }
};

/**
 * Position and velocity of an observing station.
 * @summary Observatory Position & Velocity.
 * @param {Number} p - Latitude (geodetic, radians)
 * @param {Number} h - Height above reference spheroid (geodetic, metres)
 * @param {Number} stl - Local apparent sidereal time (radians)
 * @returns {Array} [x,y,z,\dot x,\dot y,\dot z] (AU, AU/s, true equator
 *                  and equinox of date)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss149.html}
 */
sla.pvobs = function (p, h, stl) {
    "use strict";
    var ret = sla.geoc(p, h);
    /* Functions of ST */
    var s = Math.sin(stl);
    var c = Math.cos(stl);
    /* Speed */
    var v = sla.sr * ret.r;
    return [ret.r * c,
            ret.r * s,
            ret.z,
            -v * s,
            v * c,
            0];
};

/**
 * Estimate \Delta T, the offset between dynamical time and Universal Time,
 * for a given historical epoch.
 * @summary Approximate ET minus UT
 * @param {Number} epoch - (Julian) epoch (e.g. 1850D0)
 * @returns {Number} Approximate ET-UT (after 1984, TT-UT1) in seconds
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss61.html}
 */
sla.dt = function (epoch) {
    "use strict";
    /* Centuries since 1800 */
    var t = (epoch - 1800) / 100;
    /* Select model */
    if (epoch >= 1708.185161980887) {
        /* Post-1708: use McCarthy & Babcock */
        var w = t - 0.19;
        return 5.156 + 13.3066 * w * w;
    } else if (epoch >= 979.0258204760233) {
        /* 979-1708: use Stephenson & Morrison's 948-1600 model */
        return 25.5 * t * t;
    } else {
        /* Pre-979: use Stephenson & Morrison's 390 BC to AD 948 model */
        return 1360.0 + (320 + 44.3 * t) * t;
    }
};

/**
 * Product of two 3x3 matrices.
 * @summary Multiply 3x3 Matrices
 * @param {Array} a - 3x3 matrix A
 * @param {Array} b - 3x3 matrix B
 * @returns {Array} 3x3 matrix result: AxB
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss50.html}
 */
sla.dmxm = function (a, b) {
    "use strict";
    var c = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    var i;
    var j;
    var w;
    var k;
    for (i = 0; i < 3; i += 1) {
        for (j = 0; j < 3; j += 1) {
            w = 0;
            for (k = 0; k < 3; k += 1) {
                w += a[i][k] * b[k][j];
            }
            c[i][j] = w;
        }
    }
    return c;
};

/**
 * Convert Modified Julian Date to Julian Epoch.
 * @summary MJD to Julian Epoch
 * @param {Number} date - Modified Julian Date (JD-2400000.5)
 * @returns {Number} Julian Epoch
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss83.html}
 */
sla.epj = function (date) {
    "use strict";
    return 2000 + (date - 51544.5) / 365.25;
};

/**
 * Form the matrix of precession between two epochs (IAU 1976, FK5).
 * @summary Precession Matrix (FK5)
 * @param {Number} ep0 - beginning epoch
 * @param {Number} ep1 - ending epoch
 * @returns {Array} 3x3 precession matrix
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss143.html}
 */
sla.prec = function (ep0, ep1) {
    "use strict";
    var t0 = (ep0 - 2000) / 100;
    var t = (ep1 - ep0) / 100;
    var tas2r = t * sla.das2r;
    var w = 2306.2181 + (1.39656 - 0.000139 * t0) * t0;
    var zeta = (w + ((0.30188 - 0.000344 * t0) + 0.017998 * t) * t) * tas2r;
    var z = (w + ((1.09468 + 0.000066 * t0) + 0.018203 * t) * t) * tas2r;
    var theta = ((2004.3109 + (-0.85330 - 0.000217 * t0) * t0) +
            ((-0.42665 - 0.000217 * t0) - 0.041833 * t) * t) * tas2r;
    return sla.deuler("ZYZ", -zeta, theta, -z);
};

/**
 * Form the matrix of precession and nutation (SF2001).
 * @summary Precession-Nutation Matrix
 * @param {Number} epoch - Julian Epoch for mean coordinates
 * @param {Number} date - Modified Julian Date (JD-2400000.5) for
 *                        true coordinates
 * @returns {Array} Combined 3x3 precession-nutation matrix
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss146.html}
 */
sla.prenut = function (epoch, date) {
    "use strict";
    return sla.dmxm(sla.nut(date), sla.prec(epoch, sla.epj(date)));
};

/**
 * Approximate topocentric apparent [α,δ] and angular size of a planet.
 * @summary Apparent [α,δ] of Planet
 * @param {Number} date - MJD of observation (JD-2400000.5)
 * @param {Number} np - Planet:
 *                       1 = Mercury
 *                       2 = Venus
 *                       3 = Moon
 *                       4 = Mars
 *                       5 = Jupiter
 *                       6 = Saturn
 *                       7 = Uranus
 *                       8 = Neptune
 *                       9 = Pluto
 *                       else = Sun
 * @param {Number} elong - Observer's longitude (east +ve) (radians)
 * @param {Number} phi - Observer's latitude (radians)
 * @returns {Array} [0-1] topocentric apparent [α,δ] (radians)
 *                  [2] angular diameter (equatorial, radians)
 * @throws {RangeError} If np is out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss155.html}
 */
sla.rdplan = function (date, np, elong, phi) {
    "use strict";
    var eqrau = [
        696000, 2439.7, 6051.9, 1738, 3397, 71492,
        60268, 25559, 24764, 1151
    ];
    /* Classify NP */
    var ip;
    if (np <= 0 || np > 9 || np === "Sun") {
        ip = 0;
    } else if (np === 1 || np === "Mercury") {
        ip = 1;
    } else if (np === 2 || np === "Venus") {
        ip = 2;
    } else if (np === 3 || np === "Moon") {
        ip = 3;
    } else if (np === 4 || np === "Mars") {
        ip = 4;
    } else if (np === 5 || np === "Jupiter") {
        ip = 5;
    } else if (np === 6 || np === "Saturn") {
        ip = 6;
    } else if (np === 7 || np === "Uranus") {
        ip = 7;
    } else if (np === 8 || np === "Neptune") {
        ip = 8;
    } else if (np === 9 || np === "Pluto") {
        ip = 9;
    } else {
        throw new RangeError("Unknown planet given as argument to sla.rdplan.");
    }

    /* Approximate local ST */
    var stl = sla.gmst(date - sla.dt(sla.epj(date)) / sla.d2s) + elong;
    /* Geocentre to Moon (mean of date) */
    var v = sla.dmoon(date);
    /* Nutation to true of date */
    var rmat = sla.nut(date);
    var vgm = sla.dmxv(rmat, v.slice(0, 3));
    var vgm4 = sla.dmxv(rmat, v.slice(3));
    vgm = vgm.concat(vgm4);
    var i;
    /* Moon? */
    if (ip === 3) {
        /* Yes: geocentre to Moon (true of date) */
        for (i = 0; i < 6; i += 1) {
            v[i] = vgm[i];
        }
    } else {
        /* No: precession/nutation matrix, J2000 to date */
        rmat = sla.prenut(2000, date);
        /* Sun to Earth-Moon Barycentre (J2000) */
        v = sla.planet(date, 3);
        /* Precession and nutation to date */
        var vse = sla.dmxv(rmat, v.slice(0, 3));
        var vse4 = sla.dmxv(rmat, v.slice(3));
        vse = vse.concat(vse4);
        var vsg = [];
        /* Sun to geocentre (true of date) */
        for (i = 0; i < 6; i += 1) {
            vsg[i] = vse[i] - 0.012150581 * vgm[i];
        }
        if (ip === 0) {
            /* Yes: geocentre to Sun */
            for (i = 0; i < 6; i += 1) {
                v[i] = -vsg[i];
            }
        } else {
            var vsp;
            var vsp4;
            /* No: Sun to Planet (J2000) */
            v = sla.planet(date, ip);
            /* Precession and nutation to date */
            vsp = sla.dmxv(rmat, v.slice(0, 3));
            vsp4 = sla.dmxv(rmat, v.slice(3));
            vsp = vsp.concat(vsp4);
            /* Geocentre to planet */
            for (i = 0; i < 6; i += 1) {
                v[i] = vsp[i] - vsg[i];
            }
        }
    }
    /* Refer to origin at the observer */
    var vg0 = sla.pvobs(phi, 0, stl);
    for (i = 0; i < 6; i += 1) {
        v[i] -= vg0[i];
    }

    /* Geometric distance (AU) */
    var dx = v[0];
    var dy = v[1];
    var dz = v[2];
    var r = Math.sqrt(dx * dx + dy * dy + dz * dz);

    /* Light time (sec) */
    var tl = sla.tau * r;

    /* Correct position for planetary aberration */
    for (i = 0; i < 3; i += 1) {
        v[i] -= tl * v[i + 3];
    }

    /* To RA,Dec */
    var ret = sla.dcc2s(v);

    /* Angular diametre (radians) */
    return {
        ra: sla.dranrm(ret.a),
        dec: ret.b,
        diam: 2 * Math.asin(eqrau[ip] / (r * sla.aukm))
    };
};

/**
 * Refractive index and derivative with respect to height for the
 * troposphere.
 * @summary Internal routine used by REFRO
 * @returns {Array} [0] Temperature at R (K)
 *                  [1] Refractive index at R
 *                  [2] R * rate the refractive index is changing at R
 */
sla.atmt = function (r0, t0, alpha, gamm2, delm2, c1, c2, c3, c4, c5, c6, r) {
    "use strict";
    var t = Math.max(Math.min(t0 - alpha * (r - r0), 320), 100);
    var tt0 = t / t0;
    var tt0gm2 = Math.pow(tt0, gamm2);
    var tt0dm2 = Math.pow(tt0, delm2);
    return {
        t: t,
        dn: 1 + (c1 * tt0gm2 - (c2 - c5 / t) * tt0dm2) * tt0,
        rdndr: r * (-c3 * tt0gm2 + (c4 - c6 / tt0) * tt0dm2)
    };
};

/**
 * Refractive index and derivative with respect to height for the
 * stratosphere.
 * @summary Internal routine used by REFRO
 * @returns {Array} [0] Refractive index at R
 *                  [1] R * rate the refractive index is changing at R
 */
sla.atms = function (rt, tt, dnt, gamal, r) {
    "use strict";
    var b = gamal / tt;
    var w = (dnt - 1) * Math.exp(-b * (r - rt));
    return {
        dn: 1 + w,
        rdndr: -r * b * w
    };
};

/**
 * Atmospheric refraction, for radio or optical/IR wavelengths.
 * @summary Refraction
 * @param {Number} zobs - Observed zenith distance of the source (radians)
 * @param {Number} hm - Height of the observer above sea level (metre)
 * @param {Number} tdk - Ambient temperature at the observer K)
 * @param {Number} pmb - Pressure at the observer (mb)
 * @param {Number} rh - Relative humidity at the observer (range 0-1)
 * @param {Number} wl - Effective wavelength of the source (μm)
 * @param {Number} phi - Latitude of the observer (radian, astronomical)
 * @param {Number} tlr - Temperature lapse rate in the troposphere (K per metre)
 * @param {Number} eps - Precision required to terminate iteration (radian)
 * @returns {Number} Refraction: in vacuo ZD minus observed ZD (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss158.html}
 */
sla.refro = function (zobs, hm, tdk, pmb, rh, wl, phi, tlr, eps) {
    "use strict";
    /* 93 degrees in radians */
    var d93 = 1.623156204;
    /* Universal gas constant */
    var gcr = 8314.32;
    /* Molecular weight of dry air */
    var dmd = 28.9644;
    /* Molecular weight of water vapour */
    var dmw = 18.0152;
    /* Mean Earth radius (metre) */
    var s = 6378120;
    /* Exponent of temperature dependence of water vapour pressure */
    var delta = 18.36;
    /* Height of tropopause (metre) */
    var ht = 11000;
    /* Upper limit for refractive effects (metre) */
    var hs = 80000;
    /* Numerical integration: maximum number of strips. */
    var ismax = 16384;

    /* The refraction integrand */
    var refi = function (dn, rdndr) {
        return rdndr / (dn + rdndr);
    };

    /* Transform ZOBS into the normal range. */
    var zobs1 = sla.drange(zobs);
    var zobs2 = Math.min(Math.abs(zobs1), d93);

    /* Keep other arguments within safe bounds. */
    var hmok = Math.min(Math.max(hm, -1e3), hs);
    var tdkok = Math.min(Math.max(tdk, 100), 500);
    var pmbok = Math.min(Math.max(pmb, 0), 10000);
    var rhok = Math.min(Math.max(rh, 0), 1);
    var wlok = Math.max(wl, 0.1);
    var alpha = Math.min(Math.max(Math.abs(tlr), 0.001), 0.01);

    /* Tolerance for iteration. */
    var tol = Math.min(Math.max(Math.abs(eps), 1e-12), 0.1) / 2;

    /* Decide whether optical/IR or radio case - switch at 100 microns. */
    var optic = wlok <= 100;

    /* Set up model atmosphere parameters defined at the observer. */
    var wlsq = wlok * wlok;
    var gb = 9.784 * (1 - 0.0026 * Math.cos(phi + phi) - 0.00000028 * hmok);
    var a;
    if (optic) {
        a = (287.6155 + (1.62887 + 0.01360 / wlsq) / wlsq)
                * 273.15e-6 / 1013.25;
    } else {
        a = 77.6890e-6;
    }
    var gamal = (gb * dmd) / gcr;
    var gamma = gamal / alpha;
    var gamm2 = gamma - 2;
    var delm2 = delta - 2;
    var tdc = tdkok - 273.15;
    var psat = Math.pow(10, (0.7859 + 0.03477 * tdc) / (1 + 0.00412 * tdc) *
            (1 + pmbok * (4.5e-6 + 6e-10 * tdc * tdc)));
    var pw0 = 0;
    if (pmbok > 0) {
        pw0 = rhok * psat / (1 - (1 - rhok) * psat / pmbok);
    }
    var w = pw0 * (1 - dmw / dmd) * gamma / (delta - gamma);
    var c1 = a * (pmbok + w) / tdkok;
    var c2;
    if (optic) {
        c2 = (a * w + 11.2684e-6 * pw0) / tdkok;
    } else {
        c2 = (a * w + 6.3938e-6 * pw0) / tdkok;
    }
    var c3 = (gamma - 1) * alpha * c1 / tdkok;
    var c4 = (delta - 1) * alpha * c2 / tdkok;
    var c5 = 0;
    var c6 = 0;
    if (!optic) {
        c5 = 375463e-6 * pw0 / tdkok;
        c6 = c5 * delm2 * alpha / (tdkok * tdkok);
    }

    /* Conditions at the observer. */
    var r0 = s + hmok;
    var ret = sla.atmt(r0, tdkok, alpha, gamm2, delm2,
            c1, c2, c3, c4, c5, c6, r0);
    var dn0 = ret.dn;
    var rdndr0 = ret.rdndr;
    var sk0 = dn0 * r0 * Math.sin(zobs2);
    var f0 = refi(dn0, rdndr0);

    /* Conditions in the troposphere at the tropopause. */
    var rt = s + Math.max(ht, hmok);
    ret = sla.atmt(r0, tdkok, alpha, gamm2, delm2,
            c1, c2, c3, c4, c5, c6, rt);
    var tt = ret.t;
    var dnt = ret.dn;
    var rdndrt = ret.rdndr;
    var sine = sk0 / (rt * dnt);
    var zt = Math.atan2(sine, Math.sqrt(Math.max(1 - sine * sine, 0)));
    var ft = refi(dnt, rdndrt);

    /* Conditions in the stratosphere at the tropopause. */
    ret = sla.atms(rt, tt, dnt, gamal, rt);
    var dnts = ret.dn;
    var rdndrp = ret.rdndr;
    sine = sk0 / (rt * dnts);
    var zts = Math.atan2(sine, Math.sqrt(Math.max(1 - sine * sine, 0)));
    var fts = refi(dnts, rdndrp);

    /* Conditions at the stratosphere limit. */
    var rs = s + hs;
    ret = sla.atms(rt, tt, dnt, gamal, rs);
    var dns = ret.dn;
    var rdndrs = ret.rdndr;
    sine = sk0 / (rs * dns);
    var zs = Math.atan2(sine, Math.sqrt(Math.max(1 - sine * sine, 0)));
    var fs = refi(dns, rdndrs);

    /* Variable initialization to avoid compiler warning. */
    var reft = 0;

    /* Integrate the refraction integral in two parts;  first in the
     * troposphere (K=1), then in the stratosphere (K=2). */
    var k;
    var refold;
    var is;
    var z0;
    var zrange;
    var fb;
    var ff;
    var fe;
    var n;
    var loop;
    var dn;
    var rdndr;
    var h;
    var r;
    var i;
    var sz;
    var rg;
    var dr;
    var j;
    var f;
    var refp;
    var ref;

    for (k = 1; k <= 2; k += 1) {
        /* Initialize previous refraction to ensure at least two iterations. */
        refold = 1;

        /* Start off with 8 strips. */
        is = 8;

        /* Start Z, Z range, and start and end values. */
        if (k === 1) {
            z0 = zobs2;
            zrange = zt - z0;
            fb = f0;
            ff = ft;
        } else {
            z0 = zts;
            zrange = zs - z0;
            fb = fts;
            ff = fs;
        }

        /* Sums of odd and even values. */
        f0 = 0;
        fe = 0;

        /* First time through the loop we have to do every point. */
        n = 1;

        /* Start of iteration loop (terminates at specified precision). */
        loop = true;
        while (loop) {
            /* Strip width. */
            h = zrange / is;

            /* Initialize distance from Earth centre for quadrature pass. */
            if (k === 1) {
                r = r0;
            } else {
                r = rt;
            }

            /* One pass (no need to compute evens after first time). */
            for (i = 1; i < is; i += n) {
                /* Sine of observed zenith distance. */
                sz = Math.sin(z0 + h * i);

                /* Find R (to the nearest metre, maximum four iterations). */
                if (sz > 1e-20) {
                    w = sk0 / sz;
                    rg = r;
                    dr = 1e6;
                    j = 0;
                    while (Math.abs(dr) > 1 && j < 4) {
                        j += 1;
                        if (k === 1) {
                            ret = sla.atmt(r0, tdkok, alpha, gamm2, delm2,
                                    c1, c2, c3, c4, c5, c6, rg);
                        } else {
                            ret = sla.atms(rt, tt, dnt, gamal, rg);
                        }
                        dn = ret.dn;
                        rdndr = ret.rdndr;
                        dr = (rg * dn - w) / (dn + rdndr);
                        rg -= dr;
                    }
                    r = rg;
                }

                /* Find the refractive index and integrand at R. */
                if (k === 1) {
                    ret = sla.atmt(r0, tdkok, alpha, gamm2, delm2,
                            c1, c2, c3, c4, c5, c6, r);
                } else {
                    ret = sla.atms(rt, tt, dnt, gamal, r);
                }

                dn = ret.dn;
                rdndr = ret.rdndr;
                f = refi(dn, rdndr);

                /* Accumulate odd and (first time only) even values. */
                if (n === 1 && i % 2 === 0) {
                    fe += f;
                } else {
                    f0 += f;
                }
            }

            /* Evaluate the integrand using Simpson's Rule. */
            refp = h * (fb + 4 * f0 + 2 * fe + ff) / 3;

            /* Has the required precision been achieved (or can't be)? */
            if (Math.abs(refp - refold) > tol && is < ismax) {
                /* No: prepare for next iteration. */
                /* Save current value for convergence test. */
                refold = refp;
                /* Double the number of strips. */
                is += is;
                /*  Sum of all current values = sum of next pass's
                 *                              even values. */
                fe += f0;
                /* Prepare for new odd values. */
                f0 = 0;
                /* Skip even values next time. */
                n = 2;
            } else {
                /* Yes: save troposphere component and terminate the loop. */
                if (k === 1) {
                    reft = refp;
                }
                loop = false;
            }
        }
    }
    /* Result */
    ref = reft + refp;
    if (zobs1 < 0) {
        ref = -ref;
    }

    return ref;
};

/**
 * Determine the constants a and b in the atmospheric refraction model
 *     \Delta\zeta=a\tan\zeta+b\tan^3\zeta,
 * where \zeta is the observed zenith distance (i.e. affected by refraction) and
 * \Delta\zeta is what to add to \zeta to give the topocentric (i.e. in vacuo)
 * zenith distance.
 * @summary Refraction Constants
 * @param {Number} hm - Height of the observer above sea level (metre)
 * @param {Number} tdk - Ambient temperature at the observer K)
 * @param {Number} pmb - Pressure at the observer (mb)
 * @param {Number} rh - Relative humidity at the observer (range 0-1)
 * @param {Number} wl - Effective wavelength of the source (microns)
 * @param {Number} phi - Latitude of the observer (radian, astronomical)
 * @param {Number} tlr - Temperature lapse rate in the troposphere (K per metre)
 * @param {Number} eps - Precision required to terminate iteration (radian)
 * @returns {Array} [0] \tan\zeta coefficient (radians)
 *                  [1] \tan^3\zeta coefficient (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss156.html}
 */
sla.refco = function (hm, tdk, pmb, rh, wl, phi, tlr, eps) {
    "use strict";
    /* Sample zenith distances: arctan(1) and arctan(4) */
    var atn1 = 0.7853981633974483;
    var atn4 = 1.325817663668033;

    /* Determine refraction for the two sample zenith distances */
    var r1 = sla.refro(atn1, hm, tdk, pmb, rh, wl, phi, tlr, eps);
    var r2 = sla.refro(atn4, hm, tdk, pmb, rh, wl, phi, tlr, eps);

    /* Solve for refraction constants */
    return {
        refa: (64 * r1 - r2) / 60,
        refb: (r2 - 4 * r1) / 60
    };
};

/**
 * Adjust an unrefracted zenith distance to include the effect of atmospheric
 * refraction, using the simple \Delta\zeta=a\tan\zeta+b\tan^3\zeta model.
 * @summary Apply Refraction to ZD
 * @param {Number} zu - Unrefracted zenith distance of the source (radians)
 * @param {Number} refa - \tan\zeta coefficient (radians)
 * @param {Number} refb - \tan^3\zeta coefficient (radians)
 * @returns {Number} Refracted zenith distance (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss160.html}
 */
sla.refz = function (zu, refa, refb) {
    "use strict";
    /* @constant {Number} Largest usable ZD (deg) */
    var d93 = 93;

    /* Coefficients for high ZD model (used beyond ZD 83 deg) */
    var c1 = 0.55445;
    var c2 = -0.01133;
    var c3 = 0.00202;
    var c4 = 0.28385;
    var c5 = 0.02390;

    /* ZD at which one model hands over to the other (radians) */
    var z83 = 83 / sla.r2d;

    /* High-ZD-model prediction (deg) for that point */
    var ref83 = (c1 + c2 * 7 + c3 * 49) / (1 + c4 * 7 + c5 * 49);

    /* Perform calculations for ZU or 83 deg, whichever is smaller */
    var zu1 = Math.min(zu, z83);

    /* Functions of zd */
    var zl = zu1;
    var s = Math.sin(zl);
    var c = Math.cos(zl);
    var t = s / c;
    var tsq = t * t;
    var tcu = t * tsq;

    /* Refracted ZD (mathematically to better than 1 mas at 70 deg) */
    zl -= (refa * t + refb * tcu) / (1 + (refa + 3 * refb * tsq) / (c * c));

    /* Further iteration */
    s = Math.sin(zl);
    c = Math.cos(zl);
    t = s / c;
    tsq = t * t;
    tcu = t * tsq;
    var ref = zu1 - zl + (zl - zu1 + refa * t + refb * tcu) /
            (1 + (refa + 3 * refb * tsq) / (c * c));

    /* Special handling for large ZU */
    if (zu > zu1) {
        var e = 90 - Math.min(d93, zu * sla.r2d);
        var e2 = e * e;
        ref = (ref / ref83) * (c1 + c2 * e + c3 * e2) /
                (1 + c4 * e + c5 * e2);
    }

    /* Return refracted ZD */
    return zu - ref;
};

/**
 * Barycentric and heliocentric velocity and position of the Earth.
 * @summary Earth Position & Velocity
 * @param {Number} date - TDB (formerly ET) as a Modified Julian Date
 *                        (JD-2400000.5).
 * @param {Number} deqx - Julian Epoch (e.g. 2000D0) of mean equator and
 *                        equinox of the vectors returned. If DEQX <0, all
 *                        vectors are referred to the mean equator and equinox
 *                        (FK5) of date DATE.
 * @returns {Array} [0] dvb - barycentric [\dot x,\dot y,\dot z], AU/s
 *                  [1] dpb - barycentric [x,y,z], AU
 *                  [2] dvh - heliocentric [\dot x,\dot y,\dot z], AU/s
 *                  [3] dph - heliocentric [x,y,z], AU
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss91.html}
 */
sla.evp = function (date, deqx) {
    "use strict";
    /* Control parameter IDEQ, and time arguments */
    var ideq = 0;
    if (deqx > 0) {
        ideq = 1;
    }
    var dt = (date - 15019.5) / 36525;
    var dtsq = dt * dt;

    /* Values of all elements for the instant DATE */
    var forbel = [];
    var sorbel = [];
    var k;
    var dlocal;
    var k3;
    var dml;
    for (k = 0; k < 8; k += 1) {
        k3 = k * 3;
        dlocal = (sla.dcfel[k3] + dt * sla.dcfel[k3 + 1] + dtsq *
                sla.dcfel[k3 + 2]) % sla.d2pi;
        if (k === 0) {
            dml = dlocal;
        } else {
            forbel[k - 1] = dlocal;
        }
    }
    var deps = (sla.dceps[0] + dt * sla.dceps[1] + dtsq * sla.dceps[2])
            % sla.d2pi;
    for (k = 0; k < 17; k += 1) {
        k3 = k * 3;
        sorbel[k] = (sla.ccsel[k3] + dt * sla.ccsel[k3 + 1] +
                dtsq * sla.ccsel[k3 + 2]) % sla.d2pi;
    }
    var sn = [];
    var a;
    /* Secular perturbations in longitude */
    for (k = 0; k < 4; k += 1) {
        k3 = k * 3;
        a = (sla.ccsec[k3 + 1] + dt * sla.ccsec[k3 + 2]) % sla.d2pi;
        sn[k] = Math.sin(a);
    }
    /* Periodic perturbations of the EMB (Earth-Moon barycentre) */
    var pertl = sla.ccsec[0] * sn[0] + sla.ccsec[3] * sn[1] +
            (sla.ccsec[6] + dt * sla.ccsec3) * sn[2] + sla.ccsec[9] * sn[3];
    var pertld = 0;
    var pertr = 0;
    var pertrd = 0;
    var k5;
    var cosa;
    var sina;
    for (k = 0; k < 15; k += 1) {
        k3 = k * 2;
        k5 = k * 5;
        a = (sla.dcargs[k3] + dt * sla.dcargs[k3 + 1]) % sla.d2pi;
        cosa = Math.cos(a);
        sina = Math.sin(a);
        pertl += sla.ccamps[k5] * cosa + sla.ccamps[k5 + 1] * sina;
        pertr += sla.ccamps[k5 + 2] * cosa + sla.ccamps[k5 + 3] * sina;
        if (k < 10) {
            pertld += (sla.ccamps[k5 + 1] * cosa - sla.ccamps[k5] * sina) *
                    sla.ccamps[k5 + 4];
            pertrd += (sla.ccamps[k5 + 3] * cosa - sla.ccamps[k5 + 2] * sina) *
                    sla.ccamps[k5 + 4];
        }
    }

    /* Elliptic part of the motion of the EMB */
    var e = sorbel[0];
    var g = forbel[0];
    var esq = e * e;
    var dparam = 1 - esq;
    var twoe = e + e;
    var twog = g + g;
    var phi = twoe * ((1 - esq * 0.125) * Math.sin(g) + e * 0.625 *
            Math.sin(twog) + esq * 0.54166667 * Math.sin(g + twog));
    var f = g + phi;
    var sinf = Math.sin(f);
    var cosf = Math.cos(f);
    var dpsi = dparam / (1 + (e * cosf));
    var phid = twoe * sla.ccsgd * ((1 + esq * 1.5) * cosf + e *
            (1.25 - sinf * sinf * 0.5));
    var psid = sla.ccsgd * e * sinf / Math.sqrt(dparam);

    /* Perturbed heliocentric motion of the EMB */
    var d1pdro = 1 + pertr;
    var drd = d1pdro * (psid + dpsi * pertrd);
    var drld = d1pdro * dpsi * (sla.dcsld + phid + pertld);
    var dtl = (dml + phi + pertl) % sla.d2pi;
    var dsinls = Math.sin(dtl);
    var dcosls = Math.cos(dtl);
    var dxhd = drd * dcosls - drld * dsinls;
    var dyhd = drd * dsinls + drld * dcosls;

    /* Influence of eccentricity, evection and variation on the
     * geocentric motion of the Moon */
    pertl = 0;
    pertld = 0;
    var pertp = 0;
    var pertpd = 0;
    for (k = 0; k < 3; k += 1) {
        k3 = k * 2;
        k5 = k * 4;
        a = (sla.dcargm[k3] + dt * sla.dcargm[k3 + 1]) % sla.d2pi;
        sina = Math.sin(a);
        cosa = Math.cos(a);
        pertl += sla.ccampm[k5] * sina;
        pertld += sla.ccampm[k5 + 1] * cosa;
        pertp += sla.ccampm[k5 + 2] * cosa;
        pertpd += -sla.ccampm[k5 + 3] * sina;
    }

    /* Heliocentric motion of the Earth */
    var tl = forbel[1] + pertl;
    var sinlm = Math.sin(tl);
    var coslm = Math.cos(tl);
    var sigma = sla.cckm / (1 + pertp);
    a = sigma * (sla.ccmld + pertld);
    var b = sigma * pertpd;
    dxhd += a * sinlm + b * coslm;
    dyhd += -a * coslm + b * sinlm;
    var dzhd = -sigma * sla.ccfdi * Math.cos(forbel[2]);

    /* Barycentric motion of the Earth */
    var dxbd = dxhd * sla.dc1mme;
    var dybd = dyhd * sla.dc1mme;
    var dzbd = dzhd * sla.dc1mme;
    var sinlp = [];
    var coslp = [];
    var plon;
    var pomg;
    var pecc;
    for (k = 0; k < 4; k += 1) {
        plon = forbel[k + 3];
        pomg = sorbel[k + 1];
        pecc = sorbel[k + 9];
        tl = (plon + 2 * pecc * Math.sin(plon - pomg)) % sla.d2pi;
        sinlp[k] = Math.sin(tl);
        coslp[k] = Math.cos(tl);
        dxbd += sla.ccpamv[k] * (sinlp[k] + pecc * Math.sin(pomg));
        dybd += -sla.ccpamv[k] * (coslp[k] + pecc * Math.cos(pomg));
        dzbd += -sla.ccpamv[k] * sorbel[k + 13] *
                Math.cos(plon - sorbel[k + 5]);
    }

    /* Transition to mean equator of date */
    var dcosep = Math.cos(deps);
    var dsinep = Math.sin(deps);
    var dyahd = dcosep * dyhd - dsinep * dzhd;
    var dzahd = dsinep * dyhd + dcosep * dzhd;
    var dyabd = dcosep * dybd - dsinep * dzbd;
    var dzabd = dsinep * dybd + dcosep * dzbd;

    /* Heliocentric coordinates of the Earth */
    var dr = dpsi * d1pdro;
    var flatm = sla.ccim * Math.sin(forbel[2]);
    a = sigma * Math.cos(flatm);
    var dxh = dr * dcosls - a * coslm;
    var dyh = dr * dsinls - a * sinlm;
    var dzh = -sigma * Math.sin(flatm);

    /* Barycentric coordinates of the Earth */
    var dxb = dxh * sla.dc1mme;
    var dyb = dyh * sla.dc1mme;
    var dzb = dzh * sla.dc1mme;
    var flat;
    for (k = 0; k < 4; k += 1) {
        flat = sorbel[k + 13] * Math.sin(forbel[k + 3] - sorbel[k + 5]);
        a = sla.ccpam[k] * (1 - sorbel[k + 9] *
                Math.cos(forbel[k + 3] - sorbel[k + 1]));
        b = a * Math.cos(flat);
        dxb -= b * coslp[k];
        dyb -= b * sinlp[k];
        dzb -= a * Math.sin(flat);
    }

    /* Transition to mean equator of date */
    var dyah = dcosep * dyh - dsinep * dzh;
    var dzah = dsinep * dyh + dcosep * dzh;
    var dyab = dcosep * dyb - dsinep * dzb;
    var dzab = dsinep * dyb + dcosep * dzb;

    /* Copy result components into vectors, correcting for FK4 equinox */
    var depj = sla.epj(date);
    var deqcor = sla.ds2r * (0.035 + 0.00085 * (depj - sla.b1950));
    var dvh = [
        dxhd - deqcor * dyahd,
        dyahd + deqcor * dxhd,
        dzahd
    ];
    var dvb = [
        dxbd - deqcor * dyabd,
        dyabd + deqcor * dxbd,
        dzabd
    ];
    var dph = [
        dxh - deqcor * dyah,
        dyah + deqcor * dxh,
        dzah
    ];
    var dpb = [
        dxb - deqcor * dyab,
        dyab + deqcor * dxb,
        dzab
    ];

    /* Was precession to another equinox requested? */
    if (ideq !== 0) {
        /* Yes: compute precession matrix from MJD DATE to Julian epoch DEQX */
        var dprema = sla.prec(depj, deqx);

        /* Rotate DVH */
        dvh = sla.dmxv(dprema, dvh);

        /* Rotate DVB */
        dvb = sla.dmxv(dprema, dvb);

        /* Rotate DPH */
        dph = sla.dmxv(dprema, dph);

        /* Rotate DPB */
        dpb = sla.dmxv(dprema, dpb);
    }
    return {
        dvb: dvb,
        dpb: dpb,
        dvh: dvh,
        dph: dph
    };
};

/**
 * Normalize a 3-vector, also giving the modulus (double precision).
 * @summary Normalize Vector
 * @param {Array} v - vector
 * @returns {Object} uv - unit vector in direction of V
 *                   vm - modulus of V
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss71.html}
 */
sla.dvn = function (v) {
    "use strict";
    var w1 = 0;
    var i;
    var w2;
    for (i = 0; i < 3; i += 1) {
        w2 = v[i];
        w1 += w2 * w2;
    }
    w1 = Math.sqrt(w1);

    /* Normalize the vector */
    if (w1 <= 0) {
        w1 = 1;
    }
    return {
        uv: v.map(function (x) {
            return x / w1;
        }),
        vm: w1
    };
};

/**
 * Compute star-independent parameters in preparation for conversions between
 * mean place and geocentric apparent place. The parameters produced by this
 * routine are required in the parallax, light deflection, aberration, and
 * precession-nutation parts of the mean/apparent transformations. The reference
 * frames and time scales used are post IAU 1976.
 * @summary Mean to Apparent Parameters
 * @param {Number} eq - Epoch of mean equinox to be used (Julian)
 * @param {Number} date - TDB (JD-2400000.5)
 * @returns {Array} Star-independent mean-to-apparent parameters:
 *                  [0] time interval for proper motion (Julian years)
 *                  [1-3] barycentric position of the Earth (AU)
 *                  [4-6] heliocentric direction of the Earth (unit vector)
 *                  [7] (gravitational radius of Sun)x2/(Sun-Earth distance)
 *                  [8-10] v: barycentric Earth velocity in units of c
 *                  [11] \sqrt{1-|v|^2}
 *                  [12-20] precession-nutation 3x3 matrix
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss116.html}
 */
sla.mappa = function (eq, date) {
    "use strict";
    var amprms = [];

    /* Time interval for proper motion correction */
    amprms[0] = sla.epj(date) - eq;

    /* Get Earth barycentric and heliocentric position and velocity */
    var ret = sla.evp(date, eq);
    var ebd = ret.dvb;
    amprms[1] = ret.dpb[0];
    amprms[2] = ret.dpb[1];
    amprms[3] = ret.dpb[2];
    var eh = ret.dph;

    /* Heliocentric direction of earth (normalized) and modulus */
    ret = sla.dvn(eh);
    amprms[4] = ret.uv[0];
    amprms[5] = ret.uv[1];
    amprms[6] = ret.uv[2];
    var e = ret.vm;

    /* Light deflection parameter */
    amprms[7] = sla.gr2 / e;

    /* Aberration parameters */
    var i;
    for (i = 0; i < 3; i += 1) {
        amprms[i + 8] = ebd[i] * sla.tau;
    }
    ret = sla.dvn(amprms.slice(8, 11));
    amprms[11] = Math.sqrt(1 - ret.vm * ret.vm);

    /* Precession/nutation matrix */
    var p13 = sla.prenut(eq, date);
    return amprms.concat(p13[0], p13[1], p13[2]);
};

/**
 * Transform star [\alpha,\delta] from mean place to geocentric apparent.
 * The reference frames and time scales used are post IAU 1976.
 * @summary Mean to Apparent
 * @param {Number} rm, dm - mean [\alpha,\delta] (radians)
 * @param {Number} pr - proper motions: [\alpha,\delta] changes per Julian year
 * @param {Number} pd - parallax (arcsec)
 * @param {Number} rv - radial velocity (km/s, +ve if receding)
 * @param {Number} eq - epoch and equinox of star data (Julian)
 * @param {Number} date - TDB for apparent place (JD-2400000.5)
 * @returns {Object} ra,da - apparent [\alpha,\delta] (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss115.html}
 */
sla.map = function (rm, dm, pr, pd, px, rv, eq, date) {
    "use strict";
    /* Star-independent parameters */
    var amprms = sla.mappa(eq, date);
    /* Mean to apparent */
    return sla.mapqk(rm, dm, pr, pd, px, rv, amprms);
};

/**
 * Polar motion:  correct site longitude and latitude for polar
 * motion and calculate azimuth difference between celestial and
 * terrestrial poles.
 * @summary Polar Motion
 * @param {Number} elongm - mean longitude of the site (radians, east +ve)
 * @param {Number} phim - mean geodetic latitude of the site (radians)
 * @param {Number} xp - polar motion x-coordinate (radians)
 * @param {Number} yp - polar motion y-coordinate (radians)
 * @returns {Object} elong - true longitude of the site (radians, east +ve)
 *                   phi - true geodetic latitude of the site (radians)
 *                   daz - azimuth correction (terrestrial-celestial, radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss141.html}
 */
sla.polmo = function (elongm, phim, xp, yp) {
    "use strict";
    /* Site mean longitude and mean geodetic latitude as a Cartesian vector */
    var sel = Math.sin(elongm);
    var cel = Math.cos(elongm);
    var sph = Math.sin(phim);
    var cph = Math.cos(phim);

    var xm = cel * cph;
    var ym = sel * cph;
    var zm = sph;

    /* Rotate site vector by polar motion, Y-component then X-component */
    var sxp = Math.sin(xp);
    var cxp = Math.cos(xp);
    var syp = Math.sin(yp);
    var cyp = Math.cos(yp);

    var zw = -ym * syp + zm * cyp;

    var xt = xm * cxp - zw * sxp;
    var yt = ym * cyp + zm * syp;
    var zt = xm * sxp + zw * cxp;

    /* Rotate also the geocentric direction of the terrestrial pole (0,0,1) */
    var xnm = -sxp * cyp;
    var ynm = syp;
    var znm = cxp * cyp;

    cph = Math.sqrt(xt * xt + yt * yt);
    if (cph === 0) {
        xt = 1;
    }
    sel = yt / cph;
    cel = xt / cph;

    /* Return true longitude and true geodetic latitude of site */
    var elong;
    if (xt !== 0 || yt !== 0) {
        elong = Math.atan2(yt, xt);
    } else {
        elong = 0;
    }
    var phi = Math.atan2(zt, cph);

    /* Return current azimuth of terrestrial pole seen from site position */
    var xnt = (xnm * cel + ynm * sel) * zt - znm * cph;
    var ynt = -xnm * sel + ynm * cel;
    var daz;
    if (xnt !== 0 || ynt !== 0) {
        daz = Math.atan2(-ynt, -xnt);
    } else {
        daz = 0;
    }
    return {
        elong: elong,
        phi: phi,
        daz: daz
    };
};

/**
 * Spherical coordinates to Cartesian coordinates.
 * @summary Spherical to Cartesian
 * @param {Number} a,b - spherical coordinates in radians: [\alpha, \delta] etc.
 * @returns {Array} [x,y,z] unit vector
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss38.html}
 */
sla.dcs2c = function (a, b) {
    "use strict";
    return [
        Math.cos(a) * Math.cos(b),
        Math.sin(a) * Math.cos(b),
        Math.sin(b)
    ];
};

/**
 * Scalar product of two 3-vectors.
 * @summary Scalar Product
 * @param {Array(3)} va - first vector
 * @param {Array(3)} vb - second vector
 * @returns {Array(3)} scalar product VA.VB
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss70.html}
 */
sla.dvdv = function (va, vb) {
    "use strict";
    return va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
};

/**
 * Quick mean to apparent place: transform a star [\alpha,\delta] from
 * mean place to geocentric apparent place, given the star-independent
 * parameters, and assuming zero parallax and FK5 proper motion. The
 * reference frames and time scales used are post IAU 1976.
 * @summary Quick Mean-Appt, no PM etc.
 * @param {Number} rm, dm - mean [\alpha,\delta] (radians)
 * @param {Array} amprms - star-independent mean-to-apparent parameters:
 *                [0] time interval for proper motion (Julian years)
 *                [1-3] barycentric position of the Earth (AU)
 *                [4-6] heliocentric direction of the Earth (unit vector)
 *                [7] (gravitational radius of Sun)x2/(Sun-Earth distance)
 *                [8-10] v: barycentric Earth velocity in units of c
 *                [11] \sqrt{1-|v|^2}
 *                [12-20] precession-nutation 3x3 matrix
 * @returns {Object} ra, da - apparent [\alpha,\delta] (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss118.html}
 */
sla.mapqkz = function (rm, dm, amprms) {
    "use strict";
    /* Unpack scalar and vector parameters */
    var gr2e = amprms[7];
    var ab1 = amprms[11];
    var ehn = [];
    var abv = [];
    var i;
    for (i = 0; i < 3; i += 1) {
        ehn[i] = amprms[i + 4];
        abv[i] = amprms[i + 8];
    }

    /* Spherical to x,y,z */
    var p = sla.dcs2c(rm, dm);

    /* Light deflection */
    var p1 = [];
    var p2 = [];
    var pde = sla.dvdv(p, ehn);
    var pdep1 = pde + 1;
    var w = gr2e / Math.max(pdep1, 1e-5);
    for (i = 0; i < 3; i += 1) {
        p1[i] = p[i] + w * (ehn[i] - pde * p[i]);
    }

    /* Aberration */
    var p1dv = sla.dvdv(p1, abv);
    var p1dvp1 = p1dv + 1;
    w = 1 + p1dv / (ab1 + 1);
    for (i = 0; i < 3; i += 1) {
        p2[i] = (ab1 * p1[i] + w * abv[i]) / p1dvp1;
    }

    /* Precession and nutation */
    var p3 = sla.dmxv([
        amprms.slice(12, 15),
        amprms.slice(15, 18),
        amprms.slice(18, 21)
    ], p2);

    /* Geocentric apparent RA,Dec */
    var ret = sla.dcc2s(p3);
    return {
        ra: sla.dranrm(ret.a),
        da: ret.b
    };
};

/**
 * Quick mean to apparent place:  transform a star RA,Dec from
 * mean place to geocentric apparent place, given the
 * star-independent parameters.
 * @summary Quick Mean to Apparent
 * @param {Number} rm, dm - mean [α,δ] (radians)
 * @param {Number} pr, pd - proper motions: [α,δ] changes per Julian year
 * @param {Number} px - parallax (arcsec)
 * @param {Number} rv - radial velocity (km/s, +ve if receding)
 * @param {Array} amprms - star-independent mean-to-apparent parameters:
 *                [0] time interval for proper motion (Julian years)
 *                [1-3] barycentric position of the Earth (AU)
 *                [4-6] heliocentric direction of the Earth (unit vector)
 *                [7] (gravitational radius of Sun)x2/(Sun-Earth distance)
 *                [8-10] v: barycentric Earth velocity in units of c
 *                [11] \sqrt{1-|v|^2}
 *                [12-20] precession-nutation 3x3 matrix
 * @returns {Object} ra, da - apparent [\alpha,\delta] (radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss117.html}
 */
sla.mapqk = function (rm, dm, pr, pd, px, rv, amprms) {
    "use strict";
    /* Unpack scalar and vector parameters */
    var pmt = amprms[0];
    var gr2e = amprms[7];
    var ab1 = amprms[11];
    var eb = [];
    var ehn = [];
    var abv = [];
    var i;
    for (i = 0; i < 3; i += 1) {
        eb[i] = amprms[i + 1];
        ehn[i] = amprms[i + 4];
        abv[i] = amprms[i + 8];
    }

    /* Spherical to x,y,z */
    var q = sla.dcs2c(rm, dm);

    /* Space motion (radians per year) */
    var pxr = px * sla.das2r;
    var w = sla.vf * rv * pxr;
    var em = [
        -pr * q[1] - pd * Math.cos(rm) * Math.sin(dm) + w * q[0],
        pr * q[0] - pd * Math.sin(rm) * Math.sin(dm) + w * q[1],
        pd * Math.cos(dm) + w * q[2]
    ];

    /* Geocentric direction of star (normalized) */
    var p = [];
    var p1 = [];
    var p2 = [];
    for (i = 0; i < 3; i += 1) {
        p[i] = q[i] + pmt * em[i] - pxr * eb[i];
    }
    var ret = sla.dvn(p);
    var pn = ret.uv;
    w = ret.vm;

    /* Light deflection (restrained within the Sun's disc) */
    var pde = sla.dvdv(pn, ehn);
    var pdep1 = pde + 1;
    w = gr2e / Math.max(pdep1, 1e-5);
    for (i = 0; i < 3; i += 1) {
        p1[i] = pn[i] + w * (ehn[i] - pde * pn[i]);
    }

    /* Aberration (normalization omitted) */
    var p1dv = sla.dvdv(p1, abv);
    w = 1 + p1dv / (ab1 + 1);
    for (i = 0; i < 3; i += 1) {
        p2[i] = ab1 * p1[i] + w * abv[i];
    }

    /* Precession and nutation */
    var p3 = sla.dmxv([
        amprms.slice(12, 15),
        amprms.slice(15, 18),
        amprms.slice(18, 21)
    ], p2);

    /* Geocentric apparent RA,Dec */
    ret = sla.dcc2s(p3);
    return {
        ra: sla.dranrm(ret.a),
        da: ret.b
    };
};

/**
 * Vector product of two 3-vectors.
 * @summary Vector product
 * @param {Array} va - first vector
 * @param {Array} vb - second vector
 * @returns {Array} vector product VA x VB
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss72.html}
 */
sla.dvxv = function (va, vb) {
    "use strict";
    /* Form the vector product VA cross VB */
    return [
        va[1] * vb[2] - va[2] * vb[1],
        va[2] * vb[0] - va[0] * vb[2],
        va[0] * vb[1] - va[1] * vb[0]
    ];
};

/**
 * Angle between two vectors.
 * @summary Angle Between 2 Vectors
 * @param {Array} v1 - first vector
 * @param {Array} v2 - second vector
 * @returns {Array} angle between V1 and V2 in radians
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss60.html}
 */
sla.dsepv = function (v1, v2) {
    "use strict";
    /* Modulus of cross product = sine multiplied by the two moduli. */
    var v1xv2 = sla.dvxv(v1, v2);
    var ret = sla.dvn(v1xv2);

    /* Dot product = cosine multiplied by the two moduli. */
    var c = sla.dvdv(v1, v2);

    /* Angle between the vectors. */
    if (ret.vm !== 0 || c !== 0) {
        return Math.atan2(ret.vm, c);
    } else {
        return 0;
    }
};

/**
 * Angle between two points on a sphere.
 * @summary Angle Between 2 Points on Sphere
 * @param {Number} a1, b1 - spherical coordinates of one point (radians)
 * @param {Number} a2, b2 - spherical coordinates of the other point (radians)
 * @returns {Number} angle between [A1,B1] and [A2,B2] in radians
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss59.html}
 */
sla.dsep = function (a1, b1, a2, b2) {
    "use strict";
    /* Convert coordinates from spherical to Cartesian. */
    var v1 = sla.dcs2c(a1, b1);
    var v2 = sla.dcs2c(a2, b2);

    /* Angle between the vectors. */
    return sla.dsepv(v1, v2);
};

/**
 * Form the equatorial to ecliptic rotation matrix (IAU 1980 theory).
 * @summary Form \alpha,\delta -> \lambda,\beta Matrix
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Array} 3x3 rotation matrix
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss76.html}
 */
sla.ecmat = function (date) {
    "use strict";
    /* Interval between basic epoch J2000.0 and current epoch (JC) */
    var t = (date - 51544.5) / 36525;

    /* Mean obliquity */
    var eps0 = sla.das2r * (84381.448 + (-46.8150 + (-0.00059 + 0.001813 *
            t) * t) * t);

    /* Matrix */
    return sla.deuler("X", eps0, 0, 0);
};

/**
 * Transformation from J2000.0 equatorial coordinates to ecliptic
 * longitude and latitude.
 * @summary J2000 RA, Dec to Ecliptic
 * @param {Number} dr, dd - J2000.0 mean [\alpha, \delta] (radians)
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @return {Object} dl, db - ecliptic longitude and latitude (mean of date,
 *                           IAU 1980 theory, radians)
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss86.html}
 */
sla.eqecl = function (dr, dd, date) {
    "use strict";
    /* Spherical to Cartesian */
    var v1 = sla.dcs2c(dr, dd);

    /* Mean J2000 to mean of date */
    var rmat = sla.prec(2000, sla.epj(date));
    var v2 = sla.dmxv(rmat, v1);

    /* Equatorial to ecliptic */
    rmat = sla.ecmat(date);
    v1 = sla.dmxv(rmat, v2);

    /* Cartesian to spherical */
    var ret = sla.dcc2s(v1);

    /* Express in conventional ranges */
    return {
        dl: sla.dranrm(ret.a),
        db: sla.drange(ret.b)
    };
};

/**
 * Hour angle and declination to zenith distance.
 * @summary h,\delta to Zenith Distance
 * @param {Number} ha - Hour Angle in radians
 * @param {Number} dec - Declination in radians
 * @param {Number} phi - Observatory latitude in radians
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss188.html}
 */
sla.zd = function (ha, dec, phi) {
    "use strict";
    var sh = Math.sin(ha);
    var ch = Math.cos(ha);
    var sd = Math.sin(dec);
    var cd = Math.cos(dec);
    var sp = Math.sin(phi);
    var cp = Math.cos(phi);
    var x = ch * cd * sp - sd * cp;
    var y = sh * cd;
    var z = ch * cd * cp + sd * sp;
    return Math.atan2(Math.sqrt(x * x + y * y), z);
};

/**
 * Unit testing
 */
function assertEqual(val, ref) {
    "use strict";
    if (val === ref) {
        return;
    }
    if (Number.isNaN(val)) {
        throw new Error("Assertion failed. NaN value passed.");
    }
    if (val !== ref) {
        throw new Error("Assertion failed. Exact comparison failed.");
    }
}

function assertAlmostEqual(val, ref, tol) {
    "use strict";
    if (Number.isNaN(val)) {
        throw new Error("Assertion failed. NaN value passed.");
    }
    if (Math.abs(val - ref) / Math.abs(ref) > Math.pow(10, -tol)) {
        throw new Error("Assertion failed. Desired precision not reached.");
    }
}

/**
 * Unit tests. The values are taken from the original unit tests in SLALIB
 * (sla_test.f). The desired precision is typically the same, although for
 * some tests it can be lower by a few orders of magnitude.
 */
sla.performUnitTests = function () {
    "use strict";
    var ret;

    /* sla_AIRMAS */
    assertAlmostEqual(sla.airmas(1.2354), 3.015698990074724, 12);

    /* sla_AOP */
    ret = sla.aop(2.7, -0.1234, 51000.1, 25, 2.1, 0.5, 3000, -0.5e-6, 1e-6,
            280, 550, 0.6, 0.45, 0.006);
    assertAlmostEqual(ret.aob, 1.812817787123283034, 5);
    assertAlmostEqual(ret.zob, 1.393860816635714034, 5);
    assertAlmostEqual(ret.hob, -1.297808009092456683, 5);
    assertAlmostEqual(ret.dob, -0.122967060534561, 5);
    assertAlmostEqual(ret.rob, 2.699270287872084, 5);
    ret = sla.aop(2.345, -0.1234, 51000.1, 25, 2.1, 0.5, 3000, -0.5e-6, 1e-6,
            280, 550, 0.6, 0.45, 0.006);
    assertAlmostEqual(ret.aob, 2.019928026670621442, 5);
    assertAlmostEqual(ret.zob, 1.101316172427482466, 5);
    assertAlmostEqual(ret.hob, -0.9432923558497740862, 5);
    assertAlmostEqual(ret.dob, -0.1232144708194224, 5);
    assertAlmostEqual(ret.rob, 2.344754634629428, 5);
    ret = sla.aop(2.345, -0.1234, 51000.1, 25, 2.1, 0.5, 3000, -0.5e-6, 1e-6,
            280, 550, 0.6, 1e6, 0.006);
    assertAlmostEqual(ret.aob, 2.019928026670621442, 5);
    assertAlmostEqual(ret.zob, 1.101267532198003760, 5);
    assertAlmostEqual(ret.hob, -0.9432533138143315937, 5);
    assertAlmostEqual(ret.dob, -0.1231850665614878, 5);
    assertAlmostEqual(ret.rob, 2.344715592593984, 5);

    /* sla_AOPPA */
    ret = sla.aoppa(48000.3, 25, 2.1, 0.5, 3000, -0.5e-6, 1e-6, 280,
            550, 0.6, 0.45, 0.006);
    assertAlmostEqual(ret[0], 0.4999993892136306, 13);
    assertAlmostEqual(ret[1], 0.4794250025886467, 13);
    assertAlmostEqual(ret[2], 0.8775828547167932, 13);
    assertAlmostEqual(ret[3], 1.363180872136126e-6, 13);
    assertEqual(ret[4], 3000);
    assertEqual(ret[5], 280);
    assertEqual(ret[6], 550);
    assertEqual(ret[7], 0.6);
    assertEqual(ret[8], 0.45);
    assertEqual(ret[9], 0.006);
    assertAlmostEqual(ret[10], 0.0001562803328459898, 2);
    assertAlmostEqual(ret[11], -1.792293660141e-7, 2);
    assertAlmostEqual(ret[12], 2.101874231495843, 13);
    assertAlmostEqual(ret[13], 7.601916802079765, 8);

    /* sla_AOPQK */
    ret = sla.aopqk(2.7, -0.1234, sla.aoppa(51000.1, 25, 2.1, 0.5, 3000,
            -0.5e-6, 1e-6, 280, 550, 0.6, 0.45, 0.006));
    assertAlmostEqual(ret.aob, 1.812817787123283034, 7);
    assertAlmostEqual(ret.zob, 1.393860816635714034, 7);
    assertAlmostEqual(ret.hob, -1.297808009092456683, 7);
    assertAlmostEqual(ret.dob, -0.122967060534561, 7);
    assertAlmostEqual(ret.rob, 2.699270287872084, 7);
    ret = sla.aopqk(2.345, -0.1234, sla.aoppa(51000.1, 25, 2.1, 0.5, 3000,
            -0.5e-6, 1e-6, 280, 550, 0.6, 0.45, 0.006));
    assertAlmostEqual(ret.aob, 2.019928026670621442, 7);
    assertAlmostEqual(ret.zob, 1.101316172427482466, 7);
    assertAlmostEqual(ret.hob, -0.9432923558497740862, 7);
    assertAlmostEqual(ret.dob, -0.1232144708194224, 7);
    assertAlmostEqual(ret.rob, 2.344754634629428, 7);
    ret = sla.aopqk(2.345, -0.1234, sla.aoppa(51000.1, 25, 2.1, 0.5, 3000,
            -0.5e-6, 1e-6, 280, 550, 0.6, 1e6, 0.006));
    assertAlmostEqual(ret.aob, 2.019928026670621442, 5);
    assertAlmostEqual(ret.zob, 1.101267532198003760, 5);
    assertAlmostEqual(ret.hob, -0.9432533138143315937, 5);
    assertAlmostEqual(ret.dob, -0.1231850665614878, 5);
    assertAlmostEqual(ret.rob, 2.344715592593984, 5);

    /* sla_ATMDSP */
    ret = sla.atmdsp(275.9, 709.3, 0.9, 0.77, 2.007202720084551e-4,
            -2.223037748876e-7, 0.5);
    assertAlmostEqual(ret.a2, 2.034523658888048e-4, 12);
    assertAlmostEqual(ret.b2, -2.250855362179e-7, 13);

    /* sla_CLDJ */
    assertEqual(sla.cldj(1899, 12, 31), 15019);

    /* sla_DAF2R */
    assertAlmostEqual(sla.daf2r(76, 54, 32.1), 1.342313819975276, 12);

    /* sla_DAT */
    assertEqual(sla.dat(43900), 18);

    /* sla_DAV2M */
    ret = sla.dav2m([-0.123, 0.0987, 0.0654]);
    assertAlmostEqual(ret[0][0], 0.9930075842721269, 12);
    assertAlmostEqual(ret[0][1], 0.05902743090199868, 12);
    assertAlmostEqual(ret[0][2], -0.1022335560329612, 12);
    assertAlmostEqual(ret[1][0], -0.07113807138648245, 12);
    assertAlmostEqual(ret[1][1], 0.9903204657727545, 12);
    assertAlmostEqual(ret[1][2], -0.1191836812279541, 12);
    assertAlmostEqual(ret[2][0], 0.09420887631983825, 12);
    assertAlmostEqual(ret[2][1], 0.1256229973879967, 12);
    assertAlmostEqual(ret[2][2], 0.9875948309655174, 12);

    /* sla_DC62S */
    ret = sla.dc62s([100, -50, 25, -0.1, 0.2, 0.7]);
    assertAlmostEqual(ret.a, -0.4636476090008061, 6);
    assertAlmostEqual(ret.b, 0.2199879773954594, 6);
    assertAlmostEqual(ret.r, 114.564392373896, 9);
    assertAlmostEqual(ret.ad, 0.001200000000000000, 15);
    assertAlmostEqual(ret.bd, 0.006303582107999407, 14);
    assertAlmostEqual(ret.rd, -0.02182178902359925, 13);

    /* sla_DCC2S */
    ret = sla.dcc2s([100, -50, 25]);
    assertAlmostEqual(ret.a, -0.4636476090008061, 12);
    assertAlmostEqual(ret.b, 0.2199879773954594, 12);

    /* sla_DD2TF */
    ret = sla.dd2tf(4, -0.987654321);
    assertEqual(ret.sign, "-");
    assertEqual(ret.ihmsf[0], 23);
    assertEqual(ret.ihmsf[1], 42);
    assertEqual(ret.ihmsf[2], 13);
    assertEqual(ret.ihmsf[3], 3333);

    /* sla_DJCAL */
    ret = sla.djcal(4, 50123.9999);
    assertEqual(ret[0], 1996);
    assertEqual(ret[1], 2);
    assertEqual(ret[2], 10);
    assertEqual(ret[3], 9999);

    /* sla_DJCL */
    ret = sla.djcl(50123.9999);
    assertEqual(ret.iy, 1996);
    assertEqual(ret.im, 2);
    assertEqual(ret.id, 10);
    assertAlmostEqual(ret.f, 0.9999, 7);

    /* sla_DE2H */
    ret = sla.de2h(-0.3, -1.1, -0.7);
    assertAlmostEqual(ret.az, 2.820087515852369, 12);
    assertAlmostEqual(ret.el, 1.132711866443304, 12);

    /* sla_DEULER */
    ret = sla.deuler("YZY", 2.345, -0.333, 2.222);
    assertAlmostEqual(ret[0][0], -0.1681574770810878, 12);
    assertAlmostEqual(ret[0][1], 0.1981362273264315, 12);
    assertAlmostEqual(ret[0][2], 0.9656423242187410, 12);
    assertAlmostEqual(ret[1][0], -0.2285369373983370, 12);
    assertAlmostEqual(ret[1][1], 0.9450659587140423, 12);
    assertAlmostEqual(ret[1][2], -0.2337117924378156, 12);
    assertAlmostEqual(ret[2][0], -0.9589024617479674, 12);
    assertAlmostEqual(ret[2][1], -0.2599853247796050, 12);
    assertAlmostEqual(ret[2][2], -0.1136384607117296, 12);

    /* sla_DIMXV */
    var dav1 = [-0.123, 0.0987, 0.0654];
    var drm1 = sla.dav2m(dav1);
    var drm2 = sla.deuler("YZY", 2.345, -0.333, 2.222);
    var drm = sla.dmxm(drm2, drm1);
    var dv1a = sla.dcs2c(3.0123, -0.999);
    var dv2a = sla.dmxv(drm1, dv1a);
    var dv3 = sla.dmxv(drm2, dv2a);
    ret = sla.dimxv(drm, dv3);
    assertAlmostEqual(ret[0], -0.5366267667260526, 12);
    assertAlmostEqual(ret[1], 0.06977111097651445, 12);
    assertAlmostEqual(ret[2], -0.8409302618566215, 12);

    /* sla_DMOON */
    ret = sla.dmoon(sla.cldj(1999, 12, 31) + 0.9);
    assertAlmostEqual(ret[0], -2.1551584396394953e-3, 12);
    assertAlmostEqual(ret[1], -1.5378642572018313e-3, 12);
    assertAlmostEqual(ret[2], -4.0034441693277050e-4, 12);
    assertAlmostEqual(ret[3], 3.6316816553948431e-9, 15);
    assertAlmostEqual(ret[4], -4.9849322017752987e-9, 15);
    assertAlmostEqual(ret[5], -2.1588349421568112e-9, 15);

    /* sla_DMXV */
    var dav = [-0.123, 0.0987, 0.0654];
    var drm1a = sla.dav2m(dav);
    var drm2a = sla.deuler("YZY", 2.345, -0.333, 2.222);
    var dv1 = sla.dcs2c(3.0123, -0.999);
    var dv2 = sla.dmxv(drm1a, dv1);
    ret = sla.dmxv(drm2a, dv2);
    assertAlmostEqual(ret[0], -0.7267487768696160, 12);
    assertAlmostEqual(ret[1], 0.5011537352639822, 12);
    assertAlmostEqual(ret[2], 0.4697671220397141, 12);

    /* sla_DR2AF */
    ret = sla.dr2af(4, 2.345);
    assertEqual(ret.sign, "+");
    assertEqual(ret.idmsf[0], 134);
    assertEqual(ret.idmsf[1], 21);
    assertEqual(ret.idmsf[2], 30);
    assertEqual(ret.idmsf[3], 9706);

    /* sla_DR2TF */
    ret = sla.dr2tf(4, -3.01234);
    assertEqual(ret.sign, "-");
    assertEqual(ret.ihmsf[0], 11);
    assertEqual(ret.ihmsf[1], 30);
    assertEqual(ret.ihmsf[2], 22);
    assertEqual(ret.ihmsf[3], 6484);

    /* sla_DRANGE */
    assertAlmostEqual(sla.drange(-4), 2.283185307179586, 12);

    /* sla_DRANRM */
    assertAlmostEqual(sla.dranrm(-0.1), 6.183185307179587, 12);

    /* sla_DS2C6 */
    ret = sla.ds2c6(-3.21, 0.123, 0.456, -7.8e-6, 9.01e-6, -1.23e-5);
    assertAlmostEqual(ret[0], -0.4514964673880165, 12);
    assertAlmostEqual(ret[1], 0.03093394277342585, 12);
    assertAlmostEqual(ret[2], 0.05594668105108779, 12);
    assertAlmostEqual(ret[3], 1.292270850663260e-5, 12);
    assertAlmostEqual(ret[4], 2.652814182060692e-6, 12);
    assertAlmostEqual(ret[5], 2.568431853930293e-6, 12);

    /* sla_DSEP */
    var v1 = sla.dcc2s([1, 0.1, 0.2]);
    var v2 = sla.dcc2s([-3, 1e-3, 0.2]);
    assertAlmostEqual(sla.dsep(v1.a, v1.b, v2.a, v2.b), 2.8603919190246608, 7);

    /* sla_DSEPV */
    assertAlmostEqual(sla.dsepv([1, 0.1, 0.2], [-3, 1e-3, 0.2]),
            2.8603919190246608, 7);

    /* sla_DT */
    assertAlmostEqual(sla.dt(500), 4686.7, 10);
    assertAlmostEqual(sla.dt(1400), 408, 11);
    assertAlmostEqual(sla.dt(1950), 27.99145626, 12);

    /* sla_DTF2D */
    assertAlmostEqual(sla.dtf2d(23, 56, 59.1), 0.99790625, 12);

    /* sla_DTF2R */
    assertAlmostEqual(sla.dtf2r(23, 56, 59.1), 6.270029887942679, 12);

    /* sla_DTT */
    assertAlmostEqual(sla.dtt(40404), 39.709746, 12);

    /* sla_DVN */
    ret = sla.dvn([6.889040510209034, -1577.473205461961, 520.1843672856759]);
    assertAlmostEqual(ret.uv[0], 0.004147420704640065, 12);
    assertAlmostEqual(ret.uv[1], -0.9496888606842218, 12);
    assertAlmostEqual(ret.uv[2], 0.3131674740355448, 12);
    assertAlmostEqual(ret.vm, 1661.042127339937, 9);

    /* sla_DVXV */
    ret = sla.dvxv([0.004147420704640065, -0.9496888606842218,
            0.3131674740355448], [-0.5366267667260525, 0.06977111097651444,
            -0.8409302618566215]);
    assertAlmostEqual(ret[0], 0.7767720597123304, 12);
    assertAlmostEqual(ret[1], -0.1645663574562769, 12);
    assertAlmostEqual(ret[2], -0.5093390925544726, 12);

    /* sla_ECMAT */
    ret = sla.ecmat(41234);
    assertEqual(ret[0][0], 1);
    assertEqual(ret[0][1], 0);
    assertEqual(ret[0][2], 0);
    assertEqual(ret[1][0], 0);
    assertAlmostEqual(ret[1][1], 0.917456575085716, 12);
    assertAlmostEqual(ret[1][2], 0.397835937079581, 12);
    assertEqual(ret[2][0], 0);
    assertAlmostEqual(ret[2][1], -0.397835937079581, 12);
    assertAlmostEqual(ret[2][2], 0.917456575085716, 12);

    /* sla_EPJ */
    assertAlmostEqual(sla.epj(42999), 1976.603696098563, 7);

    /* sla_EQECL */
    ret = sla.eqecl(0.789, -0.123, 46555);
    assertAlmostEqual(sla.dl, 0.7036566430349022, 12);
    assertAlmostEqual(sla.db, -0.4036047164116848, 12);

    /* sla_EQEQX */
    assertAlmostEqual(sla.eqeqx(41234), 5.376047445838358596e-5, 12);

    /* sla_EVP */
    ret = sla.evp(50100, 1990);
    assertAlmostEqual(ret.dvb[0], -1.807210068604058436e-7, 12);
    assertAlmostEqual(ret.dvb[1], -8.385891022440320e-8, 12);
    assertAlmostEqual(ret.dvb[2], -3.635846882638055e-8, 12);
    assertAlmostEqual(ret.dpb[0], -0.4515615297360333, 7);
    assertAlmostEqual(ret.dpb[1], 0.8103788166239596, 7);
    assertAlmostEqual(ret.dpb[2], 0.3514505204144827, 7);
    assertAlmostEqual(ret.dvh[0], -1.806354061156890855e-7, 12);
    assertAlmostEqual(ret.dvh[1], -8.383798678086174e-8, 12);
    assertAlmostEqual(ret.dvh[2], -3.635185843644782e-8, 12);
    assertAlmostEqual(ret.dph[0], -0.4478571659918565, 7);
    assertAlmostEqual(ret.dph[1], 0.8036439916076232, 7);
    assertAlmostEqual(ret.dph[2], 0.3484298459102053, 7);

    /* sla_FK52H */
    ret = sla.fk52h(1.234, -0.987, 1e-6, -2e-6);
    assertAlmostEqual(ret.rh, 1.234000000272122558, 13);
    assertAlmostEqual(ret.dh, -0.9869999235218543959, 13);
    assertAlmostEqual(ret.drh, 0.000000993178295, 9);
    assertAlmostEqual(ret.ddh, -0.000001997665915, 9);

    /* sla_GEOC */
    ret = sla.geoc(0.4321, 2345);
    assertAlmostEqual(ret.r, 3.8753538604880781e-5, 12);
    assertAlmostEqual(ret.z, 1.7752185855173969e-5, 12);

    /* sla_GMST */
    assertAlmostEqual(sla.gmst(43999.999), 3.9074971356487318, 9);

    /* sla_GMSTA */
    assertAlmostEqual(sla.gmsta(43999, 0.999), 3.9074971356487318, 12);

    /* sla_H2FK5 */
    ret = sla.h2fk5(1.234000000272122558, -0.9869999235218543959,
            0.000000993178295, -0.000001997665915);
    assertAlmostEqual(ret.r5, 1.234, 13);
    assertAlmostEqual(ret.d5, -0.987, 13);
    assertAlmostEqual(ret.dr5, 1e-6, 8);
    assertAlmostEqual(ret.dd5, -2e-6, 8);

    /* sla_MAP */
    ret = sla.map(6.123, -0.999, 1.23e-5, -0.987e-5,
            0.123, 32.1, 1999, 43210.9);
    assertAlmostEqual(ret.ra, 6.117130429775647, 12);
    assertAlmostEqual(ret.da, -1.000880769038632, 12);

    /* sla_MAPPA */
    ret = sla.mappa(2020, 45012.3);
    assertAlmostEqual(ret[0], -37.884188911704310, 11);
    assertAlmostEqual(ret[1], -0.7888341859486424, 7);
    assertAlmostEqual(ret[2], 0.5405321789059870, 7);
    assertAlmostEqual(ret[3], 0.2340784267119091, 7);
    assertAlmostEqual(ret[4], -0.8067807553217332071, 7);
    assertAlmostEqual(ret[5], 0.5420884771236513880, 7);
    assertAlmostEqual(ret[6], 0.2350423277034460899, 7);
    assertAlmostEqual(ret[7], 1.999729469227807e-8, 8);
    assertAlmostEqual(ret[8], -6.035531043691568494e-5, 8);
    assertAlmostEqual(ret[9], -7.381891582591552377e-5, 8);
    assertAlmostEqual(ret[10], -3.200897749853207412e-5, 8);
    assertAlmostEqual(ret[11], 0.9999999949417148, 11);
    assertAlmostEqual(ret[12], 0.9999566751478850, 11);
    assertAlmostEqual(ret[13], 8.537308717676752e-3, 11);
    assertAlmostEqual(ret[14], 3.709742180572510e-3, 11);
    assertAlmostEqual(ret[15], -8.537361890149777e-3, 11);
    assertAlmostEqual(ret[16], 0.9999635560607690, 11);
    assertAlmostEqual(ret[17], -1.502613373498668e-6, 11);
    assertAlmostEqual(ret[18], -3.709619811228171e-3, 11);
    assertAlmostEqual(ret[19], -3.016886324169151e-5, 11);
    assertAlmostEqual(ret[20], 0.9999931188816729, 11);

    /* sla_MAPQK */
    ret = sla.mapqk(1.234, -0.987, -1.2e-5, -0.99, 0.75, -23.4,
            sla.mappa(2020, 45012.3));
    assertAlmostEqual(ret.ra, 1.223337584930993, 11);
    assertAlmostEqual(ret.da, 0.5558838650379129, 11);

    /* sla_MAPQKZ */
    ret = sla.mapqkz(6.012, 1.234,
            sla.mappa(2020, 45012.3));
    assertAlmostEqual(ret.ra, 6.006091119756597, 11);
    assertAlmostEqual(ret.da, 1.23045846622498, 11);

    /* sla_NUT */
    ret = sla.nut(46012.34);
    assertAlmostEqual(ret[0][0], 9.999999969492166e-1, 11);
    assertAlmostEqual(ret[0][1], 7.166577986249302e-5, 11);
    assertAlmostEqual(ret[0][2], 3.107382973077677e-5, 11);
    assertAlmostEqual(ret[1][0], -7.166503970900504e-5, 11);
    assertAlmostEqual(ret[1][1], 9.999999971483732e-1, 11);
    assertAlmostEqual(ret[1][2], -2.381965032461830e-5, 11);
    assertAlmostEqual(ret[2][0], -3.107553669598237e-5, 11);
    assertAlmostEqual(ret[2][1], 2.381742334472628e-5, 11);
    assertAlmostEqual(ret[2][2], 9.999999992335206818e-1, 11);

    /* sla_NUTC */
    ret = sla.nutc(50123.4);
    assertAlmostEqual(ret.dpsi, 3.523550954747999709e-5, 12);
    assertAlmostEqual(ret.deps, -4.143371566683342e-5, 12);
    assertAlmostEqual(ret.eps0, 0.4091014592901651, 12);

    /* sla_POLMO */
    ret = sla.polmo(0.7, -0.5, 1e-6, -2e-6);
    assertAlmostEqual(ret.elong, 0.7000004837322044, 12);
    assertAlmostEqual(ret.phi, -0.4999979467222241, 12);
    assertAlmostEqual(ret.daz, 1.008982781275728e-6, 12);

    /* sla_PRENUT */
    ret = sla.prenut(1985, 50123.4567);
    assertAlmostEqual(ret[0][0], 9.999962358680738e-1, 12);
    assertAlmostEqual(ret[0][1], -2.516417057665452e-3, 12);
    assertAlmostEqual(ret[0][2], -1.093569785342370e-3, 12);
    assertAlmostEqual(ret[1][0], 2.516462370370876e-3, 12);
    assertAlmostEqual(ret[1][1], 9.999968329010883e-1, 12);
    assertAlmostEqual(ret[1][2], 4.006159587358310e-5, 12);
    assertAlmostEqual(ret[2][0], 1.093465510215479e-3, 12);
    assertAlmostEqual(ret[2][1], -4.281337229063151e-5, 12);
    assertAlmostEqual(ret[2][2], 9.999994012499173e-1, 12);

    /* sla_RDPLAN */
    ret = sla.rdplan(40999.9, "Sun", 0.1, -0.9);
    assertAlmostEqual(ret.ra, 5.772270359389275837, 7);
    assertAlmostEqual(ret.dec, -0.2089207338795416192, 7);
    assertAlmostEqual(ret.diam, 9.415338935229717875e-3, 12);
    ret = sla.rdplan(41999.9, "Mercury", 1.1, -0.9);
    assertAlmostEqual(ret.ra, 3.866363420052936653, 7);
    assertAlmostEqual(ret.dec, -0.2594430577550113130, 7);
    assertAlmostEqual(ret.diam, 4.638468996795023071e-5, 12);
    ret = sla.rdplan(42999.9, "Venus", 2.1, 0.9);
    assertAlmostEqual(ret.ra, 2.695383203184077378, 7);
    assertAlmostEqual(ret.dec, 0.2124044506294805126, 7);
    assertAlmostEqual(ret.diam, 4.892222838681000389e-5, 12);
    ret = sla.rdplan(43999.9, "Moon", 3.1, 0.9);
    assertAlmostEqual(ret.ra, 2.908326678461540165, 7);
    assertAlmostEqual(ret.dec, 0.08729783126905579385, 7);
    assertAlmostEqual(ret.diam, 8.581305866034962476e-3, 12);
    ret = sla.rdplan(44999.9, "Mars", -0.1, 1.1);
    assertAlmostEqual(ret.ra, 3.429840787472851721, 7);
    assertAlmostEqual(ret.dec, -0.06979851055261161013, 7);
    assertAlmostEqual(ret.diam, 4.540536678439300199e-5, 12);
    ret = sla.rdplan(45999.9, "Jupiter", -1.1, 0.1);
    assertAlmostEqual(ret.ra, 4.864669466449422548, 7);
    assertAlmostEqual(ret.dec, -0.4077714497908953354, 7);
    assertAlmostEqual(ret.diam, 1.727945579027815576e-4, 12);
    ret = sla.rdplan(46999.9, "Saturn", -2.1, -0.1);
    assertAlmostEqual(ret.ra, 4.432929829176388766, 7);
    assertAlmostEqual(ret.dec, -0.3682820877854730530, 7);
    assertAlmostEqual(ret.diam, 8.670829016099083311e-5, 12);
    ret = sla.rdplan(47999.9, "Uranus", -3.1, -1.1);
    assertAlmostEqual(ret.ra, 4.894972492286818487, 7);
    assertAlmostEqual(ret.dec, -0.4084068901053653125, 7);
    assertAlmostEqual(ret.diam, 1.793916783975974163e-5, 12);
    ret = sla.rdplan(48999.9, "Neptune", 0, 0);
    assertAlmostEqual(ret.ra, 5.066050284760144000, 7);
    assertAlmostEqual(ret.dec, -0.3744690779683850609, 7);
    assertAlmostEqual(ret.diam, 1.062210086082700563e-5, 12);
    ret = sla.rdplan(49999.9, "Pluto", 0, 0);
    assertAlmostEqual(ret.ra, 4.179543143097200945, 7);
    assertAlmostEqual(ret.dec, -0.1258021632894033300, 7);
    assertAlmostEqual(ret.diam, 5.034057475664904352e-7, 12);

    /* sla_REFCO */
    ret = sla.refco(2111.1, 275.9, 709.3, 0.9, 101, -1.03, 0.0067, 1e-12);
    assertAlmostEqual(ret.refa, 2.3257404447937042e-4, 12);
    assertAlmostEqual(ret.refb, -2.2652153783432995e-7, 12);
    ret = sla.refco(2111.1, 275.9, 709.3, 0.9, 0.77, -1.03, 0.0067, 1e-12);
    assertAlmostEqual(ret.refa, 2.0071938389101652e-4, 12);
    assertAlmostEqual(ret.refb, -2.2230438392616659e-7, 12);

    /* sla_REFRO */
    assertAlmostEqual(sla.refro(1.4, 3456.7, 280, 678.9, 0.9, 0.55, -0.3,
            0.006, 1e-9), 1.0671490945850398e-3, 12);
    assertAlmostEqual(sla.refro(1.4, 3456.7, 280, 678.9, 0.9, 1000, -0.3,
            0.006, 1e-9), 1.2973965490831413e-3, 12);

    /* sla_REFZ */
    assertAlmostEqual(sla.refz(0.567, 2.007202720084551e-4, -2.223037748876e-7),
            0.566872285910534, 12);
    assertAlmostEqual(sla.refz(1.55, 2.007202720084551e-4, -2.223037748876e-7),
            1.545697350690958, 12);

    /* sla_ZD */
    assertAlmostEqual(sla.zd(-1.023, -0.876, -0.432), 0.8963914139430839, 12);
};

sla.performUnitTests();
