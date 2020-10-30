/**
 * @file SLALIB subroutines used by Visplot, ported to JavaScript.
 * @author Emanuel Gafton
 * @copyright (c) 2016-2021 Emanuel Gafton, NOT/ING.
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
/* @constant {Number} Earth equatorial radius in AU (= 6378.137 / 149597870) */
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
/* @constant {Number} Small number to avoid arithmetic problems */
sla.tiny = 1e-30;

/**
 * @summary **Air Mass**
 * @param {Number} zd - Observed zenith distance (radians).
 * @returns {Number} Air mass (1 at zenith).
 * @description Air mass at given zenith distance.
 * 1. The *observed* zenith distance referred to above means “as affected by
 *    refraction”.
 * 2. The routine uses Hardie’s (1962) polynomial fit to Bemporad’s data
 *    for the relative air mass, X, in units of thickness at the zenith as
 *    tabulated by Schoenberg (1929). This is adequate for all normal needs
 *    as it is accurate to better than 0.1% up to X=6.8 and better than 1%
 *    up to X=10. Bemporad’s tabulated values are unlikely to be trustworthy
 *    to such accuracy because of variations in density, pressure and other
 *    conditions in the atmosphere from those assumed in his work.
 * 3. The sign of the ZD is ignored.
 * 4. At zenith distances greater than about ζ=87° the air mass is held
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
    const seczm1 = 1 / (Math.cos(Math.min(1.52, Math.abs(zd)))) - 1;
    return 1 + seczm1 * (0.9981833 - seczm1 * (0.002875 + 0.0008083 * seczm1));
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
 * @returns {Object}
 * + aob - observed azimuth (radians: N=0, E=90°)
 * + zob - observed zenith distance (radians)
 * + hob - observed Hour Angle (radians)
 * + dob - observed *δ* (radians)
 * + rob - observed *α* (radians)
 * @description Apparent to observed place, for sources distant from the
 *              solar system.
 * 1. This routine returns zenith distance rather than elevation in order to
 *    reflect the fact that no allowance is made for depression of the horizon.
 * 2. The accuracy of the result is limited by the corrections for refraction.
 *    Providing the meteorological parameters are known accurately and there
 *    are no gross local effects, the predicted azimuth and elevation should
 *    be within about ′′01 for ζ<70°. Even at a topocentric zenith distance of
 *    90°, the accuracy in elevation should be better than 1 arcminute; useful
 *    results are available for a further 3°, beyond which the {@link sla.refro}
 *    routine returns a fixed value of the refraction. The complementary
 *    routines {@link sla.aop} (or {@link sla.aopqk}) and {@link sla.oap} (or
 *    {@link sla.oapqk} are self-consistent to better than 1 microarcsecond all
 *    over the celestial sphere.
 * 3. It is advisable to take great care with units, as even unlikely values
 *    of the input parameters are accepted and processed in accordance with
 *    the models used.
 * 4. *Apparent* [*α*,*δ*] means the geocentric apparent right ascension and
 *    declination, which is obtained from a catalogue mean place by allowing
 *    for space motion, parallax, the Sun’s gravitational lens effect, annual
 *    aberration, and precession-nutation. For star positions in the FK5 system
 *    (i.e. J2000), these effects can be applied by means of the {@link sla.map}
 *    etc. routines. Starting from other mean place systems, additional
 *    transformations will be needed; for example, FK4 (i.e. B1950) mean places
 *    would first have to be converted to FK5, which can be done with the
 *    {@link sla.fk425} etc. routines.
 * 5. *Observed* [*Az*,*El*] means the position that would be seen by a perfect
 *    theodolite located at the observer. This is obtained from the geocentric
 *    apparent [*α*,*δ*] by allowing for Earth orientation and diurnal
 *    aberration, rotating from equator to horizon coordinates, and then
 *    adjusting for refraction. The [*h*,*δ*] is obtained by rotating back into
 *    equatorial coordinates, using the geodetic latitude corrected for polar
 *    motion, and is the position that would be seen by a perfect equatorial
 *    located at the observer and with its polar axis aligned to the Earth’s
 *    axis of rotation (n.b. not to the refracted pole). Finally, the *α* is
 *    obtained by subtracting the *h* from the local apparent ST.
 * 6. To predict the required setting of a real telescope, the observed place
 *    produced by this routine would have to be adjusted for the tilt of the
 *    azimuth or polar axis of the mounting (with appropriate corrections for
 *    mount flexures), for non-perpendicularity between the mounting axes, for
 *    the position of the rotator axis and the pointing axis relative to it,
 *    for tube flexure, for gear and encoder errors, and finally for encoder
 *    zero points. Some telescopes would, of course, exhibit other properties
 *    which would need to be accounted for at the appropriate point in the
 *    sequence.
 * 7. This routine takes time to execute, due mainly to the rigorous integration
 *    used to evaluate the refraction. For processing multiple stars for one
 *    location and time, call {@link sla.aoppa} once followed by one call per
 *    star to {@link sla.aopqk}. Where a range of times within a limited period
 *    of a few hours is involved, and the highest precision is not required,
 *    call {@link sla.aoppa} once, followed by a call to {@link sla.aoppat}
 *    each time the time changes, followed by one call per star to
 *    {@link sla.aopqk}.
 * 8. The DATE argument is UTC expressed as an MJD. This is, strictly speaking,
 *    wrong, because of leap seconds. However, as long as the ΔUT and the UTC
 *    are consistent there are no difficulties, except during a leap second.
 *    In this case, the start of the 61st second of the final minute should
 *    begin a new MJD day and the old pre-leap ΔUT should continue to be used.
 *    As the 61st second completes, the MJD should revert to the start of the
 *    day as, simultaneously, the ΔUT changes by one second to its post-leap
 *    new value.
 * 9. The ΔUT (UT1−UTC) is tabulated in IERS circulars and elsewhere. It
 *    increases by exactly one second at the end of each UTC leap second,
 *    introduced in order to keep ΔUT within ±0.9s.
 * 10. IMPORTANT − TAKE CARE WITH THE LONGITUDE SIGN CONVENTION. The longitude
 *    required by the present routine is **east-positive**, in accordance with
 *    geographical convention (and right-handed). In particular, note that
 *    the longitudes returned by the {@link sla.obs} routine are west-positive
 *    (as in the *Astronomical Almanac* before 1984) and must be reversed in
 *    sign before use in the present routine.
 * 11. The polar coordinates XP,YP can be obtained from IERS circulars and
 *    equivalent publications. The maximum amplitude is about ′′03. If XP,YP
 *    values are unavailable, use XP=YP=0. See page B60 of the 1988
 *    *Astronomical Almanac* for a definition of the two angles.
 * 12. The height above sea level of the observing station, HM, can be obtained
 *    from the *Astronomical Almanac* (Section J in the 1988 edition), or via
 *    the routine {@link sla.obs}. If P, the pressure in millibars, is
 *    available, an adequate estimate of HM can be obtained from the following
 *    expression:
 *       HM = -29.3 * TSL * Math.log(P / 1013.25)
 *    where TSL is the approximate sea-level air temperature in K (see
 *    *Astrophysical Quantities*, C.W.Allen, 3rd edition, §52). Similarly, if
 *    the pressure P is not known, it can be estimated from the height of the
 *    observing station, HM as follows:
 *        P = 1013.25 * Math.exp(-HM / (29.3 * TSL))
 *    Note, however, that the refraction is nearly proportional to the pressure
 *    and that an accurate P value is important for precise work.
 * 13. The azimuths etc. used by the present routine are with respect to the
 *    celestial pole. Corrections to the terrestrial pole can be computed using
 *    {@link sla.polmo}.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss7.html}
 */
sla.aop = function (rap, dap, date, dut, elongm, phim, hm, xp, yp,
        tdk, pmb, rh, wl, tlr) {
    "use strict";
    /* Star-independent parameters */
    const aoprms = sla.aoppa(date, dut, elongm, phim, hm, xp, yp, tdk, pmb, rh,
        wl, tlr);
    /* Apparent to observed */
    return sla.aopqk(rap, dap, aoprms);
};

/**
 * @summary **Appt-to-Obs Parameters**
 * @param {Number} date - UTC date/time (Modified Julian Date, JD–2400000.5)
 * @param {Number} dut - ΔUT: UT1–UTC (UTC seconds)
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
 * 2. The DATE argument is UTC expressed as an MJD. This is, strictly speaking,
 *    wrong, because of leap seconds. However, as long as the ΔUT and the UTC
 *    are consistent there are no difficulties, except during a leap second.
 *    In this case, the start of the 61st second of the final minute should
 *    begin a new MJD day and the old pre-leap ΔUT should continue to be used.
 *    As the 61st second completes, the MJD should revert to the start of the
 *    day as, simultaneously, the ΔUT changes by one second to its post-leap
 *    new value.
 * 3. The ΔUT (UT1−UTC) is tabulated in IERS circulars and elsewhere. It
 *    increases by exactly one second at the end of each UTC leap second,
 *    introduced in order to keep ΔUT within ±0.9s.
 * 4. IMPORTANT − TAKE CARE WITH THE LONGITUDE SIGN CONVENTION. The longitude
 *    required by the present routine is **east-positive**, in accordance with
 *    geographical convention (and right-handed). In particular, note that
 *    the longitudes returned by the {@link sla.obs} routine are west-positive
 *    (as in the *Astronomical Almanac* before 1984) and must be reversed in
 *    sign before use in the present routine.
 * 5. The polar coordinates XP,YP can be obtained from IERS circulars and
 *    equivalent publications. The maximum amplitude is about ′′03. If XP,YP
 *    values are unavailable, use XP=YP=0. See page B60 of the 1988
 *    *Astronomical Almanac* for a definition of the two angles.
 * 6. The height above sea level of the observing station, HM, can be obtained
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
 * 7. Repeated, computationally-expensive, calls to {@link sla.aoppa} for times
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

    /* Observer's location corrected for polar motion */
    const cphim = Math.cos(phim);
    const xt = Math.cos(elongm) * cphim;
    const yt = Math.sin(elongm) * cphim;
    const zt = Math.sin(phim);
    const xc = xt - xp * zt;
    const yc = yt + yp * zt;
    const zc = xp * xt - yp * yt + zt;
    const elong = (xc === 0 && yc === 0) ? 0 : Math.atan2(yc, xc);
    const phi = Math.atan2(zc, Math.sqrt(xc * xc + yc * yc));
    let aoprms = [];
    aoprms[0] = phi;
    aoprms[1] = Math.sin(phi);
    aoprms[2] = Math.cos(phi);

    /* Magnitude of the diurnal aberration vector */
    aoprms[3] = sla.d2pi * sla.geoc(phi, hm).r * sla.solsid / sla.c;

    /* Copy the refraction parameters and compute the A & B constants */
    aoprms[4] = hm;
    aoprms[5] = tdk;
    aoprms[6] = pmb;
    aoprms[7] = rh;
    aoprms[8] = wl;
    aoprms[9] = tlr;
    const ret = sla.refco(hm, tdk, pmb, rh, wl, phi, tlr, 1e-10);
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
    return aoprms;
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
 * 2. The accuracy of the result is limited by the corrections for refraction.
 *    Providing the meteorological parameters are known accurately and there
 *    are no gross local effects, the predicted azimuth and elevation should
 *    be within about ′′01 for ζ<70°. Even at a topocentric zenith distance of
 *    90°, the accuracy in elevation should be better than 1 arcminute; useful
 *    results are available for a further 3°, beyond which the {@link sla.refro}
 *    routine returns a fixed value of the refraction. The complementary
 *    routines {@link sla.aop} (or {@link sla.aopqk}) and {@link sla.oap} (or
 *    {@link sla.oapqk} are self-consistent to better than 1 microarcsecond all
 *    over the celestial sphere.
 * 3. It is advisable to take great care with units, as even unlikely values
 *    of the input parameters are accepted and processed in accordance with
 *    the models used.
 * 4. *Apparent* [*α*,*δ*] means the geocentric apparent right ascension and
 *    declination, which is obtained from a catalogue mean place by allowing
 *    for space motion, parallax, the Sun’s gravitational lens effect, annual
 *    aberration, and precession-nutation. For star positions in the FK5 system
 *    (i.e. J2000), these effects can be applied by means of the {@link sla.map}
 *    etc. routines. Starting from other mean place systems, additional
 *    transformations will be needed; for example, FK4 (i.e. B1950) mean places
 *    would first have to be converted to FK5, which can be done with the
 *    {@link sla.fk425} etc. routines.
 * 5. *Observed* [*Az*,*El*] means the position that would be seen by a perfect
 *    theodolite located at the observer. This is obtained from the geocentric
 *    apparent [*α*,*δ*] by allowing for Earth orientation and diurnal
 *    aberration, rotating from equator to horizon coordinates, and then
 *    adjusting for refraction. The [*h*,*δ*] is obtained by rotating back into
 *    equatorial coordinates, using the geodetic latitude corrected for polar
 *    motion, and is the position that would be seen by a perfect equatorial
 *    located at the observer and with its polar axis aligned to the Earth’s
 *    axis of rotation (n.b. not to the refracted pole). Finally, the *α* is
 *    obtained by subtracting the *h* from the local apparent ST.
 * 6. To predict the required setting of a real telescope, the observed place
 *    produced by this routine would have to be adjusted for the tilt of the
 *    azimuth or polar axis of the mounting (with appropriate corrections for
 *    mount flexures), for non-perpendicularity between the mounting axes, for
 *    the position of the rotator axis and the pointing axis relative to it,
 *    for tube flexure, for gear and encoder errors, and finally for encoder
 *    zero points. Some telescopes would, of course, exhibit other properties
 *    which would need to be accounted for at the appropriate point in the
 *    sequence.
 * 7. The star-independent apparent-to-observed-place parameters in AOPRMS may
 *    be computed by means of the {@link sla.aoppa} routine. If nothing has
 *    changed significantly except the time, the {@link sla.aoppat} routine may
 *    be used to perform the requisite partial recomputation of AOPRMS.
 * 8. At zenith distances beyond about 76°, the need for special care with the
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
 * 9. The azimuths etc. used by the present routine are with respect to the
 *    celestial pole. Corrections to the terrestrial pole can be computed using
 *    {@link sla.polmo}.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss10.html}
 */
sla.aopqk = function (rap, dap, aoprms) {
    "use strict";
    const zbreak = 0.242535625;
    /* Sin, cos of latitude */
    const sphi = aoprms[1];
    const cphi = aoprms[2];

    /* Local apparent sidereal time */
    const st = aoprms[13];

    /* Apparent RA,Dec to Cartesian -HA,Dec */
    let v = sla.dcs2c(rap - st, dap);
    const xhd = v[0];
    const yhd = v[1];
    const zhd = v[2];

    /* Diurnal aberration */
    const diurab = aoprms[3];
    const f = (1 - diurab * yhd);
    const xhdt = f * xhd;
    const yhdt = f * (yhd + diurab);
    const zhdt = f * zhd;

    /* Cartesian -HA,Dec to Cartesian Az,El (S=0,E=90) */
    const xaet = sphi * xhdt - cphi * zhdt;
    const yaet = yhdt;
    const zaet = cphi * xhdt + sphi * zhdt;

    /* Azimuth (N=0,E=90) */
    const azobs = (xaet === 0 && yaet === 0) ? 0 : Math.atan2(yaet, -xaet);

    /* Topocentric zenith distance */
    const zdt = Math.atan2(Math.sqrt(xaet * xaet + yaet * yaet), zaet);
    /* Refraction */
    let zdobs = sla.refz(zdt, aoprms[10], aoprms[11]);

    /* Large zenith distance? */
    if (Math.cos(zdobs) < zbreak) {
        /* Yes: use rigorous algorithm */
        /* Initialize loop (maximum of 10 iterations) */
        let i = 0;
        let dzd = 1;
        let dref;
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
    const ce = Math.sin(zdobs);
    const xaeo = -Math.cos(azobs) * ce;
    const yaeo = Math.sin(azobs) * ce;
    const zaeo = Math.cos(zdobs);

    /* Cartesian Az/ZD to Cartesian -HA,Dec */
    v[0] = sphi * xaeo + cphi * zaeo;
    v[1] = yaeo;
    v[2] = -cphi * xaeo + sphi * zaeo;

    /* To spherical -HA,Dec */
    const ret = sla.dcc2s(v);
    const hmobs = ret.a;
    const dcobs = ret.b;

    /* Right Ascension */
    const raobs = sla.dranrm(st + hmobs);

    /* Return the results */
    return {
        "aob": azobs,
        "zob": zdobs,
        "hob": -hmobs,
        "dob": dcobs,
        "rob": raobs
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
 * 2. Most of the atmospheric dispersion happens between 0.7μm and the UV
 *    atmospheric cutoff, and the effect increases strongly towards the UV end.
 *    For this reason a blue reference wavelength is recommended, for example
 *    0.4μm.
 * 3. The accuracy, for this set of conditions:
 *
 *        height above sea level | 2000 m
 *                      latitude | 29°
 *                      pressure | 793 mb
 *                   temperature | 290 K
 *                      humidity | 0.5 (50%)
 *                    lapse rate | 0.0065 K/m
 *          reference wavelength | 0.4 μm
 *                star elevation | 15°
 *
 *    is about 2.5 mas RMS between 0.3 and 1.0μm, and stays within 4 mas for
 *    the whole range longward of 0.3μm (compared with a total dispersion from
 *    0.3 to 20μm of about 11′′). These errors are typical for ordinary
 *    conditions; in extreme conditions values a few times this size may occur.
 * 4. If either wavelength exceeds 100μm, the radio case is assumed and the
 *    returned refraction coefficients are the same as the given ones. Note that
 *    radio refraction coefficients cannot be turned into optical values using
 *    this routine, nor vice versa.
 * 5. The algorithm consists of calculation of the refractivity of the air at
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
            "a2": a1,
            "b2": b1
        };
    }
    /* Optical: keep arguments within safe bounds */
    const tdkok = Math.min(Math.max(tdk, 100), 500);
    const pmbok = Math.min(Math.max(pmb, 0), 10000);
    const rhok = Math.min(Math.max(rh, 0), 1);

    /* Atmosphere parameters at the observer */
    const psat = Math.pow(10, -8.7115 + 0.03477 * tdkok);
    const pw0 = rhok * psat;
    const w1 = 11.2684e-6 * pw0;

    /* Refractivity at the observer for first wavelength */
    let wlok = Math.max(wl1, 0.1);
    let wlsq = wlok * wlok;
    let w2 = 77.5317e-6 + (0.43909e-6 + 0.00367e-6 / wlsq) / wlsq;
    const dn1 = (w2 * pmbok - w1) / tdkok;
    if (dn1 === 0) {
        return {
            "a2": a1,
            "b2": b1
        };
    }

    /* Refractivity at the observer for second wavelength */
    wlok = Math.max(wl2, 0.1);
    wlsq = wlok * wlok;
    w2 = 77.5317e-6 + (0.43909e-6 + 0.00367e-6 / wlsq) / wlsq;
    const dn2 = (w2 * pmbok - w1) / tdkok;

    /* Scale the refraction coefficients (see Green 4.31, p.93) */
    const f = dn2 / dn1;
    const a2 = a1 * f;
    let b2 = b1 * f;
    if (dn1 !== a1) {
        b2 = b2 * (1 + dn1 * (dn1 - dn2) / (2 * (dn1 - a1)));
    }
    return {
        "a2": a2,
        "b2": b2
    };
};

/**
 * @summary **Calendar to MJD**
 * @param {Number} iy - Year in Gregorian calendar (-4699 or later)
 * @param {Number} im - Month in Gregorian calendar (1 to 12)
 * @param {Number} id - Day in Gregorian calendar (1 to 28-31)
 * @returns {Number} Modified Julian Date (JD-2400000.5) for 0h
 * @description Gregorian Calendar to Modified Julian Date.
 * 1. When an invalid year or month is supplied (status J = 1 or 2) the MJD
 *    is *not* computed. When an invalid day is supplied (status J = 3)
 *    the MJD *is* computed.
 * 2. The year must be -4699 (i.e. 4700BC) or later. For year nBC use
 *    IY = -(n-1).
 * 3. An alternative to the present routine is sla_CALDJ, which accepts a year
 *    with the century missing.
 * ----------
 * References:
 * - The algorithm is adapted from Hatcher, *Q. Jl. R. astr. Soc.* (1984) 25,
 *   53-55.
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
 * @summary **MJD to Gregorian for Output**
 * @param {Number} ndp - number of decimal places of days in fraction
 * @param {Number} djm - modified Julian Date (JD-2400000.5)
 * @returns {Array} year, month, day, fraction in Gregorian calendar
 * @description Modified Julian Date to Gregorian Calendar Date, expressed in
 *              a form convenient for formatting messages (namely rounded to
 *              a specified precision, and with the fields stored in a single
 *              array).
 * 1. Any date after 4701BC March 1 is accepted.
 * 2. Large NDP values risk internal overflows. It is typically safe to use
 *    up to NDP=4.
 * ----------
 * References:
 * - The algorithm is adapted from Hatcher, *Q. Jl. R. astr. Soc.* (1984) 25,
 *   53-55.
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
    const fd = Math.pow(10, Math.max(ndp, 0));

    /* Round date and express in units of fraction. */
    const df = Math.round(djm * fd);

    /* Separate day and fraction. */
    let f = df % fd;
    if (f < 0) {
        f += fd;
    }
    const d = (df - f) / fd;

    /* Express day in Gregorian calendar. */
    const jd = Math.round(d) + 2400001;

    const n4 = 4 * (Math.floor(jd + (Math.floor((2 * Math.floor((4 * jd -
            17918) / 146097) * 3) / 4) + 1) / 2) - 37);
    const nd10 = 10 * Math.floor(((n4 - 237) % 1461) / 4) + 5;

    return [
        Math.floor(n4 / 1461) - 4712,
        (Math.floor(nd10 / 306) + 2) % 12 + 1,
        Math.floor((nd10 % 306) / 10) + 1,
        Math.round(f)
    ];
};

/**
 * @summary **MJD to Year,Month,Day,Frac**
 * @param {Number} djm - modified Julian Date (JD-2400000.5)
 * @returns {Object} iy - year, im - month, id - day
 *                   fd - fraction of day
 * @description Modified Julian Date to Gregorian year, month, day, and
 *              fraction of a day.
 * ----------
 * References:
 * - The algorithm is adapted from Hatcher, *Q. Jl. R. astr. Soc.* (1984) 25,
 *   53-55.
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
    let f = djm % 1;
    if (f < 0) {
        f += 1;
    }
    const d = Math.round(djm - f);

    /* Express day in Gregorian calendar. */
    const jd = Math.round(d) + 2400001;

    const n4 = 4 * (Math.floor(jd + (Math.floor((6 * Math.floor((4 * jd -
            17918) / 146097)) / 4) + 1) / 2) - 37);
    const nd10 = 10 * Math.floor(((n4 - 237) % 1461) / 4) + 5;

    return {
        "iy": Math.floor(n4 / 1461) - 4712,
        "im": (Math.floor(nd10 / 306) + 2) % 12 + 1,
        "id": Math.floor((nd10 % 306) / 10) + 1,
        "fd": f
    };
};

/**
 * @summary **TAI-UTC**
 * @param {Number} utc - Date as a modified JD (JD-2400000.5)
 * @returns {Number} TAI-UTC in seconds
 * @description Increment to be applied to Coordinated Universal Time UTC to
 *              give International Atomic Time TAI.
 * 1. The UTC is specified to be a date rather than a time to indicate that
 *    care needs to be taken not to specify an instant which lies within a
 *    leap second. Though in most cases UTC can include the fractional part,
 *    correct behaviour on the day of a leap second can be guaranteed only up
 *    to the end of the second 23h59m59s.
 * 2. For epochs from 1961 January 1 onwards, the expressions from the file
 *    @link{ftp://maia.usno.navy.mil/ser7/tai-utc.dat} are used. A 5ms time
 *    step at 1961 January 1 is taken from 2.58.1 (p87) of the 1992
 *    Explanatory Supplement.
 * 3. UTC began at 1960 January 1.0 (JD 2436934.5) and it is improper to call
 *    the routine with an earlier epoch. However, if this is attempted, the
 *    TAI-UTC expression for the year 1960 is used.
 * 4. This routine has to be updated on each occasion that a leap second is
 *    announced, and programs using it relinked. Refer to the program source
 *    code for information on when the most recent leap second was added.
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
 * @summary **Rotation Matrix from Axial Vector**
 * @param {Array} axvec - axial vector (radians)
 * @returns {Array} 3x3 rotation matrix
 * @description Form the rotation matrix corresponding to a given axial vector.
 * 1. A rotation matrix describes a rotation about some arbitrary axis,
 *    called the Euler axis. The *axial vector* supplied to this routine has
 *    the same direction as the Euler axis, and its magnitude is the amount
 *    of rotation in radians.
 * 2. If AXVEC is null, the unit matrix is returned.
 * 3. The reference frame rotates clockwise as seen looking along the axial
 *    vector from the origin.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss32.html}
 */
sla.dav2m = function (axvec) {
    "use strict";
    /* Rotation angle - magnitude of axial vector - and functions */
    let x = axvec[0];
    let y = axvec[1];
    let z = axvec[2];
    const phi = Math.sqrt(x * x + y * y + z * z);
    const s = Math.sin(phi);
    const c = Math.cos(phi);
    const w = 1 - c;

    /* Euler axis - direction of axial vector (perhaps null) */
    if (phi !== 0) {
        x = x / phi;
        y = y / phi;
        z = z / phi;
    }

    /* Compute the rotation matrix */
    return [
        [x * x * w + c, x * y * w + z * s, x * z * w - y * s],
        [x * y * w - z * s, y * y * w + c, y * z * w + x * s],
        [x * z * w + y * s, y * z * w - x * s, z * z * w + c]
    ];
};

/**
 * @summary **Cartesian to Spherical**
 * @param {Number} v - [x,y,z] vector
 * @returns {Object} a,b - spherical coordinates in radians
 * @description Cartesian coordinates to spherical coordinates.
 * 1. The spherical coordinates are longitude (+ve anticlockwise looking from
 *    the +ve latitude pole) and latitude. The Cartesian coordinates are right
 *    handed, with the x-axis at zero longitude and latitude, and the z-axis
 *    at the +ve latitude pole.
 * 2. If V is null, zero A and B are returned.
 * 3. At either pole, zero A is returned.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss36.html}
 */
sla.dcc2s = function (v) {
    "use strict";
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const r = Math.sqrt(x * x + y * y);
    let a = 0;
    if (r !== 0) {
        a = Math.atan2(y, x);
    }
    let b = 0;
    if (z !== 0) {
        b = Math.atan2(z, r);
    }
    return {
        "a": a,
        "b": b
    };
};

/**
 * @summary **h,δ to Az,El**
 * @param {Number} ha - Hour Angle in radians
 * @param {Number} dec - Declination in radians
 * @param {Number} phi - Observatory latitude in radians
 * @returns {array} [az,el] - Azimuth and elevation in radians
 * @description Equatorial to horizon coordinates.
 * 1. Azimuth is returned in the range 0−2π; north is zero, and east is +π/2.
 *    Elevation is returned in the range ±π.
 * 2. The latitude must be geodetic. In critical applications, corrections
 *    for polar motion should be applied.
 * 3. In some applications it will be important to specify the correct type
 *    of hour angle and declination in order to produce the required type of
 *    azimuth and elevation. In particular, it may be important to distinguish
 *    between elevation as affected by refraction, which would require the
 *    *observed* [h,δ], and the elevation *in vacuo*, which would require the
 *    *topocentric* [h,δ]. If the effects of diurnal aberration can be
 *    neglected, the *apparent* [h,δ] may be used instead of the topocentric
 *    [h,δ].
 * 4. No range checking of arguments is carried out.
 * 5. In applications which involve many such calculations, rather than calling
 *    the present routine it will be more efficient to use inline code, having
 *    previously computed fixed terms such as sine and cosine of latitude, and
 *    (for tracking a star) sine and cosine of declination.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss40.html}
 */
sla.de2h = function (ha, dec, phi) {
    "use strict";
    const sh = Math.sin(ha);
    const ch = Math.cos(ha);
    const sd = Math.sin(dec);
    const cd = Math.cos(dec);
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);
    const x = -ch * cd * sp + sd * cp;
    const y = -sh * cd;
    const z = ch * cd * cp + sd * sp;
    const r = Math.sqrt(x * x + y * y);
    let a = 0;
    if (r !== 0) {
        a = Math.atan2(y, x);
        if (a < 0) {
            a += sla.d2pi;
        }
    }
    return {
        "az": a,
        "el": Math.atan2(z, r)
    };
};

/**
 * @summary **Euler Angles to Rotation Matrix**
 * @param {string} order - Specifies about which axes the rotations occur
 * @param {Number} phi - 1st rotation (radians)
 * @param {Number} theta - 2nd rotation (radians)
 * @param {Number} psi - 3rd rotation (radians)
 * @return {Array} Rotation matrix
 * @description Form a rotation matrix from the Euler angles - three successive
 *              rotations about specified Cartesian axes.
 * 1. A rotation is positive when the reference frame rotates anticlockwise as
 *    seen looking towards the origin from the positive region of the specified
 *    axis.
 * 2. The characters of ORDER define which axes the three successive rotations
 *    are about. A typical value is ‘ZXZ’, indicating that RMAT is to become
 *    the direction cosine matrix corresponding to rotations of the reference
 *    frame through PHI radians about the old z-axis, followed by THETA radians
 *    about the resulting x-axis, then PSI radians about the resulting z-axis.
 * 3. The axis names can be any of the following, in any order or combination:
 *    X, Y, Z, uppercase or lowercase, 1, 2, 3. Normal axis labelling/numbering
 *    conventions apply; the xyz (≡123) triad is right-handed. Thus, the ‘ZXZ’
 *    example given above could be written ‘zxz’ or ‘313’ (or even ‘ZxZ’ or
 *    ‘3xZ’). ORDER is terminated by length or by the first unrecognized
 *    character. Fewer than three rotations are acceptable, in which case the
 *    later angle arguments are ignored. Zero rotations produces the identity
 *    RMAT.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss41.html}
 */
sla.deuler = function (order, phi, theta, psi) {
    "use strict";
    /* Initialize result matrix */
    let result = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    let wm = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    /* Establish length of axis string */
    const l = order.length;

    /* Look at each character of axis string until finished */
    for (let n = 0; n < 3; n += 1) {
        if (n > l) {
            break;
        }
        /* Pick up the appropriate Euler angle and take sine & cosine */
        let angle;
        if (n === 0) {
            angle = phi;
        } else if (n === 1) {
            angle = theta;
        } else {
            angle = psi;
        }
        const s = Math.sin(angle);
        const c = Math.cos(angle);

        /* Identify the axis */
        const axis = order.substring(n, n + 1);
        let rotn;
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

        for (let i = 0; i < 3; i += 1) {
            for (let j = 0; j < 3; j += 1) {
                let w = 0;
                for (let k = 0; k < 3; k += 1) {
                    w += rotn[i][k] * result[k][j];
                }
                wm[i][j] = w;
            }
        }

        for (let i = 0; i < 3; i += 1) {
            for (let j = 0; j < 3; j += 1) {
                result[i][j] = wm[i][j];
            }
        }
    }
    return result;
};

/**
 * @summary **Approx Moon Pos/Vel**
 * @param {Number} date - TDB (loosely ET) as a Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Array} Moon [x,y,z,\dot x,\dot y,\dot z], mean equator and
 *                  equinox of date (AU, AU/s)
 * @description Approximate geocentric position and velocity of the Moon.
 * 1. This routine is a full implementation of the algorithm published by
 *    Meeus (see reference).
 * 2. Meeus quotes accuracies of 10′′ in longitude, 3′′ in latitude and
 *    ′′02 arcsec in HP (equivalent to about 20 km in distance).
 *    JPL DE200 over the interval 1960-2025 gives RMS errors of ′′37 and 83
 *    mas/hour in longitude, ′′23 arcsec and 48 mas/hour in latitude, 11 km
 *    and 81 mm/s in distance. The maximum errors over the same interval are
 *    18′′ and ′′050/hour in longitude, 11′′ and ′′024/hour in latitude, 40 km
 *    and 0.29 m/s in distance.
 * 3. The original algorithm is expressed in terms of the obsolete time scale
 *    *Ephemeris Time*. Either TDB or TT can be used, but not UT without
 *    incurring significant errors (30′′ at the present time) due to the Moon’s
 *    ′′05/s movement.
 * 4. The algorithm is based on pre IAU 1976 standards. However, the result has
 *    been moved onto the new (FK5) equinox, an adjustment which is in any case
 *    much smaller than the intrinsic accuracy of the procedure.
 * 5. Velocity is obtained by a complete analytical differentiation of the
 *    Meeus model.
 * ----------
 * References:
 * - Meeus, *L’Astronomie*, June 1984, p. 348.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss49.html}
 */
sla.dmoon = function (date) {
    "use strict";
    /* Moon's mean longitude */
    let elp0 = 270.434164;
    let elp1 = 481267.8831;
    let elp2 = -0.001133;
    let elp3 = 0.0000019;
    /* Sun's mean anomaly */
    let em0 = 358.475833;
    let em1 = 35999.0498;
    let em2 = -0.000150;
    let em3 = -0.0000033;
    /* Moon's mean anomaly */
    let emp0 = 296.104608;
    let emp1 = 477198.8491;
    let emp2 = 0.009192;
    let emp3 = 0.0000144;
    /* Moon's mean elongation */
    let d0 = 350.737486;
    let d1 = 445267.1142;
    let d2 = -0.001436;
    let d3 = 0.0000019;
    /* Mean distance of the Moon from its ascending node */
    let f0 = 11.250889;
    let f1 = 483202.0251;
    let f2 = -0.003211;
    let f3 = -0.0000003;
    /* Longitude of the Moon's ascending node */
    let om0 = 259.183275;
    let om1 = -1934.1420;
    let om2 = 0.002078;
    let om3 = 0.0000022;
    /* Coefficients for (dimensionless) E factor */
    let e1 = -0.002495;
    let e2 = -0.00000752;
    /* Coefficients for periodic variations etc. */
    let pac = 0.000233;
    let pa0 = 51.2;
    let pa1 = 20.2;
    let pbc = -0.001778;
    let pcc = 0.000817;
    let pdc = 0.002011;
    let pec = 0.003964;
    let pe0 = 346.560;
    let pe1 = 132.870;
    let pe2 = -0.0091731;
    let pfc = 0.001964;
    let pgc = 0.002541;
    let phc = 0.001964;
    let pic = -0.024691;
    let pjc = -0.004328;
    let pj0 = 275.05;
    let pj1 = -2.30;
    let cw1 = 0.0004664;
    let cw2 = 0.0000754;
    /* Coefficients for Moon position */
    /* Centuries since J1900 */
    let t = (date - 15019.5) / 36525;

    /**
     * Fundamental arguments (radians) and derivatives (radians per
     * Julian century) for the current epoch.
     */
    /* Moon's mean longitude */
    let elp = sla.d2r * ((elp0 + (elp1 + (elp2 + elp3 * t) * t) * t) % 360);
    let delp = sla.d2r * (elp1 + (2 * elp2 + 3 * elp3 * t) * t);
    /* Sun's mean anomaly */
    let em = sla.d2r * ((em0 + (em1 + (em2 + em3 * t) * t) * t) % 360);
    let dem = sla.d2r * (em1 + (2 * em2 + 3 * em3 * t) * t);
    /* Moon's mean anomaly */
    let emp = sla.d2r * ((emp0 + (emp1 + (emp2 + emp3 * t) * t) * t) % 360);
    let demp = sla.d2r * (emp1 + (2 * emp2 + 3 * emp3 * t) * t);
    /* Moon's mean elongation */
    let d = sla.d2r * ((d0 + (d1 + (d2 + d3 * t) * t) * t) % 360);
    let dd = sla.d2r * (d1 + (2 * d2 + 3 * d3 * t) * t);
    /* Mean distance of the Moon from its ascending node */
    let f = sla.d2r * ((f0 + (f1 + (f2 + f3 * t) * t) * t) % 360);
    let df = sla.d2r * (f1 + (2 * f2 + 3 * f3 * t) * t);
    /* Longitude of the Moon's ascending node */
    let om = sla.d2r * ((om0 + (om1 + (om2 + om3 * t) * t) * t) % 360);
    let dom = sla.d2r * (om1 + (2 * om2 + 3 * om3 * t) * t);
    let sinom = Math.sin(om);
    let cosom = Math.cos(om);
    let domcom = dom * cosom;

    /* Add the periodic variations */
    let theta = sla.d2r * (pa0 + pa1 * t);
    let wa = Math.sin(theta);
    let dwa = sla.d2r * pa1 * Math.cos(theta);
    theta = sla.d2r * (pe0 + (pe1 + pe2 * t) * t);
    let wb = pec * Math.sin(theta);
    let dwb = sla.d2r * pec * (pe1 + 2 * pe2 * t) * Math.cos(theta);
    elp += sla.d2r * (pac * wa + wb + pfc * sinom);
    delp += sla.d2r * (pac * dwa + dwb + pfc * domcom);
    em += sla.d2r * pbc * wa;
    dem += sla.d2r * pbc * dwa;
    emp += sla.d2r * (pcc * wa + wb + pgc * sinom);
    demp += sla.d2r * (pcc * dwa + dwb + pgc * domcom);
    d += sla.d2r * (pdc * wa + wb + phc * sinom);
    dd += sla.d2r * (pdc * dwa + dwb + phc * domcom);
    let wom = om + sla.d2r * (pj0 + pj1 * t);
    let dwom = dom + sla.d2r * pj1;
    let sinwom = Math.sin(wom);
    let coswom = Math.cos(wom);
    f += sla.d2r * (wb + pic * sinom + pjc * sinwom);
    df += sla.d2r * (dwb + pic * domcom + pjc * dwom * coswom);
    /* E-factor, and square */
    let e = 1 + (e1 + e2 * t) * t;
    let de = e1 + 2 * e2 * t;
    let esq = e * e;
    let desq = 2 * e * de;

    /**
     * Series expansions
     */
    let nl = 50;
    let nb = 45;
    let np = 31;
    let coeff;
    let emn;
    let empn;
    let dn;
    let fn;
    let i;
    let en;
    let den;
    let dtheta;
    let ftheta;

    /* Longitude */
    let v = 0;
    let dv = 0;
    let n5;
    for (let n = 0; n < nl; n += 1) {
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
    let el = elp + sla.d2r * v;
    let del = (delp + sla.d2r * dv) / sla.cj;

    /* Latitude */
    v = 0;
    dv = 0;
    for (let n = 0; n < nb; n += 1) {
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
    let bf = 1 - cw1 * cosom - cw2 * coswom;
    let dbf = cw1 * dom * sinom + cw2 * dwom * sinwom;
    let b = sla.d2r * v * bf;
    let db = sla.d2r * (dv * bf + v * dbf) / sla.cj;

    /* Parallax */
    v = 0;
    dv = 0;
    for (let n = 0; n < np; n += 1) {
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
    let p = sla.d2r * v;
    let dp = sla.d2r * dv / sla.cj;

    /**
     * Transformation into final form
     */
    /* Parallax to distance (AU, AU/sec) */
    let sp = Math.sin(p);
    let r = sla.eradau / sp;
    let dr = -r * dp * Math.cos(p) / sp;

    /* Longitude, latitude to x,y,z (AU) */
    let sel = Math.sin(el);
    let cel = Math.cos(el);
    let sb = Math.sin(b);
    let cb = Math.cos(b);
    let rcb = r * cb;
    let rbd = r * db;
    let w = rbd * sb - cb * dr;
    let x = rcb * cel;
    let y = rcb * sel;
    let z = r * sb;
    let xd = -y * del - w * cel;
    let yd = x * del - w * sel;
    let zd = rbd * cb + sb * dr;

    /* Julian centuries since J2000 */
    t = (date - 51544.5) / 36525;

    /* Fricke equinox correction */
    let epj = 2000 + t * 100;
    let eqcor = sla.ds2r * (0.035 + 0.00085 * (epj - sla.b1950));

    /* Mean obliquity (IAU 1976) */
    let eps = sla.das2r * (84381.448 + (-46.8150 + (-0.00059 +
            0.001813 * t) * t) * t);

    /* To the equatorial system, mean of date, FK5 system */
    let sineps = Math.sin(eps);
    let coseps = Math.cos(eps);
    let es = eqcor * sineps;
    let ec = eqcor * coseps;
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
 * @summary **Apply 3D Rotation**
 * @param {Array} dm - 3x3 rotation matrix
 * @param {Array} va - 3-vector to be rotated
 * @returns {Array} Result 3-vector.
 * @description Multiply a 3-vector by a rotation matrix.
 * 1. This routine performs the operation: **b = M⋅a** where **a** and **b**
 *    are the 3-vectors VA and VB respectively, and **M** is the 3×3 matrix DM.
 * 2. The main function of this routine is apply a rotation; under these
 *    circumstances, **M** is a proper real orthogonal matrix.
 * 3. To comply with the ANSI Fortran 77 standard, VA and VB must not be the
 *    same array. The routine is, in fact, coded so as to work properly with
 *    many Fortran compilers even if this rule is violated, something that is
 *    *not*, however, recommended.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss51.html}
 */
sla.dmxv = function (dm, va) {
    "use strict";
    const vb = [];
    for (let i = 0; i < 3; i += 1) {
        let w = 0;
        for (let j = 0; j < 3; j += 1) {
            w += dm[i][j] * va[j];
        }
        vb[i] = w;
    }
    return vb;
};

/**
 * @summary **Days to Hour,Min,Sec**
 * @param {Number} ndp - Number of decimal places of seconds
 * @param {Number} days - Interval in days
 * @returns {Array} [0] sign, '+' or '-'
 *                  [1-4] degrees, arcminutes, arcseconds, fraction
 * @decription Convert an interval in days into hours, minutes, seconds.
 * 1. NDP less than zero is interpreted as zero.
 * 2. The largest useful value for NDP is determined by the size of DAYS,
 *    the format of DOUBLE PRECISION floating-point numbers on the target
 *    machine, and the risk of overflowing IHMSF(4). On some architectures,
 *    for DAYS up to 1D0, the available floating-point precision corresponds
 *    roughly to NDP=12. However, the practical limit is NDP=9, set by the
 *    capacity of a typical 32-bit IHMSF(4).
 * 3. The absolute value of DAYS may exceed 1D0. In cases where it does not,
 *    it is up to the caller to test for and handle the case where DAYS is
 *    very nearly 1D0 and rounds up to 24 hours, by testing for IHMSF(1)=24
 *    and setting IHMSF(1-4) to zero.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss39.html}
 */
sla.dd2tf = function (ndp, days) {
    "use strict";
    let rs = 1;
    for (let n = 0; n < ndp; n += 1) {
        rs *= 10;
    }
    const rm = rs * 60;
    const rh = rm * 60;

    /* Round interval and express in smallest units required */
    let a = Math.round(rs * sla.d2s * Math.abs(days));

    /* Separate into fields */
    const ah = Math.floor(a / rh);
    a -= ah * rh;
    const am = Math.floor(a / rm);
    a -= am * rm;
    const as = Math.floor(a / rs);
    a -= as * rs;
    const sign = (days >= 0) ? "+" : "-";

    return {
        "sign": sign,
        "ihmsf": [
            Math.max(Math.round(ah), 0),
            Math.max(Math.min(Math.round(am), 59), 0),
            Math.max(Math.min(Math.round(as), 59), 0),
            Math.max(Math.round(Math.min(a, rs - 1)), 0)
        ]
    };
};

/**
 * @summary **Radians to Hour,Min,Sec,Frac**
 * @param {Number} ndp - Number of decimal places of arcseconds
 * @param {Number} angle - Angle in radians
 * @return {Array} [0] sign, '+' or '-'
 *                 [1-4] degrees, arcminutes, arcseconds, fraction
 * @description Convert an angle in radians to degrees, minutes, seconds,
 *              fraction.
 * 1. NDP less than zero is interpreted as zero.
 * 2. The largest useful value for NDP is determined by the size of ANGLE, the
 *    format of DOUBLE PRECISION floating-point numbers on the target machine,
 *    and the risk of overflowing IDMSF(4). On some architectures, for ANGLE
 *    up to 2π, the available floating-point precision corresponds roughly to
 *    NDP=12. However, the practical limit is NDP=9, set by the capacity of a
 *    typical 32-bit IDMSF(4).
 * 3. The absolute value of ANGLE may exceed 2π. In cases where it does not,
 *    it is up to the caller to test for and handle the case where ANGLE is
 *    very nearly 2π and rounds up to 360∘, by testing for IDMSF(1)=360 and
 *    setting IDMSF(1-4) to zero.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss53.html}
 */
sla.dr2af = function (ndp, angle) {
    "use strict";
    const ret = sla.dd2tf(ndp, angle * sla.f);
    return {
        "sign": ret.sign,
        "idmsf": ret.ihmsf
    };
};

/**
 * @summary **Radians to Hour,Min,Sec,Frac**
 * @param {Number} ndp - Number of decimal places of seconds
 * @param {Number} angle - Angle in radians
 * @return {Array} [0] - sign, '+' or '-'
 *                 [1-4] - hours, minutes, seconds, fraction
 * @description Convert an angle in radians to hours, minutes, seconds,
 *              fraction.
 * 1. NDP less than zero is interpreted as zero.
 * 2. The largest useful value for NDP is determined by the size of ANGLE, the
 *    format of DOUBLE PRECISION floating-point numbers on the target machine,
 *    and the risk of overflowing IHMSF(4). On some architectures, for ANGLE
 *    up to 2π, the available floating-point precision corresponds roughly to
 *    NDP=12. However, the practical limit is NDP=9, set by the capacity of a
 *    typical 32-bit IHMSF(4).
 * 3. The absolute value of ANGLE may exceed 2π. In cases where it does not,
 *    it is up to the caller to test for and handle the case where ANGLE is
 *    very nearly 2π and rounds up to 24 hours, by testing for IHMSF(1)=24 and
 *    setting IHMSF(1-4) to zero.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss54.html}
 */
sla.dr2tf = function (ndp, angle) {
    "use strict";
    return sla.dd2tf(ndp, angle / sla.t2r);
};

/**
 * @summary **Put Angle into Range ±π**
 * @param {Number} angle - Angle in radians
 * @returns {Number} Angle expressed in the range ±π
 * @description Normalize an angle into the range ±π.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss55.html}
 */
sla.drange = function (angle) {
    "use strict";
    let ret = angle % sla.d2pi;
    if (Math.abs(ret) >= Math.PI) {
        ret -= Math.sign(angle) * sla.d2pi;
    }
    return ret;
};

/**
 * @summary **Put Angle into Range 0−2π**
 * @param {Number} angle - Angle in radians
 * @returns {Number} Angle expressed in the range 0−2π
 * @description Normalize angle into range 0−2π.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss56.html}
 */
sla.dranrm = function (angle) {
    "use strict";
    let ret = angle % sla.d2pi;
    if (ret < 0) {
        ret = ret + sla.d2pi;
    }
    return ret;
};

/**
 * @summary **Hour,Min,Sec to Days**
 * @param {Number} ihour - Hours
 * @param {Number} imin - Minutes
 * @param {Number} sec - Seconds
 * @returns {Number} Interval in days
 * @description Convert hours, minutes, seconds to days.
 * 1. The result is computed even if any of the range checks fail.
 * 2. The sign must be dealt with outside this routine.
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
 * @summary **Hour,Min,Sec to Radians**
 * @param {Number} ihour - Hours
 * @param {Number} imin - Minutes
 * @param {Number} sec - Seconds
 * @returns {Number} Angle in radians
 * @description Convert hours, minutes, seconds to radians.
 * 1. The result is computed even if any of the range checks fail.
 * 2. The sign must be dealt with outside this routine.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss63.html}
 */
sla.dtf2r = function (ihour, imin, sec) {
    "use strict";
    /* Convert to turns then radians */
    return sla.dtf2d(ihour, imin, sec) * sla.t2r;
};

/**
 * @summary **Deg,Arcmin,Arcsec to Radians**
 * @param {Number} ideg - Degrees
 * @param {Number} iamin - Arcminutes
 * @param {Number} asec - Arcseconds
 * @returns {Number} Angle in radians
 * @description Convert degrees, arcminutes, arcseconds to radians.
 * 1. The result is computed even if any of the range checks fail.
 * 2. The sign must be dealt with outside this routine.
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
 * @summary **TT minus UTC**
 * @param {Number} utc - UTC date as a modified JD (JD-2400000.5)
 * @returns {Number} TT-UTC in seconds
 * @description Compute ΔTT, the increment to be applied to Coordinated
 *              Universal Time UTC to give Terrestrial Time TT.
 * 1. The UTC is specified to be a date rather than a time to indicate that
 *    care needs to be taken not to specify an instant which lies within a leap
 *    second. Though in most cases UTC can include the fractional part, correct
 *    behaviour on the day of a leap second can be guaranteed only up to the
 *    end of the second 23h59m59s.
 * 2. Pre 1972 January 1 a fixed value of 10 + ET−TAI is returned.
 * 3. TT is one interpretation of the defunct time scale *Ephemeris Time*, ET.
 * 4. See also the routine {sla.dt}, which roughly estimates ET−UT for
 *    historical epochs.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss68.html}
 */
sla.dtt = function (utc) {
    "use strict";
    return 32.184 + sla.dat(utc);
};

/**
 * @summary Besselian Epoch to MJD.
 * @param {Number} epb - Besselian epoch
 * @returns {Number} Modified Julian Date (JD - 2400000.5)
 * @description Conversion of Besselian epoch to Modified Julian Date.
 * ----------
 * References:
 * - Lieske, J.H., 1979. *Astr.Astrophys.* 73, 282.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss81.html}
 */
sla.epb2d = function (epb) {
    "use strict";
    return 15019.81352 + (epb - 1900.0) * 365.242198781;
};

/**
 * @summary **Equation of the Equinoxes**
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Number} The equation of the equinoxes (radians)
 * @description Equation of the equinoxes  (IAU 1994).
 * 1. The equation of the equinoxes is defined here as GAST-GMST: it is added
 *    to a *mean* sidereal time to give the *apparent* sidereal time.
 * 2. The change from the classic “textbook” expression Δψ cosϵ occurred with
 *    IAU Resolution C7, Recommendation 3 (1994). The new formulation takes
 *    into account cross-terms between the various precession and nutation
 *    quantities, amounting to about 3 milliarcsec. The transition from the old
 *    to the new model officially took place on 1997 February 27.
 * ----------
 * References:
 * - Capitaine, N. & Gontier, A.-M. (1993), *Astron. Astrophys.*, 275, 645-650.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss87.html}
 */
sla.eqeqx = function (date) {
    "use strict";
    const t = (date - 51544.5) / 36525;
    const om = sla.das2r * (450160.280 + (-5 * sla.t2as - 482890.539 +
            (7.455 + 0.008 * t) * t) * t);
    const ret = sla.nutc(date);
    return ret.dpsi * Math.cos(ret.eps0) + sla.das2r * (0.00264 * Math.sin(om) +
           0.000063 * Math.sin(om + om));
};

/**
 * @summary **FK4 to FK5, no P.M. or Parallax**
 * @param {Number} r1950 - B1950.0 FK4 α at epoch BEPOCH (radians)
 * @param {Number} d1950 - B1950.0 FK4 δ at epoch BEPOCH (radians)
 * @param {Number} epoch - Besselian epoch (e.g. 1979.3D0)
 * @returns {Object}
 * - r2000 - J2000.0 FK5 α (radians)
 * - d2000 - J2000.0 FK5 δ (radians)
 * @description Convert B1950.0 FK4 star data to J2000.0 FK5 assuming zero
 *              proper motion in the FK5 frame. This routine converts stars
 *              from the old, Bessel-Newcomb, FK4 system to the new, IAU 1976,
 *              FK5, Fricke system, in such a way that the FK5 proper motion is
 *              zero. Because such a star has, in general, a non-zero proper
 *              motion in the FK4 system, the routine requires the epoch at
 *              which the position in the FK4 system was determined. The method
 *              is from appendix 2 of reference 1, but using the constants of
 *              reference 4.
 * 1. The epoch BEPOCH is strictly speaking Besselian, but if a Julian epoch
 *    is supplied the result will be affected only to a negligible extent.
 * 2. Conversion from Besselian epoch 1950.0 to Julian epoch 2000.0 only is
 *    provided for. Conversions involving other epochs will require use of the
 *    appropriate precession, proper motion, and E-terms routines before and/or
 *    after {@link sla.fk45z} is called.
 * 3. In the FK4 catalogue the proper motions of stars within 10∘ of the poles
 *    do not include the *differential E-terms* effect and should, strictly
 *    speaking, be handled in a different manner from stars outside these
 *    regions. However, given the general lack of homogeneity of the star data
 *    available for routine astrometry, the difficulties of handling positions
 *    that may have been determined from astrometric fields spanning the polar
 *    and non-polar regions, the likelihood that the differential E-terms
 *    effect was not taken into account when allowing for proper motion in
 *    past astrometry, and the undesirability of a discontinuity in the
 *    algorithm, the decision has been made in this routine to include the
 *    effect of differential E-terms on the proper motions for all stars,
 *    whether polar or not. At epoch 2000, and measuring on the sky rather than
 *    in terms of Δα, the errors resulting from this simplification are less
 *    than 1 milliarcsecond in position and 1 milliarcsecond per century in
 *    proper motion.
 * 4. See also {@link sla.fk425}, {@link sla.fk524}, {@link sla.fk54z}.
 * ----------
 * References:
 * 1. Aoki, S., et al., 1983. *Astr.Astrophys.*, 128, 263.
 * 2. Smith, C.A. et al., 1989. *Astr.J.* 97, 265.
 * 3. Yallop, B.D. et al., 1989. *Astr.J.* 97, 274.
 * 4. Seidelmann, P.K. (ed), 1992. *Explanatory Supplement to the Astronomical
 *    Almanac*, ISBN 0-935702-68-7.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss94.html}
 */
sla.fk45z = function (r1950, d1950, bepoch) {
    "use strict";
    let pmf = 100.0 * 60.0 * 60.0 * 360.0 / sla.d2pi;
    let r0 = sla.dcs2c(r1950, d1950);
    let i;
    let j;

    /* Adjust vector a to give zero proper motion in FK5 */
    let w = (bepoch - 1950.0) / pmf;
    let a1 = [];
    for (i = 0; i < 3; i += 1) {
        a1[i] = sla.fka[i] + w * sla.fkad[i];
    }

    /* Remove e-terms */
    let v1 = [];
    w = r0[0] * a1[0] + r0[1] * a1[1] + r0[2] * a1[2];
    for (i = 0; i < 3; i += 1) {
        v1[i] = r0[i] - a1[i] + w * r0[i];
    }

    /* Convert position vector to Fricke system */
    let v2 = [];
    for (i = 0; i < 6; i += 1) {
        w = 0.0;
        for (j = 0; j < 3; j += 1) {
            w += sla.fkem3[i * 3 + j] * v1[j];
        }
        v2[i] = w;
    }

    /* Allow for fictitious proper motion in FK4 */
    w = (sla.epj(sla.epb2d(bepoch)) - 2000.0) / pmf;
    for (i = 0; i < 3; i += 1) {
        v2[i] += w * v2[i + 3];
   }

    /* Revert to spherical coordinates */
    let ret = sla.dcc2s(v2);
    let r2000 = sla.dranrm(ret.a);
    return {
        "r2000": r2000,
        "d2000": ret.b
    };
};

/**
 * @summary **FK4 to FK5.**
 * @param {Number} r1950 - B1950.0 α (radians)
 * @param {Number} d1950 - B1950.0 δ (radians)
 * @param {Number} dr1950 - B1950.0 proper motion in α (radians per tropical
 *                          year)
 * @param {Number} dd1950 - B1950.0 proper motion in δ (radians per tropical
 *                          year)
 * @param {Number} p1950 - B1950.0 parallax (arcsec)
 * @param {Number} v1950 - B1950.0 radial velocity (km/s, +ve = moving away)
 * @returns {Object}
 * - r2000 - J2000.0 α (radians)
 * - d2000 - J2000.0 δ (radians)
 * - dr2000 - J2000.0 proper motion in α (radians per Julian year)
 * - dd2000 - J2000.0 proper motion in δ (radians per Julian year)
 * - p2000 - J2000.0 parallax (arcsec)
 * - v2000 - J2000.0 radial velocity (km/s, +ve = moving away)
 * @description Convert B1950.0 FK4 star data to J2000.0 FK5. This routine
 *              converts stars from the old, Bessel-Newcomb, FK4 system to the
 *              new, IAU 1976, FK5, Fricke system. The precepts of Smith et al.
 *              (see reference 1) are followed, using the implementation by
 *              Yallop et al. (reference 2) of a matrix method due to Standish.
 *              Kinoshita’s development of Andoyer’s post-Newcomb precession is
 *              used. The numerical constants from Seidelmann et al. (reference
 *              3) are used canonically.
 * 1. The α proper motions are α̇  rather than α̇ cosδ, and are per year rather
 *    than per century.
 * 2. Conversion from Besselian epoch 1950.0 to Julian epoch 2000.0 only is
 *    provided for. Conversions involving other epochs will require use of the
 *    appropriate precession, proper motion, and E-terms routines before and/or
 *    after {@link sla.fk425} is called.
 * 3. In the FK4 catalogue the proper motions of stars within 10∘ of the poles
 *    do not include the *differential E-terms* effect and should, strictly
 *    speaking, be handled in a different manner from stars outside these
 *    regions. However, given the general lack of homogeneity of the star data
 *    available for routine astrometry, the difficulties of handling positions
 *    that may have been determined from astrometric fields spanning the polar
 *    and non-polar regions, the likelihood that the differential E-terms
 *    effect was not taken into account when allowing for proper motion in past
 *    astrometry, and the undesirability of a discontinuity in the algorithm,
 *    the decision has been made in this routine to include the effect of
 *    differential E-terms on the proper motions for all stars, whether polar
 *    or not. At epoch J2000, and measuring on the sky rather than in terms of
 *    Δα, the errors resulting from this simplification are less than 1
 *    milliarcsecond in position and 1 milliarcsecond per century in proper
 *    motion.
 * 4. See also {@link sla.fk45z}, {@link sla.fk524}, {@link sla.fk54z}.
 * ----------
 * References:
 * 1. Smith, C.A. et al., 1989. *Astr.J.* 97, 265.
 * 2. Yallop, B.D. et al., 1989. *Astr.J.* 97, 274.
 * 3. Seidelmann, P.K. (ed), 1992. *Explanatory Supplement to the Astronomical
 *    Almanac*, ISBN 0-935702-68-7.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss93.html}
 */
sla.fk425 = function (r1950, d1950, dr1950, dd1950, p1950, v1950) {
    "use strict";
    /* Radians per year to arcsec per century */
    let pmf = 100.0 * 60.0 * 60.0 * 360.0 / sla.d2pi;

    /* Km per sec to AU per tropical century */
    let vf = 21.095;

    let i;
    let j;

    /* Pick up B1950 data (units radians and arcsec/tc) */
    let r = r1950;
    let d = d1950;
    let ur = dr1950 * pmf;
    let ud = dd1950 * pmf;
    let px = p1950;
    let rv = v1950;

    /* Spherical to Cartesian */
    let sr = Math.sin(r);
    let cr = Math.cos(r);
    let sd = Math.sin(d);
    let cd = Math.cos(d);

    let r0 = [cr * cd, sr * cd, sd];
    let w = vf * rv * px;
    let rd0 = [
        (-sr * cd * ur) - (cr * sd * ud) + (w * r0[0]),
        (cr * cd * ur) - (sr * sd * ud) + (w * r0[1]),
        (cd * ud) + (w * r0[2])
    ];

    /* Allow for e-terms and express as position+velocity 6-vector */
    w = (r0[0] * sla.fka[0]) + (r0[1] * sla.fka[1]) + (r0[2] * sla.fka[2]);
    let wd = (r0[0] * sla.fkad[0]) + (r0[1] * sla.fkad[1]) +
             (r0[2] * sla.fkad[2]);

    let v1 = [];
    for (i = 0; i < 3; i += 1) {
        v1[i] = r0[i]  - sla.fka[i]  + w * r0[i];
        v1[i+3] = rd0[i] - sla.fkad[i] + wd * r0[i];
    }

    /* Convert position+velocity vector to Fricke system */
    let v2 = [];
    for (i = 0; i < 6; i += 1) {
        w = 0.0;
        for (j = 0; j < 6; j += 1) {
            w += sla.fkem6[i * 6 + j] * v1[j];
        }
        v2[i] = w;
    }

    /* Revert to spherical coordinates */
    let x = v2[0];
    let y = v2[1];
    let z = v2[2];
    let xd = v2[3];
    let yd = v2[4];
    let zd = v2[5];

    let rxysq = (x * x) + (y * y);
    let rxyzsq = (rxysq) + (z * z);
    let rxy = Math.sqrt(rxysq);
    let rxyz = Math.sqrt(rxyzsq);
    let spxy = (x * xd) + (y * yd);
    let spxyz = spxy + (z * zd);

    if ((x === 0.0) && (y === 0.0)) {
        r = 0.0;
    } else {
        r = Math.atan2(y, x);
        if (r < 0.0) {
            r += sla.d2pi;
        }
    }
    d = Math.atan2 (z, rxy);

    if (rxy > sla.tiny) {
        ur = ((x * yd) - (y * xd)) / rxysq;
        ud = ((zd * rxysq) - (z * spxy)) / (rxyzsq * rxy);
    }
    if (px > sla.tiny) {
        rv = spxyz / (px * rxyz * vf);
        px = px / rxyz;
    }

    return {
        "r2000": r,
        "d2000": d,
        "dr2000": ur / pmf,
        "dd2000": ud / pmf,
        "v2000": rv,
        "p2000": px
    };
};

/**
 * @summary **UT to GMST**
 * @param {Number} ut1 - Universal time (strictly UT1) expressed as modified
 *                       Julian Date (JD-2400000.5).
 * @returns {Number} Greenwich mean sidereal time (radians).
 * @description Conversion from universal time UT1 to Greenwich mean sidereal
 *              time.
 * 1. The IAU 1982 expression (see page S15 of the 1984 *Astronomical Almanac*)
 *    is used, but rearranged to reduce rounding errors. This expression is
 *    always described as giving the GMST at 0hUT; in fact, it gives the
 *    difference between the GMST and the UT, which happens to equal the GMST
 *    (modulo 24 hours) at 0hUT each day. In {@link sla.gmst}, the entire UT
 *    is used directly as the argument for the canonical formula, and the
 *    fractional part of the UT is added separately; note that the factor
 *    1.0027379⋯ does not appear.
 * 2. See also the routine {@link sla.gmsta}, which delivers better numerical
 *    precision by accepting the UT date and time as separate arguments.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss104.html}
 */
sla.gmst = function (ut1) {
    "use strict";
    let tu = (ut1 - 51544.5) / 36525;
    return sla.dranrm((ut1 % 1) * sla.d2pi + (24110.54841 +
            (8640184.812866 + (0.093104 - 6.2e-6 * tu) * tu) * tu) * sla.ds2r);
};

/**
 * @summary **UT to GMST (extra precision)**
 * @param {Number} date - UT1 date as Modified Julian Date (integer part of
 *                        JD-2400000.5)
 * @param {Number} ut - UT1 time (fraction of a day)
 * @returns {Number} Greenwich mean sidereal time (radians)
 * @description Conversion from Universal Time to Greenwich mean sidereal time,
 *              with rounding errors minimized.
 * 1. The algorithm is derived from the IAU 1982 expression (see page S15 of
 *    the 1984 *Astronomical Almanac*).
 * 2. There is no restriction on how the UT is apportioned between the DATE
 *    and UT1 arguments. Either of the two arguments could, for example, be
 *    zero and the entire date + time supplied in the other. However, the
 *    routine is designed to deliver maximum accuracy when the DATE argument
 *    is a whole number and the UT1 argument lies in the range [0,1], or vice
 *    versa.
 * 3. See also the routine {@link sla.gmst}, which accepts the UT1 as a single
 *    argument. Compared with {@link sla.gmst}, the extra numerical precision
 *    delivered by the present routine is unlikely to be important in an
 *    absolute sense, but may be useful when critically comparing algorithms
 *    and in applications where two sidereal times close together are
 *    differenced.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss105.html}
 */
sla.gmsta = function (date, ut) {
    "use strict";
    let d1;
    let d2;
    if (date < ut) {
        d1 = date;
        d2 = ut;
    } else {
        d1 = ut;
        d2 = date;
    }
    const t = (d1 + (d2 - 51544.5)) / 36525;
    return sla.dranrm(sla.ds2r * (24110.54841 + (8640184.812866 + (0.093104 -
           6.2e-6 * t) * t) * t + sla.d2s * (d1 % 1 + d2 % 1)));
};

/**
 * @summary **Geodetic to Geocentric**
 * @param {Number} p - Latitude (geodetic, radians).
 * @param {Number} h - Height above reference spheroid (geodetic, metres).
 * @returns {Array} [0] Distance from Earth axis (AU)
 *                  [1] Distance from plane of Earth equator (AU)
 * @description Convert geodetic position to geocentric.
 * 1. Geocentric latitude can be obtained by evaluating ATAN2(Z,R).
 * 2. IAU 1976 constants are used.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss103.html}
 */
sla.geoc = function (p, h) {
    "use strict";
    const sp = Math.sin(p);
    const cp = Math.cos(p);
    const c = 1 / Math.sqrt(cp * cp + sla.sb * sp * sp);
    const s = sla.sb * c;
    return {
        "r": (sla.a0 * c + h) * cp / sla.au,
        "z": (sla.a0 * s + h) * sp / sla.au
    };
};

/**
 * @summary **Spherical Pos/Vel to Cartesian**
 * @param {Number} a - longitude (radians) - for example α
 * @param {Number} b - latitude (radians) - for example δ
 * @param {Number} r - radial coordinate
 * @param {Number} ad - longitude derivative (radians per unit time)
 * @param {Number} bd - latitude derivative (radians per unit time)
 * @param {Number} rd - radial derivative
 * @returns {Array} [x,y,z,\dot x,\dot y,\dot z]
 * @description Conversion of position & velocity in spherical coordinates to
 *              Cartesian coordinates.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss57.html}
 */
sla.ds2c6 = function (a, b, r, ad, bd, rd) {
    "use strict";
    /* Useful functions */
    const sa = Math.sin(a);
    const ca = Math.cos(a);
    const sb = Math.sin(b);
    const cb = Math.cos(b);
    const rcb = r * cb;
    const x = rcb * ca;
    const y = rcb * sa;
    const rbd = r * bd;
    const w = rbd * sb - cb * rd;

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
 * @summary **Apply 3D Reverse Rotation**
 * @param {Array} dm - 3x3 rotation matrix
 * @param {Array} va - vector to be rotated
 * @returns {Array} result vector
 * @description Multiply a 3-vector by the inverse of a rotation matrix.
 * 1. This routine performs the operation: **b = M^T⋅a** where **a** and **b**
 *    are the 3-vectors VA and VB respectively, and **M** is the 3×3 matrix DM.
 * 2. The main function of this routine is apply an inverse rotation; under
 *    these circumstances, **M** is *orthogonal*, with its inverse the same as
 *    its transpose.
 * 3. To comply with the ANSI Fortran 77 standard, VA and VB must *not* be the
 *    same array. The routine is, in fact, coded so as to work properly on
 *    the VAX and many other systems even if this rule is violated, something
 *    that is *not*, however, recommended.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss44.html}
 */
sla.dimxv = function (dm, va) {
    "use strict";
    let vb = [];
    /* Inverse of matrix DM * vector VA -> vector VW */
    for (let i = 0; i < 3; i += 1) {
        let w = 0;
        for (let j = 0; j < 3; j += 1) {
            w += dm[j][i] * va[j];
        }
        vb[i] = w;
    }

    return vb;
};

/**
 * @summary **Cartesian 6-Vector to Spherical**
 * @param {Array} v - [x,y,z,\dot x,\dot y,\dot z]
 * @returns {Object} a - longitude (radians)
 *                   b - latitude (radians)
 *                   r - radial coordinate
 *                   ad - longitude derivative (radians per unit time)
 *                   bd - latitude derivative (radians per unit time)
 *                   rd - radial derivative
 * @description Conversion of position & velocity in Cartesian coordinates to
 *              spherical coordinates.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss35.html}
 */
sla.dc62s = function (v) {
    "use strict";
    /* Components of position/velocity vector */
    let x = v[0];
    let y = v[1];
    let z = v[2];
    let xd = v[3];
    let yd = v[4];
    let zd = v[5];

    /* Component of R in XY plane squared */
    let rxy2 = x * x + y * y;

    /* Modulus squared */
    let r2 = rxy2 + z * z;

    /* Protection against null vector */
    if (r2 === 0) {
        x = xd;
        y = yd;
        z = zd;
        rxy2 = x * x + y * y;
        r2 = rxy2 + z * z;
    }

    /* Position and velocity in spherical coordinates */
    let rxy = Math.sqrt(rxy2);
    let xyp = x * xd + y * yd;
    let a;
    let b;
    let ad;
    let bd;
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
    let r = Math.sqrt(r2);
    let rd;
    if (r !== 0) {
        rd = (xyp + z * zd) / r;
    } else {
        rd = 0;
    }

    return {
        "a": a,
        "b": b,
        "r": r,
        "ad": ad,
        "bd": bd,
        "rd": rd
    };
};

/**
 * @summary **FK5 to Hipparcos**
 * @param {Number} r5 - J2000.0 FK5 α (radians)
 * @param {Number} d5 - J2000.0 FK5 δ (radians)
 * @param {Number} dr5 - J2000.0 FK5 proper motion in α (radians per Julian
 *                       year)
 * @param {Number} dd5 - J2000.0 FK5 proper motion in δ (radians per Julian
 *                       year)
 * @returns {Object} rh - Hipparcos α (radians)
 *                   dh - Hipparcos δ (radians)
 *                   drh - Hipparcos proper motion in α (radians per Julian
 *                         year)
 *                   ddh - Hipparcos proper motion in δ (radians per Julian
 *                         year)
 * @description Transform an FK5 (J2000) position and proper motion into the
 *              frame of the Hipparcos catalogue.
 * 1. The α proper motions are α̇  rather than α̇ cosδ, and are per year rather
 *    than per century.
 * 2. The FK5 to Hipparcos transformation consists of a pure rotation and spin;
 *    zonal errors in the FK5 catalogue are not taken into account.
 * 3. The adopted epoch J2000.0 FK5 to Hipparcos orientation and spin values
 *    are as follows (see reference):
 *
 *      | orientation | spin
 *    -----------------------
 *    x | -19.9       | -0.30
 *    y |  -9.1       | +0.60
 *    z | +22.9       | +0.70
 *      | mas         | mas/y
 *
 *    These orientation and spin components are interpreted as axial vectors.
 *    An axial vector points at the pole of the rotation and its length is the
 *    amount of rotation in radians.
 * 4. See also {@link sla.fk5hz}, {@link sla.h2fk5}, {@link sla.hfk5z}.
 * ----------
 * References:
 * - Feissel, M. & Mignard, F., 1998., *Astron.Astrophys.* 331, L33-L36.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss96.html}
 */
sla.fk52h = function (r5, d5, dr5, dd5) {
    "use strict";
    /* FK5 to Hipparcos orientation and spin (radians, radians/year) */
    const epx = -19.9e-3 * sla.das2r;
    const epy = -9.1e-3 * sla.das2r;
    const epz = 22.9e-3 * sla.das2r;
    const omx = -0.30e-3 * sla.das2r;
    const omy = 0.60e-3 * sla.das2r;
    const omz = 0.70e-3 * sla.das2r;

    /* FK5 barycentric position/velocity 6-vector (normalized) */
    const pv5 = sla.ds2c6(r5, d5, 1, dr5, dd5, 0);

    /* FK5 to Hipparcos orientation matrix. */
    const r5h = sla.dav2m([epx, epy, epz]);

    /* Orient & spin the 6-vector into the Hipparcos frame. */
    const pvh = sla.dmxv(r5h, pv5);
    let vv = sla.dvxv(pv5, [omx, omy, omz]);
    for (let i = 0; i < 3; i += 1) {
        vv[i] += pv5[i + 3];
    }
    const pvhd = sla.dmxv(r5h, vv);

    /* Hipparcos 6-vector to spherical. */
    const ret = sla.dc62s(pvh.concat(pvhd));
    return {
        "rh": sla.dranrm(ret.a),
        "dh": ret.b,
        "drh": ret.ad,
        "ddh": ret.bd
    };
};

/**
 * @summary **Hipparcos to FK**
 * @param {Number} rh - Hipparcos α (radians)
 * @param {Number} dh - Hipparcos δ (radians)
 * @param {Number} drh - Hipparcos proper motion in α (radians per Julian year)
 * @param {Number} ddh - Hipparcos proper motion in δ (radians per Julian year)
 * @returns {Object} r5 - J2000.0 FK5 α (radians)
 *                   d5 - J2000.0 FK5 δ (radians)
 *                   dr5 - J2000.0 FK5 proper motion in α (radians per Julian
 *                         year)
 *                   dd5 - J2000.0 FK5 proper motion in δ (radians per Julian
 *                         year)
 * @description Transform a Hipparcos star position and proper motion into the
 *              FK5 (J2000) frame.
 * 1. The α proper motions are α̇  rather than α̇ cosδ, and are per year rather
 *    than per century.
 * 2. The FK5 to Hipparcos transformation consists of a pure rotation and spin;
 *    zonal errors in the FK5 catalogue are not taken into account.
 * 3. The adopted epoch J2000.0 FK5 to Hipparcos orientation and spin values
 *    are as follows (see reference):
 *
 *      | orientation | spin
 *    -----------------------
 *    x | -19.9       | -0.30
 *    y |  -9.1       | +0.60
 *    z | +22.9       | +0.70
 *      | mas         | mas/y
 *
 *    These orientation and spin components are interpreted as axial vectors.
 *    An axial vector points at the pole of the rotation and its length is the
 *    amount of rotation in radians.
 * 4. See also {@link sla.fk52h}, {@link sla.fk5hz}, {@link sla.hfk5z}.
 * ----------
 * References:
 * - Feissel, M. & Mignard, F., 1998., *Astron.Astrophys.* 331, L33-L36.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss108.html}
 */
sla.h2fk5 = function (rh, dh, drh, ddh) {
    "use strict";
    /* FK5 to Hipparcos orientation and spin (radians, radians/year) */
    const epx = -19.9e-3 * sla.das2r;
    const epy = -9.1e-3 * sla.das2r;
    const epz = 22.9e-3 * sla.das2r;
    const omx = -0.30e-3 * sla.das2r;
    const omy = 0.60e-3 * sla.das2r;
    const omz = 0.70e-3 * sla.das2r;

    /* Hipparcos barycentric position/velocity 6-vector (normalized). */
    const pvh = sla.ds2c6(rh, dh, 1, drh, ddh, 0);

    /* FK5 to Hipparcos orientation matrix. */
    const r5h = sla.dav2m([epx, epy, epz]);

    /* Rotate the spin vector into the Hipparcos frame. */
    const sh = sla.dmxv(r5h, [omx, omy, omz]);

    /* De-orient & de-spin the 6-vector into FK5 J2000. */
    const pv5 = sla.dimxv(r5h, pvh);
    let vv = sla.dvxv(pvh, sh);
    for (let i = 0; i < 3; i += 1) {
        vv[i] = pvh[i + 3] - vv[i];
    }
    const pv5d = sla.dimxv(r5h, vv);

    /* FK5 6-vector to spherical. */
    const ret = sla.dc62s(pv5.concat(pv5d));
    return {
        "r5": sla.dranrm(ret.a),
        "d5": ret.b,
        "dr5": ret.ad,
        "dd5": ret.bd
    };
};

/**
 * @summary **Nutation Matrix**
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5).
 * @returns {Array} 3x3 nutation matrix.
 * @description Form the matrix of nutation (SF2001 theory) for a given date.
 * 1. The matrix is in the sense:
 *    **v**_true = **M**×**v**_mean
 *    where **v**_true is the star vector relative to the true equator and
 *    equinox of date, **M** is the 3×3 matrix rmatn and **v**_mean is the
 *    star vector relative to the mean equator and equinox of date.
 * 2. The matrix represents forced nutation (but not free core nutation) plus
 *    corrections to the IAU 1976 precession model.
 * 3. Earth attitude predictions made by combining the present nutation matrix
 *    with IAU 1976 precession are accurate to 1 mas (with respect to the ICRS)
 *    for a few decades around 2000.
 * 4. The distinction between the required TDB and TT is always negligible.
 *    Moreover, for all but the most critical applications UTC is adequate.
 * ----------
 * References:
 * 1. Kaplan, G.H., 1981. *USNO circular No. 163*, p. A3-6.
 * 2. Shirai, T. & Fukushima, T., 2001, *Astron.J.*, 121, 3270-3283.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss122.html}
 */
sla.nut = function (date) {
    "use strict";
    const ret = sla.nutc(date);
    return sla.deuler("XZX", ret.eps0, -ret.dpsi, -(ret.eps0 + ret.deps));
};

/**
 * @summary **Nutation Components**
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Array} [0] Nutation in longitude (radians)
 *                  [1] Nutation in obliquity (radians)
 *                  [2] Mean obliquity (radians)
 * @description Nutation (SF2001 theory): longitude & obliquity components,
 *              and mean obliquity.
 * 1. The routine predicts forced nutation (but not free core nutation) plus
 *    corrections to the IAU 1976 precession model.
 * 2. Earth attitude predictions made by combining the present nutation model
 *    with IAU 1976 precession are accurate to 1 mas (with respect to the ICRS)
 *    for a few decades around 2000.
 * 3. The {@link sla.nutc80} routine is the equivalent of the present routine
 *    but using the IAU 1980 nutation theory. The older theory is less
 *    accurate, leading to errors as large as 350 mas over the interval
 *    1900-2100, mainly because of the error in the IAU 1976 precession.
 * ----------
 * References:
 * 1. Shirai, T. & Fukushima, T., Astron.J. 121, 3270-3283 (2001).
 * 2. Fukushima, T., Astron.Astrophys. 244, L11 (1991).
 * 3. Simon, J. L., Bretagnon, P., Chapront, J., Chapront-Touze, M., Francou, G.
 *    & Laskar, J., Astron.Astrophys. 282, 663 (1994).
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss123.html}
 */
sla.nutc = function (date) {
    "use strict";
    /* Number of terms in the nutation model */
    let nterms = 194;

    /* Interval between fundamental epoch J2000.0 and given epoch (JC). */
    let t = (date - sla.djm0) / sla.djc;

    /* Mean anomaly of the Moon. */
    let el = 134.96340251 * sla.dd2r + (t * (1717915923.2178 + t * (31.8792 +
            t * (0.051635 + t * (-0.00024470)))) % sla.t2as) * sla.das2r;

    /* Mean anomaly of the Sun. */
    let elp = 357.52910918 * sla.dd2r + (t * (129596581.0481 + t * (-0.5532 +
            t * (0.000136 + t * (-0.00001149)))) % sla.t2as) * sla.das2r;

    /* Mean argument of the latitude of the Moon. */
    let f = 93.27209062 * sla.dd2r + (t * (1739527262.8478 + t * (-12.7512 +
            t * (-0.001037 + t * (0.00000417)))) % sla.t2as) * sla.das2r;

    /* Mean elongation of the Moon from the Sun. */
    let d = 297.85019547 * sla.dd2r + (t * (1602961601.2090 + t * (-6.3706 +
            t * (0.006539 + t * (-0.00003169)))) % sla.t2as) * sla.das2r;

    /* Mean longitude of the ascending node of the Moon. */
    let om = 125.04455501 * sla.dd2r + (t * (-6962890.5431 + t * (7.4722 +
            t * (0.007702 + t * (-0.00005939)))) % sla.t2as) * sla.das2r;

    /* Mean longitude of Venus. */
    let ve = 181.97980085 * sla.dd2r + ((210664136.433548 * t) %
            sla.t2as) * sla.das2r;

    /* Mean longitude of Mars. */
    let ma = 355.43299958 * sla.dd2r + ((68905077.493988 * t) %
            sla.t2as) * sla.das2r;

    /* Mean longitude of Jupiter. */
    let ju = 34.351518740 * sla.dd2r + ((10925660.377991 * t) %
            sla.t2as) * sla.das2r;

    /* Mean longitude of Saturn. */
    let sa = 50.077444300 * sla.dd2r + ((4399609.855732 * t) %
            sla.t2as) * sla.das2r;

    /* Geodesic nutation (Fukushima 1991) in microarcsec. */
    let dp = -153.1 * Math.sin(elp) - 1.9 * Math.sin(2 * elp);
    let de = 0;

    /* Shirai & Fukushima (2001) nutation series. */
    let i9 = 0;
    let i4 = 0;
    let j;
    let theta;
    let c;
    let s;
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
    let dpsi = (dp * 1e-6 - 0.042888 - 0.29856 * t) * sla.das2r;
    let deps = (de * 1e-6 - 0.005171 - 0.02408 * t) * sla.das2r;
    /* Mean obliquity of date (Simon et al. 1994). */
    let eps0 = (84381.412 + (-46.80927 + (-0.000152 + (0.0019989 +
            (-0.00000051 + (-0.000000025) * t) * t) * t) * t) * t) *
            sla.das2r;
    return {
        "dpsi": dpsi,
        "deps": deps,
        "eps0": eps0
    };
};

/**
 * @summary **Conventional to Universal Elements**
 * @param {Number} date - Epoch (TT MJD) of osculation (Note 3)
 * @param {Number} jform - Choice of element set (1-3; Note 6)
 * @param {Number} epoch - Epoch of elements (t0 or T, TT MJD)
 * @param {Number} orbinc - Inclination (i, radians)
 * @param {Number} anode - Longitude of the ascending node (Ω, radians)
 * @param {Number} perih - Longitude or argument of perihelion (ϖ or ω, radians)
 * @param {Number} aorq - Mean distance or perihelion distance (a or q, AU)
 * @param {Number} e - Eccentricity (e)
 * @param {Number} aorl - Mean anomaly or longitude (M or L, radians,
 *                        JFORM=1,2 only)
 * @param {Number} dm - Daily motion (n, radians, jform=1 only)
 * @returns {Array} Universal orbital elements (Note 1)
 *                  [0] combined mass (M+m)
 *                  [1] total energy of the orbit (α)
 *                  [2] reference (osculating) epoch (t0)
 *                  [3-5] position at reference epoch (r0)
 *                  [6-8] velocity at reference epoch (v0)
 *                  [9] heliocentric distance at reference epoch
 *                  [10] r0.v0
 *                  [11] date (t)
 *                  [12] universal eccentric anomaly (ψ) of date, approx
 * @description Transform conventional osculating orbital elements into
 *              "universal" form.
 * 1. The “universal” elements are those which define the orbit for the
 *    purposes of the method of universal variables (see reference). They
 *    consist of the combined mass of the two bodies, an epoch, and the
 *    position and velocity vectors (arbitrary reference frame) at that epoch.
 *    The parameter set used here includes also various quantities that can,
 *    in fact, be derived from the other information. This approach is taken
 *    to avoiding unnecessary computation and loss of accuracy. The
 *    supplementary quantities are (i) α, which is proportional to the total
 *    energy of the orbit, (ii) the heliocentric distance at epoch, (iii) the
 *    outwards component of the velocity at the given epoch, (iv) an estimate
 *    of ψ, the “universal eccentric anomaly” at a given date and (v) that date.
 * 2. The companion routine is {@link sla.ue2pv}. This takes the set of numbers
 *    that the present routine outputs and uses them to derive the object’s
 *    position and velocity. A single prediction requires one call to the
 *    present routine followed by one call to {@link sla.ue2pv}; for
 *    convenience, the two calls are packaged as the routine {@link sla.planel}.
 *    Multiple predictions may be made by again calling the present routine
 *    once, but then calling {@link sla.ue2pv} multiple times, which is faster
 *    than multiple calls to {@link sla.planel}.
 * 3. DATE is the epoch of osculation. It is in the TT time scale (formerly
 *    Ephemeris Time, ET) and is a Modified Julian Date (JD−2400000.5).
 * 4. The supplied orbital elements are with respect to the J2000 ecliptic and
 *    equinox. The position and velocity parameters returned in the array U
 *    are with respect to the mean equator and equinox of epoch J2000, and
 *    are for the perihelion prior to the specified epoch.
 * 5. The universal elements returned in the array U are in canonical units
 *    (solar masses, AU and canonical days).
 * 6. Three different element-format options are supported, as follows.
 *    - JFORM=1, suitable for the major planets:
 *    - JFORM=2, suitable for minor planets:
 *    - JFORM=3, suitable for comets:
 * 7. Unused elements (DM for JFORM=2, AORL and DM for JFORM=3) are not
 *    accessed.
 * 8. The algorithm was originally adapted from the EPHSLA program of D.H.P.
 *    Jones (private communication, 1996). The method is based on Stumpff’s
 *    Universal Variables.
 * ----------
 * References:
 * - Everhart, E. & Pitkin, E.T., *Am. J. Phys.* 51, 712, 1983.
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

    let pht;
    let argph;
    let q;
    let w;
    let cm;
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
    let alpha = cm * (e - 1) / q;

    /* Speed at perihelion */
    let phs = Math.sqrt(alpha + 2 * cm / q);

    /* Functions of the Euler angles. */
    let sw = Math.sin(argph);
    let cw = Math.cos(argph);
    let si = Math.sin(orbinc);
    let ci = Math.cos(orbinc);
    let so = Math.sin(anode);
    let co = Math.cos(anode);

    /* Position at perihelion (AU) */
    let x = q * cw;
    let y = q * sw;
    let z = y * si;
    y = y * ci;
    let px = x * co - y * so;
    y = x * so + y * co;
    let py = y * sla.ce - z * sla.se;
    let pz = y * sla.se + z * sla.ce;

    /* Velocity at perihelion (AU per canonical day). */
    x = -phs * sw;
    y = phs * cw;
    z = y * si;
    y = y * ci;
    let vx = x * co - y * so;
    y = x * so + y * co;
    let vy = y * sla.ce - z * sla.se;
    let vz = y * sla.se + z * sla.ce;

    /* Time from perihelion to date (in Canonical Days: a canonical day
     *  is 58.1324409... days, defined as 1/GCON). */
    let dt = (date - pht) * sla.gcon;

    /* First approximation to the Universal Eccentric Anomaly, PSI,
     *  based on the circle (FC) and parabola (FP) values. */
    let fc = dt / q;
    w = Math.pow(3 * dt + Math.sqrt(9 * dt * dt + 8 * q * q * q), 1 / 3);
    let fp = w - 2 * q / w;
    let psi = (1 - e) * fc + e * fp;

    /* Assemble local copy of element set. */
    let ul = [cm, alpha, pht, px, py, pz, vx, vy, vz, q, 0, date, psi];

    /* Predict position+velocity at epoch of osculation. */
    let pv = sla.ue2pv(date, ul);

    /* Convert back to universal elements. */
    return sla.pv2ue(pv, date, cm - 1);
};

/**
 * @summary **Pos/Vel from Universal Elements**
 * @param {Number} date - Date (TT Modified Julian Date = JD-2400000.5)
 * @param {Array} u - Universal orbital elements (updated; Note 1)
 *                [0] combined mass (M+m)
 *                [1] total energy of the orbit (α)
 *                [2] reference (osculating) epoch (t0)
 *                [3-5] position at reference epoch (r0)
 *                [6-8] velocity at reference epoch (v0)
 *                [9] heliocentric distance at reference epoch
 *                [10] r0.v0
 *                [11] date (t)
 *                [12] universal eccentric anomaly (ψ) of date, approx
 * @returns {Array} Heliocentric [x,y,z,\dot x,\dot y,\dot z], equatorial,
 *                  J2000 (AU, AU/s; Note 1)
 * @description Heliocentric position and velocity of a planet, asteroid or
 *              comet, starting from orbital elements in the "universal
 *              variables" form.
 * 1. The “universal” elements are those which define the orbit for the
 *    purposes of the method of universal variables (see reference). They
 *    consist of the combined mass of the two bodies, an epoch, and the
 *    position and velocity vectors (arbitrary reference frame) at that epoch.
 *    The parameter set used here includes also various quantities that can,
 *    in fact, be derived from the other information. This approach is taken to
 *    avoiding unnecessary computation and loss of accuracy. The supplementary
 *    quantities are (i) α, which is proportional to the total energy of the
 *    orbit, (ii) the heliocentric distance at epoch, (iii) the outwards
 *    component of the velocity at the given epoch, (iv) an estimate of ψ,
 *    the “universal eccentric anomaly” at a given date and (v) that date.
 * 2. The companion routine is {@link sla.el2ue}. This takes the conventional
 *    orbital elements and transforms them into the set of numbers needed by
 *    the present routine. A single prediction requires one one call to
 *    {@link sla.el2ue} followed by one call to the present routine; for
 *    convenience, the two calls are packaged as the routine {@link sla.planel}.
 *    Multiple predictions may be made by again calling {@link sla.el2ue}
 *    once, but then calling the present routine multiple times, which is
 *    faster than multiple calls to {@link sla.planel}.
 *    It is not obligatory to use {@link sla.el2ue} to obtain the parameters.
 *    However, it should be noted that because {@link sla.el2ue} performs its
 *    own validation, no checks on the contents of the array U are made by the
 *    present routine.
 * 3. DATE is the instant for which the prediction is required. It is in the
 *    TT time scale (formerly Ephemeris Time, ET) and is a Modified Julian Date
 *    (JD−2400000.5).
 * 4. The universal elements supplied in the array U are in canonical units
 *    (solar masses, AU and canonical days). The position and velocity are not
 *    sensitive to the choice of reference frame. The {@link sla.el2ue}
 *    routine in fact produces coordinates with respect to the J2000 equator
 *    and equinox.
 * 5. The algorithm was originally adapted from the EPHSLA program of D.H.P.
 *    Jones (private communication, 1996). The method is based on Stumpff’s
 *    Universal Variables.
 * ----------
 * References:
 * - Everhart, E. & Pitkin, E.T., *Am. J. Phys.* 51, 712, 1983.
 * @throws {RangeError} If radius vector is zero.
 * @throws {Error} If the algorithm fails to converge.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss180.html}
 */
sla.ue2pv = function (date, u) {
    "use strict";
    /* Unpack the parameters. */
    let test = 1e-13;
    let nitmax = 25;

    let cm = u[0];
    let alpha = u[1];
    let t0 = u[2];
    let p0 = u.slice(3, 6);
    let v0 = u.slice(6, 9);
    let r0 = u[9];
    let sigma0 = u[10];
    let t = u[11];
    let psi = u[12];

    /* Approximately update the universal eccentric anomaly. */
    psi += (date - t) * sla.gcon / r0;

    /* Time from reference epoch to date (in Canonical Days: a canonical
     *  day is 58.1324409... days, defined as 1/GCON). */
    let dt = (date - t0) * sla.gcon;

    /* Refine the universal eccentric anomaly, psi. */
    let nit = 1;
    let w = 1;
    let tol = 0;
    let n;
    let psj;
    let psj2;
    let beta;
    let s3;
    let s2;
    let s1;
    let s0;
    let ff;
    let r;
    let flast;
    let plast;
    while (Math.abs(w) > tol) {
        /* Form half angles until BETA small enough. */
        n = 0;
        psj = psi;
        psj2 = psj * psj;
        beta = alpha * psj2;
        while (Math.abs(beta) > 0.7) {
            n += 1;
            beta = beta / 4;
            psj = psj / 2;
            psj2 = psj2 / 4;
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
    let f = 1 - w / r0;
    let g = dt - cm * s3;
    let fd = -cm * s1 / (r0 * r);
    let gd = 1 - w / r;
    let i;
    let pv = [];
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
 * @summary **Position/Velocity to Universal Elements**
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
 *                  [12] universal eccentric anomaly (ψ) of date, approx
 * @description Construct a universal element set based on an instantaneous
 *              position and velocity.
 * 1. The PV 6-vector can be with respect to any chosen inertial frame, and
 *    the resulting universal-element set will be with respect to the same
 *    frame. A common choice will be mean equator and ecliptic of epoch J2000.
 * 2. The mass, PMASS, is important only for the larger planets. For most
 *    purposes (e.g. asteroids) use 0D0. Values less than zero are illegal.
 * 3. The “universal” elements are those which define the orbit for the
 *    purposes of the method of universal variables (see reference). They
 *    consist of the combined mass of the two bodies, an epoch, and the
 *    position and velocity vectors (arbitrary reference frame) at that epoch.
 *    The parameter set used here includes also various quantities that can,
 *    in fact, be derived from the other information. This approach is taken
 *    to avoiding unnecessary computation and loss of accuracy. The
 *    supplementary quantities are (i) α, which is proportional to the total
 *    energy of the orbit, (ii) the heliocentric distance at epoch, (iii) the
 *    outwards component of the velocity at the given epoch, (iv) an estimate
 *    of ψ, the “universal eccentric anomaly” at a given date and (v) that date.
 * ----------
 * References:
 * - Everhart, E. & Pitkin, E.T., *Am. J. Phys.* 51, 712, 1983.
 * @throws {RangeError} If pmass is negative, or r or v are too small.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss148.html}
 */
sla.pv2ue = function (pv, date, pmass) {
    "use strict";
    let rmin = 1e-3;
    let vmin = 1e-3;

    /* Reference epoch. */
    let t0 = date;

    /* Combined mass (mu=M+m). */
    if (pmass < 0) {
        throw new RangeError("Illegal PMASS (j=-1).");
    }
    let cm = 1 + pmass;

    /* Unpack the state vector, expressing velocity in AU per canonical day. */
    let x = pv[0];
    let y = pv[1];
    let z = pv[2];
    let xd = pv[3] / sla.cd2s;
    let yd = pv[4] / sla.cd2s;
    let zd = pv[5] / sla.cd2s;

    /* Heliocentric distance, and speed. */
    let r = Math.sqrt(x * x + y * y + z * z);
    let v2 = xd * xd + yd * yd + zd * zd;
    let v = Math.sqrt(v2);

    /* Reject unreasonably small values. */
    if (r < rmin) {
        throw new RangeError("Too close to Sun (j=-2).");
    }
    if (v < vmin) {
        throw new RangeError("Too slow (j=-3).");
    }

    /* Total energy of the orbit. */
    let alpha = v2 - 2 * cm / r;

    /* Outward component of velocity. */
    let rdv = x * xd + y * yd + z * zd;

    /* Construct the universal-element set. */
    return [cm, alpha, t0, x, y, z, xd, yd, zd, r, rdv, t0, 0];
};

/**
 * @summary **Planet Position from Elements**
 * @param {Number} date - Epoch (TT MJD) of observation (JD-2400000.5, Note 1)
 * @param {Number} jform - Choice of element set (1-3; Note 3)
 * @param {Number} epoch - Epoch of elements (t0 or T, TT MJD, Note 4)
 * @param {Number} orbinc - Inclination (i, radians)
 * @param {Number} anode - Longitude of the ascending node (Ω, radians)
 * @param {Number} perih - Longitude or argument of perihelion (ϖ or ω, radians)
 * @param {Number} aorq - Mean distance or perihelion distance (a or q, AU)
 * @param {Number} e - Eccentricity (e)
 * @param {Number} aorl - Mean anomaly or longitude (M or L, radians,
 *                        JFORM=1,2 only)
 * @param {Number} dm - Daily motion (n, radians, jform=1 only)
 * @returns {Array} Heliocentric [x,y,z,\dot x,\dot y,\dot z], equatorial,
 *                  J2000 (AU, AU/s)
 * @description Heliocentric position and velocity of a planet, asteroid or
 *              comet, starting from orbital elements.
 * 1. DATE is the instant for which the prediction is required. It is in the
 *    TT time scale (formerly Ephemeris Time, ET) and is a Modified Julian
 *    Date (JD−2400000.5).
 * 2. The elements are with respect to the J2000 ecliptic and equinox.
 * 3. A choice of three different element-format options is available,
 *    as follows.
 *    - JFORM=1, suitable for the major planets:
 *    - JFORM=2, suitable for minor planets:
 *    - JFORM=3, suitable for comets:
 *    Unused elements (DM for JFORM=2, AORL and DM for JFORM=3) are not
 *    accessed.
 * 4. Each of the three element sets defines an unperturbed heliocentric orbit.
 *    For a given epoch of observation, the position of the body in its orbit
 *    can be predicted from these elements, which are called *osculating
 *    elements*, using standard two-body analytical solutions. However, due to
 *    planetary perturbations, a given set of osculating elements remains
 *    usable for only as long as the unperturbed orbit that it describes is an
 *    adequate approximation to reality. Attached to such a set of elements is
 *    a date called the *osculating epoch*, at which the elements are,
 *    momentarily, a perfect representation of the instantaneous position and
 *    velocity of the body.
 *    Therefore, for any given problem there are up to three different epochs
 *    in play, and it is vital to distinguish clearly between them:
 *    - The epoch of observation: the moment in time for which the position of
 *      the body is to be predicted.
 *    - The epoch defining the position of the body: the moment in time at
 *      which, in the absence of purturbations, the specified position—mean
 *      longitude, mean anomaly, or perihelion—is reached.
 *    - The osculating epoch: the moment in time at which the given elements
 *      are correct.
 *    For the major-planet and minor-planet cases it is usual to make the epoch
 *    that defines the position of the body the same as the epoch of osculation.
 *    Thus, only two different epochs are involved: the epoch of the elements
 *    and the epoch of observation. For comets, the epoch of perihelion fixes
 *    the position in the orbit and in general a different epoch of osculation
 *    will be chosen. Thus, all three types of epoch are involved.
 *    For the present routine:
 *    - The epoch of observation is the argument DATE.
 *    - The epoch defining the position of the body is the argument EPOCH.
 *    - The osculating epoch is not used and is assumed to be close enough to
 *      the epoch of observation to deliver adequate accuracy. If not, a
 *      preliminary call to {@link sla.pertel} may be used to update the
 *      element-set (and its associated osculating epoch) by applying planetary
 *      perturbations.
 * 5. The reference frame for the result is equatorial and is with respect to
 *    the mean equinox and ecliptic of epoch J2000.
 * 6. The algorithm was originally adapted from the EPHSLA program of D.H.P.
 *    Jones (private communication, 1996). The method is based on Stumpff’s
 *    Universal Variables.
 * ----------
 * References:
 * - Everhart, E. & Pitkin, E.T., *Am. J. Phys.* 51, 712, 1983.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss136.html}
 */
sla.planel = function (date, jform, epoch, orbinc, anode, perih,
        aorq, e, aorl, dm) {
    "use strict";
    return sla.ue2pv(date, sla.el2ue(date, jform, epoch, orbinc, anode, perih,
            aorq, e, aorl, dm));
};

/**
 * @summary **Planetary Ephemerides**
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
 * @description Approximate heliocentric position and velocity of a planet.
 * 1. The epoch, DATE, is in the TDB time scale and is in the form of a
 *    Modified Julian Date (JD−2400000.5).
 * 2. The reference frame is equatorial and is with respect to the mean equinox
 *    and ecliptic of epoch J2000.
 * 3. If a planet number, NP, outside the range 1-9 is supplied, an error
 *    status is returned (JSTAT = −1) and the PV vector is set to zeroes.
 * 4. The algorithm for obtaining the mean elements of the planets from Mercury
 *    to Neptune is due to J. L. Simon, P. Bretagnon, J. Chapront,
 *    M. Chapront-Touze, G. Francou and J. Laskar (Bureau des Longitudes,
 *    Paris, France). The (completely different) algorithm for calculating the
 *    ecliptic coordinates of Pluto is by Meeus.
 * 5. Comparisons of the present routine with the JPL DE200 ephemeris give the
 *    following RMS errors over the interval 1960-2025:
 *                | position (km) | speed (metre/sec)
 *        Mercury | 334           | 0.437
 *        Venus   | 1060          | 0.855
 *        EMB     | 2010          | 0.815
 *        Mars    | 7690          | 1.98
 *        Jupiter | 71700         | 7.70
 *        Saturn  | 199000        | 19.4
 *        Uranus  | 564000        | 16.4
 *        Neptune | 158000        | 14.4
 *        Pluto   | 36400         | 0.137
 *    From comparisons with DE102, Simon et al. quote the following longitude
 *    accuracies over the interval 1800-2200:
 *        Mercury | 4′′
 *        Venus   | 5′′
 *        EMB     | 6′′
 *        Mars    | 17′′
 *        Jupiter | 71′′
 *        Saturn  | 81′′
 *        Uranus  | 86′′
 *        Neptune | 11′′
 *    In the case of Pluto, Meeus quotes an accuracy of ′′06 in longitude and
 *    ′′02 in latitude for the period 1885-2099.
 *    For all except Pluto, over the period 1000-3000, the accuracy is better
 *    than 1.5 times that over 1800-2200. Outside the interval 1000-3000 the
 *    accuracy declines. For Pluto the accuracy declines rapidly outside the
 *    period 1885-2099. Outside these ranges (1885-2099 for Pluto, 1000-3000
 *    for the rest) a “date out of range” warning status (JSTAT=+1) is
 *    returned.
 * 6. The algorithms for (i) Mercury through Neptune and (ii) Pluto are
 *    completely independent. In the Mercury through Neptune case, the present
 *    SLALIB implementation differs from the original Simon et al. Fortran code
 *    in the following respects:
 *    - The date is supplied as a Modified Julian Date rather a Julian Date
 *      MJD=(JD−2400000.5).
 *    - The result is returned only in equatorial Cartesian form; the ecliptic
 *      longitude, latitude and radius vector are not returned.
 *    - The velocity is in AU per second, not AU per day.
 *    - Different error/warning status values are used.
 *    - Kepler’s Equation is not solved inline.
 *    - Polynomials in T are nested to minimize rounding errors.
 *    - Explicit double-precision constants are used to avoid mixed-mode
 *      expressions.
 *    - There are other, cosmetic, changes to comply with Starlink/SLALIB style
 *      guidelines.
 *    None of the above changes affects the result significantly.
 * 7. For NP = 3 the result is for the Earth-Moon Barycentre. To obtain the
 *    heliocentric position and velocity of the Earth, either use the SLALIB
 *    routine {@link sla.evp} (or {@link sla.epv}) or call {@link sla.dmoon}
 *    and subtract 0.012150581 times the geocentric Moon vector from the EMB
 *    vector produced by the present routine. (The Moon vector should be
 *    precessed to J2000 first, but this can be omitted for modern epochs
 *    without introducing significant inaccuracy.)
 * ----------
 * References:
 * 1. Simon et al., *Astron. Astrophys.* 282, 663 (1994).
 * 2. Meeus, J., *Astronomical Algorithms*, Willmann-Bell (1991).
 * @throws {RangeError} If np or date are out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss137.html}
 */
sla.planet = function (date, np) {
    "use strict";
    if (np < 1 || np > 9) {
        throw new RangeError("Unknown planet given as argument to planet.");
    }
    let t;
    let j;
    let dl;
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
        let np3 = (np - 1) * 3; // First index
        let da = sla.a[np3] + (sla.a[np3 + 1] + sla.a[np3 + 2] * t) * t;
        dl = (3600 * sla.dlm[np3] + (sla.dlm[np3 + 1] + sla.dlm[np3 + 2] *
                t) * t) * sla.das2r;
        let de = sla.e[np3] + (sla.e[np3 + 1] + sla.e[np3 + 2] * t) * t;
        let dpe = ((3600 * sla.pi[np3] + (sla.pi[np3 + 1] + sla.pi[np3 + 2] *
                t) * t) * sla.das2r) % sla.d2pi;
        let di = (3600 * sla.dinc[np3] + (sla.dinc[np3 + 1] +
                sla.dinc[np3 + 2] * t) * t) * sla.das2r;
        let dom = ((3600 * sla.omega[np3] + (sla.omega[np3 + 1] +
                sla.omega[np3 + 2] * t) * t) * sla.das2r) % sla.d2pi;

        /* Apply the trigonometric terms. */
        let dmu = 0.35953620 * t;
        let arga;
        let argl;
        let nj;
        np3 = (np - 1) * 9;
        let nq3 = (np - 1) * 10;
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
        let dm = sla.gcon * Math.sqrt((1 + 1 / sla.amas[np - 1]) /
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
        let dj = (sla.dj0 + sla.djd * t) * sla.d2r;
        let ds = (sla.ds0 + sla.dsd * t) * sla.d2r;
        let dp = (sla.dp0 + sla.dpd * t) * sla.d2r;

        /* Initialize coefficients and derivatives */
        let wlbr = [0, 0, 0];
        let wlbrd = [0, 0, 0];

        let i;
        let j3;
        let wj;
        let ws;
        let wp;
        let al;
        let ald;
        let sal;
        let cal;
        let ac;
        let bc;
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
        let dld = (sla.dld0 + wlbrd[0]) * sla.d2r / sla.spc;

        /* Heliocentric latitude and derivative (radians, radians/sec). */
        let db = (sla.db0 + wlbr[1]) * sla.d2r;
        let dbd = wlbrd[1] * sla.d2r / sla.spc;

        /* Heliocentric radius vector and derivative (AU, AU/sec). */
        let dr = sla.dr0 + wlbr[2];
        let drd = wlbrd[2] / sla.spc;

        /*  Functions of latitude, longitude, radius vector. */
        let sl = Math.sin(dl);
        let cl = Math.cos(dl);
        let sb = Math.sin(db);
        let cb = Math.cos(db);
        let slcb = sl * cb;
        let clcb = cl * cb;

        /* Heliocentric vector and derivative, J2000 ecliptic and equinox. */
        let x = dr * clcb;
        let y = dr * slcb;
        let z = dr * sb;
        let xd = drd * clcb - dr * (cl * sb * dbd + slcb * dld);
        let yd = drd * slcb + dr * (-sl * sb * dbd + clcb * dld);
        let zd = drd * sb + dr * cb * dbd;

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
 * @summary **Observatory Position & Velocity.**
 * @param {Number} p - Latitude (geodetic, radians)
 * @param {Number} h - Height above reference spheroid (geodetic, metres)
 * @param {Number} stl - Local apparent sidereal time (radians)
 * @returns {Array} [x,y,z,\dot x,\dot y,\dot z] (AU, AU/s, true equator
 *                  and equinox of date)
 * @description Position and velocity of an observing station.
 * - IAU 1976 constants are used.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss149.html}
 */
sla.pvobs = function (p, h, stl) {
    "use strict";
    let ret = sla.geoc(p, h);
    /* Functions of ST */
    let s = Math.sin(stl);
    let c = Math.cos(stl);
    /* Speed */
    let v = sla.sr * ret.r;
    return [ret.r * c,
            ret.r * s,
            ret.z,
            -v * s,
            v * c,
            0];
};

/**
 * @summary **Approximate ET minus UT**
 * @param {Number} epoch - (Julian) epoch (e.g. 1850D0)
 * @returns {Number} Approximate ET-UT (after 1984, TT-UT1) in seconds
 * @description Estimate ΔT, the offset between dynamical time and Universal
 *              Time, for a given historical epoch.
 * 1. Depending on the epoch, one of three parabolic approximations is used:
 *        before AD 979      | Stephenson & Morrison’s 390 BC to AD 948 model
 *        AD 979 to AD 1708  | Stephenson & Morrison’s AD 948 to AD 1600 model
 *        after AD 1708      | McCarthy & Babcock’s post-1650 model
 *    The breakpoints are chosen to ensure continuity: they occur at places
 *    where the adjacent models give the same answer as each other.
 * 2. The accuracy is modest, with errors of up to 20s during the interval
 *    since 1650, rising to perhaps 30m by 1000 BC. Comparatively accurate
 *    values from AD 1600 are tabulated in the *Astronomical Almanac* (see
 *    section K8 of the 1995 edition).
 * 3. The use of DOUBLE PRECISION for both argument and result is simply for
 *    compatibility with other SLALIB time routines.
 * 4. The models used are based on a lunar tidal acceleration value of
 *    ′′-2600 per century.
 * ----------
 * References:
 * - Seidelmann, P.K. (ed), 1992. *Explanatory Supplement to the Astronomical
 *   Almanac*, ISBN 0-935702-68-7. This contains references to the papers by
 *   Stephenson & Morrison and by McCarthy & Babcock which describe the models
 *   used here.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss61.html}
 */
sla.dt = function (epoch) {
    "use strict";
    /* Centuries since 1800 */
    let t = (epoch - 1800) / 100;
    /* Select model */
    if (epoch >= 1708.185161980887) {
        /* Post-1708: use McCarthy & Babcock */
        let w = t - 0.19;
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
 * @summary **Multiply 3x3 Matrices**
 * @param {Array} a - 3x3 matrix A
 * @param {Array} b - 3x3 matrix B
 * @returns {Array} 3x3 matrix result: AxB
 * @description Product of two 3x3 matrices.
 * - To comply with the ANSI Fortran 77 standard, A, B and C must be different
 *   arrays. However, the routine is coded so as to work properly on many
 *   platforms even if this rule is violated, something that is not, however,
 *   recommended.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss50.html}
 */
sla.dmxm = function (a, b) {
    "use strict";
    let c = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    let i;
    let j;
    let k;
    for (i = 0; i < 3; i += 1) {
        for (j = 0; j < 3; j += 1) {
            let w = 0;
            for (k = 0; k < 3; k += 1) {
                w += a[i][k] * b[k][j];
            }
            c[i][j] = w;
        }
    }
    return c;
};

/**
 * @summary **MJD to Julian Epoch**
 * @param {Number} date - Modified Julian Date (JD-2400000.5)
 * @returns {Number} Julian Epoch
 * @description Convert Modified Julian Date to Julian Epoch.
 * ----------
 * References:
 * - Lieske, J.H., 1979. *Astr.Astrophys.*, 73, 282.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss83.html}
 */
sla.epj = function (date) {
    "use strict";
    return 2000 + (date - 51544.5) / 365.25;
};

/**
 * @summary **Precession Matrix (FK5)**
 * @param {Number} ep0 - beginning epoch
 * @param {Number} ep1 - ending epoch
 * @returns {Array} 3x3 precession matrix
 * @description Form the matrix of precession between two epochs (IAU 1976,
 *              FK5).
 * 1. The epochs are TDB Julian epochs.
 * 2. The matrix is in the sense:
 *    **v**_1 = **M**⋅**v**_0
 *    where **v**_1 is the star vector relative to the mean equator and equinox
 *    of epoch EP1, **M** is the 3×3 matrix RMATP and **v**_0 is the star
 *    vector relative to the mean equator and equinox of epoch EP0.
 * 3. Though the matrix method itself is rigorous, the precession angles are
 *    expressed through canonical polynomials which are valid only for a
 *    limited time span. There are also known errors in the IAU precession rate.
 *    The absolute accuracy of the present formulation is better than ′′01 from
 *    1960 AD to 2040 AD, better than 1′′ from 1640 AD to 2360 AD, and remains
 *    below 3′′ for the whole of the period 500 BC to 3000 AD. The errors
 *    exceed 10′′ outside the range 1200 BC to 3900 AD, exceed 100′′ outside
 *    4200 BC to 5600 AD and exceed 1000′′ outside 6800 BC to 8200 AD. The
 *    SLALIB routine {@link sla.precl} implements a more elaborate model which
 *    is suitable for problems spanning several thousand years.
 * ----------
 * References:
 * 1. Lieske, J.H., 1979. *Astr.Astrophys.* 73, 282; equations 6 & 7, p283.
 * 2. Kaplan, G.H., 1981. *USNO circular no. 163*, p. A2.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss143.html}
 */
sla.prec = function (ep0, ep1) {
    "use strict";
    const t0 = (ep0 - 2000) / 100;
    const t = (ep1 - ep0) / 100;
    const tas2r = t * sla.das2r;
    const w = 2306.2181 + (1.39656 - 0.000139 * t0) * t0;
    const zeta = (w + ((0.30188 - 0.000344 * t0) + 0.017998 * t) * t) * tas2r;
    const z = (w + ((1.09468 + 0.000066 * t0) + 0.018203 * t) * t) * tas2r;
    const theta = ((2004.3109 + (-0.85330 - 0.000217 * t0) * t0) +
                ((-0.42665 - 0.000217 * t0) - 0.041833 * t) * t) * tas2r;
    return sla.deuler("ZYZ", -zeta, theta, -z);
};

/**
 * @summary **Precession-Nutation Matrix**
 * @param {Number} epoch - Julian Epoch for mean coordinates
 * @param {Number} date - Modified Julian Date (JD-2400000.5) for
 *                        true coordinates
 * @returns {Array} Combined 3x3 precession-nutation matrix
 * @description Form the matrix of precession and nutation (SF2001).
 * 1. The epoch and date are TDB. TT (or even UTC) will do.
 * 2. The matrix is in the sense:
 *    **v**_true = **M**×**v**_mean
 *    where **v**_true is the star vector relative to the true equator and
 *    equinox of epoch DATE, **M** is the 3×3 matrix RMATPN and **v**_mean is
 *    the star vector relative to the mean equator and equinox of epoch EPOCH.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss146.html}
 */
sla.prenut = function (epoch, date) {
    "use strict";
    return sla.dmxm(sla.nut(date), sla.prec(epoch, sla.epj(date)));
};

/**
 * @summary **Apparent [α,δ] of Planet**
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
 * @description Approximate topocentric apparent [α,δ] and angular size of
 *              a planet.
 * 1. The date is in a dynamical time scale (TDB, formerly ET) and is in the
 *    form of a Modified Julian Date (JD−2400000.5). For all practical
 *    purposes, TT can be used instead of TDB, and for many applications UT
 *    will do (except for the Moon).
 * 2. The longitude and latitude allow correction for geocentric parallax. This
 *    is a major effect for the Moon, but in the context of the limited
 *    accuracy of the present routine its effect on planetary positions is
 *    small (negligible for the outer planets). Geocentric positions can be
 *    generated by appropriate use of the routines {@link sla.dmoon} and
 *    {@link sla.planet}.
 * 3. The direction accuracy (arcsec, 1000-3000 AD) is of order:
 *        Sun     | 5
 *        Mercury | 2
 *        Venus   | 10
 *        Moon    | 30
 *        Mars    | 50
 *        Jupiter | 90
 *        Saturn  | 90
 *        Uranus  | 90
 *        Neptune | 10
 *        Pluto   | 1 (1885-2099 AD only)
 *    The angular diameter accuracy is about 0.4% for the Moon, and 0.01% or
 *    better for the Sun and planets. For more information on accuracy, refer
 *    to the routines {@link sla.planet} and {@link sla.dmoon}, which the
 *    present routine uses.
 * @throws {RangeError} If np is out of range.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss155.html}
 */
sla.rdplan = function (date, np, elong, phi) {
    "use strict";
    let eqrau = [
        696000, 2439.7, 6051.9, 1738, 3397, 71492,
        60268, 25559, 24764, 1151
    ];
    /* Classify NP */
    let ip;
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
    let stl = sla.gmst(date - sla.dt(sla.epj(date)) / sla.d2s) + elong;
    /* Geocentre to Moon (mean of date) */
    let v = sla.dmoon(date);
    /* Nutation to true of date */
    let rmat = sla.nut(date);
    let vgm = sla.dmxv(rmat, v.slice(0, 3));
    let vgm4 = sla.dmxv(rmat, v.slice(3));
    vgm = vgm.concat(vgm4);
    let i;
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
        let vse = sla.dmxv(rmat, v.slice(0, 3));
        let vse4 = sla.dmxv(rmat, v.slice(3));
        vse = vse.concat(vse4);
        let vsg = [];
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
            let vsp;
            let vsp4;
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
    let vg0 = sla.pvobs(phi, 0, stl);
    for (i = 0; i < 6; i += 1) {
        v[i] -= vg0[i];
    }

    /* Geometric distance (AU) */
    let dx = v[0];
    let dy = v[1];
    let dz = v[2];
    let r = Math.sqrt(dx * dx + dy * dy + dz * dz);

    /* Light time (sec) */
    let tl = sla.tau * r;

    /* Correct position for planetary aberration */
    for (i = 0; i < 3; i += 1) {
        v[i] -= tl * v[i + 3];
    }

    /* To RA,Dec */
    let ret = sla.dcc2s(v);

    /* Angular diametre (radians) */
    return {
        "ra": sla.dranrm(ret.a),
        "dec": ret.b,
        "diam": 2 * Math.asin(eqrau[ip] / (r * sla.aukm))
    };
};

/**
 * @summary **Internal routine used by REFRO**
 * @description Refractive index and derivative with respect to height for the
 *              troposphere.
 * @returns {Array} [0] Temperature at R (K)
 *                  [1] Refractive index at R
 *                  [2] R * rate the refractive index is changing at R
 */
sla.atmt = function (r0, t0, alpha, gamm2, delm2, c1, c2, c3, c4, c5, c6, r) {
    "use strict";
    const t = Math.max(Math.min(t0 - alpha * (r - r0), 320), 100);
    const tt0 = t / t0;
    const tt0gm2 = Math.pow(tt0, gamm2);
    const tt0dm2 = Math.pow(tt0, delm2);
    return {
        "t": t,
        "dn": 1 + (c1 * tt0gm2 - (c2 - c5 / t) * tt0dm2) * tt0,
        "rdndr": r * (-c3 * tt0gm2 + (c4 - c6 / tt0) * tt0dm2)
    };
};

/**
 * @summary **Internal routine used by REFRO**
 * @description Refractive index and derivative with respect to height for the
 *              stratosphere.
 * @returns {Array} [0] Refractive index at R
 *                  [1] R * rate the refractive index is changing at R
 */
sla.atms = function (rt, tt, dnt, gamal, r) {
    "use strict";
    const b = gamal / tt;
    const w = (dnt - 1) * Math.exp(-b * (r - rt));
    return {
        "dn": 1 + w,
        "rdndr": -r * b * w
    };
};

/**
 * @summary **Refraction**
 * @param {Number} zobs - Observed zenith distance of the source (radians)
 * @param {Number} hm - Height of the observer above sea level (metre)
 * @param {Number} tdk - Ambient temperature at the observer (K)
 * @param {Number} pmb - Pressure at the observer (mb)
 * @param {Number} rh - Relative humidity at the observer (range 0-1)
 * @param {Number} wl - Effective wavelength of the source (μm)
 * @param {Number} phi - Latitude of the observer (radian, astronomical)
 * @param {Number} tlr - Temperature lapse rate in the troposphere (K per metre)
 * @param {Number} eps - Precision required to terminate iteration (radian)
 * @returns {Number} Refraction: in vacuo ZD minus observed ZD (radians)
 * @description Atmospheric refraction, for radio or optical/IR wavelengths.
 * 1.  A suggested value for the TLR argument is 0.0065D0 (sign immaterial).
 *     The refraction is significantly affected by TLR, and if studies of the
 *     local atmosphere have been carried out a better TLR value may be
 *     available.
 * 2.  A suggested value for the EPS argument is 1D−8. The result is usually at
 *     least two orders of magnitude more computationally precise than the
 *     supplied EPS value.
 * 3.  The routine computes the refraction for zenith distances up to and a
 *     little beyond 90∘ using the method of Hohenkerk & Sinclair (NAO
 *     Technical Notes 59 and 63, subsequently adopted in the *Explanatory
 *     Supplement to the Astronomical Almanac*, 1992 – see section 3.281).
 * 4.  The code is based on the AREF optical/IR refraction subroutine (HMNAO,
 *     September 1984, RGO: Hohenkerk 1985), with extensions to support the
 *     radio case. The modifications to the original HMNAO optical/IR
 *     refraction code which affect the results are:
 *     - The angle arguments have been changed to radians, any value of ZOBS is
 *       allowed (see Note 6, below) and other argument values have been
 *       limited to safe values.
 *     - Revised values for the gas constants are used, from Murray (1983).
 *     - A better model for P_s(T) has been adopted, from Gill (1982).
 *     - More accurate expressions for P_{w_o} have been adopted (again from
 *       Gill 1982).
 *     - The formula for the water vapour pressure, given the saturation
 *       pressure and the relative humidity, is from Crane (1976), expression
 *       2.5.5.
 *     - Provision for radio wavelengths has been added using expressions
 *       devised by A. T. Sinclair, RGO (Sinclair 1989). The refractivity model
 *       is from Rueger (2002).
 *     - The optical refractivity for dry air is from IAG (1999).
 * 5.  The radio refraction is chosen by specifying WL >100 μm. Because the
 *     algorithm takes no account of the ionosphere, the accuracy deteriorates
 *     at low frequencies, below about 30 MHz.
 * 6.  Before use, the value of ZOBS is expressed in the range ±π. If this
 *     ranged ZOBS is negative, the result REF is computed from its absolute
 *     value before being made negative to match. In addition, if it has an
 *     absolute value greater than 93∘, a fixed REF value equal to the result
 *     for ZOBS =93∘ is returned, appropriately signed.
 * 7.  As in the original Hohenkerk & Sinclair algorithm, fixed values of the
 *     water vapour polytrope exponent, the height of the tropopause, and the
 *     height at which refraction is negligible are used.
 * 8.  The radio refraction has been tested against work done by Iain Coulson,
 *     JACH, (private communication 1995) for the James Clerk Maxwell
 *     Telescope, Mauna Kea. For typical conditions, agreement at the ′′01
 *     level is achieved for moderate ZD, worsening to perhaps ′′05 – ′′10 at
 *     ZD 80∘. At hot and humid sea-level sites the accuracy will not be as
 *     good.
 * 9.  It should be noted that the relative humidity RH is formally defined in
 *     terms of “mixing ratio” rather than pressures or densities as is often
 *     stated. It is the mass of water per unit mass of dry air divided by that
 *     for saturated air at the same temperature and pressure (see Gill 1982).
 *     The familiar ν=pw/ps or ν=ρw/ρs expressions can differ from the formal
 *     definition by several percent, significant in the radio case.
 * 10. The algorithm is designed for observers in the troposphere. The supplied
 *     temperature, pressure and lapse rate are assumed to be for a point in
 *     the troposphere and are used to define a model atmosphere with the
 *     tropopause at 11km altitude and a constant temperature above that.
 *     However, in practice, the refraction values returned for stratospheric
 *     observers, at altitudes up to 25km, are quite usable.
 * ----------
 * References:
 * 1.  Coulsen, I. 1995, private communication.
 * 2.  Crane, R.K., Meeks, M.L. (ed), 1976, “Refraction Effects in the Neutral
 *     Atmosphere”, *Methods of Experimental Physics: Astrophysics 12B*,
 *     Academic Press.
 * 3.  Gill, Adrian E. 1982, *Atmosphere-Ocean Dynamics*, Academic Press.
 * 4.  Hohenkerk, C.Y. 1985, private communication.
 * 5.  Hohenkerk, C.Y., & Sinclair, A.T. 1985, *NAO Technical Note* No. 63,
 *     Royal Greenwich Observatory.
 * 6.  International Association of Geodesy, XXIIth General Assembly,
 *     Birmingham, UK, 1999, Resolution 3.
 * 7.  Murray, C.A. 1983, *Vectorial Astrometry*, Adam Hilger, Bristol.
 * 8.  Seidelmann, P.K. et al. 1992, *Explanatory Supplement to the
 *     Astronomical Almanac*, Chapter 3, University Science Books.
 * 9.  Rueger, J.M. 2002, *Refractive Index Formulae for Electronic Distance
 *     Measurement with Radio and Millimetre Waves*, in Unisurv Report S-68,
 *     School of Surveying and Spatial Information Systems, University of New
 *     South Wales, Sydney, Australia.
 * 10. Sinclair, A.T. 1989, private communication.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss158.html}
 */
sla.refro = function (zobs, hm, tdk, pmb, rh, wl, phi, tlr, eps) {
    "use strict";
    /* 93 degrees in radians */
    const d93 = 1.623156204;
    /* Universal gas constant */
    const gcr = 8314.32;
    /* Molecular weight of dry air */
    const dmd = 28.9644;
    /* Molecular weight of water vapour */
    const dmw = 18.0152;
    /* Mean Earth radius (metre) */
    const s = 6378120;
    /* Exponent of temperature dependence of water vapour pressure */
    const delta = 18.36;
    /* Height of tropopause (metre) */
    const ht = 11000;
    /* Upper limit for refractive effects (metre) */
    const hs = 80000;
    /* Numerical integration: maximum number of strips. */
    const ismax = 16384;

    /* The refraction integrand */
    let refi = function (dn, rdndr) {
        return rdndr / (dn + rdndr);
    };

    /* Transform ZOBS into the normal range. */
    let zobs1 = sla.drange(zobs);
    let zobs2 = Math.min(Math.abs(zobs1), d93);

    /* Keep other arguments within safe bounds. */
    let hmok = Math.min(Math.max(hm, -1e3), hs);
    let tdkok = Math.min(Math.max(tdk, 100), 500);
    let pmbok = Math.min(Math.max(pmb, 0), 10000);
    let rhok = Math.min(Math.max(rh, 0), 1);
    let wlok = Math.max(wl, 0.1);
    let alpha = Math.min(Math.max(Math.abs(tlr), 0.001), 0.01);

    /* Tolerance for iteration. */
    let tol = Math.min(Math.max(Math.abs(eps), 1e-12), 0.1) / 2;

    /* Decide whether optical/IR or radio case - switch at 100 microns. */
    let optic = wlok <= 100;

    /* Set up model atmosphere parameters defined at the observer. */
    let wlsq = wlok * wlok;
    let gb = 9.784 * (1 - 0.0026 * Math.cos(phi + phi) - 0.00000028 * hmok);
    let a;
    if (optic) {
        a = (287.6155 + (1.62887 + 0.01360 / wlsq) / wlsq) *
            273.15e-6 / 1013.25;
    } else {
        a = 77.6890e-6;
    }
    let gamal = (gb * dmd) / gcr;
    let gamma = gamal / alpha;
    let gamm2 = gamma - 2;
    let delm2 = delta - 2;
    let tdc = tdkok - 273.15;
    let psat = Math.pow(10, (0.7859 + 0.03477 * tdc) / (1 + 0.00412 * tdc) *
            (1 + pmbok * (4.5e-6 + 6e-10 * tdc * tdc)));
    let pw0 = 0;
    if (pmbok > 0) {
        pw0 = rhok * psat / (1 - (1 - rhok) * psat / pmbok);
    }
    let w = pw0 * (1 - dmw / dmd) * gamma / (delta - gamma);
    let c1 = a * (pmbok + w) / tdkok;
    let c2;
    if (optic) {
        c2 = (a * w + 11.2684e-6 * pw0) / tdkok;
    } else {
        c2 = (a * w + 6.3938e-6 * pw0) / tdkok;
    }
    let c3 = (gamma - 1) * alpha * c1 / tdkok;
    let c4 = (delta - 1) * alpha * c2 / tdkok;
    let c5 = 0;
    let c6 = 0;
    if (!optic) {
        c5 = 375463e-6 * pw0 / tdkok;
        c6 = c5 * delm2 * alpha / (tdkok * tdkok);
    }

    /* Conditions at the observer. */
    let r0 = s + hmok;
    let ret = sla.atmt(r0, tdkok, alpha, gamm2, delm2,
            c1, c2, c3, c4, c5, c6, r0);
    let dn0 = ret.dn;
    let rdndr0 = ret.rdndr;
    let sk0 = dn0 * r0 * Math.sin(zobs2);
    let f0 = refi(dn0, rdndr0);

    /* Conditions in the troposphere at the tropopause. */
    let rt = s + Math.max(ht, hmok);
    ret = sla.atmt(r0, tdkok, alpha, gamm2, delm2,
            c1, c2, c3, c4, c5, c6, rt);
    let tt = ret.t;
    let dnt = ret.dn;
    let rdndrt = ret.rdndr;
    let sine = sk0 / (rt * dnt);
    let zt = Math.atan2(sine, Math.sqrt(Math.max(1 - sine * sine, 0)));
    let ft = refi(dnt, rdndrt);

    /* Conditions in the stratosphere at the tropopause. */
    ret = sla.atms(rt, tt, dnt, gamal, rt);
    let dnts = ret.dn;
    let rdndrp = ret.rdndr;
    sine = sk0 / (rt * dnts);
    let zts = Math.atan2(sine, Math.sqrt(Math.max(1 - sine * sine, 0)));
    let fts = refi(dnts, rdndrp);

    /* Conditions at the stratosphere limit. */
    let rs = s + hs;
    ret = sla.atms(rt, tt, dnt, gamal, rs);
    let dns = ret.dn;
    let rdndrs = ret.rdndr;
    sine = sk0 / (rs * dns);
    let zs = Math.atan2(sine, Math.sqrt(Math.max(1 - sine * sine, 0)));
    let fs = refi(dns, rdndrs);

    /* Variable initialization to avoid compiler warning. */
    let reft = 0;

    /* Integrate the refraction integral in two parts;  first in the
     * troposphere (K=1), then in the stratosphere (K=2). */
    let k;
    let refold;
    let is;
    let z0;
    let zrange;
    let fb;
    let ff;
    let fe;
    let n;
    let loop;
    let dn;
    let rdndr;
    let h;
    let r;
    let i;
    let sz;
    let rg;
    let dr;
    let j;
    let f;
    let refp;
    let ref;

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
 * @summary **Refraction Constants**
 * @param {Number} hm - Height of the observer above sea level (metre)
 * @param {Number} tdk - Ambient temperature at the observer K)
 * @param {Number} pmb - Pressure at the observer (mb)
 * @param {Number} rh - Relative humidity at the observer (range 0-1)
 * @param {Number} wl - Effective wavelength of the source (microns)
 * @param {Number} phi - Latitude of the observer (radian, astronomical)
 * @param {Number} tlr - Temperature lapse rate in the troposphere (K per metre)
 * @param {Number} eps - Precision required to terminate iteration (radian)
 * @returns {Array} [0] \tan ζ coefficient (radians)
 *                  [1] \tan^3 ζ coefficient (radians)
 * @description Determine the constants a and b in the atmospheric refraction
 *              model Δζ=a\tan ζ+b\tan^3 ζ, where ζ is the observed
 *              zenith distance (i.e. affected by refraction) and Δζ is what
 *              to add to ζ to give the topocentric (i.e. in vacuo) zenith
 *              distance.
 * 1. Suggested values for the TLR and EPS arguments are 0.0065D0 and 1D−8
 *    respectively. The signs of both are immaterial.
 * 2. The radio refraction is chosen by specifying WL >100 μm.
 * 3. The routine is a slower but more accurate alternative to the
 *    {@link sla.refcoq} routine. The constants it produces give perfect
 *    agreement with {@link sla.refro} at zenith distances tan−11 (45∘) and
 *    tan−14 (∼76∘). At other zenith distances, the model achieves:
 *    ′′05 accuracy for ζ<80∘, ′′001 accuracy for ζ<60∘, and
 *    ′′0001 accuracy for ζ<45∘.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss156.html}
 */
sla.refco = function (hm, tdk, pmb, rh, wl, phi, tlr, eps) {
    "use strict";
    /* Sample zenith distances: arctan(1) and arctan(4) */
    let atn1 = 0.7853981633974483;
    let atn4 = 1.325817663668033;

    /* Determine refraction for the two sample zenith distances */
    let r1 = sla.refro(atn1, hm, tdk, pmb, rh, wl, phi, tlr, eps);
    let r2 = sla.refro(atn4, hm, tdk, pmb, rh, wl, phi, tlr, eps);

    /* Solve for refraction constants */
    return {
        "refa": (64 * r1 - r2) / 60,
        "refb": (r2 - 4 * r1) / 60
    };
};

/**
 * @summary **Apply Refraction to ZD**
 * @param {Number} zu - Unrefracted zenith distance of the source (radians)
 * @param {Number} refa - \tan ζ coefficient (radians)
 * @param {Number} refb - \tan^3 ζ coefficient (radians)
 * @returns {Number} Refracted zenith distance (radians)
 * @description Adjust an unrefracted zenith distance to include the effect of
 *     atmospheric refraction, using the simple Δζ=a\tan ζ+b\tan^3 ζ
 *     model.
 * 1. This routine applies the adjustment for refraction in the opposite sense
 *    to the usual one – it takes an unrefracted (in vacuo) position and
 *    produces an observed (refracted) position, whereas the Δζ=atanζ+btan3ζ
 *    model strictly applies to the case where an observed position is to have
 *    the refraction removed. The unrefracted to refracted case is harder, and
 *    requires an inverted form of the text-book refraction models; the formula
 *    used here is based on the Newton-Raphson method. For the utmost numerical
 *    consistency with the refracted to unrefracted model, two iterations are
 *    carried out, achieving agreement at the 10^−11 arcsecond level for ζ=80∘.
 *    The inherent accuracy of the model is, of course, far worse than this –
 *    see the documentation for {@link sla.refco} for more information.
 * 2. At ζ=83∘, the rapidly-worsening Δζ=atanζ+btan3ζ model is abandoned and
 *    an empirical formula takes over:
 *
 *        Δζ = F * (0∘.55445−0∘.01133*E+0∘.00202*E^2) /
 *                 (1+0.28385*E+0.02390*E^2),
 *
 *    where E=90∘−ζ_true and F is a factor chosen to meet the Δζ=atanζ+btan3ζ
 *    formula at ζ=83∘.
 *    For optical/IR wavelengths, over a wide range of observer heights and
 *    corresponding temperatures and pressures, the following levels of
 *    accuracy (worst case) are achieved, relative to numerical integration
 *    through a model atmosphere:
 *        ζobs | error |
 *        80∘  | ′′07  |
 *        81∘  | ′′13  |
 *        82∘  | ′′24  |
 *        83∘  | ′′47  |
 *        84∘  | ′′62  |
 *        85∘  | ′′64  |
 *        86∘  | 8′′   |
 *        87∘  | 10′′  |
 *        88∘  | 15′′  |
 *        89∘  | 30′′  |
 *        90∘  | 60′′  |
 *        91∘  | 150′′ | <high-altitude
 *        92∘  | 400′′ | <sites only
 *    For radio wavelengths the errors are typically 50% larger than the
 *    optical figures and by ζ=85∘ are twice as bad, worsening rapidly below
 *    that. To maintain 1′′ accuracy down to ζ=85∘ at the Green Bank site,
 *    Condon (2004) has suggested amplifying the amount of refraction predicted
 *    by {@link sla.refz} below 10∘.8 elevation by the factor
 *        (1+0.00195∗(10.8−E_topo)),
 *    where E_topo is the unrefracted elevation in degrees.
 *    The high-ZD model is scaled to match the normal model at the transition
 *    point; there is no glitch.
 * 3. See also the routine {@link sla.refv}, which performs the adjustment in
 *    [x,y,z], and with the emphasis on speed rather than numerical accuracy.
 * ----------
 * References:
 * - Condon, J.J., *Refraction Corrections for the GBT*, PTCS/PN/35.2, NRAO
 *   Green Bank, 2004.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss160.html}
 */
sla.refz = function (zu, refa, refb) {
    "use strict";
    /* @constant {Number} Largest usable ZD (deg) */
    let d93 = 93;

    /* Coefficients for high ZD model (used beyond ZD 83 deg) */
    let c1 = 0.55445;
    let c2 = -0.01133;
    let c3 = 0.00202;
    let c4 = 0.28385;
    let c5 = 0.02390;

    /* ZD at which one model hands over to the other (radians) */
    let z83 = 83 / sla.r2d;

    /* High-ZD-model prediction (deg) for that point */
    let ref83 = (c1 + c2 * 7 + c3 * 49) / (1 + c4 * 7 + c5 * 49);

    /* Perform calculations for ZU or 83 deg, whichever is smaller */
    let zu1 = Math.min(zu, z83);

    /* Functions of zd */
    let zl = zu1;
    let s = Math.sin(zl);
    let c = Math.cos(zl);
    let t = s / c;
    let tsq = t * t;
    let tcu = t * tsq;

    /* Refracted ZD (mathematically to better than 1 mas at 70 deg) */
    zl -= (refa * t + refb * tcu) / (1 + (refa + 3 * refb * tsq) / (c * c));

    /* Further iteration */
    s = Math.sin(zl);
    c = Math.cos(zl);
    t = s / c;
    tsq = t * t;
    tcu = t * tsq;
    let ref = zu1 - zl + (zl - zu1 + refa * t + refb * tcu) /
            (1 + (refa + 3 * refb * tsq) / (c * c));

    /* Special handling for large ZU */
    if (zu > zu1) {
        let e = 90 - Math.min(d93, zu * sla.r2d);
        let e2 = e * e;
        ref = (ref / ref83) * (c1 + c2 * e + c3 * e2) /
                (1 + c4 * e + c5 * e2);
    }

    /* Return refracted ZD */
    return zu - ref;
};

/**
 * @summary **Earth Position & Velocity**
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
 * @description Barycentric and heliocentric velocity and position of the Earth.
 * 1. This routine is accurate enough for many purposes but faster and more
 *    compact than the {@link sla.epv} routine. The maximum deviations from the
 *    JPL DE96 ephemeris are as follows:
 *    - velocity (barycentric or heliocentric): 420 mm/s
 *    - position (barycentric): 6900 km
 *    - position (heliocentric): 1600 km
 * 2. The routine is adapted from the BARVEL and BARCOR subroutines of Stumpff
 *    (1980). Most of the changes are merely cosmetic and do not affect the
 *    results at all. However, some adjustments have been made so as to give
 *    results that refer to the IAU 1976 ‘FK5’ equinox and precession, although
 *    the differences these changes make relative to the results from Stumpff’s
 *    original ‘FK4’ version are smaller than the inherent accuracy of the
 *    algorithm. One minor shortcoming in the original routines that has *not*
 *    been corrected is that slightly better numerical accuracy could be
 *    achieved if the various polynomial evaluations were to be so arranged
 *    that the smallest terms were computed first.
 * ----------
 * References:
 * - Stumpff, P., 1980., *Astron.Astrophys.Suppl.Ser.* 41, 1-8.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss91.html}
 */
sla.evp = function (date, deqx) {
    "use strict";
    /* Control parameter IDEQ, and time arguments */
    let ideq = 0;
    if (deqx > 0) {
        ideq = 1;
    }
    let dt = (date - 15019.5) / 36525;
    let dtsq = dt * dt;

    /* Values of all elements for the instant DATE */
    let forbel = [];
    let sorbel = [];
    let k;
    let dlocal;
    let k3;
    let dml;
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
    let deps = (sla.dceps[0] + dt * sla.dceps[1] + dtsq * sla.dceps[2]) %
               sla.d2pi;
    for (k = 0; k < 17; k += 1) {
        k3 = k * 3;
        sorbel[k] = (sla.ccsel[k3] + dt * sla.ccsel[k3 + 1] +
                dtsq * sla.ccsel[k3 + 2]) % sla.d2pi;
    }
    let sn = [];
    let a;
    /* Secular perturbations in longitude */
    for (k = 0; k < 4; k += 1) {
        k3 = k * 3;
        a = (sla.ccsec[k3 + 1] + dt * sla.ccsec[k3 + 2]) % sla.d2pi;
        sn[k] = Math.sin(a);
    }
    /* Periodic perturbations of the EMB (Earth-Moon barycentre) */
    let pertl = sla.ccsec[0] * sn[0] + sla.ccsec[3] * sn[1] +
            (sla.ccsec[6] + dt * sla.ccsec3) * sn[2] + sla.ccsec[9] * sn[3];
    let pertld = 0;
    let pertr = 0;
    let pertrd = 0;
    let k5;
    let cosa;
    let sina;
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
    let e = sorbel[0];
    let g = forbel[0];
    let esq = e * e;
    let dparam = 1 - esq;
    let twoe = e + e;
    let twog = g + g;
    let phi = twoe * ((1 - esq * 0.125) * Math.sin(g) + e * 0.625 *
            Math.sin(twog) + esq * 0.54166667 * Math.sin(g + twog));
    let f = g + phi;
    let sinf = Math.sin(f);
    let cosf = Math.cos(f);
    let dpsi = dparam / (1 + (e * cosf));
    let phid = twoe * sla.ccsgd * ((1 + esq * 1.5) * cosf + e *
            (1.25 - sinf * sinf * 0.5));
    let psid = sla.ccsgd * e * sinf / Math.sqrt(dparam);

    /* Perturbed heliocentric motion of the EMB */
    let d1pdro = 1 + pertr;
    let drd = d1pdro * (psid + dpsi * pertrd);
    let drld = d1pdro * dpsi * (sla.dcsld + phid + pertld);
    let dtl = (dml + phi + pertl) % sla.d2pi;
    let dsinls = Math.sin(dtl);
    let dcosls = Math.cos(dtl);
    let dxhd = drd * dcosls - drld * dsinls;
    let dyhd = drd * dsinls + drld * dcosls;

    /* Influence of eccentricity, evection and variation on the
     * geocentric motion of the Moon */
    pertl = 0;
    pertld = 0;
    let pertp = 0;
    let pertpd = 0;
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
    let tl = forbel[1] + pertl;
    let sinlm = Math.sin(tl);
    let coslm = Math.cos(tl);
    let sigma = sla.cckm / (1 + pertp);
    a = sigma * (sla.ccmld + pertld);
    let b = sigma * pertpd;
    dxhd += a * sinlm + b * coslm;
    dyhd += -a * coslm + b * sinlm;
    let dzhd = -sigma * sla.ccfdi * Math.cos(forbel[2]);

    /* Barycentric motion of the Earth */
    let dxbd = dxhd * sla.dc1mme;
    let dybd = dyhd * sla.dc1mme;
    let dzbd = dzhd * sla.dc1mme;
    let sinlp = [];
    let coslp = [];
    let plon;
    let pomg;
    let pecc;
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
    let dcosep = Math.cos(deps);
    let dsinep = Math.sin(deps);
    let dyahd = dcosep * dyhd - dsinep * dzhd;
    let dzahd = dsinep * dyhd + dcosep * dzhd;
    let dyabd = dcosep * dybd - dsinep * dzbd;
    let dzabd = dsinep * dybd + dcosep * dzbd;

    /* Heliocentric coordinates of the Earth */
    let dr = dpsi * d1pdro;
    let flatm = sla.ccim * Math.sin(forbel[2]);
    a = sigma * Math.cos(flatm);
    let dxh = dr * dcosls - a * coslm;
    let dyh = dr * dsinls - a * sinlm;
    let dzh = -sigma * Math.sin(flatm);

    /* Barycentric coordinates of the Earth */
    let dxb = dxh * sla.dc1mme;
    let dyb = dyh * sla.dc1mme;
    let dzb = dzh * sla.dc1mme;
    let flat;
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
    let dyah = dcosep * dyh - dsinep * dzh;
    let dzah = dsinep * dyh + dcosep * dzh;
    let dyab = dcosep * dyb - dsinep * dzb;
    let dzab = dsinep * dyb + dcosep * dzb;

    /* Copy result components into vectors, correcting for FK4 equinox */
    let depj = sla.epj(date);
    let deqcor = sla.ds2r * (0.035 + 0.00085 * (depj - sla.b1950));
    let dvh = [
        dxhd - deqcor * dyahd,
        dyahd + deqcor * dxhd,
        dzahd
    ];
    let dvb = [
        dxbd - deqcor * dyabd,
        dyabd + deqcor * dxbd,
        dzabd
    ];
    let dph = [
        dxh - deqcor * dyah,
        dyah + deqcor * dxh,
        dzah
    ];
    let dpb = [
        dxb - deqcor * dyab,
        dyab + deqcor * dxb,
        dzab
    ];

    /* Was precession to another equinox requested? */
    if (ideq !== 0) {
        /* Yes: compute precession matrix from MJD DATE to Julian epoch DEQX */
        let dprema = sla.prec(depj, deqx);

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
        "dvb": dvb,
        "dpb": dpb,
        "dvh": dvh,
        "dph": dph
    };
};

/**
 * @summary **Normalize Vector**
 * @param {Array} v - vector
 * @returns {Object} uv - unit vector in direction of V
 *                   vm - modulus of V
 * @description Normalize a 3-vector, also giving the modulus.
 * - If the modulus of V is zero, UV is set to zero as well.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss71.html}
 */
sla.dvn = function (v) {
    "use strict";
    let w1 = 0;
    let w2;
    for (let i = 0; i < 3; i += 1) {
        w2 = v[i];
        w1 += w2 * w2;
    }
    w1 = Math.sqrt(w1);

    /* Normalize the vector */
    if (w1 <= 0) {
        w1 = 1;
    }
    return {
        "uv": v.map(function (x) {
            return x / w1;
        }),
        "vm": w1
    };
};

/**
 * @summary **Mean to Apparent Parameters**
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
 * @description Compute star-independent parameters in preparation for
 *              conversions between mean place and geocentric apparent place.
 *              The parameters produced by this routine are required in the
 *              parallax, light deflection, aberration, and precession-nutation
 *              parts of the mean/apparent transformations. The reference
 *              frames and time scales used are post IAU 1976.
 * 1. For DATE, the distinction between the required TDB and TT is always
 *    negligible. Moreover, for all but the most critical applications UTC is
 *    adequate.
 * 2. The vectors AMPRMS(2-4) and AMPRMS(5-7) are (in essence) referred to the
 *    mean equinox and equator of epoch EQ. For EQ=2000D0, they are referred to
 *    the ICRS.
 * 3. The parameters produced by this routine are used by {@link sla.mapqk},
 *    {@link sla.mapqkz} and {@link sla.ampqk}.
 * 4. The accuracy, starting from ICRS star data, is limited to about 1 mas by
 *    the precession-nutation model used, SF2001. A different
 *    precession-nutation model can be introduced by first calling the present
 *    routine and then replacing the precession-nutation matrix in
 *    AMPRMS(13-21) directly.
 * 5. A further limit to the accuracy of routines using the parameter array
 *    AMPRMS is imposed by the routine {@link sla.evp}, used here to compute
 *    the Earth position and velocity by the methods of Stumpff. The maximum
 *    error in the resulting aberration corrections is about 0.3
 *    milliarcsecond.
 * ----------
 * References:
 * 1. 1984 *Astronomical Almanac*, pp B39-B41.
 * 2. Lederle & Schwan, 1984. *Astr.Astrophys.* 134, 1-6.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss116.html}
 */
sla.mappa = function (eq, date) {
    "use strict";
    const amprms = [];

    /* Time interval for proper motion correction */
    amprms[0] = sla.epj(date) - eq;

    /* Get Earth barycentric and heliocentric position and velocity */
    let ret = sla.evp(date, eq);
    const ebd = ret.dvb;
    amprms[1] = ret.dpb[0];
    amprms[2] = ret.dpb[1];
    amprms[3] = ret.dpb[2];
    const eh = ret.dph;

    /* Heliocentric direction of earth (normalized) and modulus */
    ret = sla.dvn(eh);
    amprms[4] = ret.uv[0];
    amprms[5] = ret.uv[1];
    amprms[6] = ret.uv[2];
    const e = ret.vm;

    /* Light deflection parameter */
    amprms[7] = sla.gr2 / e;

    /* Aberration parameters */
    for (let i = 0; i < 3; i += 1) {
        amprms[i + 8] = ebd[i] * sla.tau;
    }
    ret = sla.dvn(amprms.slice(8, 11));
    amprms[11] = Math.sqrt(1 - ret.vm * ret.vm);

    /* Precession/nutation matrix */
    const p13 = sla.prenut(eq, date);
    return amprms.concat(p13[0], p13[1], p13[2]);
};

/**
 * @summary **Mean to Apparent**
 * @param {Number} rm, dm - mean [α,δ] (radians)
 * @param {Number} pr - proper motions: [α,δ] changes per Julian year
 * @param {Number} pd - parallax (arcsec)
 * @param {Number} rv - radial velocity (km/s, +ve if receding)
 * @param {Number} eq - epoch and equinox of star data (Julian)
 * @param {Number} date - TDB for apparent place (JD-2400000.5)
 * @returns {Object} ra,da - apparent [α,δ] (radians)
 * @description Transform star [α,δ] from mean place to geocentric apparent.
 *              The reference frames and time scales used are post IAU 1976.
 * 1. EQ is the Julian epoch specifying both the reference frame and the epoch
 *    of the position – usually 2000. For positions where the epoch and equinox
 *    are different, use the routine {@link sla.pm} to apply proper motion
 *    corrections before using this routine.
 * 2. The distinction between the required TDB and TT is always negligible.
 *    Moreover, for all but the most critical applications UTC is adequate.
 * 3. The α proper motions are α̇  rather than α̇ cosδ, and are per year rather
 *    than per century.
 * 4. This routine may be wasteful for some applications because it recomputes
 *    the Earth position/velocity and the precession-nutation matrix each time,
 *    and because it allows for parallax and proper motion. Where multiple
 *    transformations are to be carried out for one epoch, a faster method is
 *    to call the {@link sla.mappa} routine once and then either the
 *    {@link sla.mapqk} routine (which includes parallax and proper motion) or
 *    {@link sla.mapqkz} (which assumes zero parallax and FK5 proper motion).
 * 5. The accuracy, starting from ICRS star data, is limited to about 1 mas by
 *    the precession-nutation model used, SF2001. A different
 *    precession-nutation model can be introduced by using {@link sla.mappa}
 *    and {@link sla.mapqk} (see the previous note) and replacing the
 *    precession-nutation matrix into the parameter array directly.
 * 6. The accuracy is further limited by the routine {@link sla.evp}, called by
 *    {@link sla.mappa}, which computes the Earth position and velocity using
 *    the methods of Stumpff. The maximum error is about 0.3 milliarcsecond.
 * ----------
 * References:
 * 1. 1984 *Astronomical Almanac*, pp B39-B41.
 * 2. Lederle & Schwan, 1984. *Astr.Astrophys.*, 134, 1-6.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss115.html}
 */
sla.map = function (rm, dm, pr, pd, px, rv, eq, date) {
    "use strict";
    /* Star-independent parameters */
    const amprms = sla.mappa(eq, date);
    /* Mean to apparent */
    return sla.mapqk(rm, dm, pr, pd, px, rv, amprms);
};

/**
 * @summary **Polar Motion**
 * @param {Number} elongm - mean longitude of the site (radians, east +ve)
 * @param {Number} phim - mean geodetic latitude of the site (radians)
 * @param {Number} xp - polar motion x-coordinate (radians)
 * @param {Number} yp - polar motion y-coordinate (radians)
 * @returns {Object} elong - true longitude of the site (radians, east +ve)
 *                   phi - true geodetic latitude of the site (radians)
 *                   daz - azimuth correction (terrestrial-celestial, radians)
 * @description Polar motion: correct site longitude and latitude for polar
 *              motion and calculate azimuth difference between celestial and
 *              terrestrial poles.
 * 1. “Mean” longitude and latitude are the (fixed) values for the site’s
 *    location with respect to the IERS terrestrial reference frame; the
 *    latitude is geodetic. TAKE CARE WITH THE LONGITUDE SIGN CONVENTION. The
 *    longitudes used by the present routine are east-positive, in accordance
 *    with geographical convention (and right-handed). In particular, note that
 *    the longitudes returned by the {@link sla.obs} routine are west-positive,
 *    following astronomical usage, and must be reversed in sign before use in
 *    the present routine.
 * 2. XP and YP are the (changing) coordinates of the Celestial Ephemeris Pole
 *    with respect to the IERS Reference Pole. XP is positive along the
 *    meridian at longitude 0∘, and YP is positive along the meridian at
 *    longitude 270∘ (i.e. 90∘ west). Values for XP,YP can be obtained from
 *    IERS circulars and equivalent publications; the maximum amplitude
 *    observed so far is about ′′03.
 * 3. “True” longitude and latitude are the (moving) values for the site’s
 *    location with respect to the celestial ephemeris pole and the meridian
 *    which corresponds to the Greenwich apparent sidereal time. The true
 *    longitude and latitude link the terrestrial coordinates with the standard
 *    celestial models (for precession, nutation, sidereal time etc).
 * 4. The azimuths produced by {@link sla.aop} and {@link sla.aopqk} are with
 *    respect to due north as defined by the Celestial Ephemeris Pole, and can
 *    therefore be called “celestial azimuths”. However, a telescope fixed to
 *    the Earth measures azimuth essentially with respect to due north as
 *    defined by the IERS Reference Pole, and can therefore be called
 *    “terrestrial azimuth”. Uncorrected, this would manifest itself as a
 *    changing “azimuth zero-point error”. The value DAZ is the correction to
 *    be added to a celestial azimuth to produce a terrestrial azimuth.
 * 5. The present routine is rigorous. For most practical purposes, the
 *    following simplified formulae provide an adequate approximation:
 *        ELONG = ELONGM+XP*COS(ELONGM)-YP*SIN(ELONGM)
 *        PHI   = PHIM+(XP*SIN(ELONGM)+YP*COS(ELONGM))*TAN(PHIM)
 *        DAZ   = -SQRT(XP*XP+YP*YP)*COS(ELONGM-ATAN2(XP,YP))/COS(PHIM)
 *    An alternative formulation for DAZ is:
 *        X     = COS(ELONGM)*COS(PHIM)
 *        Y     = SIN(ELONGM)*COS(PHIM)
 *        DAZ   = ATAN2(-X*YP-Y*XP,X*X+Y*Y)
 * ----------
 * References:
 * - Seidelmann, P.K. (ed), 1992. *Explanatory Supplement to the Astronomical
 *   Almanac*, ISBN 0-935702-68-7, sections 3.27, 4.25, 4.52.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss141.html}
 */
sla.polmo = function (elongm, phim, xp, yp) {
    "use strict";
    /* Site mean longitude and mean geodetic latitude as a Cartesian vector */
    let sel = Math.sin(elongm);
    let cel = Math.cos(elongm);
    let sph = Math.sin(phim);
    let cph = Math.cos(phim);

    let xm = cel * cph;
    let ym = sel * cph;
    let zm = sph;

    /* Rotate site vector by polar motion, Y-component then X-component */
    let sxp = Math.sin(xp);
    let cxp = Math.cos(xp);
    let syp = Math.sin(yp);
    let cyp = Math.cos(yp);

    let zw = -ym * syp + zm * cyp;

    let xt = xm * cxp - zw * sxp;
    let yt = ym * cyp + zm * syp;
    let zt = xm * sxp + zw * cxp;

    /* Rotate also the geocentric direction of the terrestrial pole (0,0,1) */
    let xnm = -sxp * cyp;
    let ynm = syp;
    let znm = cxp * cyp;

    cph = Math.sqrt(xt * xt + yt * yt);
    if (cph === 0) {
        xt = 1;
    }
    sel = yt / cph;
    cel = xt / cph;

    /* Return true longitude and true geodetic latitude of site */
    let elong;
    if (xt !== 0 || yt !== 0) {
        elong = Math.atan2(yt, xt);
    } else {
        elong = 0;
    }
    let phi = Math.atan2(zt, cph);

    /* Return current azimuth of terrestrial pole seen from site position */
    let xnt = (xnm * cel + ynm * sel) * zt - znm * cph;
    let ynt = -xnm * sel + ynm * cel;
    let daz;
    if (xnt !== 0 || ynt !== 0) {
        daz = Math.atan2(-ynt, -xnt);
    } else {
        daz = 0;
    }
    return {
        "elong": elong,
        "phi": phi,
        "daz": daz
    };
};

/**
 * @summary **Spherical to Cartesian**
 * @param {Number} a,b - spherical coordinates in radians: [α,δ] etc.
 * @returns {Array} [x,y,z] unit vector
 * @description Spherical coordinates to Cartesian coordinates.
 * - The spherical coordinates are longitude (+ve anticlockwise looking from
 *   the +ve latitude pole) and latitude. The Cartesian coordinates are right
 *   handed, with the x-axis at zero longitude and latitude, and the z-axis at
 *   the +ve latitude pole.
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
 * @summary **Scalar Product**
 * @param {Array(3)} va - first vector
 * @param {Array(3)} vb - second vector
 * @returns {Array(3)} scalar product VA.VB
 * @description Scalar product of two 3-vectors.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss70.html}
 */
sla.dvdv = function (va, vb) {
    "use strict";
    return va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
};

/**
 * @summary **Quick Mean-Appt, no PM etc.**
 * @param {Number} rm, dm - mean [α,δ] (radians)
 * @param {Array} amprms - star-independent mean-to-apparent parameters:
 *                [0] time interval for proper motion (Julian years)
 *                [1-3] barycentric position of the Earth (AU)
 *                [4-6] heliocentric direction of the Earth (unit vector)
 *                [7] (gravitational radius of Sun)x2/(Sun-Earth distance)
 *                [8-10] v: barycentric Earth velocity in units of c
 *                [11] \sqrt{1-|v|^2}
 *                [12-20] precession-nutation 3x3 matrix
 * @returns {Object} ra, da - apparent [α,δ] (radians)
 * @description Quick mean to apparent place: transform a star [α,δ] from
 *              mean place to geocentric apparent place, given the
 *              star-independent parameters, and assuming zero parallax and FK5
 *              proper motion. The reference frames and time scales used are
 *              post IAU 1976.
 * 1. Use of this routine is appropriate when efficiency is important and where
 *    many star positions, all with parallax and proper motion either zero or
 *    already allowed for, and all referred to the same equator and equinox,
 *    are to be transformed for one epoch. The star-independent parameters can
 *    be obtained by calling the {@link sla.mappa} routine.
 * 2. The corresponding routine for the case of non-zero parallax and FK5
 *    proper motion is {@link sla.mapqk}.
 * 3. The vectors AMPRMS(2-4) and AMPRMS(5-7) are (in essence) referred to the
 *    mean equinox and equator of epoch EQ. For EQ=2000D0, they are referred to
 *    the ICRS.
 * 4. Strictly speaking, the routine is not valid for solar-system sources,
 *    though the error will usually be extremely small. However, to prevent
 *    gross errors in the case where the position of the Sun is specified, the
 *    gravitational deflection term is restrained within about 920′′ of the
 *    centre of the Sun’s disc. The term has a maximum value of about ′′185 at
 *    this radius, and decreases to zero as the centre of the disc is
 *    approached.
 * ----------
 * References:
 * 1. 1984 *Astronomical Almanac*, pp B39-B41.
 * 2. Lederle & Schwan, 1984. *Astr.Astrophys.* 134, 1-6.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss118.html}
 */
sla.mapqkz = function (rm, dm, amprms) {
    "use strict";
    /* Unpack scalar and vector parameters */
    const gr2e = amprms[7];
    const ab1 = amprms[11];
    const ehn = [];
    const abv = [];
    for (let i = 0; i < 3; i += 1) {
        ehn[i] = amprms[i + 4];
        abv[i] = amprms[i + 8];
    }

    /* Spherical to x,y,z */
    const p = sla.dcs2c(rm, dm);

    /* Light deflection */
    const p1 = [];
    const p2 = [];
    const pde = sla.dvdv(p, ehn);
    const pdep1 = pde + 1;
    let w = gr2e / Math.max(pdep1, 1e-5);
    for (let i = 0; i < 3; i += 1) {
        p1[i] = p[i] + w * (ehn[i] - pde * p[i]);
    }

    /* Aberration */
    const p1dv = sla.dvdv(p1, abv);
    const p1dvp1 = p1dv + 1;
    w = 1 + p1dv / (ab1 + 1);
    for (let i = 0; i < 3; i += 1) {
        p2[i] = (ab1 * p1[i] + w * abv[i]) / p1dvp1;
    }

    /* Precession and nutation */
    const p3 = sla.dmxv([
        amprms.slice(12, 15),
        amprms.slice(15, 18),
        amprms.slice(18, 21)
    ], p2);

    /* Geocentric apparent RA,Dec */
    const ret = sla.dcc2s(p3);
    return {
        "ra": sla.dranrm(ret.a),
        "da": ret.b
    };
};

/**
 * @summary **Quick Mean to Apparent**
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
 * @returns {Object} ra, da - apparent [α,δ] (radians)
 * @description Quick mean to apparent place: transform a star RA,Dec from
 *              mean place to geocentric apparent place, given the
 *              star-independent parameters.
 * 1. Use of this routine is appropriate when efficiency is important and where
 *    many star positions, all referred to the same equator and equinox, are to
 *    be transformed for one epoch. The star-independent parameters can be
 *    obtained by calling the {@link sla.mappa} routine.
 * 2. If the parallax and proper motions are zero the {@link sla.mapqkz}
 *    routine can be used instead.
 * 3. The vectors AMPRMS(2-4) and AMPRMS(5-7) are (in essence) referred to the
 *    mean equinox and equator of epoch EQ. For EQ=2000D0, they are referred to
 *    the ICRS.
 * 4. Strictly speaking, the routine is not valid for solar-system sources,
 *    though the error will usually be extremely small. However, to prevent
 *    gross errors in the case where the position of the Sun is specified, the
 *    gravitational deflection term is restrained within about 920′′ of the
 *    centre of the Sun’s disc. The term has a maximum value of about ′′185 at
 *    this radius, and decreases to zero as the centre of the disc is
 *    approached.
 * ----------
 * References:
 * 1. 1984 *Astronomical Almanac*, pp B39-B41.
 * 2. Lederle & Schwan, 1984. *Astr.Astrophys.* 134, 1-6.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss117.html}
 */
sla.mapqk = function (rm, dm, pr, pd, px, rv, amprms) {
    "use strict";
    /* Unpack scalar and vector parameters */
    let pmt = amprms[0];
    let gr2e = amprms[7];
    let ab1 = amprms[11];
    let eb = [];
    let ehn = [];
    let abv = [];
    let i;
    for (i = 0; i < 3; i += 1) {
        eb[i] = amprms[i + 1];
        ehn[i] = amprms[i + 4];
        abv[i] = amprms[i + 8];
    }

    /* Spherical to x,y,z */
    let q = sla.dcs2c(rm, dm);

    /* Space motion (radians per year) */
    let pxr = px * sla.das2r;
    let w = sla.vf * rv * pxr;
    let em = [
        -pr * q[1] - pd * Math.cos(rm) * Math.sin(dm) + w * q[0],
        pr * q[0] - pd * Math.sin(rm) * Math.sin(dm) + w * q[1],
        pd * Math.cos(dm) + w * q[2]
    ];

    /* Geocentric direction of star (normalized) */
    let p = [];
    let p1 = [];
    let p2 = [];
    for (i = 0; i < 3; i += 1) {
        p[i] = q[i] + pmt * em[i] - pxr * eb[i];
    }
    let ret = sla.dvn(p);
    let pn = ret.uv;
    w = ret.vm;

    /* Light deflection (restrained within the Sun's disc) */
    let pde = sla.dvdv(pn, ehn);
    let pdep1 = pde + 1;
    w = gr2e / Math.max(pdep1, 1e-5);
    for (i = 0; i < 3; i += 1) {
        p1[i] = pn[i] + w * (ehn[i] - pde * pn[i]);
    }

    /* Aberration (normalization omitted) */
    let p1dv = sla.dvdv(p1, abv);
    w = 1 + p1dv / (ab1 + 1);
    for (i = 0; i < 3; i += 1) {
        p2[i] = ab1 * p1[i] + w * abv[i];
    }

    /* Precession and nutation */
    let p3 = sla.dmxv([
        amprms.slice(12, 15),
        amprms.slice(15, 18),
        amprms.slice(18, 21)
    ], p2);

    /* Geocentric apparent RA,Dec */
    ret = sla.dcc2s(p3);
    return {
        "ra": sla.dranrm(ret.a),
        "da": ret.b
    };
};

/**
 * @summary **Vector product**
 * @param {Array} va - first vector
 * @param {Array} vb - second vector
 * @returns {Array} vector product VA x VB
 * @description Vector product of two 3-vectors.
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
 * @summary **Angle Between 2 Vectors**
 * @param {Array} v1 - first vector
 * @param {Array} v2 - second vector
 * @returns {Array} angle between V1 and V2 in radians
 * @description Angle between two vectors.
 * 1. There is no requirement for either vector to be of unit length.
 * 2. If either vector is null, zero is returned.
 * 3. The result is always positive.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss60.html}
 */
sla.dsepv = function (v1, v2) {
    "use strict";
    /* Modulus of cross product = sine multiplied by the two moduli. */
    const v1xv2 = sla.dvxv(v1, v2);
    const ret = sla.dvn(v1xv2);

    /* Dot product = cosine multiplied by the two moduli. */
    const c = sla.dvdv(v1, v2);

    /* Angle between the vectors. */
    if (ret.vm !== 0 || c !== 0) {
        return Math.atan2(ret.vm, c);
    } else {
        return 0;
    }
};

/**
 * @summary **Angle Between 2 Points on Sphere**
 * @param {Number} a1, b1 - spherical coordinates of one point (radians)
 * @param {Number} a2, b2 - spherical coordinates of the other point (radians)
 * @returns {Number} angle between [A1,B1] and [A2,B2] in radians
 * @description Angle between two points on a sphere.
 * 1. The spherical coordinates are right ascension and declination, longitude
 *    and latitude, etc., in radians.
 * 2. The result is always positive.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss59.html}
 */
sla.dsep = function (a1, b1, a2, b2) {
    "use strict";
    /* Convert coordinates from spherical to Cartesian. */
    const v1 = sla.dcs2c(a1, b1);
    const v2 = sla.dcs2c(a2, b2);

    /* Angle between the vectors. */
    return sla.dsepv(v1, v2);
};

/**
 * @summary **Form α,δ -> λ,β Matrix**
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @returns {Array} 3x3 rotation matrix
 * @description Form the equatorial to ecliptic rotation matrix (IAU 1980
 *              theory).
 * 1. RMAT is matrix **M** in the expression **v**_ecl = **M**⋅**v**_equ.
 * 2. The equator, equinox and ecliptic are mean of date.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss76.html}
 */
sla.ecmat = function (date) {
    "use strict";
    /* Interval between basic epoch J2000.0 and current epoch (JC) */
    const t = (date - 51544.5) / 36525;

    /* Mean obliquity */
    const eps0 = sla.das2r * (84381.448 + (-46.8150 + (-0.00059 + 0.001813 *
            t) * t) * t);

    /* Matrix */
    return sla.deuler("X", eps0, 0, 0);
};

/**
 * @summary **J2000 RA, Dec to Ecliptic**
 * @param {Number} dr, dd - J2000.0 mean [α,δ] (radians)
 * @param {Number} date - TDB (formerly ET) as Modified Julian Date
 *                        (JD-2400000.5)
 * @return {Object} dl, db - ecliptic longitude and latitude (mean of date,
 *                           IAU 1980 theory, radians)
 * @description Transformation from J2000.0 equatorial coordinates to ecliptic
 *              longitude and latitude.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss86.html}
 */
sla.eqecl = function (dr, dd, date) {
    "use strict";
    /* Spherical to Cartesian */
    let v1 = sla.dcs2c(dr, dd);

    /* Mean J2000 to mean of date */
    let rmat = sla.prec(2000, sla.epj(date));
    const v2 = sla.dmxv(rmat, v1);

    /* Equatorial to ecliptic */
    rmat = sla.ecmat(date);
    v1 = sla.dmxv(rmat, v2);

    /* Cartesian to spherical */
    const ret = sla.dcc2s(v1);

    /* Express in conventional ranges */
    return {
        "dl": sla.dranrm(ret.a),
        "db": sla.drange(ret.b)
    };
};

/**
 * @summary **h,δ to Zenith Distance**
 * @param {Number} ha - Hour Angle in radians
 * @param {Number} dec - Declination in radians
 * @param {Number} phi - Observatory latitude in radians
 * @return {Number} Zenith distance (radians, 0−π)
 * @description Hour angle and declination to zenith distance.
 * 1. The latitude must be geodetic. In critical applications, corrections for
 *    polar motion should be applied (see @link{sla.polmo}).
 * 2. In some applications it will be important to specify the correct type
 *    of hour angle and declination in order to produce the required type of
 *    azimuth and elevation. In particular, it may be important to distinguish
 *    between elevation as affected by refraction, which would require the
 *    *observed* [h,δ], and the elevation *in vacuo*, which would require the
 *    *topocentric* [h,δ]. If the effects of diurnal aberration can be
 *    neglected, the *apparent* [h,δ] may be used instead of the topocentric
 *    [h,δ].
 * 3. No range checking of arguments is done.
 * 4. In applications which involve many zenith distance calculations, rather
 *    than calling the present routine it will be more efficient to use inline
 *    code, having previously computed fixed terms such as sine and cosine of
 *    latitude, and perhaps sine and cosine of declination.
 * @see {@link http://star-www.rl.ac.uk/docs/sun67.htx/sun67ss188.html}
 */
sla.zd = function (ha, dec, phi) {
    "use strict";
    const sh = Math.sin(ha);
    const ch = Math.cos(ha);
    const sd = Math.sin(dec);
    const cd = Math.cos(dec);
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);
    const x = ch * cd * sp - sd * cp;
    const y = sh * cd;
    const z = ch * cd * cp + sd * sp;
    return Math.atan2(Math.sqrt(x * x + y * y), z);
};

/**
 * Unit testing
 */

/**
 * @summary Assert that two objects are equal.
 * @throws {Error} If *val* is not equal to the reference value *ref*.
 * @param {Object} val - Value to check.
 * @param {Object} ref - Reference value.
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

/**
 * @summary Assert that two numbers are equal, to a given precision.
 * @param {Number} val - Value to check.
 * @param {Number} ref - Reference value.
 * @param {Number} tol - Desired precision (relative difference between *val*
 *                       and *ref* must be smaller than 10^*tol*).
 * @throws {TypeError} If the value to check is NaN.
 * @throws {Error} If *val* is not equal to the reference value *ref*, within
 *                 the desired precision.
 */
function assertAlmostEqual(val, ref, tol) {
    "use strict";
    if (Number.isNaN(val)) {
        throw new TypeError("Assertion failed. NaN value passed.");
    }
    if (Math.abs(val - ref) / Math.abs(ref) > Math.pow(10, -tol)) {
        throw new Error("Assertion failed. Desired precision not reached.");
    }
}

/**
 * @summary Perform all unit tests (wrapped function that does the work).
 * @description The values are taken from the original unit tests in SLALIB
 *              (sla_test.f). The desired precision is typically the same,
 *              although for some tests it can be lower by a few orders of
 *              magnitude.
 */
sla.performUnitTestsWrapped = function () {
    "use strict";
    let ret;

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
    let dav1 = [-0.123, 0.0987, 0.0654];
    let drm1 = sla.dav2m(dav1);
    let drm2 = sla.deuler("YZY", 2.345, -0.333, 2.222);
    let drm = sla.dmxm(drm2, drm1);
    let dv1a = sla.dcs2c(3.0123, -0.999);
    let dv2a = sla.dmxv(drm1, dv1a);
    let dv3 = sla.dmxv(drm2, dv2a);
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
    let dav = [-0.123, 0.0987, 0.0654];
    let drm1a = sla.dav2m(dav);
    let drm2a = sla.deuler("YZY", 2.345, -0.333, 2.222);
    let dv1 = sla.dcs2c(3.0123, -0.999);
    let dv2 = sla.dmxv(drm1a, dv1);
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
    let v1 = sla.dcc2s([1, 0.1, 0.2]);
    let v2 = sla.dcc2s([-3, 1e-3, 0.2]);
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

    /* sla_FK45Z */
    ret = sla.fk45z(1.234, -0.123, 1984);
    assertAlmostEqual(ret.r2000, 1.244616510731691, 12);
    assertAlmostEqual(ret.d2000, -0.1214185839586555, 12);

    /* sla_FK425 */
    ret = sla.fk425(1.234, -0.123, -1e-5, 2e-6, 0.5, 20);
    assertAlmostEqual(ret.r2000, 1.244117554618727, 12);
    assertAlmostEqual(ret.d2000, -0.1213164254458709, 12);
    assertAlmostEqual(ret.dr2000, -9.964265838268711e-6, 17);
    assertAlmostEqual(ret.dd2000, 2.038065265773541e-6, 15);
    assertAlmostEqual(ret.p2000, 0.4997443812415410, 12);
    assertAlmostEqual(ret.v2000, 20.010460915421010, 11);

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

/**
 * @summary Perform all unit tests.
 * @description This is merely a wrapper for {@link sla._performUnitTests},
 *              which encloses the function call in a try..catch construct
 *              and informs the user if anything goes wrong.
 */
sla.performUnitTests = function () {
    "use strict";
    try {
        helper.LogEntry("Performing slalib unit tests...");
        sla.performUnitTestsWrapped();
        helper.LogSuccess("slalib unit tests completed - everything OK");
    } catch (error) {
        helper.LogError("slalib unit tests failed");
        helper.LogError(error);
        helper.LogError(error.stack);
    }
};
