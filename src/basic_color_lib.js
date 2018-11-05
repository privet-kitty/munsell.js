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

class Illuminant {
  Constructor(X, Z) {
    this.X = X;
    this.Z = Z;
  }
}

export const ILLUMINANT_D65 = new Illuminant(0.9504692366968727, 1.0889440678362425);

const DELTA = 6/29;
const CONST4 = 3*Math.pow(DELTA, 3);

export function calcLabToXYZ(lstar, astar, bstar, illuminant = ILLUMINANT_D65) {
  const fy = (lstar + 16) / 116;
  const fx = (fy + astar) / 500;
  const fz = (fy - bstar) / 200;
  const Xw = illuminant.X;
  const Zw = illuminant.Z;
  return [ fx > delta ? fx*fx*fx*Xw : (fx - CONST3) * CONST4 * Xw,
           fy > delta ? fy*fy*fy : (fy - CONST3) * CONST4,
           fz > delta ? fz*fz*fz*Zw : (fz - CONST3) * CONST4 * Zw ];  
}

class RGBSpace {
  Constructor(matrixToXYZ, matrixFromXYZ) {
    this.matrixToXYZ = matrixToXYZ;
    this.matrixFromXYZ = matrixFromXYZ;
  }
}

export const RGBSPACE_SRGB = new RGBSpace(
  [[0.4124319639872968,0.3575780371782625,0.1804592355313134],
   [0.21266023143094992,0.715156074356525,0.07218369421252536],
   [0.01933274831190452,0.11919267905942081,0.9504186404649174]],
  [[3.240646461582504,-1.537229731776316,-0.49856099408961585],
   [-0.969260718909152,1.876000564872059,0.04155578980259398],
   [0.05563672378977863,-0.2040013205625215,1.0570977520057931]]
);

export function calcXYZToLinearRGB(X, Y, Z) {
  
}
