import * as MRD from './MRD';
import {
  functionF,
  lchabToLab,
  labToLchab,
  labToXyz,
  xyzToLinearRgb,
  linearRgbToRgb,
  rgbToRgb255,
  rgbToHex,
  ILLUMINANT_C,
  ILLUMINANT_D65,
  SRGB,
} from './colorspace';
import {
  mod,
  clamp,
  polarToCartesian,
  circularLerp,
  multMatrixVector,
  Vector3,
} from './arithmetic';

/**
 * @name mhvc
 * @global
 * @desc <code>mhvc</code>, or Munsell HVC, is a 3-number expression of Munsell
 * Color composed of [Hue, Value, Chroma]: e.g. <code>[94.2, 3.5, 11]</code>,
 * <code>[0, 10 ,0]</code>. Here Hue is in the circle group R/100Z: i.e. 0R (=
 * 10RP) corresponds to 0 (= 100 = 300 = -2000) and 2YR corresponds to 12 (= -88
 * = 412). Value is in the interval [0, 10] and the converters will clamp it if
 * a given value exceeds it. Chroma is non-negative and the converters will
 * assume it to be zero if a given chroma is negative. Note that every converter
 * accepts a huge chroma outside the Munsell Renotation Data (e.g. 1000000) and
 * returns a extrapolated result.
 */

/**
 * @name munsell
 * @global
 * @desc <code>munsell</code> is the standard string specification of the
 * Munsell Color: e.g. <code>"4.2RP 3.5/11"</code>, <code>"N 10"</code>. Here
 * various notations of numbers are accepted; an ugly specification like
 * <code>"2e-02RP .9/0xf"</code> (equivalent to <code>"0.02RP 0.9/15"</code>)
 * will be also available. However, the capital letters A-Z and the slash '/'
 * are reserved.
 */

/**
 * Converts Munsell value to Y (of XYZ) based on the formula in the ASTM
 * D1535-18e1.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @returns {number} Y
 */
export const munsellValueToY = (v: number): number => {
  return v * (1.1914 + v * (-0.22533 + v * (0.23352 + v * (-0.020484 + v * 0.00081939)))) * 0.01;
};

/**
 * Converts Munsell value to L* (of CIELAB).
 * @param v - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @returns {number} L*
 */
export const munsellValueToL = (v: number): number => {
  return 116 * functionF(munsellValueToY(v)) - 16;
};

// These converters process a dark color (value < 1) separately because the
// values of the Munsell Renotation Data (all.dat) are not evenly distributed:
// [0, 0.2, 0.4, 0.6, 0.8, 1, 2, 3, ..., 10].

// In the following functions, the actual value equals scaledValue/5 if dark is
// true; the actual chroma equals to halfChroma*2.

const mhvcToLchabAllIntegerCase = (
  hue40: number,
  scaledValue: number,
  halfChroma: number,
  dark = false,
): Vector3 => {
  // This function deals with the case where H, V, and C are all integers.
  // If chroma is larger than 50, C * ab is linearly extrapolated.

  // This function does no range checks: hue40 must be in {0, 1, ..., 39};
  // scaledValue must be in {0, 1, ..., 10} if dark is false, and {0, 1, ..., 6}
  // if dark is true; halfChroma must be a non-negative integer.
  if (dark) {
    // Value is in {0, 0.2, 0.4, 0.6, 0.8, 1}.
    if (halfChroma <= 25) {
      return [
        MRD.mrdLTableDark[scaledValue],
        MRD.mrdCHTableDark[hue40][scaledValue][halfChroma][0],
        MRD.mrdCHTableDark[hue40][scaledValue][halfChroma][1],
      ];
    } else {
      // Linearly extrapolates a color outside the MRD.
      const cstarab = MRD.mrdCHTableDark[hue40][scaledValue][25][0];
      const factor = halfChroma / 25;
      return [
        MRD.mrdLTableDark[scaledValue],
        cstarab * factor,
        MRD.mrdCHTableDark[hue40][scaledValue][25][1],
      ];
    }
  } else {
    if (halfChroma <= 25) {
      return [
        MRD.mrdLTable[scaledValue],
        MRD.mrdCHTable[hue40][scaledValue][halfChroma][0],
        MRD.mrdCHTable[hue40][scaledValue][halfChroma][1],
      ];
    } else {
      const cstarab = MRD.mrdCHTable[hue40][scaledValue][25][0];
      const factor = halfChroma / 25;
      return [
        MRD.mrdLTable[scaledValue],
        cstarab * factor,
        MRD.mrdCHTable[hue40][scaledValue][25][1],
      ];
    }
  }
};

// Deals with the case where V and C are integer.
const mhvcToLchabValueChromaIntegerCase = (
  hue40: number,
  scaledValue: number,
  halfChroma: number,
  dark = false,
): Vector3 => {
  const hue1 = Math.floor(hue40);
  const hue2 = mod(Math.ceil(hue40), 40);
  const [lstar, cstarab1, hab1] = mhvcToLchabAllIntegerCase(hue1, scaledValue, halfChroma, dark);
  if (hue1 === hue2) {
    return [lstar, cstarab1, hab1];
  } else {
    const [, cstarab2, hab2] = mhvcToLchabAllIntegerCase(hue2, scaledValue, halfChroma, dark);
    if (hab1 === hab2 || mod(hab2 - hab1, 360) >= 180) {
      // FIXME: was workaround for the rare
      // case hab1 exceeds hab2, which will be removed after some test.
      return [lstar, cstarab1, hab1];
    } else {
      const hab = circularLerp(hue40 - hue1, hab1, hab2, 360);
      const cstarab =
        (cstarab1 * mod(hab2 - hab, 360)) / mod(hab2 - hab1, 360) +
        (cstarab2 * mod(hab - hab1, 360)) / mod(hab2 - hab1, 360);
      return [lstar, cstarab, hab];
    }
  }
};

// Deals with the case where V is integer.
const mhvcToLchabValueIntegerCase = (
  hue40: number,
  scaledValue: number,
  halfChroma: number,
  dark = false,
): Vector3 => {
  const halfChroma1 = Math.floor(halfChroma);
  const halfChroma2 = Math.ceil(halfChroma);
  if (halfChroma1 === halfChroma2) {
    return mhvcToLchabValueChromaIntegerCase(hue40, scaledValue, halfChroma, dark);
  } else {
    const [lstar, cstarab1, hab1] = mhvcToLchabValueChromaIntegerCase(
      hue40,
      scaledValue,
      halfChroma1,
      dark,
    );
    const [, cstarab2, hab2] = mhvcToLchabValueChromaIntegerCase(
      hue40,
      scaledValue,
      halfChroma2,
      dark,
    );
    const [astar1, bstar1] = polarToCartesian(cstarab1, hab1, 360);
    const [astar2, bstar2] = polarToCartesian(cstarab2, hab2, 360);
    const astar = astar1 * (halfChroma2 - halfChroma) + astar2 * (halfChroma - halfChroma1);
    const bstar = bstar1 * (halfChroma2 - halfChroma) + bstar2 * (halfChroma - halfChroma1);
    return labToLchab(lstar, astar, bstar);
  }
};

const mhvcToLchabGeneralCase = (
  hue40: number,
  scaledValue: number,
  halfChroma: number,
  dark = false,
): Vector3 => {
  const actualValue = dark ? scaledValue * 0.2 : scaledValue;
  const scaledValue1 = Math.floor(scaledValue);
  const scaledValue2 = Math.ceil(scaledValue);
  const lstar = munsellValueToL(actualValue);
  if (scaledValue1 === scaledValue2) {
    return mhvcToLchabValueIntegerCase(hue40, scaledValue1, halfChroma, dark);
  } else if (scaledValue1 === 0) {
    // If the given color is so dark (V < 0.2) that it is out of MRD, we use the
    // fact that the chroma and hue of LCHab corresponds roughly to that of
    // Munsell.
    const [, cstarab, hab] = mhvcToLchabValueIntegerCase(hue40, 1, halfChroma, dark);
    return [lstar, cstarab, hab];
  } else {
    const [lstar1, cstarab1, hab1] = mhvcToLchabValueIntegerCase(
      hue40,
      scaledValue1,
      halfChroma,
      dark,
    );
    const [lstar2, cstarab2, hab2] = mhvcToLchabValueIntegerCase(
      hue40,
      scaledValue2,
      halfChroma,
      dark,
    );
    const [astar1, bstar1] = polarToCartesian(cstarab1, hab1, 360);
    const [astar2, bstar2] = polarToCartesian(cstarab2, hab2, 360);
    const astar =
      (astar1 * (lstar2 - lstar)) / (lstar2 - lstar1) +
      (astar2 * (lstar - lstar1)) / (lstar2 - lstar1);
    const bstar =
      (bstar1 * (lstar2 - lstar)) / (lstar2 - lstar1) +
      (bstar2 * (lstar - lstar1)) / (lstar2 - lstar1);
    return labToLchab(lstar, astar, bstar);
  }
};

/**
 * Converts Munsell HVC to LCHab. Note that the returned value is under
 * <strong>Illuminant C</strong>.
 * @param hue100 - is in the circle group R/100Z. Any real number is
 * accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero if it is
 * negative.
 * @returns {Array} [L*, C*ab, hab]
 */
export const mhvcToLchab = (hue100: number, value: number, chroma: number): Vector3 => {
  const hue40 = mod(hue100 * 0.4, 40);
  const value10 = clamp(value, 0, 10);
  const halfChroma = Math.max(0, chroma) * 0.5;
  if (value >= 1) {
    return mhvcToLchabGeneralCase(hue40, value10, halfChroma, false);
  } else {
    return mhvcToLchabGeneralCase(hue40, value10 * 5, halfChroma, true);
  }
};

const hueNames = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP'];

/**
 * Converts Munsell Color string to Munsell HVC.
 * @param munsellStr - is the standard Munsell Color code.
 * @returns {Array} [hue100, value, chroma]
 * @see munsell
 * @see mhvc
 */
export const munsellToMhvc = (munsellStr: string): Vector3 => {
  const nums = munsellStr
    .split(/[^a-z0-9.-]+/)
    .filter(Boolean)
    .map((str) => Number(str));
  const words = munsellStr.match(/[A-Z]+/);
  if (words === null) throw new SyntaxError(`Doesn't contain hue names: ${munsellStr}`);
  const hueName = words[0];
  const hueNumber = hueNames.indexOf(hueName);
  if (hueName === 'N') {
    return [0, nums[0], 0];
  } else if (nums.length !== 3) {
    throw new SyntaxError(`Doesn't contain 3 numbers: ${nums}`);
  } else if (hueNumber === -1) {
    // achromatic
    throw new SyntaxError(`Invalid hue designator: ${hueName}`);
  } else {
    return [hueNumber * 10 + nums[0], nums[1], nums[2]];
  }
};

/**
 * Converts Munsell Color string to LCHab. Note that the returned value is under
 * <strong>Illuminant C</strong>.
 * @param munsellStr - is the standard Munsell Color code.
 * @returns {Array} [L*, C*ab, hab]
 */
export const munsellToLchab = (munsellStr: string): Vector3 => {
  return mhvcToLchab(...munsellToMhvc(munsellStr));
};

/**
 * Converts Munsell HVC to CIELAB. Note that the returned value is under
 * <strong>Illuminant C</strong>.
 * @param hue100 - is in the circle group R/100Z. Any real number is
 * accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero if it is
 * negative.
 * @returns {Array} [L*, a*, b*]
 */
export const mhvcToLab = (hue100: number, value: number, chroma: number): Vector3 => {
  return lchabToLab(...mhvcToLchab(hue100, value, chroma));
};

/**
 * Converts Munsell Color string to CIELAB. Note that the returned value is under
 * <strong>Illuminant C</strong>.
 * @param munsellStr
 * @returns {Array} [L*, a*, b*]
 */
export const munsellToLab = (munsellStr: string): Vector3 => {
  return mhvcToLab(...munsellToMhvc(munsellStr));
};

/**
 * Converts Munsell HVC to XYZ.
 * @param hue100 - is in the circle group R/100Z. Any real number is
 * accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero if it is
 * negative.
 * @param [illuminant = ILLUMINANT_D65]
 * @returns {Array} [X, Y, Z]
 */
export const mhvcToXyz = (
  hue100: number,
  value: number,
  chroma: number,
  illuminant = ILLUMINANT_D65,
): Vector3 => {
  // Uses Bradford transformation
  return multMatrixVector(
    illuminant.catMatrixCToThis,
    labToXyz(...mhvcToLab(hue100, value, chroma), ILLUMINANT_C),
  );
};

/**
 * Converts Munsell Color string to XYZ.
 * @param munsellStr
 * @param [illuminant = ILLUMINANT_D65]
 * @returns {Array} [X, Y, Z]
 */
export const munsellToXyz = (munsellStr: string, illuminant = ILLUMINANT_D65): Vector3 => {
  return mhvcToXyz(...munsellToMhvc(munsellStr), illuminant);
};

/**
 * Converts Munsell HVC to linear RGB.
 * @param hue100 - is in the circle group R/100Z. Any real
 * number is accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds
 * the interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero
 * if it is negative.
 * @param [rgbSpace = SRGB]
 * @returns {Array} [linear R, linear G, linear B]
 */
export const mhvcToLinearRgb = (
  hue100: number,
  value: number,
  chroma: number,
  rgbSpace = SRGB,
): Vector3 => {
  return xyzToLinearRgb(...mhvcToXyz(hue100, value, chroma, rgbSpace.illuminant), rgbSpace);
};

/**
 * Converts Munsell Color string to linear RGB.
 * @param munsellStr
 * @param [rgbSpace = SRGB]
 * @returns {Array} [linear R, linear G, linear B]
 */
export const munsellToLinearRgb = (munsellStr: string, rgbSpace = SRGB): Vector3 => {
  return mhvcToLinearRgb(...munsellToMhvc(munsellStr), rgbSpace);
};

/**
 * Converts Munsell HVC to gamma-corrected RGB.
 * @param hue100 - is in the circle group R/100Z. Any real number is
 * accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero if it is
 * negative.
 * @param [rgbSpace = SRGB]
 * @returns {Array} [R, G, B]
 */
export const mhvcToRgb = (
  hue100: number,
  value: number,
  chroma: number,
  rgbSpace = SRGB,
): Vector3 => {
  return linearRgbToRgb(...mhvcToLinearRgb(hue100, value, chroma, rgbSpace), rgbSpace);
};

/**
 * Converts Munsell Color string to gamma-corrected RGB.
 * @param munsellStr
 * @param [rgbSpace = SRGB]
 * @returns {Array} [R, G, B]
 */
export const munsellToRgb = (munsellStr: string, rgbSpace = SRGB): Vector3 => {
  return mhvcToRgb(...munsellToMhvc(munsellStr), rgbSpace);
};

/**
 * Converts Munsell HVC to quantized RGB.
 * @param hue100 - is in the circle group R/100Z. Any real number is
 * accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero if it is
 * negative.
 * @param [clamp = true] - If true, the returned value will be clamped
 * to the range [0, 255].
 * @param [rgbSpace = SRGB]
 * @returns {Array} [R255, G255, B255]
 */
export const mhvcToRgb255 = (
  hue100: number,
  value: number,
  chroma: number,
  clamp = true,
  rgbSpace = SRGB,
): Vector3 => {
  return rgbToRgb255(...mhvcToRgb(hue100, value, chroma, rgbSpace), clamp);
};

/**
 * Converts Munsell Color string to quantized RGB.
 * @param munsellStr
 * @param [clamp = true] - If true, the returned value will be clamped
 * to the range [0, 255].
 * @param [rgbSpace = SRGB]
 * @returns {Array} [R255, G255, B255]
 */
export const munsellToRgb255 = (munsellStr: string, clamp = true, rgbSpace = SRGB): Vector3 => {
  return mhvcToRgb255(...munsellToMhvc(munsellStr), clamp, rgbSpace);
};

/**
 * Converts Munsell HVC to 24-bit hex color.
 * @param hue100 - is in the circle group R/100Z. Any real number is
 * accepted.
 * @param value - will be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param chroma - will be in [0, +inf). Assumed to be zero if it is
 * negative.
 * @param [rgbSpace = SRGB]
 * @returns {string} hex color "#XXXXXX"
 */
export const mhvcToHex = (
  hue100: number,
  value: number,
  chroma: number,
  rgbSpace = SRGB,
): string => {
  return rgbToHex(...mhvcToRgb(hue100, value, chroma, rgbSpace));
};

/**
 * Converts Munsell Color string to 24-bit hex color.
 * @param munsellStr
 * @param [rgbSpace = SRGB]
 * @returns {string} hex color "#XXXXXX"
 */
export const munsellToHex = (munsellStr: string, rgbSpace = SRGB): string => {
  return mhvcToHex(...munsellToMhvc(munsellStr), rgbSpace);
};

/**
 * Converts Munsell HVC to string. `N', the code for achromatic colors, is used
 * when the chroma becomes zero w.r.t. the specified number of digits.
 * @param hue100
 * @param value
 * @param chroma
 * @param [digits = 1] - is the number of digits after the decimal
 * point. Must be non-negative integer. Note that the units digit of the hue
 * prefix is assumed to be already after the decimal point.
 * @returns {string} Munsell Color code
 * @see mhvc
 * @see munsell
 */
export const mhvcToMunsell = (
  hue100: number,
  value: number,
  chroma: number,
  digits = 1,
): string => {
  const canonicalHue100 = mod(hue100, 100);
  const huePrefix = canonicalHue100 % 10;
  const hueNumber = Math.round((canonicalHue100 - huePrefix) / 10);
  // If the hue prefix is 0, 10 is used instead with the previous hue name.
  const hueStr =
    huePrefix === 0
      ? Number(10).toFixed(Math.max(digits - 1, 0)) + hueNames[mod(hueNumber - 1, 10)]
      : huePrefix.toFixed(Math.max(digits - 1, 0)) + hueNames[hueNumber];
  const chromaStr = chroma.toFixed(digits);
  const valueStr = value.toFixed(digits);
  if (parseFloat(chromaStr) === 0) {
    return `N ${valueStr}`;
  } else {
    return `${hueStr} ${valueStr}/${chromaStr}`;
  }
};
