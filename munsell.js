import * as MRD from './MRD.js'
import {functionF, calcLCHabToLab, calcLabToLCHab} from './basic_color_lib.js'
import {mod, circularLerp} from './circle_arithmetic.js'


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
  if (dark) {
    if (halfChroma <= 25) {
      return [MRD.mrdLTableDark[scaledValue],
              MRD.mrdCHTableDark[hue40][scaledValue][halfChroma][0],
              MRD.mrdCHTableDark[hue40][scaledValue][halfChroma][1]];
    } else {
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
      const hab = circularLerp(hue40 - hue1, hab1, hab2, 360)
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
    const [_, cstarab2, hab2] = calcMHVCToLCHabValueChromaIntegerCase(hue40, scaledValue, halfChroma2, dark);
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
    const [_, cstarab, hab] = calcMHVCToLCHabValueIntegerCase(hue40, 1, halfChroma, dark);
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

function clamp(x, min, max) {
  if (x < min)
    return min;
  else if (x > max)
    return max;
  return x;
}


/**
 * Converts Munsell HVC to LCHab.
 * @param {number} hue100 - is in the circle group R/100Z. Any real
 * number is accepted.
 * @param {number} value - should be in [0, 10]. Clamped if it exceeds the
 * interval.
 * @param {number} chroma - should be in [0, +inf). Assumed to be zero
 * if it is negative.
 * @returns [Array] LCHab
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


