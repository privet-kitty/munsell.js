import {
  polarToCartesian,
  cartesianToPolar,
  multMatrixVector,
  clamp,
  Vector3,
  Matrix33,
} from './arithmetic';

const CONST1 = 216 / 24389;
const CONST2 = 24389 / 27 / 116;
const CONST3 = 16 / 116;

export const functionF = (x: number): number => {
  // Called in XYZ -> Lab conversion
  if (x > CONST1) {
    return Math.pow(x, 0.3333333333333333);
  } else {
    return CONST2 * x + CONST3;
  }
};

export const labToLchab = (lstar: number, astar: number, bstar: number): Vector3 => {
  return [lstar, ...cartesianToPolar(astar, bstar, 360)];
};

export const lchabToLab = (lstar: number, Cstarab: number, hab: number): Vector3 => {
  return [lstar, ...polarToCartesian(Cstarab, hab, 360)];
};

export class Illuminant {
  X: number;
  Z: number;
  catMatrixCToThis: Matrix33;
  catMatrixThisToC: Matrix33;
  constructor(X: number, Z: number, catMatrixCToThis: Matrix33, catMatrixThisToC: Matrix33) {
    this.X = X;
    this.Z = Z;
    this.catMatrixCToThis = catMatrixCToThis;
    this.catMatrixThisToC = catMatrixThisToC;
  }
}

// The following data are based on dufy. I use the Bradford transformation as CAT.
export const ILLUMINANT_D65 = new Illuminant(
  0.950428061568676,
  1.08891545904089,
  [
    [0.9904112147597705, -0.00718628493839008, -0.011587161829988951],
    [-0.012395677058354078, 1.01560663662526, -0.0029181533414322086],
    [-0.003558889496942143, 0.006762494889396557, 0.9182865019746504],
  ],
  [
    [1.0098158523233767, 0.007060316533713093, 0.012764537821734395],
    [0.012335983421444891, 0.9846986027789835, 0.003284857773421468],
    [0.003822773174044815, -0.007224207660971385, 1.0890100329203007],
  ],
);
export const ILLUMINANT_C = new Illuminant(
  0.9807171421603395,
  1.182248923134197,
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
);

const DELTA = 6 / 29;
const CONST4 = 3 * DELTA * DELTA;

export const lToY = (lstar: number): number => {
  const fy = (lstar + 16) / 116;
  return fy > DELTA ? fy * fy * fy : (fy - CONST3) * CONST4;
};

export const labToXyz = (
  lstar: number,
  astar: number,
  bstar: number,
  illuminant = ILLUMINANT_D65,
): Vector3 => {
  const fy = (lstar + 16) / 116;
  const fx = fy + astar * 0.002;
  const fz = fy - bstar * 0.005;
  const Xw = illuminant.X;
  const Zw = illuminant.Z;
  return [
    fx > DELTA ? fx * fx * fx * Xw : (fx - CONST3) * CONST4 * Xw,
    fy > DELTA ? fy * fy * fy : (fy - CONST3) * CONST4,
    fz > DELTA ? fz * fz * fz * Zw : (fz - CONST3) * CONST4 * Zw,
  ];
};

export const xyzToLab = (X: number, Y: number, Z: number, illuminant = ILLUMINANT_D65): Vector3 => {
  const [fX, fY, fZ] = [X / illuminant.X, Y, Z / illuminant.Z].map(functionF);
  return [116 * fY - 16, 500 * (fX - fY), 200 * (fY - fZ)];
};

const createLinearizer = (gamma: number): ((x: number) => number) => {
  // Returns a function for inverse gamma-correction (not used for sRGB).
  const reciprocal = 1 / gamma;
  return (x) => {
    return x >= 0 ? Math.pow(x, reciprocal) : -Math.pow(-x, reciprocal);
  };
};

const createDelinearizer = (gamma: number): ((x: number) => number) => {
  // Returns a function for gamma correction (not used for sRGB).
  return (x) => {
    return x >= 0 ? Math.pow(x, gamma) : -Math.pow(-x, gamma);
  };
};

export class RGBSpace {
  matrixThisToXyz: Matrix33;
  matrixXyzToThis: Matrix33;
  linearizer: (x: number) => number;
  delinearizer: (x: number) => number;
  illuminant: Illuminant;
  constructor(
    matrixThisToXyz: Matrix33,
    matrixXyzToThis: Matrix33,
    linearizer = createLinearizer(2.2),
    delinearizer = createDelinearizer(2.2),
    illuminant = ILLUMINANT_D65,
  ) {
    this.matrixThisToXyz = matrixThisToXyz;
    this.matrixXyzToThis = matrixXyzToThis;
    this.linearizer = linearizer;
    this.delinearizer = delinearizer;
    this.illuminant = illuminant;
  }
}

const CONST5 = 0.0031308 * 12.92;

// The following data are based on dufy.
export const SRGB = new RGBSpace(
  [
    [0.4124319639872968, 0.3575780371782625, 0.1804592355313134],
    [0.21266023143094992, 0.715156074356525, 0.07218369421252536],
    [0.01933274831190452, 0.11919267905942081, 0.9504186404649174],
  ],
  [
    [3.240646461582504, -1.537229731776316, -0.49856099408961585],
    [-0.969260718909152, 1.876000564872059, 0.04155578980259398],
    [0.05563672378977863, -0.2040013205625215, 1.0570977520057931],
  ],
  (x) => {
    // Below is actually the linearizer of bg-sRGB.
    if (x > CONST5) {
      return Math.pow((0.055 + x) / 1.055, 2.4);
    } else if (x < -CONST5) {
      return -Math.pow((0.055 - x) / 1.055, 2.4);
    } else {
      return x / 12.92;
    }
  },
  (x) => {
    // Below is actually the delinearizer of bg-sRGB.
    if (x > 0.0031308) {
      return Math.pow(x, 1 / 2.4) * 1.055 - 0.055;
    } else if (x < -0.0031308) {
      return -Math.pow(-x, 1 / 2.4) * 1.055 + 0.055;
    } else {
      return x * 12.92;
    }
  },
);

export const ADOBE_RGB = new RGBSpace(
  [
    [0.5766645233146432, 0.18556215235063508, 0.18820138590339738],
    [0.29734264483411293, 0.6273768008045281, 0.07528055436135896],
    [0.027031149530373878, 0.07069034375262295, 0.991193965757893],
  ],
  [
    [2.0416039047109305, -0.5650114025085637, -0.3447340526026908],
    [-0.969223190031607, 1.8759279278672774, 0.04155418080089159],
    [0.01344622799042258, -0.11837953662156253, 1.015322039041507],
  ],
  createDelinearizer(563 / 256),
  createLinearizer(563 / 256),
);

export const xyzToLinearRgb = (X: number, Y: number, Z: number, rgbSpace = SRGB): Vector3 => {
  return multMatrixVector(rgbSpace.matrixXyzToThis, [X, Y, Z]);
};

export const linearRgbToXyz = (lr: number, lg: number, lb: number, rgbSpace = SRGB): Vector3 => {
  return multMatrixVector(rgbSpace.matrixThisToXyz, [lr, lg, lb]);
};

export const linearRgbToRgb = (lr: number, lg: number, lb: number, rgbSpace = SRGB): Vector3 => {
  return [lr, lg, lb].map(rgbSpace.delinearizer) as Vector3;
};

export const rgbToLinearRgb = (r: number, g: number, b: number, rgbSpace = SRGB): Vector3 => {
  return [r, g, b].map(rgbSpace.linearizer) as Vector3;
};

export const rgbToRgb255 = (r: number, g: number, b: number, clamp = true): Vector3 => {
  if (clamp) {
    return [r, g, b].map((x) => Math.max(Math.min(Math.round(x * 255), 255), 0)) as Vector3;
  } else {
    return [r, g, b].map((x) => Math.round(x * 255)) as Vector3;
  }
};

export const rgb255ToRgb = (r255: number, g255: number, b255: number): Vector3 => {
  return [r255 / 255, g255 / 255, b255 / 255];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#'.concat(
    [r, g, b]
      .map((x) => {
        const hex = clamp(Math.round(x * 255), 0, 255).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      })
      .join(''),
  );
};

export const hexToRgb = (hex: string): Vector3 => {
  const num = parseInt(hex.slice(1), 16);
  const length = hex.length;
  switch (length) {
    case 7: // #XXXXXX
      return [num >> 16, num >> 8, num].map((x) => (x & 0xff) / 255) as Vector3;
    case 4: // #XXX
      return [num >> 8, num >> 4, num].map((x) => (x & 0xf) / 15) as Vector3;
    case 9: // #XXXXXXXX
      return [num >> 24, num >> 16, num >> 8].map((x) => (x & 0xff) / 255) as Vector3;
    case 5: // #XXXX
      return [num >> 12, num >> 8, num >> 4].map((x) => (x & 0xf) / 15) as Vector3;
    default:
      throw SyntaxError(`The length of hex color is invalid: ${hex}`);
  }
};
