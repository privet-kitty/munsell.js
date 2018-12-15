import {lchabToLab,
        labToLchab,
        labToXyz,
        xyzToLab,
        xyzToLinearRgb,
        linearRgbToXyz,
        linearRgbToRgb,
        rgbToRgb255,
        rgb255ToRgb,
        rgbToHex,
        hexToRgb,
        ILLUMINANT_C,
        ILLUMINANT_D65,
        SRGB,
        ADOBE_RGB} from '../src/colorspace.js';
import {multMatrixMatrix} from '../src/arithmetic.js';
import './jest-extension.js';

describe('Lab <-> LCHab', () => {
  test('boundary case', () => {
    expect(lchabToLab(1, 360)).toNearlyEqual([1, 0], 10);
    expect(lchabToLab(2, -90)).toNearlyEqual([0, -2], 10);
    expect(labToLchab(1, 0)).toNearlyEqual([1, 0], 10);
  })
  test('round-trip', () => {
    for (let ab of [[-3, 4], [3.9e10, 3.9e-10], [0, 0]]) {
      expect(lchabToLab.apply(null, labToLchab.apply(null, ab))).toNearlyEqual(ab, 10);
    }
  })
})

describe('Lab <-> XYZ', () => {
  test('boundary case', () => {
    expect(labToXyz(100, 0, 0, ILLUMINANT_C)).toNearlyEqual([ILLUMINANT_C.X, 1, ILLUMINANT_C.Z], 5);
    expect(xyzToLab(ILLUMINANT_D65.X, 1, ILLUMINANT_D65.Z)).toNearlyEqual([100, 0, 0], 5);
  })
  test('consistency with dufy', () => {
    expect(labToXyz(1, 1, 1)).toNearlyEqual([0.0012962827110591009, 0.0011070564598794526, 5.063061751414016e-4], 6);
    expect(labToXyz(50, 10, 3)).toNearlyEqual([0.19417300681355418, 0.18418651851244416, 0.1851153188341182],6);
  })
  test('round-trip', () => {
    for (let XYZ of [[0, 0, 0], [0.1, 0.2, 0.3], [1, 0.5, 0.00001]]) {
      expect(labToXyz.apply(null, xyzToLab.apply(null, XYZ))).toNearlyEqual(XYZ, 10);
    }
  })
})

describe('built-in RGB spaces', () => {
  test('round-trip of gamma-correction', () => {
    for (let x of [0, 1e-6, -1e-5, 0.7, -0.8, 1, 1.8, -2.5]) {
      expect(SRGB.delinearizer(SRGB.linearizer(x))).toBeCloseTo(x, 10);
      expect(ADOBE_RGB.delinearizer(ADOBE_RGB.linearizer(x))).toBeCloseTo(x, 10);
    }
  })
})
  
describe('XYZ <-> liner RGB', () => {
  test('consistency with dufy (sRGB)', () => {
    expect(xyzToLinearRgb(0.1, 0.2, 0.3)).toNearlyEqual([-0.1329496041195698, 0.29074078266626474, 0.28189274594473257], 5);
  })
  test('round-trip', () => {
    for (let XYZ of [[0, 0, 0], [0.1, 0.2, 0.3], [1, 0.5, -0.00001]]) {
      expect(linearRgbToXyz.apply(null, xyzToLinearRgb.apply(null, XYZ))).toNearlyEqual(XYZ, 10);
    }
  })
})

describe('linear RGB <-> gamma-corrected RGB', () => {
  test('consistency with dufy (sRGB)', () => {
    expect(linearRgbToRgb(0.002, 0.7, -0.2)).toNearlyEqual([0.025840000000000002, 0.85430583154494, -0.48452920448170694], 6);
  })
})

describe('gamma-corrected RGB <-> quantized RGB', () => {
  test('clamp', () => {
    expect(rgbToRgb255(0.101, 1.1, -0.3)).toEqual([26, 255, 0]);
  })
  test('round-trip', () => {
    expect(rgbToRgb255.apply(null, rgb255ToRgb(200, -18, 300))).toEqual([200, 0, 255]);
  })
})

describe('gamma-corrected RGB <-> Hex code', () => {
  test('clamp', () => {
    expect(rgbToHex(0.101, 1.1, -0.3)).toEqual("#1aff00");
  })
  test('round-trip', () => {
    for(let hex of ["#FEDCBA", "#000000"]) {
      expect(rgbToHex.apply(null, hexToRgb(hex)).toUpperCase()).toEqual(hex);
    }
  })
  test('12-bit hex', () => {
    expect(hexToRgb("#FE0")).toNearlyEqual([15/16, 14/16, 0], 10);
  })
  test('invalid-hex-length error', () => {
    expect(() => hexToRgb("#0000000")).toThrowError(SyntaxError);
  })
})
