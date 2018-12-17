import {clamp,
        circularDelta} from './arithmetic.js';
import {yToMunsellValueTable} from './y-to-value-table.js';

/**
 * Converts Y of XYZ to Munsell value. The round-trip error,
 * yToMunsellValue(munsellValueToY(V)), is guaranteed to be smaller than 1e-5 if
 * V is in [0, 10].
 * @param {number} Y - will be in [0, 1]. Clamped if it exceeds the interval.
 */
export function yToMunsellValue(Y) {
  const y1000 = clamp(Y, 0, 1) * 1000;
  const yFloor = Math.floor(y1000);
  const yCeil = Math.ceil(y1000);
  if (yFloor === yCeil) {
    return yToMunsellValueTable[yFloor];
  } else {
    return (yCeil - y1000) * yToMunsellValueTable[yFloor] +
      (y1000 - yFloor) * yToMunsellValueTable[yCeil];
  }
}

export function lToMunsellValue(lstar) {
}

export function invertMhvcToLchab (lstar, cstarab, hab, initHue100, initChroma, maxIteration = 200, ifReachMax = "error", factor = 0.5, threshold = 1e-6) {
}
