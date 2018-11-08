// -*- encoding: utf-8 -*-
import * as MRD from './MRD.js';
import {functionF,
        calcLCHabToLab,
        calcLabToLCHab,
        calcLabToXYZ,
        calcXYZToLinearRGB,
        calcLinearRGBToRGB,
        calcRGBToRGB255,
        calcRGBToHex,
        ILLUMINANT_C,
        ILLUMINANT_D65,
        RGBSPACE_SRGB} from './colorspace.js';
import {mod,
        clamp,
        circularLerp,
        multMatrixVector} from './arithmetic.js';

/**
 * <p> This module handles the Munsell Color system. The main facility
 * is the conversion from the Munsell Color space to other spaces
 * (e.g. RGB).

 * <p> The data underlying this module is {@link
 * https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php
 * Munsell Renotation Data}. Every converter inter- and extrapolates
 * them using cylindrical coordinates of LCH(ab) space. This algorithm
 * is similar to the one by Paul Centore. (See "An open‐source
 * inversion algorithm for the Munsell renotation", 2011). All of
 * relevant colorimetric data are (indirectly) based on corresponding
 * standards via {@link https://github.com/privet-kitty/dufy dufy}, my
 * color library for Common Lisp. See the links for more details.
 *
 * <p> This module handles the Munsell Color in two ways, a string or
 * numbers, which can be identified by the name of method. The one is
 * <dfn>Munsell</dfn>, the standard string specification of the
 * Munsell Color: e.g. "4.2RP 3/11", "N 10". The other is
 * <dfn>MHVC</dfn>, or Munsell HVC, its 3-number expression composed
 * of [Hue, Value, Chroma]: e.g. [94.2, 3, 11], [0, 10 ,0]. Hue is the
 * circle group R/100Z: i.e. 0R (= 10RP) corresponds to 0 (= 100 = 300
 * = -2000) and 2YR corresponds to 12 (= -88 = 412). Value is in the
 * interval [0, 10] and the converters will clamp it if a given value
 * exceeds it. Chroma is non-negative and the converters will assume
 * it to be zero if a given chroma is negative. Note that every
 * converter accepts a huge chroma outside the MRD (e.g. 1000000) and
 * returns a extrapolated result.
 * @module
 */

export function calcMunsellValueToY(v) {
  return v * (1.1914 + v * (-0.22533 + v * (0.23352 + v * (-0.020484 + v * 0.00081939)))) * 0.01;
}

export function calcMunsellValueToL(v) {
  return 116 * functionF(calcMunsellValueToY(v)) - 16;
}

// These converters process a dark color (value < 1) separately
// because the values of the Munsell Renotation Data (all.dat) are not
// evenly distributed: [0, 0.2, 0.4, 0.6, 0.8, 1, 2, 3, ..., 10].

// In the following functions, the real value equals scaledValue/5 if
// dark is true; the real chroma equals to halfChroma*2.

function calcMHVCToLCHabAllIntegerCase(hue40, scaledValue, halfChroma, dark = false) {
  // Handles the case HVC are all integer. If chroma is larger than
  // 50, C*ab is linearly extrapolated.

  // This function does no range checks: hue40 must be in {0, 1,
  // ..., 39}; scaledValue must be in {0, 1, ..., 10} if dark is
  // false, and {0, 1, ..., 6} if dark is true; halfChroma must be
  // a non-negative integer.
  if (dark) { // Value is in {0, 0.2, 0.4, 0.6, 0.8, 1}.
    if (halfChroma <= 25) {
      return [MRD.mrdLTableDark[scaledValue],
              MRD.mrdCHTableDark[hue40][scaledValue][halfChroma][0],
              MRD.mrdCHTableDark[hue40][scaledValue][halfChroma][1]];
    } else { // Linearly extrapolates a color outside the MRD.
      const cstarab = MRD.mrdCHTableDark[hue40][scaledValue][25][0];
      const factor = halfChroma/25;
      return [MRD.mrdLTableDark[scaledValue],
              cstarab * factor,
              MRD.mrdCHTableDark[hue40][scaledValue][25][1]];
    }
  } else {
    if (halfChroma <= 25) {
      return [MRD.mrdLTable[scaledValue],
              MRD.mrdCHTable[hue40][scaledValue][halfChroma][0],
              MRD.mrdCHTable[hue40][scaledValue][halfChroma][1]];
    } else {
      const cstarab = MRD.mrdCHTable[hue40][scaledValue][25][0];
      const factor = halfChroma/25;
      return [MRD.mrdLTable[scaledValue],
              cstarab * factor,
              MRD.mrdCHTable[hue40][scaledValue][25][1]];
    }
  }
}

// Handles the case V and C are integer.
function calcMHVCToLCHabValueChromaIntegerCase(hue40, scaledValue, halfChroma, dark = false) {
  const hue1 = Math.floor(hue40);
  const hue2 = mod(Math.ceil(hue40), 40);
  const [lstar, cstarab1, hab1] = calcMHVCToLCHabAllIntegerCase(hue1, scaledValue, halfChroma, dark);
  if (hue1 === hue2) {
    return [lstar, cstarab1, hab1];
  } else {
    const [ , cstarab2, hab2] = calcMHVCToLCHabAllIntegerCase(hue2, scaledValue, halfChroma, dark);
    if ((hab1 === hab2) ||
        (mod(hab2 - hab1, 360) >= 180)) { // workaround for the rare case hab1 exceeds hab2
      return [lstar, cstarab1, hab1];
    } else {
      const hab = circularLerp(hue40 - hue1, hab1, hab2, 360);
      const cstarab = (cstarab1 * mod(hab2 - hab, 360) / mod(hab2 - hab1, 360))
            + (cstarab2 * mod(hab - hab1, 360) / mod(hab2 - hab1, 360));
      return [lstar, cstarab, hab];
    }
  }
}

// Handles the case V is integer.
function calcMHVCToLCHabValueIntegerCase(hue40, scaledValue, halfChroma, dark = false) {
  const halfChroma1 = Math.floor(halfChroma);
  const halfChroma2 = Math.ceil(halfChroma);
  if (halfChroma1 === halfChroma2) {
    return calcMHVCToLCHabValueChromaIntegerCase(hue40, scaledValue, halfChroma, dark);
  } else {
    const [lstar, cstarab1, hab1] = calcMHVCToLCHabValueChromaIntegerCase(hue40, scaledValue, halfChroma1, dark);
    const [, cstarab2, hab2] = calcMHVCToLCHabValueChromaIntegerCase(hue40, scaledValue, halfChroma2, dark);
    const [astar1, bstar1] = calcLCHabToLab(cstarab1, hab1);
    const [astar2, bstar2] = calcLCHabToLab(cstarab2, hab2);
    const astar = astar1 * (halfChroma2 - halfChroma) + astar2 * (halfChroma - halfChroma1);
    const bstar = bstar1 * (halfChroma2 - halfChroma) + bstar2 * (halfChroma - halfChroma1);
    return [lstar].concat(calcLabToLCHab(astar, bstar));
  }
}

function calcMHVCToLCHabGeneralCase(hue40, scaledValue, halfChroma, dark = false) {
  const realValue = dark ? scaledValue*0.2 : scaledValue;
  const scaledValue1 = Math.floor(scaledValue);
  const scaledValue2 = Math.ceil(scaledValue);
  const lstar = calcMunsellValueToL(realValue);
  if (scaledValue1 === scaledValue2) {
    return calcMHVCToLCHabValueIntegerCase(hue40, scaledValue1, halfChroma, dark);
  } else if (scaledValue1 === 0) {
    // If the given color is so dark (V < 0.2) that it is out of MRD,
    // we use the fact that the chroma and hue of LCHab corresponds
    // roughly to that of Munsell.
    const [, cstarab, hab] = calcMHVCToLCHabValueIntegerCase(hue40, 1, halfChroma, dark);
    return [lstar, cstarab, hab];
  } else {
    const [lstar1, cstarab1, hab1] = calcMHVCToLCHabValueIntegerCase(hue40, scaledValue1, halfChroma, dark);
    const [lstar2, cstarab2, hab2] = calcMHVCToLCHabValueIntegerCase(hue40, scaledValue2, halfChroma, dark);
    const [astar1, bstar1] = calcLCHabToLab(cstarab1, hab1);
    const [astar2, bstar2] = calcLCHabToLab(cstarab2, hab2);
    const astar = astar1 * (lstar2 - lstar) / (lstar2 - lstar1) +
          astar2 * (lstar - lstar1) / (lstar2 - lstar1);
    const bstar = bstar1 * (lstar2 - lstar) / (lstar2 - lstar1) +
          bstar2 * (lstar - lstar1) / (lstar2 - lstar1);
    return [lstar].concat(calcLabToLCHab(astar, bstar));
  }
}

/**
 * Converts Munsell HVC to LCHab.
 * @param {number} hue100 - is in the circle group R/100Z. Any real
 * number is accepted.
 * @param {number} value - will be in [0, 10]. Clamped if it exceeds
 * the interval.
 * @param {number} chroma - will be in [0, +inf). Assumed to be zero
 * if it is negative.
 * @returns [Array] [L*, C*ab, hab]
 */
export function calcMHVCToLCHab(hue100, value, chroma) {
  const hue40 = mod(hue100 * 0.4, 40);
  const value10 = clamp(value, 0, 10);
  const halfChroma = Math.max(0, chroma) * 0.5;
  if (value >= 1) {
    return calcMHVCToLCHabGeneralCase(hue40, value10, halfChroma, false);
  } else {
    return calcMHVCToLCHabGeneralCase(hue40, value10 * 5, halfChroma, true);
  }
}


const hueNames = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"];

/**
 * Converts Munsell string to Munsell HVC. Munsell string is, e.g.,
"3GY 2/10" and "N 2.4". This converter accepts various notations of
numbers; an ugly specification as follows will be also available:
"2e-02RP .9/0xffffff". However, the capital letters and '/' are
reserved.
 * @param {string} munsellStr - is the standard Munsell Color code.
 * @returns [Array] [hue, value, chroma]
 */
export function calcMunsellToMHVC(munsellStr) {
  const nums = munsellStr.split(/[^a-z0-9.\-]+/)
        .filter(Boolean)
        .map(str => Number(str));
  const hueName = munsellStr.match(/[A-Z]+/)[0];
  const hueNumber = hueNames.indexOf(hueName);
  if (hueName === "N") {
    return [0, nums[0], 0];
  } else if (nums.length !== 3) {
    throw new SyntaxError(`Doesn't contain 3 numbers: ${nums}`);
  } else if (hueNumber === -1) { // achromatic
    throw new SyntaxError(`Invalid hue designator: ${hueName}`);
  } else {
    return [hueNumber * 10 + nums[0], nums[1], nums[2]];
  }
}

/**
 * Converts Munsell string to LCHab.
 * @param {string} munsellStr - is the standard Munsell Color code.
 * @returns [Array] [L*, C*ab, hab]
 */
export function calcMunsellToLCHab(munsellStr) {
  return calcMHVCToLCHab.apply(null, calcMunsellToMHVC(munsellStr));
}

export function calcMHVCToLab(hue100, value, chroma) {
  const [lstar, cstarab, hab] = calcMHVCToLCHab(hue100, value, chroma);
  return [lstar].concat(calcLCHabToLab(cstarab, hab));
}

export function calcMunsellToLab(munsellStr) {
  return calcMHVCToLab.apply(null, calcMunsellToMHVC(munsellStr));
}

export function calcMHVCToXYZ(hue100, value, chroma, illuminant = ILLUMINANT_D65) {
  // Uses Bradford transformation
  const [lstar, astar, bstar] = calcMHVCToLab(hue100, value, chroma);
  return multMatrixVector(illuminant.catMatrixCToThis,
                          calcLabToXYZ(lstar, astar, bstar, ILLUMINANT_C));
}

export function calcMunsellToXYZ(munsellStr, illuminant = ILLUMINANT_D65) {
  const [hue100, value, chroma] = calcMunsellToMHVC(munsellStr);
  return calcMHVCToXYZ(hue100, value, chroma, illuminant);
}

export function calcMHVCToLinearRGB(hue100, value, chroma, rgbSpace = RGBSPACE_SRGB) {
  const [X, Y, Z] = calcMHVCToXYZ(hue100, value, chroma, rgbSpace.illuminant);
  return calcXYZToLinearRGB(X, Y, Z, rgbSpace);
}

export function calcMunsellToLinearRGB(munsellStr, rgbSpace = RGBSPACE_SRGB) {
  const [hue100, value, chroma] = calcMunsellToMHVC(munsellStr);
  return calcMHVCToLinearRGB(hue100, value, chroma, rgbSpace);
}

export function calcMHVCToRGB(hue100, value, chroma, rgbSpace = RGBSPACE_SRGB) {
  const [lr, lg, lb] = calcMHVCToLinearRGB(hue100, value, chroma, rgbSpace);
  return calcLinearRGBToRGB(lr, lg, lb, rgbSpace);
}

export function calcMunsellToRGB(munsellStr, rgbSpace = RGBSPACE_SRGB) {
  const [hue100, value, chroma] = calcMunsellToMHVC(munsellStr);
  return calcMHVCToRGB(hue100, value, chroma, rgbSpace);
}

export function calcMHVCToRGB255(hue100, value, chroma, clamp = true, rgbSpace = RGBSPACE_SRGB) {
  const [r, g, b] = calcMHVCToRGB(hue100, value, chroma, rgbSpace);
  return calcRGBToRGB255(r, g, b, clamp);
}

export function calcMunsellToRGB255(munsellStr, clamp = true, rgbSpace = RGBSPACE_SRGB) {
  const [hue100, value, chroma] = calcMunsellToMHVC(munsellStr);
  return calcMHVCToRGB255(hue100, value, chroma, clamp, rgbSpace);
}

export function calcMHVCToHex(hue100, value, chroma, rgbSpace = RGBSPACE_SRGB) {
  return calcRGBToHex.apply(null, calcMHVCToRGB(hue100, value, chroma, rgbSpace));
}

export function calcMunsellToHex(munsellStr, rgbSpace = RGBSPACE_SRGB) {
  const [hue100, value, chroma] = calcMunsellToMHVC(munsellStr);
  return calcMHVCToHex(hue100, value, chroma, rgbSpace);
}

export function calcMHVCToMunsell(hue100, value, chroma, digits = 1) {
  const canonicalHue100 = mod(hue100, 100);
  const huePrefix = canonicalHue100 % 10;
  const hueNumber = Math.round((canonicalHue100 - huePrefix)/10);
  // If the hue prefix is 0, 10 is instead used with the previous hue name.
  const hueStr = (huePrefix === 0) ?
        Number(10).toFixed(Math.max(digits-1, 0)) + hueNames[mod(hueNumber-1, 10)] :
        huePrefix.toFixed(Math.max(digits-1, 0)) + hueNames[hueNumber];
  const chromaStr = chroma.toFixed(digits);
  const valueStr = value.toFixed(digits);
  if (parseFloat(chromaStr) === 0) {
    return `N ${valueStr}`;
  } else {
    return `${hueStr} ${valueStr}/${chromaStr}`;
  }
}

