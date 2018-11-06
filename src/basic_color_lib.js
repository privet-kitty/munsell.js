import {TWO_PI, mod} from './circle_arithmetic.js';

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
  constructor(X, Z) {
    this.X = X;
    this.Z = Z;
  }
}

export const ILLUMINANT_D65 = new Illuminant(0.9504692366968727, 1.0889440678362425);
export const ILLUMINANT_C = new Illuminant(0.980705971659919, 1.1822494939271255);

const DELTA = 6/29;
const CONST4 = 3*Math.pow(DELTA, 3);

export function calcLabToXYZ(lstar, astar, bstar, illuminant = ILLUMINANT_D65) {
  const fy = (lstar + 16) / 116;
  const fx = fy + astar * 0.002;
  const fz = fy - bstar * 0.005;
  const Xw = illuminant.X;
  const Zw = illuminant.Z;
  return [ fx > DELTA ? fx*fx*fx*Xw : (fx - CONST3) * CONST4 * Xw,
           fy > DELTA ? fy*fy*fy : (fy - CONST3) * CONST4,
           fz > DELTA ? fz*fz*fz*Zw : (fz - CONST3) * CONST4 * Zw ];  
}

function genLinearizer(gamma) {
  // Returns a function for gamma-correction (not for sRGB).
  const reciprocal = 1/gamma;
  return (x) => {
    return x >= 0 ? Math.pow(x, reciprocal) : -Math.pow(-x, reciprocal);
  };
}

function genDelinearizer(gamma) {
  // Returns a function for linearization (not for sRGB).
  return (x) => {
    return x >= 0 ? Math.pow(x, gamma) : -Math.pow(-x, gamma);
  };
}

class RGBSpace {
  constructor(matrixToXYZ, matrixFromXYZ,
              linearizer = genLinearizer(2.2), delinearizer = genDelinearizer(2.2)) {
    this.matrixToXYZ = matrixToXYZ;
    this.matrixFromXYZ = matrixFromXYZ;
    this.linearizer = linearizer;
    this.delinearizer = delinearizer;
  }
}

// Only the following two kinds of multiplication are necessary.
function multMatrixVector(A, x) {
  return [[A[0][0]*x[0]+A[0][1]*x[1]+A[0][2]*x[2]],
          [A[1][0]*x[0]+A[1][1]*x[1]+A[1][2]*x[2]],
          [A[2][0]*x[0]+A[2][1]*x[1]+A[2][2]*x[2]]];    
}

function multMatrixMatrix(A, B) {
  return [[A[0][0]*B[0][0]+A[0][1]*B[1][0]+A[0][2]*B[2][0],
           A[0][0]*B[0][1]+A[0][1]*B[1][1]+A[0][2]*B[2][1],
           A[0][0]*B[0][2]+A[0][1]*B[1][2]+A[0][2]*B[2][2]]
          ,
          [A[1][0]*B[0][0]+A[1][1]*B[1][0]+A[1][2]*B[2][0],
           A[1][0]*B[0][1]+A[1][1]*B[1][1]+A[1][2]*B[2][1],
           A[1][0]*B[0][2]+A[1][1]*B[1][2]+A[1][2]*B[2][2]]
          ,
          [A[2][0]*B[0][0]+A[2][1]*B[1][0]+A[2][2]*B[2][0],
           A[2][0]*B[0][1]+A[2][1]*B[1][1]+A[2][2]*B[2][1],
           A[2][0]*B[0][2]+A[2][1]*B[1][2]+A[2][2]*B[2][2]]
         ];
}

const CONST5 = 0.0031308*12.92;

export const RGBSPACE_SRGB = new RGBSpace(
  // These data are based on dufy.
  [[0.4124319639872968,0.3575780371782625,0.1804592355313134],
   [0.21266023143094992,0.715156074356525,0.07218369421252536],
   [0.01933274831190452,0.11919267905942081,0.9504186404649174]],
  [[3.240646461582504,-1.537229731776316,-0.49856099408961585],
   [-0.969260718909152,1.876000564872059,0.04155578980259398],
   [0.05563672378977863,-0.2040013205625215,1.0570977520057931]],
  (x) => {
    if (x > CONST5) {
      return Math.pow ((0.055 + x) / 1.055, 2.4);
    } else if (x < -CONST5) {
      return - Math.pow ((0.055 - 1) / 1.055, 2.4);
    } else {
      return x / 12.92;
    }
  },
  (x) => {
    if (x > 0.0031308) {
      return Math.pow(x, 1/2.4) * 1.055 - 0.055;
    } else if (x < -0.0031308) {
      return - Math.pow(-x, 1/2.4) * 1.055 + 0.055;
    } else {
      return x * 12.92;
    }
  }
);

export function calcXYZToLinearRGB(X, Y, Z, space = RGBSPACE_SRGB) {
  return multMatrixVector(space.matrixFromXYZ, [X, Y, Z]);
}

export function calcLinearRGBToRGB(lr, lg, lb, space = RGBSPACE_SRGB) {
  return [lr, lg, lb].map(space.delinearizer);
}


export function calcRGBToQuantizedRGB(r, g, b, clamp = true, bitPerChannel = 8) {
  const qmax = (2 << (bitPerChannel - 1)) - 1;
  if (clamp) {
    return [r, g, b].map((x) => Math.max(Math.min(Math.round(x * qmax), qmax), 0));
  } else {
    return [r, g, b].map((x) => Math.round(x * qmax));
  }
}

function clamp(x, min, max) {
  if (x < min)
    return min;
  else if (x > max)
    return max;
  return x;
}

export function calcRGBToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => {
    const hex = clamp(Math.round(x * 255), 0, 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}
