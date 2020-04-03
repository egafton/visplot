/**
 * This file contains coefficient matrices used by some SLALIB
 * subroutines.
 *
 * Copyright (C) 2016-2018 Emanuel Gafton, NOT/ING.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See COPYING.md.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program (see LICENSE.md); if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place, Suite 330,
 * Boston, MA 02111-1307 USA.
 */

/**
 * @namespace
 */
function sla() {
    "use strict";
}

/**
 * Nutation model. Coefficients taken from slalib/nutc.f
 */

/* Coefficients of fundamental angles */
sla.na = [
    0, 0, 0, 0, -1, 0, 0, 0, 0,
    0, 0, 2, -2, 2, 0, 0, 0, 0,
    0, 0, 2, 0, 2, 0, 0, 0, 0,
    0, 0, 0, 0, -2, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 2, -2, 2, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 2, 0, 1, 0, 0, 0, 0,
    1, 0, 2, 0, 2, 0, 0, 0, 0,
    0, -1, 2, -2, 2, 0, 0, 0, 0,
    0, 0, 2, -2, 1, 0, 0, 0, 0,
    -1, 0, 2, 0, 2, 0, 0, 0, 0,
    -1, 0, 0, 2, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 1, 0, 0, 0, 0,
    1, 0, 0, 0, -1, 0, 0, 0, 0,
    -1, 0, 2, 2, 2, 0, 0, 0, 0,
    1, 0, 2, 0, 1, 0, 0, 0, 0,
    -2, 0, 2, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 2, 0, 0, 0, 0, 0,
    0, 0, 2, 2, 2, 0, 0, 0, 0,
    2, 0, 0, -2, 0, 0, 0, 0, 0,
    2, 0, 2, 0, 2, 0, 0, 0, 0,
    1, 0, 2, -2, 2, 0, 0, 0, 0,
    -1, 0, 2, 0, 1, 0, 0, 0, 0,
    2, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 2, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 1, 0, 0, 0, 0,
    -1, 0, 0, 2, 1, 0, 0, 0, 0,
    0, 2, 2, -2, 2, 0, 0, 0, 0,
    0, 0, 2, -2, 0, 0, 0, 0, 0,
    -1, 0, 0, 2, -1, 0, 0, 0, 0,
    0, 1, 0, 0, -1, 0, 0, 0, 0,
    0, 2, 0, 0, 0, 0, 0, 0, 0,
    -1, 0, 2, 2, 1, 0, 0, 0, 0,
    1, 0, 2, 2, 2, 0, 0, 0, 0,
    0, 1, 2, 0, 2, 0, 0, 0, 0,
    -2, 0, 2, 0, 0, 0, 0, 0, 0,
    0, 0, 2, 2, 1, 0, 0, 0, 0,
    0, -1, 2, 0, 2, 0, 0, 0, 0,
    0, 0, 0, 2, 1, 0, 0, 0, 0,
    1, 0, 2, -2, 1, 0, 0, 0, 0,
    2, 0, 0, -2, -1, 0, 0, 0, 0,
    2, 0, 2, -2, 2, 0, 0, 0, 0,
    2, 0, 2, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 2, -1, 0, 0, 0, 0,
    0, -1, 2, -2, 1, 0, 0, 0, 0,
    -1, -1, 0, 2, 0, 0, 0, 0, 0,
    2, 0, 0, -2, 1, 0, 0, 0, 0,
    1, 0, 0, 2, 0, 0, 0, 0, 0,
    0, 1, 2, -2, 1, 0, 0, 0, 0,
    1, -1, 0, 0, 0, 0, 0, 0, 0,
    -2, 0, 2, 0, 2, 0, 0, 0, 0,
    0, -1, 0, 2, 0, 0, 0, 0, 0,
    3, 0, 2, 0, 2, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 0, 0,
    1, -1, 2, 0, 2, 0, 0, 0, 0,
    1, 0, 0, -1, 0, 0, 0, 0, 0,
    -1, -1, 2, 2, 2, 0, 0, 0, 0,
    -1, 0, 2, 0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, -1, 0, 0, 0, 0,
    0, -1, 2, 2, 2, 0, 0, 0, 0,
    1, 1, 2, 0, 2, 0, 0, 0, 0,
    2, 0, 0, 0, 1, 0, 0, 0, 0,
    1, 1, 0, 0, 0, 0, 0, 0, 0,
    1, 0, -2, 2, -1, 0, 0, 0, 0,
    1, 0, 2, 0, 0, 0, 0, 0, 0,
    -1, 1, 0, 1, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 2, 0, 0, 0, 0,
    -1, 0, 1, 0, 1, 0, 0, 0, 0,
    0, 0, 2, 1, 2, 0, 0, 0, 0,
    -1, 1, 0, 1, 1, 0, 0, 0, 0,
    -1, 0, 2, 4, 2, 0, 0, 0, 0,
    0, -2, 2, -2, 1, 0, 0, 0, 0,
    1, 0, 2, 2, 1, 0, 0, 0, 0,
    1, 0, 0, 0, -2, 0, 0, 0, 0,
    -2, 0, 2, 2, 2, 0, 0, 0, 0,
    1, 1, 2, -2, 2, 0, 0, 0, 0,
    -2, 0, 2, 4, 2, 0, 0, 0, 0,
    -1, 0, 4, 0, 2, 0, 0, 0, 0,
    2, 0, 2, -2, 1, 0, 0, 0, 0,
    1, 0, 0, -1, -1, 0, 0, 0, 0,
    2, 0, 2, 2, 2, 0, 0, 0, 0,
    1, 0, 0, 2, 1, 0, 0, 0, 0,
    3, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 2, -2, -1, 0, 0, 0, 0,
    3, 0, 2, -2, 2, 0, 0, 0, 0,
    0, 0, 4, -2, 2, 0, 0, 0, 0,
    -1, 0, 0, 4, 0, 0, 0, 0, 0,
    0, 1, 2, 0, 1, 0, 0, 0, 0,
    0, 0, 2, -2, 3, 0, 0, 0, 0,
    -2, 0, 0, 4, 0, 0, 0, 0, 0,
    -1, -1, 0, 2, 1, 0, 0, 0, 0,
    -2, 0, 2, 0, -1, 0, 0, 0, 0,
    0, 0, 2, 0, -1, 0, 0, 0, 0,
    0, -1, 2, 0, 1, 0, 0, 0, 0,
    0, 1, 0, 0, 2, 0, 0, 0, 0,
    0, 0, 2, -1, 2, 0, 0, 0, 0,
    2, 1, 0, -2, 0, 0, 0, 0, 0,
    0, 0, 2, 4, 2, 0, 0, 0, 0,
    -1, -1, 0, 2, -1, 0, 0, 0, 0,
    -1, 1, 0, 2, 0, 0, 0, 0, 0,
    1, -1, 0, 0, 1, 0, 0, 0, 0,
    0, -1, 2, -2, 0, 0, 0, 0, 0,
    0, 1, 0, 0, -2, 0, 0, 0, 0,
    1, -1, 2, 2, 2, 0, 0, 0, 0,
    1, 0, 0, 2, -1, 0, 0, 0, 0,
    -1, 1, 2, 2, 2, 0, 0, 0, 0,
    3, 0, 2, 0, 1, 0, 0, 0, 0,
    0, 1, 2, 2, 2, 0, 0, 0, 0,
    1, 0, 2, -2, 0, 0, 0, 0, 0,
    -1, 0, -2, 4, -1, 0, 0, 0, 0,
    -1, -1, 2, 2, 1, 0, 0, 0, 0,
    0, -1, 2, 2, 1, 0, 0, 0, 0,
    2, -1, 2, 0, 2, 0, 0, 0, 0,
    0, 0, 0, 2, 2, 0, 0, 0, 0,
    1, -1, 2, 0, 1, 0, 0, 0, 0,
    -1, 1, 2, 0, 2, 0, 0, 0, 0,
    0, 1, 0, 2, 0, 0, 0, 0, 0,
    0, 1, 2, -2, 0, 0, 0, 0, 0,
    0, 3, 2, -2, 2, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 0, 0, 0, 0,
    -1, 0, 2, 2, 0, 0, 0, 0, 0,
    2, 1, 2, 0, 2, 0, 0, 0, 0,
    1, 1, 0, 0, 1, 0, 0, 0, 0,
    2, 0, 0, 2, 0, 0, 0, 0, 0,
    1, 1, 2, 0, 1, 0, 0, 0, 0,
    -1, 0, 0, 2, 2, 0, 0, 0, 0,
    1, 0, -2, 2, 0, 0, 0, 0, 0,
    0, -1, 0, 2, -1, 0, 0, 0, 0,
    -1, 0, 1, 0, 2, 0, 0, 0, 0,
    0, 1, 0, 1, 0, 0, 0, 0, 0,
    1, 0, -2, 2, -2, 0, 0, 0, 0,
    0, 0, 0, 1, -1, 0, 0, 0, 0,
    1, -1, 0, 0, -1, 0, 0, 0, 0,
    0, 0, 0, 4, 0, 0, 0, 0, 0,
    1, -1, 0, 2, 0, 0, 0, 0, 0,
    1, 0, 2, 1, 2, 0, 0, 0, 0,
    1, 0, 2, -1, 2, 0, 0, 0, 0,
    -1, 0, 0, 2, -2, 0, 0, 0, 0,
    0, 0, 2, 1, 1, 0, 0, 0, 0,
    -1, 0, 2, 0, -1, 0, 0, 0, 0,
    -1, 0, 2, 4, 1, 0, 0, 0, 0,
    0, 0, 2, 2, 0, 0, 0, 0, 0,
    1, 1, 2, -2, 1, 0, 0, 0, 0,
    0, 0, 1, 0, 1, 0, 0, 0, 0,
    -1, 0, 2, -1, 1, 0, 0, 0, 0,
    -2, 0, 2, 2, 1, 0, 0, 0, 0,
    2, -1, 0, 0, 0, 0, 0, 0, 0,
    4, 0, 2, 0, 2, 0, 0, 0, 0,
    2, 1, 2, -2, 2, 0, 0, 0, 0,
    0, 1, 2, 1, 2, 0, 0, 0, 0,
    1, 0, 4, -2, 2, 0, 0, 0, 0,
    1, 1, 0, 0, -1, 0, 0, 0, 0,
    -2, 0, 2, 4, 1, 0, 0, 0, 0,
    2, 0, 2, 0, 0, 0, 0, 0, 0,
    -1, 0, 1, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 1, 0, 2, 1, 0, 0, 0, 0,
    -1, 0, 4, 0, 1, 0, 0, 0, 0,
    -1, 0, 0, 4, 1, 0, 0, 0, 0,
    2, 0, 2, 2, 1, 0, 0, 0, 0,
    2, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 5, -5, 5, -3, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 2, 0,
    0, 0, 1, -1, 1, 0, 0, -1, 0,
    0, 0, -1, 1, -1, 1, 0, 0, 0,
    0, 0, -1, 1, 0, 0, 2, 0, 0,
    0, 0, 3, -3, 3, 0, 0, -1, 0,
    0, 0, -8, 8, -7, 5, 0, 0, 0,
    0, 0, -1, 1, -1, 0, 2, 0, 0,
    0, 0, -2, 2, -2, 2, 0, 0, 0,
    0, 0, -6, 6, -6, 4, 0, 0, 0,
    0, 0, -2, 2, -2, 0, 8, -3, 0,
    0, 0, 6, -6, 6, 0, -8, 3, 0,
    0, 0, 4, -4, 4, -2, 0, 0, 0,
    0, 0, -3, 3, -3, 2, 0, 0, 0,
    0, 0, 4, -4, 3, 0, -8, 3, 0,
    0, 0, -4, 4, -5, 0, 8, -3, 0,
    0, 0, 0, 0, 0, 2, 0, 0, 0,
    0, 0, -4, 4, -4, 3, 0, 0, 0,
    0, 1, -1, 1, -1, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 1, -1, 1, 1, 0, 0, 0,
    0, 0, 2, -2, 2, 0, -2, 0, 0,
    0, -1, -7, 7, -7, 5, 0, 0, 0,
    -2, 0, 2, 0, 2, 0, 0, -2, 0,
    -2, 0, 2, 0, 1, 0, 0, -3, 0,
    0, 0, 2, -2, 2, 0, 0, -2, 0,
    0, 0, 1, -1, 1, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 2,
    0, 0, 0, 0, 0, 0, 0, 0, 1,
    2, 0, -2, 0, -2, 0, 0, 3, 0,
    0, 0, 1, -1, 1, 0, 0, -2, 0,
    0, 0, -7, 7, -7, 5, 0, 0, 0
];

/* Nutation series: longitude */
sla.psi = [
    3341.5, 17206241.8, 3.1, 17409.5,
    -1716.8, -1317185.3, 1.4, -156.8,
    285.7, -227667, 0.3, -23.5,
    -68.6, -207448, 0, -21.4,
    950.3, 147607.9, -2.3, -355,
    -66.7, -51689.1, 0.2, 122.6,
    -108.6, 71117.6, 0, 7,
    35.6, -38740.2, 0.1, -36.2,
    85.4, -30127.6, 0, -3.1,
    9, 21583, 0.1, -50.3,
    22.1, 12822.8, 0, 13.3,
    3.4, 12350.8, 0, 1.3,
    -21.1, 15699.4, 0, 1.6,
    4.2, 6313.8, 0, 6.2,
    -22.8, 5796.9, 0, 6.1,
    15.7, -5961.1, 0, -0.6,
    13.1, -5159.1, 0, -4.6,
    1.8, 4592.7, 0, 4.5,
    -17.5, 6336, 0, 0.7,
    16.3, -3851.1, 0, -0.4,
    -2.8, 4771.7, 0, 0.5,
    13.8, -3099.3, 0, -0.3,
    0.2, 2860.3, 0, 0.3,
    1.4, 2045.3, 0, 2,
    -8.6, 2922.6, 0, 0.3,
    -7.7, 2587.9, 0, 0.2,
    8.8, -1408.1, 0, 3.7,
    1.4, 1517.5, 0, 1.5,
    -1.9, -1579.7, 0, 7.7,
    1.3, -2178.6, 0, -0.2,
    -4.8, 1286.8, 0, 1.3,
    6.3, 1267.2, 0, -4,
    -1, 1669.3, 0, -8.3,
    2.4, -1020, 0, -0.9,
    4.5, -766.9, 0, 0,
    -1.1, 756.5, 0, -1.7,
    -1.4, -1097.3, 0, -0.5,
    2.6, -663, 0, -0.6,
    0.8, -714.1, 0, 1.6,
    0.4, -629.9, 0, -0.6,
    0.3, 580.4, 0, 0.6,
    -1.6, 577.3, 0, 0.5,
    -0.9, 644.4, 0, 0,
    2.2, -534, 0, -0.5,
    -2.5, 493.3, 0, 0.5,
    -0.1, -477.3, 0, -2.4,
    -0.9, 735, 0, -1.7,
    0.7, 406.2, 0, 0.4,
    -2.8, 656.9, 0, 0,
    0.6, 358, 0, 2,
    -0.7, 472.5, 0, -1.1,
    -0.1, -300.5, 0, 0,
    -1.2, 435.1, 0, -1,
    1.8, -289.4, 0, 0,
    0.6, -422.6, 0, 0,
    0.8, -287.6, 0, 0.6,
    -38.6, -392.3, 0, 0,
    0.7, -281.8, 0, 0.6,
    0.6, -405.7, 0, 0,
    -1.2, 229, 0, 0.2,
    1.1, -264.3, 0, 0.5,
    -0.7, 247.9, 0, -0.5,
    -0.2, 218, 0, 0.2,
    0.6, -339, 0, 0.8,
    -0.7, 198.7, 0, 0.2,
    -1.5, 334, 0, 0,
    0.1, 334, 0, 0,
    -0.1, -198.1, 0, 0,
    -106.6, 0, 0, 0,
    -0.5, 165.8, 0, 0,
    0, 134.8, 0, 0,
    0.9, -151.6, 0, 0,
    0, -129.7, 0, 0,
    0.8, -132.8, 0, -0.1,
    0.5, -140.7, 0, 0,
    -0.1, 138.4, 0, 0,
    0, 129, 0, -0.3,
    0.5, -121.2, 0, 0,
    -0.3, 114.5, 0, 0,
    -0.1, 101.8, 0, 0,
    -3.6, -101.9, 0, 0,
    0.8, -109.4, 0, 0,
    0.2, -97, 0, 0,
    -0.7, 157.3, 0, 0,
    0.2, -83.3, 0, 0,
    -0.3, 93.3, 0, 0,
    -0.1, 92.1, 0, 0,
    -0.5, 133.6, 0, 0,
    -0.1, 81.5, 0, 0,
    0, 123.9, 0, 0,
    -0.3, 128.1, 0, 0,
    0.1, 74.1, 0, -0.3,
    -0.2, -70.3, 0, 0,
    -0.4, 66.6, 0, 0,
    0.1, -66.7, 0, 0,
    -0.7, 69.3, 0, -0.3,
    0, -70.4, 0, 0,
    -0.1, 101.5, 0, 0,
    0.5, -69.1, 0, 0,
    -0.2, 58.5, 0, 0.2,
    0.1, -94.9, 0, 0.2,
    0, 52.9, 0, -0.2,
    0.1, 86.7, 0, -0.2,
    -0.1, -59.2, 0, 0.2,
    0.3, -58.8, 0, 0.1,
    -0.3, 49, 0, 0,
    -0.2, 56.9, 0, -0.1,
    0.3, -50.2, 0, 0,
    -0.2, 53.4, 0, -0.1,
    0.1, -76.5, 0, 0,
    -0.2, 45.3, 0, 0,
    0.1, -46.8, 0, 0,
    0.2, -44.6, 0, 0,
    0.2, -48.7, 0, 0,
    0.1, -46.8, 0, 0,
    0.1, -42, 0, 0,
    0, 46.4, 0, -0.1,
    0.2, -67.3, 0, 0.1,
    0, -65.8, 0, 0.2,
    -0.1, -43.9, 0, 0.3,
    0, -38.9, 0, 0,
    -0.3, 63.9, 0, 0,
    -0.2, 41.2, 0, 0,
    0, -36.1, 0, 0.2,
    -0.3, 58.5, 0, 0,
    -0.1, 36.1, 0, 0,
    0, -39.7, 0, 0,
    0.1, -57.7, 0, 0,
    -0.2, 33.4, 0, 0,
    36.4, 0, 0, 0,
    -0.1, 55.7, 0, -0.1,
    0.1, -35.4, 0, 0,
    0.1, -31, 0, 0,
    -0.1, 30.1, 0, 0,
    -0.3, 49.2, 0, 0,
    -0.2, 49.1, 0, 0,
    -0.1, 33.6, 0, 0,
    0.1, -33.5, 0, 0,
    0.1, -31, 0, 0,
    -0.1, 28, 0, 0,
    0.1, -25.2, 0, 0,
    0.1, -26.2, 0, 0,
    -0.2, 41.5, 0, 0,
    0, 24.5, 0, 0.1,
    -16.2, 0, 0, 0,
    0, -22.3, 0, 0,
    0, 23.1, 0, 0,
    -0.1, 37.5, 0, 0,
    0.2, -25.7, 0, 0,
    0, 25.2, 0, 0,
    0.1, -24.5, 0, 0,
    -0.1, 24.3, 0, 0,
    0.1, -20.7, 0, 0,
    0.1, -20.8, 0, 0,
    -0.2, 33.4, 0, 0,
    32.9, 0, 0, 0,
    0.1, -32.6, 0, 0,
    0, 19.9, 0, 0,
    -0.1, 19.6, 0, 0,
    0, -18.7, 0, 0,
    0.1, -19, 0, 0,
    0.1, -28.6, 0, 0,
    4, 178.8, -11.8, 0.3,
    39.8, -107.3, -5.6, -1,
    9.9, 164, -4.1, 0.1,
    -4.8, -135.3, -3.4, -0.1,
    50.5, 75, 1.4, -1.2,
    -1.1, -53.5, 1.3, 0,
    -45, -2.4, -0.4, 6.6,
    -11.5, -61, -0.9, 0.4,
    4.4, -68.4, -3.4, 0,
    7.7, -47.1, -4.7, -1,
    -42.9, -12.6, -1.2, 4.2,
    -42.8, 12.7, -1.2, -4.2,
    -7.6, -44.1, 2.1, -0.5,
    -64.1, 1.7, 0.2, 4.5,
    36.4, -10.4, 1, 3.5,
    35.6, 10.2, 1, -3.5,
    -1.7, 39.5, 2, 0,
    50.9, -8.2, -0.8, -5,
    0, 52.3, 1.2, 0,
    -42.9, -17.8, 0.4, 0,
    2.6, 34.3, 0.8, 0,
    -0.8, -48.6, 2.4, -0.1,
    -4.9, 30.5, 3.7, 0.7,
    0, -43.6, 2.1, 0,
    0, -25.4, 1.2, 0,
    2, 40.9, -2, 0,
    -2.1, 26.1, 0.6, 0,
    22.6, -3.2, -0.5, -0.5,
    -7.6, 24.9, -0.4, -0.2,
    -6.2, 34.9, 1.7, 0.3,
    2, 17.4, -0.4, 0.1,
    -3.9, 20.5, 2.4, 0.6
];

/* Nutation series: obliquity */
sla.eps = [
    9205365.8, -1506.2, 885.7, -0.2,
    573095.9, -570.2, -305, -0.3,
    97845.5, 147.8, -48.8, -0.2,
    -89753.6, 28, 46.9, 0,
    7406.7, -327.1, -18.2, 0.8,
    22442.3, -22.3, -67.6, 0,
    -683.6, 46.8, 0, 0,
    20070.7, 36, 1.6, 0,
    12893.8, 39.5, -6.2, 0,
    -9593.2, 14.4, 30.2, -0.1,
    -6899.5, 4.8, -0.6, 0,
    -5332.5, -0.1, 2.7, 0,
    -125.2, 10.5, 0, 0,
    -3323.4, -0.9, -0.3, 0,
    3142.3, 8.9, 0.3, 0,
    2552.5, 7.3, -1.2, 0,
    2634.4, 8.8, 0.2, 0,
    -2424.4, 1.6, -0.4, 0,
    -123.3, 3.9, 0, 0,
    1642.4, 7.3, -0.8, 0,
    47.9, 3.2, 0, 0,
    1321.2, 6.2, -0.6, 0,
    -1234.1, -0.3, 0.6, 0,
    -1076.5, -0.3, 0, 0,
    -61.6, 1.8, 0, 0,
    -55.4, 1.6, 0, 0,
    856.9, -4.9, -2.1, 0,
    -800.7, -0.1, 0, 0,
    685.1, -0.6, -3.8, 0,
    -16.9, -1.5, 0, 0,
    695.7, 1.8, 0, 0,
    642.2, -2.6, -1.6, 0,
    13.3, 1.1, -0.1, 0,
    521.9, 1.6, 0, 0,
    325.8, 2, -0.1, 0,
    -325.1, -0.5, 0.9, 0,
    10.1, 0.3, 0, 0,
    334.5, 1.6, 0, 0,
    307.1, 0.4, -0.9, 0,
    327.2, 0.5, 0, 0,
    -304.6, -0.1, 0, 0,
    304, 0.6, 0, 0,
    -276.8, -0.5, 0.1, 0,
    268.9, 1.3, 0, 0,
    271.8, 1.1, 0, 0,
    271.5, -0.4, -0.8, 0,
    -5.2, 0.5, 0, 0,
    -220.5, 0.1, 0, 0,
    -20.1, 0.3, 0, 0,
    -191, 0.1, 0.5, 0,
    -4.1, 0.3, 0, 0,
    130.6, -0.1, 0, 0,
    3, 0.3, 0, 0,
    122.9, 0.8, 0, 0,
    3.7, -0.3, 0, 0,
    123.1, 0.4, -0.3, 0,
    -52.7, 15.3, 0, 0,
    120.7, 0.3, -0.3, 0,
    4, -0.3, 0, 0,
    126.5, 0.5, 0, 0,
    112.7, 0.5, -0.3, 0,
    -106.1, -0.3, 0.3, 0,
    -112.9, -0.2, 0, 0,
    3.6, -0.2, 0, 0,
    107.4, 0.3, 0, 0,
    -10.9, 0.2, 0, 0,
    -0.9, 0, 0, 0,
    85.4, 0, 0, 0,
    0, -88.8, 0, 0,
    -71, -0.2, 0, 0,
    -70.3, 0, 0, 0,
    64.5, 0.4, 0, 0,
    69.8, 0, 0, 0,
    66.1, 0.4, 0, 0,
    -61, -0.2, 0, 0,
    -59.5, -0.1, 0, 0,
    -55.6, 0, 0.2, 0,
    51.7, 0.2, 0, 0,
    -49, -0.1, 0, 0,
    -52.7, -0.1, 0, 0,
    -49.6, 1.4, 0, 0,
    46.3, 0.4, 0, 0,
    49.6, 0.1, 0, 0,
    -5.1, 0.1, 0, 0,
    -44, -0.1, 0, 0,
    -39.9, -0.1, 0, 0,
    -39.5, -0.1, 0, 0,
    -3.9, 0.1, 0, 0,
    -42.1, -0.1, 0, 0,
    -17.2, 0.1, 0, 0,
    -2.3, 0.1, 0, 0,
    -39.2, 0, 0, 0,
    -38.4, 0.1, 0, 0,
    36.8, 0.2, 0, 0,
    34.6, 0.1, 0, 0,
    -32.7, 0.3, 0, 0,
    30.4, 0, 0, 0,
    0.4, 0.1, 0, 0,
    29.3, 0.2, 0, 0,
    31.6, 0.1, 0, 0,
    0.8, -0.1, 0, 0,
    -27.9, 0, 0, 0,
    2.9, 0, 0, 0,
    -25.3, 0, 0, 0,
    25, 0.1, 0, 0,
    27.5, 0.1, 0, 0,
    -24.4, -0.1, 0, 0,
    24.9, 0.2, 0, 0,
    -22.8, -0.1, 0, 0,
    0.9, -0.1, 0, 0,
    24.4, 0.1, 0, 0,
    23.9, 0.1, 0, 0,
    22.5, 0.1, 0, 0,
    20.8, 0.1, 0, 0,
    20.1, 0, 0, 0,
    21.5, 0.1, 0, 0,
    -20, 0, 0, 0,
    1.4, 0, 0, 0,
    -0.2, -0.1, 0, 0,
    19, 0, -0.1, 0,
    20.5, 0, 0, 0,
    -2, 0, 0, 0,
    -17.6, -0.1, 0, 0,
    19, 0, 0, 0,
    -2.4, 0, 0, 0,
    -18.4, -0.1, 0, 0,
    17.1, 0, 0, 0,
    0.4, 0, 0, 0,
    18.4, 0.1, 0, 0,
    0, 17.4, 0, 0,
    -0.6, 0, 0, 0,
    -15.4, 0, 0, 0,
    -16.8, -0.1, 0, 0,
    16.3, 0, 0, 0,
    -2, 0, 0, 0,
    -1.5, 0, 0, 0,
    -14.3, -0.1, 0, 0,
    14.4, 0, 0, 0,
    -13.4, 0, 0, 0,
    -14.3, -0.1, 0, 0,
    -13.7, 0, 0, 0,
    13.1, 0.1, 0, 0,
    -1.7, 0, 0, 0,
    -12.8, 0, 0, 0,
    0, -14.4, 0, 0,
    12.4, 0, 0, 0,
    -12, 0, 0, 0,
    -0.8, 0, 0, 0,
    10.9, 0.1, 0, 0,
    -10.8, 0, 0, 0,
    10.5, 0, 0, 0,
    -10.4, 0, 0, 0,
    -11.2, 0, 0, 0,
    10.5, 0.1, 0, 0,
    -1.4, 0, 0, 0,
    0, 0.1, 0, 0,
    0.7, 0, 0, 0,
    -10.3, 0, 0, 0,
    -10, 0, 0, 0,
    9.6, 0, 0, 0,
    9.4, 0.1, 0, 0,
    0.6, 0, 0, 0,
    -87.7, 4.4, -0.4, -6.3,
    46.3, 22.4, 0.5, -2.4,
    15.6, -3.4, 0.1, 0.4,
    5.2, 5.8, 0.2, -0.1,
    -30.1, 26.9, 0.7, 0,
    23.2, -0.5, 0, 0.6,
    1, 23.2, 3.4, 0,
    -12.2, -4.3, 0, 0,
    -2.1, -3.7, -0.2, 0.1,
    -18.6, -3.8, -0.4, 1.8,
    5.5, -18.7, -1.8, -0.5,
    -5.5, -18.7, 1.8, -0.5,
    18.4, -3.6, 0.3, 0.9,
    -0.6, 1.3, 0, 0,
    -5.6, -19.5, 1.9, 0,
    5.5, -19.1, -1.9, 0,
    -17.3, -0.8, 0, 0.9,
    -3.2, -8.3, -0.8, 0.3,
    -0.1, 0, 0, 0,
    -5.4, 7.8, -0.3, 0,
    -14.8, 1.4, 0, 0.3,
    -3.8, 0.4, 0, -0.2,
    12.6, 3.2, 0.5, -1.5,
    0.1, 0, 0, 0,
    -13.6, 2.4, -0.1, 0,
    0.9, 1.2, 0, 0,
    -11.9, -0.5, 0, 0.3,
    0.4, 12, 0.3, -0.2,
    8.3, 6.1, -0.1, 0.1,
    0, 0, 0, 0,
    0.4, -10.8, 0.3, 0,
    9.6, 2.2, 0.3, -1.2
];

/**
 * Coefficients for Moon position.
 * Tx(N)       = coefficient of L, B or P term (deg)
 * ITx(N,1-5)  = coefficients of M, M', D, F, E**n in argument
 * Coefficients taken from slalib/dmoon.f
 */

/* Longitude */
sla.tl = [
    6.28875,
    1.274018,
    0.658309,
    0.213616,
    -0.185596,
    -0.114336,
    0.058793,
    0.057212,
    0.05332,
    0.045874,
    0.041024,
    -0.034718,
    -0.030465,
    0.015326,
    -0.012528,
    -0.01098,
    0.010674,
    0.010034,
    0.008548,
    -0.00791,
    -0.006783,
    0.005162,
    0.005,
    0.004049,
    0.003996,
    0.003862,
    0.003665,
    0.002695,
    0.002602,
    0.002396,
    -0.002349,
    0.002249,
    -0.002125,
    -0.002079,
    0.002059,
    -0.001773,
    -0.001595,
    0.00122,
    -0.00111,
    0.000892,
    -0.000811,
    0.000761,
    0.000717,
    0.000704,
    0.000693,
    0.000598,
    0.00055,
    0.000538,
    0.000521,
    0.000486
];
sla.itl = [
    0, 1, 0, 0, 0,
    0, -1, 2, 0, 0,
    0, 0, 2, 0, 0,
    0, 2, 0, 0, 0,
    1, 0, 0, 0, 1,
    0, 0, 0, 2, 0,
    0, -2, 2, 0, 0,
    -1, -1, 2, 0, 1,
    0, 1, 2, 0, 0,
    -1, 0, 2, 0, 1,
    -1, 1, 0, 0, 1,
    0, 0, 1, 0, 0,
    1, 1, 0, 0, 1,
    0, 0, 2, -2, 0,
    0, 1, 0, 2, 0,
    0, -1, 0, 2, 0,
    0, -1, 4, 0, 0,
    0, 3, 0, 0, 0,
    0, -2, 4, 0, 0,
    1, -1, 2, 0, 1,
    1, 0, 2, 0, 1,
    0, 1, -1, 0, 0,
    1, 0, 1, 0, 1,
    -1, 1, 2, 0, 1,
    0, 2, 2, 0, 0,
    0, 0, 4, 0, 0,
    0, -3, 2, 0, 0,
    -1, 2, 0, 0, 1,
    0, 1, -2, -2, 0,
    -1, -2, 2, 0, 1,
    0, 1, 1, 0, 0,
    -2, 0, 2, 0, 2,
    1, 2, 0, 0, 1,
    2, 0, 0, 0, 2,
    -2, -1, 2, 0, 2,
    0, 1, 2, -2, 0,
    0, 0, 2, 2, 0,
    -1, -1, 4, 0, 1,
    0, 2, 0, 2, 0,
    0, 1, -3, 0, 0,
    1, 1, 2, 0, 1,
    -1, -2, 4, 0, 1,
    -2, 1, 0, 0, 2,
    -2, 1, -2, 0, 2,
    1, -2, 2, 0, 1,
    -1, 0, 2, -2, 1,
    0, 1, 4, 0, 0,
    0, 4, 0, 0, 0,
    -1, 0, 4, 0, 1,
    0, 2, -1, 0, 0
];

/* Latitude */
sla.tb = [
    5.128189,
    0.280606,
    0.277693,
    0.173238,
    0.055413,
    0.046272,
    0.032573,
    0.017198,
    0.009267,
    0.008823,
    0.008247,
    0.004323,
    0.0042,
    0.003372,
    0.002472,
    0.002222,
    0.002072,
    0.001877,
    0.001828,
    -0.001803,
    -0.00175,
    0.00157,
    -0.001487,
    -0.001481,
    0.001417,
    0.00135,
    0.00133,
    0.001106,
    0.00102,
    0.000833,
    0.000781,
    0.00067,
    0.000606,
    0.000597,
    0.000492,
    0.00045,
    0.000439,
    0.000423,
    0.000422,
    -0.000367,
    -0.000353,
    0.000331,
    0.000317,
    0.000306,
    -0.000283
];
sla.itb = [
    0, 0, 0, 1, 0,
    0, 1, 0, 1, 0,
    0, 1, 0, -1, 0,
    0, 0, 2, -1, 0,
    0, -1, 2, 1, 0,
    0, -1, 2, -1, 0,
    0, 0, 2, 1, 0,
    0, 2, 0, 1, 0,
    0, 1, 2, -1, 0,
    0, 2, 0, -1, 0,
    -1, 0, 2, -1, 1,
    0, -2, 2, -1, 0,
    0, 1, 2, 1, 0,
    -1, 0, -2, 1, 1,
    -1, -1, 2, 1, 1,
    -1, 0, 2, 1, 1,
    -1, -1, 2, -1, 1,
    -1, 1, 0, 1, 1,
    0, -1, 4, -1, 0,
    1, 0, 0, 1, 1,
    0, 0, 0, 3, 0,
    -1, 1, 0, -1, 1,
    0, 0, 1, 1, 0,
    1, 1, 0, 1, 1,
    -1, -1, 0, 1, 1,
    -1, 0, 0, 1, 1,
    0, 0, -1, 1, 0,
    0, 3, 0, 1, 0,
    0, 0, 4, -1, 0,
    0, -1, 4, 1, 0,
    0, 1, 0, -3, 0,
    0, -2, 4, 1, 0,
    0, 0, 2, -3, 0,
    0, 2, 2, -1, 0,
    -1, 1, 2, -1, 1,
    0, 2, -2, -1, 0,
    0, 3, 0, -1, 0,
    0, 2, 2, 1, 0,
    0, -3, 2, -1, 0,
    1, -1, 2, 1, 1,
    1, 0, 2, 1, 1,
    0, 0, 4, 1, 0,
    -1, 1, 2, 1, 1,
    -2, 0, 2, -1, 2,
    0, 1, 0, 3, 0
];

/* Parallax */
sla.tp = [
    0.950724,
    0.051818,
    0.009531,
    0.007843,
    0.002824,
    0.000857,
    0.000533,
    0.000401,
    0.00032,
    -0.000271,
    -0.000264,
    -0.000198,
    0.000173,
    0.000167,
    -0.000111,
    0.000103,
    -8.4e-5,
    -8.3e-5,
    7.9e-5,
    7.2e-5,
    6.4e-5,
    -6.3e-5,
    4.1e-5,
    3.5e-5,
    -3.3e-5,
    -3e-5,
    -2.9e-5,
    -2.9e-5,
    2.6e-5,
    -2.3e-5,
    1.9e-5
];
sla.itp = [
    0, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, -1, 2, 0, 0,
    0, 0, 2, 0, 0,
    0, 2, 0, 0, 0,
    0, 1, 2, 0, 0,
    -1, 0, 2, 0, 1,
    -1, -1, 2, 0, 1,
    -1, 1, 0, 0, 1,
    0, 0, 1, 0, 0,
    1, 1, 0, 0, 1,
    0, -1, 0, 2, 0,
    0, 3, 0, 0, 0,
    0, -1, 4, 0, 0,
    1, 0, 0, 0, 1,
    0, -2, 4, 0, 0,
    0, 2, -2, 0, 0,
    1, 0, 2, 0, 1,
    0, 2, 2, 0, 0,
    0, 0, 4, 0, 0,
    -1, 1, 2, 0, 1,
    1, -1, 2, 0, 1,
    1, 0, 1, 0, 1,
    -1, 2, 0, 0, 1,
    0, 3, -2, 0, 0,
    0, 1, 1, 0, 0,
    0, 0, -2, 2, 0,
    1, 2, 0, 0, 1,
    -2, 0, 2, 0, 2,
    0, 1, -2, 2, 0,
    -1, -1, 4, 0, 1
];

/**
 * Coefficients for planet position, taken from
 * slalib/planet.f
 */

/* Planetary inverse masses */
sla.amas = [6023600, 408523.5, 328900.5, 3098710,
        1047.355, 3498.5, 22869, 19314];

/* Tables giving the mean Keplerian elements, limited to T**2 terms */
sla.a = [
    0.3870983098, 0, 0,
    0.72332982, 0, 0,
    1.0000010178, 0, 0,
    1.5236793419, 3e-10, 0,
    5.2026032092, 1.9132e-06, -3.9e-09,
    9.5549091915, -2.13896e-05, 4.44e-08,
    19.2184460618, -3.716e-07, 9.79e-08,
    30.1103868694, -1.6635e-06, 6.86e-08
];

sla.dlm = [
    252.25090552, 5381016286.88982, -1.92789,
    181.97980085, 2106641364.33548, 0.59381,
    100.46645683, 1295977422.83429, -2.04411,
    355.43299958, 689050774.93988, 0.94264,
    34.35151874, 109256603.77991, -30.60378,
    50.0774443, 43996098.55732, 75.61614,
    314.05500511, 15424811.93933, -1.75083,
    304.34866548, 7865503.20744, 0.21103
];

sla.e = [
    0.2056317526, 0.0002040653, -2.8349e-06,
    0.0067719164, -0.0004776521, 9.8127e-06,
    0.0167086342, -0.0004203654, -1.26734e-05,
    0.0934006477, 0.0009048438, -8.0641e-06,
    0.0484979255, 0.0016322542, -4.71366e-05,
    0.0555481426, -0.0034664062, -6.43639e-05,
    0.0463812221, -0.0002729293, 7.8913e-06,
    0.009455747, 6.03263e-05, 0.0
];

sla.pi = [
    77.45611904, 5719.1159, -4.83016,
    131.563703, 175.4864, -498.48184,
    102.93734808, 11612.3529, 53.27577,
    336.06023395, 15980.45908, -62.328,
    14.33120687, 7758.75163, 259.95938,
    93.05723748, 20395.49439, 190.25952,
    173.00529106, 3215.56238, -34.09288,
    48.12027554, 1050.71912, 27.39717
];

sla.dinc = [
    7.00498625, -214.25629, 0.28977,
    3.39466189, -30.84437, -11.67836,
    0, 469.97289, -3.35053,
    1.84972648, -293.31722, -8.1183,
    1.30326698, -71.5589, 11.95297,
    2.48887878, 91.85195, -17.66225,
    0.77319689, -60.72723, 1.25759,
    1.76995259, 8.12333, 0.08135
];

sla.omega = [
    48.33089304, -4515.21727, -31.79892,
    76.67992019, -10008.48154, -51.32614,
    174.87317577, -8679.27034, 15.34191,
    49.55809321, -10620.90088, -230.57416,
    100.46440702, 6362.03561, 326.52178,
    113.66550252, -9240.19942, -66.23743,
    74.00595701, 2669.15033, 145.93964,
    131.78405702, -221.94322, -0.78728
];

/* Tables for trigonometric terms to be added to the mean elements */
/*  of the semi-major axes. */

sla.dkp = [
    69613, 75645, 88306, 59899, 15746, 71087, 142173, 3086, 0,
    21863, 32794, 26934, 10931, 26250, 43725, 53867, 28939, 0,
    16002, 21863, 32004, 10931, 14529, 16368, 15318, 32794, 0,
    6345, 7818, 15636, 7077, 8184, 14163, 1107, 4872, 0,
    1760, 1454, 1167, 880, 287, 2640, 19, 2047, 1454,
    574, 0, 880, 287, 19, 1760, 1167, 306, 574,
    204, 0, 177, 1265, 4, 385, 200, 208, 204,
    0, 102, 106, 4, 98, 1367, 487, 204, 0
];

sla.ca = [
    4, -13, 11, -9, -9, -3, -1, 4, 0,
    -156, 59, -42, 6, 19, -20, -10, -12, 0,
    64, -152, 62, -8, 32, -41, 19, -11, 0,
    124, 621, -145, 208, 54, -57, 30, 15, 0,
    -23437, -2634, 6601, 6259, -1507, -1821, 2620, -2115, -1489,
    62911, -119919, 79336, 17814, -24241, 12068, 8306, -4893, 8902,
    389061, -262125, -44088, 8387, -22976, -2093, -615, -9720, 6633,
    -412235, -157046, -31430, 37817, -9740, -13, -7449, 9644, 0
];

sla.sa = [
    -29, -1, 9, 6, -6, 5, 4, 0, 0,
    -48, -125, -26, -37, 18, -13, -20, -2, 0,
    -150, -46, 68, 54, 14, 24, -28, 22, 0,
    -621, 532, -694, -20, 192, -94, 71, -73, 0,
    -14614, -19828, -5869, 1881, -4372, -2255, 782, 930, 913,
    139737, 0, 24667, 51123, -5102, 7429, -4095, -1976, -9566,
    -138081, 0, 37205, -49039, -41901, -33872, -27037, -12474, 18797,
    0, 28492, 133236, 69654, 52322, -49577, -26430, -3593, 0
];

/* Tables giving the trigonometric terms to be added to the mean */
/*  elements of the mean longitudes. */
sla.dkq = [
    3086, 15746, 69613, 59899, 75645, 88306, 12661, 2658, 0, 0,
    21863, 32794, 10931, 73, 4387, 26934, 1473, 2157, 0, 0,
    10, 16002, 21863, 10931, 1473, 32004, 4387, 73, 0, 0,
    10, 6345, 7818, 1107, 15636, 7077, 8184, 532, 10, 0,
    19, 1760, 1454, 287, 1167, 880, 574, 2640, 19, 1454,
    19, 574, 287, 306, 1760, 12, 31, 38, 19, 574,
    4, 204, 177, 8, 31, 200, 1265, 102, 4, 204,
    4, 102, 106, 8, 98, 1367, 487, 204, 4, 102.0
];

sla.clo = [
    21, -95, -157, 41, -5, 42, 23, 30, 0, 0,
    -160, -313, -235, 60, -74, -76, -27, 34, 0, 0,
    -325, -322, -79, 232, -52, 97, 55, -41, 0, 0,
    2268, -979, 802, 602, -668, -33, 345, 201, -55, 0,
    7610, -4997, -7689, -5841, -2617, 1115, -748, -607, 6074, 354,
    -18549, 30125, 20012, -730, 824, 23, 1289, -352, -14767, -2062,
    -135245, -14594, 4197, -4030, -5630, -2898, 2540, -306, 2939, 1986,
    89948, 2103, 8963, 2695, 3682, 1648, 866, -154, -1963, -283.0
];

sla.slo = [
    -342, 136, -23, 62, 66, -52, -33, 17, 0, 0,
    524, -149, -35, 117, 151, 122, -71, -62, 0, 0,
    -105, -137, 258, 35, -116, -88, -112, -80, 0, 0,
    854, -205, -936, -240, 140, -341, -97, -232, 536, 0,
    -56980, 8016, 1012, 1448, -3024, -3710, 318, 503, 3767, 577,
    138606, -13478, -4964, 1441, -1319, -1482, 427, 1236, -9167, -1918,
    71234, -41116, 5334, -4935, -1848, 66, 434, -1748, 3780, -701,
    -47645, 11647, 2166, 3194, 679, 0, -244, -419, -2531, 48.0
];


/* Coefficients for fundamental arguments:  mean longitudes
 *  (degrees) and mean rate of change of longitude (degrees per
 *  Julian century) for Jupiter, Saturn and Pluto */
sla.dj0 = 34.35;
sla.djd = 3034.9057;
sla.ds0 = 50.08;
sla.dsd = 1222.1138;
sla.dp0 = 238.96;
sla.dpd = 144.9600;

/* Coefficients for latitude, longitude, radius vector */
sla.dl0 = 238.956785;
sla.dld0 = 144.96;
sla.db0 = -3.908202;
sla.dr0 = 40.7247248;

/* Coefficients for periodic terms (Meeus's Table 36.A) */
sla.ijsp = [
    0, 0, 1,
    0, 0, 2,
    0, 0, 3,
    0, 0, 4,
    0, 0, 5,
    0, 0, 6,
    0, 1, -1,
    0, 1, 0,
    0, 1, 1,
    0, 1, 2,
    0, 1, 3,
    0, 2, -2,
    0, 2, -1,
    0, 2, 0,
    1, -1, 0,
    1, -1, 1,
    1, 0, -3,
    1, 0, -2,
    1, 0, -1,
    1, 0, 0,
    1, 0, 1,
    1, 0, 2,
    1, 0, 3,
    1, 0, 4,
    1, 1, -3,
    1, 1, -2,
    1, 1, -1,
    1, 1, 0,
    1, 1, 1,
    1, 1, 3,
    2, 0, -6,
    2, 0, -5,
    2, 0, -4,
    2, 0, -3,
    2, 0, -2,
    2, 0, -1,
    2, 0, 0,
    2, 0, 1,
    2, 0, 2,
    2, 0, 3,
    3, 0, -2,
    3, 0, -1,
    3, 0, 0
];

sla.ab = [
    -19798886e-6, 19848454e-6,
    -5453098e-6, -14974876e-6,
    66867334e-7, 68955876e-7,
    897499e-6, -4955707e-6,
    3527363e-6, 1672673e-6,
    -11826086e-7, -333765e-7,
    610820e-6, 1210521e-6,
    -1050939e-6, 327763e-6,
    1593657e-7, -1439953e-7,
    -341639e-6, -189719e-6,
    178691e-6, -291925e-6,
    -18948e-7, 482443e-7,
    129027e-6, -34863e-6,
    18763e-6, 100448e-6,
    -66634e-7, -85576e-7,
    -38215e-6, 31061e-6,
    -30594e-6, -25838e-6,
    30841e-7, -5765e-7,
    20349e-6, -9886e-6,
    4965e-6, 11263e-6,
    -6140e-7, 22254e-7,
    -4045e-6, -4904e-6,
    310e-6, -132e-6,
    4434e-7, 4443e-7,
    -5885e-6, -3238e-6,
    2036e-6, -947e-6,
    -1518e-7, 641e-7,
    -3812e-6, 3011e-6,
    -2e-6, -674e-6,
    -5e-7, 792e-7,
    -601e-6, 3468e-6,
    -329e-6, -563e-6,
    518e-7, 518e-7,
    1237e-6, 463e-6,
    -64e-6, 39e-6,
    -13e-7, -221e-7,
    1086e-6, -911e-6,
    -94e-6, 210e-6,
    837e-7, -494e-7,
    595e-6, -1229e-6,
    -8e-6, -160e-6,
    -281e-7, 616e-7,
    2484e-6, -485e-6,
    -177e-6, 259e-6,
    260e-7, -395e-7,
    839e-6, -1414e-6,
    17e-6, 234e-6,
    -191e-7, -396e-7,
    -964e-6, 1059e-6,
    582e-6, -285e-6,
    -3218e-7, 370e-7,
    -2303e-6, -1038e-6,
    -298e-6, 692e-6,
    8019e-7, -7869e-7,
    7049e-6, 747e-6,
    157e-6, 201e-6,
    105e-7, 45637e-7,
    1179e-6, -358e-6,
    304e-6, 825e-6,
    8623e-7, 8444e-7,
    393e-6, -63e-6,
    -124e-6, -29e-6,
    -896e-7, -801e-7,
    111e-6, -268e-6,
    15e-6, 8e-6,
    208e-7, -122e-7,
    -52e-6, -154e-6,
    7e-6, 15e-6,
    -133e-7, 65e-7,
    -78e-6, -30e-6,
    2e-6, 2e-6,
    -16e-7, 1e-7,
    -34e-6, -26e-6,
    4e-6, 2e-6,
    -22e-7, 7e-7,
    -43e-6, 1e-6,
    3e-6, 0,
    -8e-7, 16e-7,
    -15e-6, 21e-6,
    1e-6, -1e-6,
    2e-7, 9e-7,
    -1e-6, 15e-6,
    0, -2e-6,
    12e-7, 5e-7,
    4e-6, 7e-6,
    1e-6, 0,
    1e-7, -3e-7,
    1e-6, 5e-6,
    1e-6, -1e-6,
    1e-7, 0,
    8e-6, 3e-6,
    -2e-6, -3e-6,
    9e-7, 5e-7,
    -3e-6, 6e-6,
    1e-6, 2e-6,
    2e-7, -1e-7,
    6e-6, -13e-6,
    -8e-6, 2e-6,
    14e-7, 10e-7,
    10e-6, 22e-6,
    10e-6, -7e-6,
    -65e-7, 12e-7,
    -57e-6, -32e-6,
    0, 21e-6,
    126e-7, -233e-7,
    157e-6, -46e-6,
    8e-6, 5e-6,
    270e-7, 1068e-7,
    12e-6, -18e-6,
    13e-6, 16e-6,
    254e-7, 155e-7,
    -4e-6, 8e-6,
    -2e-6, -3e-6,
    -26e-7, -2e-7,
    -5e-6, 0,
    0, 0,
    7e-7, 0,
    3e-6, 4e-6,
    0, 1e-6,
    -11e-7, 4e-7,
    -1e-6, -1e-6,
    0, 1e-6,
    4e-7, -14e-7,
    6e-6, -3e-6,
    0, 0,
    18e-7, 35e-7,
    -1e-6, -2e-6,
    0, 1e-6,
    13e-7, 3e-7
];

/**
 * Coefficients aken from slalib/evp.f
 */
/* Constants DCFEL(I,K) of fast changing elements */
sla.dcfel = [
    1.7400353e+0, 6.2833195099091e+2, 5.2796e-6,
    6.2565836e+0, 6.2830194572674e+2, -2.6180e-6,
    4.7199666e+0, 8.3997091449254e+3, -1.9780e-5,
    1.9636505e-1, 8.4334662911720e+3, -5.6044e-5,
    4.1547339e+0, 5.2993466764997e+1, 5.8845e-6,
    4.6524223e+0, 2.1354275911213e+1, 5.6797e-6,
    4.2620486e+0, 7.5025342197656e+0, 5.5317e-6,
    1.4740694e+0, 3.8377331909193e+0, 5.6093e-6
];

/* Constants DCEPS and CCSEL(I,K) of slowly changing elements */
sla.dceps = [
    4.093198e-1, -2.271110e-4, -2.860401e-8
];
sla.ccsel = [
    1.675104e-2, -4.179579e-5, -1.260516e-7,
    2.220221e-1, 2.809917e-2, 1.852532e-5,
    1.589963e+0, 3.418075e-2, 1.430200e-5,
    2.994089e+0, 2.590824e-2, 4.155840e-6,
    8.155457e-1, 2.486352e-2, 6.836840e-6,
    1.735614e+0, 1.763719e-2, 6.370440e-6,
    1.968564e+0, 1.524020e-2, -2.517152e-6,
    1.282417e+0, 8.703393e-3, 2.289292e-5,
    2.280820e+0, 1.918010e-2, 4.484520e-6,
    4.833473e-2, 1.641773e-4, -4.654200e-7,
    5.589232e-2, -3.455092e-4, -7.388560e-7,
    4.634443e-2, -2.658234e-5, 7.757000e-8,
    8.997041e-3, 6.329728e-6, -1.939256e-9,
    2.284178e-2, -9.941590e-5, 6.787400e-8,
    4.350267e-2, -6.839749e-5, -2.714956e-7,
    1.348204e-2, 1.091504e-5, 6.903760e-7,
    3.106570e-2, -1.665665e-4, -1.590188e-7
];

/* Constants of the arguments of the short-period perturbations
 * by the planets:   DCARGS(I,K) */
sla.dcargs = [
    5.0974222, -7.8604195454652e+2,
    3.9584962, -5.7533848094674e+2,
    1.6338070, -1.1506769618935e+3,
    2.5487111, -3.9302097727326e+2,
    4.9255514, -5.8849265665348e+2,
    1.3363463, -5.5076098609303e+2,
    1.6072053, -5.2237501616674e+2,
    1.3629480, -1.1790629318198e+3,
    5.5657014, -1.0977134971135e+3,
    5.0708205, -1.5774000881978e+2,
    3.9318944, 5.2963464780000e+1,
    4.8989497, 3.9809289073258e+1,
    1.3097446, 7.7540959633708e+1,
    3.5147141, 7.9618578146517e+1,
    3.5413158, -5.4868336758022e+2
];

/* Amplitudes CCAMPS(N,K) of the short-period perturbations */
sla.ccamps = [
    -2.279594e-5, 1.407414e-5, 8.273188e-6, 1.340565e-5, -2.490817e-7,
    -3.494537e-5, 2.860401e-7, 1.289448e-7, 1.627237e-5, -1.823138e-7,
    6.593466e-7, 1.322572e-5, 9.258695e-6, -4.674248e-7, -3.646275e-7,
    1.140767e-5, -2.049792e-5, -4.747930e-6, -2.638763e-6, -1.245408e-7,
    9.516893e-6, -2.748894e-6, -1.319381e-6, -4.549908e-6, -1.864821e-7,
    7.310990e-6, -1.924710e-6, -8.772849e-7, -3.334143e-6, -1.745256e-7,
    -2.603449e-6, 7.359472e-6, 3.168357e-6, 1.119056e-6, -1.655307e-7,
    -3.228859e-6, 1.308997e-7, 1.013137e-7, 2.403899e-6, -3.736225e-7,
    3.442177e-7, 2.671323e-6, 1.832858e-6, -2.394688e-7, -3.478444e-7,
    8.702406e-6, -8.421214e-6, -1.372341e-6, -1.455234e-6, -4.998479e-8,
    -1.488378e-6, -1.251789e-5, 5.226868e-7, -2.049301e-7, 0,
    -8.043059e-6, -2.991300e-6, 1.473654e-7, -3.154542e-7, 0,
    3.699128e-6, -3.316126e-6, 2.901257e-7, 3.407826e-7, 0,
    2.550120e-6, -1.241123e-6, 9.901116e-8, 2.210482e-7, 0,
    -6.351059e-7, 2.341650e-6, 1.061492e-6, 2.878231e-7, 0
];

/* Constants of the secular perturbations in longitude
 * CCSEC3 and CCSEC(N,K) */
sla.ccsec3 = -7.757020E-08;
sla.ccsec = [
    1.289600e-6, 5.550147e-1, 2.076942e+0,
    3.102810e-5, 4.035027e+0, 3.525565e-1,
    9.124190e-6, 9.990265e-1, 2.622706e+0,
    9.793240e-7, 5.508259e+0, 1.559103e+1
];

/* Sidereal rate DCSLD in longitude, rate CCSGD in mean anomaly */
sla.dcsld = 1.990987e-7;
sla.ccsgd = 1.990969e-7;

/* Some constants used in the calculation of the lunar contribution */
sla.cckm = 3.122140e-5;
sla.ccmld = 2.661699e-6;
sla.ccfdi = 2.399485e-7;

/* Constants DCARGM(I,K) of the arguments of the perturbations
 * of the motion of the Moon */
sla.dcargm = [
    5.1679830e+0, 8.3286911095275e+3,
    5.4913150e+0, -7.2140632838100e+3,
    5.9598530e+0, 1.5542754389685e+4
];

/* Amplitudes CCAMPM(N,K) of the perturbations of the Moon */
sla.ccampm = [
    1.097594e-1, 2.896773e-7, 5.450474e-2, 1.438491e-7,
    -2.223581e-2, 5.083103e-8, 1.002548e-2, -2.291823e-8,
    1.148966e-2, 5.658888e-8, 8.249439e-3, 4.063015e-8
];

/* CCPAMV(K)=A*M*DL/DT (planets), DC1MME=1-MASS(Earth+Moon) */
sla.ccpamv = [
    8.326827e-11, 1.843484e-11, 1.988712e-12, 1.881276e-12
];
sla.dc1mme = 0.99999696;

/* CCPAM(K)=A*M(planets), CCIM=INCLINATION(Moon) */
sla.ccpam = [
    4.960906e-3, 2.727436e-3, 8.392311e-4, 1.556861e-3
];
sla.ccim = 8.978749e-2;
