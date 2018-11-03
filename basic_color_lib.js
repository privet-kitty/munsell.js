import {TWO_PI, mod} from './circle_arithmetic.js'

const CONST1 = 216/24389;
const CONST2 = 24389/27/116;
const CONST3 = 16/116;

export function functionF(x) {
  if (x > CONST1) {
    return Math.pow(x, 0.3333333333333333);
  } else {
    return CONST2 * x + CONST3;
  }
}
      
export function calcLabToLCHab(astar, bstar) {
  // Omits L*.
  return [Math.sqrt((astar*astar) + (bstar*bstar)),
          mod((Math.atan2(bstar, astar) / TWO_PI) * 360, 360)];
}

export function calcLCHabToLab(cstarab, hab) {
  // Omits L*.
  const hue2PI = (hab / 360) * TWO_PI;
  return [cstarab * Math.cos(hue2PI), cstarab * Math.sin(hue2PI)];
}

