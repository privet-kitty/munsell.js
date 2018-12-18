// -*- coding: utf-8 -*-
import {clamp,
        mod,
        circularDelta,
        multMatrixVector} from './arithmetic.js';
import {yToMunsellValueTable} from './y-to-value-table.js';
import {lToY,
        labToLchab,
        xyzToLab,
        linearRgbToXyz,
        rgbToLinearRgb,
        rgb255ToRgb,
        hexToRgb,
        ILLUMINANT_C,
        ILLUMINANT_D65,
        SRGB} from './colorspace.js';
import {mhvcToLchab,
        mhvcToMunsell} from './convert.js';

/**
 * Converts Y of XYZ to Munsell value. The round-trip error, abs(Y -
 * munsellValueToY(yToMunsellValue(Y)), is guaranteed to be smaller than 1e-5 if
 * Y is in [0, 1].
 * @param {number} Y - will be in [0, 1]. Clamped if it exceeds the interval.
 * @returns {number} Munsell value
 */
export function yToMunsellValue(Y) {
  const y2000 = clamp(Y, 0, 1) * 2000;
  const yFloor = Math.floor(y2000);
  const yCeil = Math.ceil(y2000);
  if (yFloor === yCeil) {
    return yToMunsellValueTable[yFloor];
  } else {
    return (yCeil - y2000) * yToMunsellValueTable[yFloor] +
      (y2000 - yFloor) * yToMunsellValueTable[yCeil];
  }
}

/**
 * Converts L* of CIELAB to Munsell value. The round-trip error, abs(L* -
 * munsellValueToL(lToMunsellValue(L*)), is guaranteed to be smaller than 1e-3
 * if L* is in [0, 100].
 * @param {number} lstar - will be in [0, 100]. Clamped if it exceeds the
 * interval.
 * @returns {number} Munsell value
 */
export function lToMunsellValue(lstar) {
  return yToMunsellValue(lToY(lstar));
}

function invertMhvcToLchab (lstar, cstarab, hab, initHue100, initChroma, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  const value = lToMunsellValue(lstar);
  if (value <= threshold || initChroma <= threshold) {
    return [initHue100, value, initChroma];
  }
  let hue100 = initHue100;
  let chroma = initChroma;
  for (let i = 0; i < maxIteration; i++) {
    const [, tmp_cstarab, tmp_hab] = mhvcToLchab(hue100, value, chroma);
    const d_cstarab = cstarab - tmp_cstarab;
    const d_hab = circularDelta(hab, tmp_hab, 360);
    const d_hue100 = d_hab * 0.277777777778; // 100/360
    const d_chroma = d_cstarab * 0.181818181818; // 1/5.5
    if (Math.abs(d_hue100) <= threshold &&
        Math.abs(d_chroma) <= threshold) {
      return [mod(hue100, 100), value, chroma];
    } else {
      hue100 += factor * d_hue100;
      chroma = Math.max(0, chroma + factor * d_chroma);
    }
  }
  // If loop finished without achieving the required accuracy:
  switch (ifReachMax) {
  case "error":
    throw new Error("invertMhvcToLchab() reached maxIteration without achieving the required accuracy.");
  case "init":
    return [initHue100, value, initChroma];
  case "last":
    return [hue100, value, chroma];
  default:
    throw new SyntaxError(`Unknown ifReachMax specifier: ${ifReachMax}`);
  }
}

/**
 * Converts LCHab to Munsell HVC by inverting {@link mhvcToLchab}() with a simple
 * iteration algorithm, which is almost the same as the one in "An Open-Source
 * Inversion Algorithm for the Munsell Renotation" by Paul Centore, 2011:

 * <ul>
 * <li>V := {@link lToMunsellValue}(L*);</li>
 * <li>C<sub>0</sub> := C*<sub>ab</sub> / 5.5;</li>
 * <li>H<sub>0</sub> := h<sub>ab</sub> / 9;</li>
 * <li>C<sub>n+1</sub> := C<sub>n</sub> + factor * ΔC<sub>n</sub>;</li>
 * <li>H<sub>n+1</sub> :=  H<sub>n</sub> + factor * ΔH<sub>n</sub>.</li>
 * </ul>

 * <p>ΔH<sub>n</sub> and ΔC<sub>n</sub> are internally calculated at every
 * step. This function returns Munsell HVC values if C<sub>0</sub> ≦ threshold
 * or if V ≦ threshold or when max(ΔH<sub>n</sub>, ΔC<sub>n</sub>) falls
 * below threshold.

 * <p> <var>ifReachMax</var> specifies the action to be taken if the loop
 * reaches the maxIteration as follows:
 * <ul>
 * <li>"error": Throws Error;</li>
 * <li>"init": Returns the initial rough approximation.</li>
 * <li>"last": Returns the last approximation.</li>
 * </ul>

 * Note that the given values are assumed to be under <strong>Illuminant
 * C</strong>.
 * @param {number} lstar
 * @param {number} cstarab
 * @param {number} hab
 * @param {number} [threshold = 1e-6]
 * @param {number} [maxIteration = 200]
 * @param {string} [ifReachMax = "error"]
 * @param {number} [factor = 0.5]
 * @returns {Array} [Hue, Value, Chroma]
 */
export function lchabToMhvc(lstar, cstarab, hab, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return invertMhvcToLchab(lstar, cstarab, hab,
                           hab * 0.277777777778,
                           cstarab * 0.181818181818,
                           threshold,
                           maxIteration,
                           ifReachMax,
                           factor);
}

/**
 * Converts LCHab to Munsell string. Note that the given values are assumed to
 * be under <strong>Illuminant C</strong>.
 * @param {number} lstar
 * @param {number} cstarab
 * @param {number} hab
 * @param {number} [digits = 1] is the number of digits after the decimal
 * point. Must be non-negative integer. Note that the units digit of the hue
 * prefix is assumed to be already after the decimal point.
 * @param {number} [threshold = 1e-6]
 * @param {number} [maxIteration = 200]
 * @param {string} [ifReachMax = "error"]
 * @param {number} [factor = 0.5]
 * @returns {string} Munsell Color code
 * @see lchabToMhvc
 */
export function lchabToMunsell(lstar, cstarab, hab, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...lchabToMhvc(lstar, cstarab, hab, threshold, maxIteration, ifReachMax, factor), digits);
}

/**
 * Converts CIELAB to Munsell HVC. Note that the given values are assumed to be
 * under <strong>Illuminant C</strong>.
 * @param {number} lstar
 * @param {number} astar
 * @param {number} bstar
 * @param {number} [threshold = 1e-6]
 * @param {number} [maxIteration = 200]
 * @param {string} [ifReachMax = "error"]
 * @param {number} [factor = 0.5]
 * @returns {Array} [Hue, Value, Chroma]
 * @see lchabToMhvc
 */
export function labToMhvc(lstar, astar, bstar, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return lchabToMhvc(...labToLchab(lstar, astar, bstar), threshold, maxIteration, ifReachMax, factor);
}

/**
 * Converts CIELAB to Munsell Color string. Note that the given values are assumed to
 * be under <strong>Illuminant C</strong>.
 * @param {number} lstar
 * @param {number} astar
 * @param {number} bstar
 * @param {number} [digits = 1] is the number of digits after the decimal
 * point. Must be non-negative integer. Note that the units digit of the hue
 * prefix is assumed to be already after the decimal point.
 * @param {number} [threshold = 1e-6]
 * @param {number} [maxIteration = 200]
 * @param {string} [ifReachMax = "error"]
 * @param {number} [factor = 0.5]
 * @returns {string} Munsell Color code
 * @see lchabToMhvc
 */
export function labToMunsell(lstar, astar, bstar, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...labToMhvc(lstar, astar, bstar, threshold, maxIteration, ifReachMax, factor), digits);
}

/**
 * Converts XYZ to Munsell HVC, where Bradford transformation is used as CAT.
 * @see lchabToMhvc
 */
export function xyzToMhvc(X, Y, Z, illuminant = ILLUMINANT_D65, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return labToMhvc(...xyzToLab(...multMatrixVector(illuminant.catMatrixThisToC,
                                                   [X, Y, Z]),
                               ILLUMINANT_C),
                   threshold,
                   maxIteration,
                   ifReachMax,
                   factor);
}

/**
 * Converts XYZ to Munsell Color string, where Bradford transformation is used
 * as CAT.
 * @see lchabToMhvc
 */
export function xyzToMunsell(X, Y, Z, illuminant = ILLUMINANT_D65, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...xyzToMhvc(X, Y, Z, illuminant, threshold, maxIteration, ifReachMax, factor), digits);
}

/**
 * Converts linear RGB to Munsell HVC.
 * @see lchabToMhvc
 */
export function linearRgbToMhvc(lr, lg, lb, rgbSpace = SRGB, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return xyzToMhvc(...linearRgbToXyz(lr, lg, lb, rgbSpace), rgbSpace.illuminant, threshold, maxIteration, ifReachMax, factor);
}

/**
 * Converts linear RGB to Munsell Color string.
 * @see lchabToMhvc
 */
export function linearRgbToMunsell(lr, lg, lb, rgbSpace = SRGB, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...linearRgbToMhvc(lr, lg, lb, rgbSpace, threshold, maxIteration, ifReachMax, factor), digits);
}

/**
 * Converts gamma-corrected RGB to Munsell HVC.
 * @see lchabToMhvc
 */
export function rgbToMhvc(r, g, b, rgbSpace = SRGB, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return linearRgbToMhvc(...rgbToLinearRgb(r, g, b, rgbSpace), rgbSpace, threshold, maxIteration, ifReachMax, factor);
}

/**
 * Converts gamma-corrected RGB to Munsell Color string.
 * @see lchabToMhvc
 */
export function rgbToMunsell(r, g, b, rgbSpace = SRGB, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...rgbToMhvc(r, g, b, rgbSpace, threshold, maxIteration, ifReachMax, factor), digits);
}

/**
 * Converts quantized RGB to Munsell HVC.
 * @see lchabToMhvc
 */
export function rgb255ToMhvc(r255, g255, b255, rgbSpace = SRGB, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return rgbToMhvc(...rgb255ToRgb(r255, g255, b255), rgbSpace, threshold, maxIteration, ifReachMax, factor);
}

/**
 * Converts quantized RGB to Munsell Color string.
 * @see lchabToMhvc
 */
export function rgb255ToMunsell(r255, g255, b255, rgbSpace = SRGB, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...rgb255ToMhvc(r255, g255, b255, rgbSpace, threshold, maxIteration, ifReachMax, factor), digits);
}

/**
 * Converts Hex code to Munsell HVC.
 * @param {number} hex
 * @param {RGBSpace} [rgbSpace = SRGB]
 * @param {number} [threshold = 1e-6]
 * @param {number} [maxIteration = 200]
 * @param {string} [ifReachMax = "error"]
 * @param {number} [factor = 0.5]
 * @returns {Array} [Hue, Value, Chroma]
 * @see lchabToMhvc
 */
export function hexToMhvc(hex, rgbSpace = SRGB, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return rgbToMhvc(...hexToRgb(hex), rgbSpace, threshold, maxIteration, ifReachMax, factor);
}

/**
 * Converts Hex code to Munsell Color string.
 * @param {number} hex
 * @param {RGBSpace} [rgbSpace = SRGB]
 * @param {number} [digits = 1] is the number of digits after the decimal
 * point. Must be non-negative integer. Note that the units digit of the hue
 * prefix is assumed to be already after the decimal point.
 * @param {number} [threshold = 1e-6]
 * @param {number} [maxIteration = 200]
 * @param {string} [ifReachMax = "error"]
 * @param {number} [factor = 0.5]
 * @returns {string} Munsell Color code
 * @see lchabToMhvc
 */
export function hexToMunsell(hex, rgbSpace = SRGB, digits = 1, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...hexToMhvc(hex, rgbSpace, threshold, maxIteration, ifReachMax, factor), digits);
}
