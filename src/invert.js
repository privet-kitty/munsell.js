import {clamp,
        mod,
        circularDelta} from './arithmetic.js';
import {yToMunsellValueTable} from './y-to-value-table.js';
import {lToY} from './colorspace.js';
import {mhvcToLchab,
        mhvcToMunsell} from './convert.js';

/**
 * Converts Y of XYZ to Munsell value. The round-trip error, abs(Y -
 * munsellValueToY(yToMunsellValue(Y)), is guaranteed to be smaller than 1e-5 if
 * Y is in [0, 1].
 * @param {number} Y - will be in [0, 1]. Clamped if it exceeds the interval.
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
 * @param {number} Y - will be in [0, 1]. Clamped if it exceeds the interval.
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
  case "as-is":
    return [hue100, value, chroma];
  default:
    throw new SyntaxError(`Unknown ifReachMax specifier: ${ifReachMax}`);
  }
}

/** */
export function lchabToMhvc(lstar, cstarab, hab, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return invertMhvcToLchab(lstar, cstarab, hab,
                           hab * 0.277777777778,
                           cstarab * 0.181818181818,
                           threshold,
                           maxIteration,
                           ifReachMax,
                           factor);
}

/** */
export function lchabToMunsell(lstar, cstarab, hab, threshold = 1e-6, maxIteration = 200, ifReachMax = "error", factor = 0.5) {
  return mhvcToMunsell(...lchabToMhvc(lstar, cstarab, hab, threshold, maxIteration, ifReachMax, factor));
}
