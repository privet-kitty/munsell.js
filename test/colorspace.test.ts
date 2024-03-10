import {
  labToXyz,
  xyzToLab,
  xyzToLinearRgb,
  linearRgbToXyz,
  linearRgbToRgb,
  rgbToLinearRgb,
  rgbToRgb255,
  rgb255ToRgb,
  rgbToHex,
  hexToRgb,
  ILLUMINANT_C,
  ILLUMINANT_D65,
  SRGB,
  ADOBE_RGB,
} from '../src/colorspace';
import { multMatrixMatrix, Vector3 } from '../src/arithmetic';
import { toNearlyEqual } from './jest-extension';

beforeEach(() => expect.extend({ toNearlyEqual }));

describe('Lab <-> XYZ', () => {
  test('boundary case', () => {
    expect(labToXyz(100, 0, 0, ILLUMINANT_C)).toNearlyEqual([ILLUMINANT_C.X, 1, ILLUMINANT_C.Z], 5);
    expect(xyzToLab(ILLUMINANT_D65.X, 1, ILLUMINANT_D65.Z)).toNearlyEqual([100, 0, 0], 5);
  });
  test('consistency with dufy', () => {
    expect(labToXyz(1, 1, 1)).toNearlyEqual(
      [0.0012962827110591009, 0.0011070564598794526, 5.063061751414016e-4],
      6,
    );
    expect(labToXyz(50, 10, 3)).toNearlyEqual(
      [0.19417300681355418, 0.18418651851244416, 0.1851153188341182],
      6,
    );
  });
  test('round-trip', () => {
    for (const XYZ of [
      [0, 0, 0],
      [0.1, 0.2, 0.3],
      [1, 0.5, 0.00001],
    ] as Array<Vector3>) {
      expect(labToXyz(...xyzToLab(...XYZ))).toNearlyEqual(XYZ, 10);
    }
  });
});

describe('built-in RGB spaces', () => {
  test('round-trip of gamma-correction', () => {
    for (const x of [0, 1e-6, -1e-5, 0.7, -0.8, 1, 1.8, -2.5]) {
      expect(SRGB.delinearizer(SRGB.linearizer(x))).toBeCloseTo(x, 10);
      expect(ADOBE_RGB.delinearizer(ADOBE_RGB.linearizer(x))).toBeCloseTo(x, 10);
    }
  });
});

describe('built-in illuminants', () => {
  test('round-trip of CAT', () => {
    for (const illum of [ILLUMINANT_D65, ILLUMINANT_C]) {
      const mat = multMatrixMatrix(illum.catMatrixCToThis, illum.catMatrixThisToC);
      expect(mat[0]).toNearlyEqual([1, 0, 0], 10);
      expect(mat[1]).toNearlyEqual([0, 1, 0], 10);
      expect(mat[2]).toNearlyEqual([0, 0, 1], 10);
    }
  });
});

describe('XYZ <-> liner RGB', () => {
  test('consistency with dufy (sRGB)', () => {
    expect(xyzToLinearRgb(0.1, 0.2, 0.3)).toNearlyEqual(
      [-0.1329496041195698, 0.29074078266626474, 0.28189274594473257],
      5,
    );
  });
  test('round-trip', () => {
    for (const XYZ of [
      [0, 0, 0],
      [0.1, 0.2, 0.3],
      [1, 0.5, -0.00001],
    ] as Array<Vector3>) {
      expect(linearRgbToXyz(...xyzToLinearRgb(...XYZ))).toNearlyEqual(XYZ, 10);
    }
  });
});

describe('linear RGB <-> gamma-corrected RGB', () => {
  test('consistency with dufy (sRGB)', () => {
    expect(linearRgbToRgb(0.002, 0.7, -0.2)).toNearlyEqual(
      [0.025840000000000002, 0.85430583154494, -0.48452920448170694],
      6,
    );
  });
  test('round-trip', () => {
    expect(linearRgbToRgb(...rgbToLinearRgb(0, 0.5, 1, ADOBE_RGB), ADOBE_RGB)).toNearlyEqual(
      [0, 0.5, 1],
      10,
    );
    expect(linearRgbToRgb(...rgbToLinearRgb(-1.2, 1e-3, 1.8))).toNearlyEqual([-1.2, 1e-3, 1.8], 10);
  });
});

describe('gamma-corrected RGB <-> quantized RGB', () => {
  test('clamp', () => {
    expect(rgbToRgb255(0.101, 1.1, -0.3)).toEqual([26, 255, 0]);
  });
  test('round-trip', () => {
    expect(rgbToRgb255(...rgb255ToRgb(200, -18, 300))).toEqual([200, 0, 255]);
  });
});

describe('gamma-corrected RGB <-> Hex code', () => {
  test('clamp', () => {
    expect(rgbToHex(0.101, 1.1, -0.3)).toEqual('#1aff00');
  });
  test('round-trip', () => {
    for (const hex of ['#FEDCBA', '#000000']) {
      expect(rgbToHex(...hexToRgb(hex)).toUpperCase()).toEqual(hex);
    }
  });
  test('12-bit hex', () => {
    expect(hexToRgb('#FE0')).toEqual([15 / 15, 14 / 15, 0]);
  });
  test('16-bit hex', () => {
    expect(hexToRgb('#FEDC')).toEqual([15 / 15, 14 / 15, 13 / 15]);
  });
  test('24-bit hex', () => {
    expect(hexToRgb('#01234567')).toEqual([1 / 255, 35 / 255, 69 / 255]);
  });
  test('32-bit hex', () => {
    expect(hexToRgb('#10203040')).toEqual([16 / 255, 32 / 255, 48 / 255]);
  });
  test('invalid-hex-length error', () => {
    expect(() => hexToRgb('#0000000')).toThrowError(SyntaxError);
  });
});
