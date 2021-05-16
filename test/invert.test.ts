import {
  yToMunsellValue,
  lToMunsellValue,
  lchabToMhvc,
  lchabToMunsell,
  labToMunsell,
  xyzToMunsell,
  linearRgbToMunsell,
  rgbToMunsell,
  rgb255ToMhvc,
  rgb255ToMunsell,
  hexToMunsell,
} from '../src/invert';
import {
  munsellValueToY,
  munsellValueToL,
  mhvcToLchab,
  munsellToXyz,
  munsellToLinearRgb,
  munsellToRgb,
  mhvcToRgb255,
  munsellToRgb255,
  munsellToHex,
} from '../src/convert';
import { SRGB, ADOBE_RGB, ILLUMINANT_C, ILLUMINANT_D65 } from '../src/colorspace';
import { Vector3 } from '../src/arithmetic';
import { toNearlyEqual } from './jest-extension';

beforeEach(() => expect.extend({ toNearlyEqual }));

describe('yToMunsellValue()', () => {
  test('clamp', () => {
    expect(yToMunsellValue(-1000000)).toBe(0);
    expect(yToMunsellValue(10.1)).toBe(10);
  });
  test('boundary case', () => {
    expect(yToMunsellValue(0)).toBe(0);
    expect(yToMunsellValue(1)).toBe(10);
  });
  test('round-trip', () => {
    for (const y of [0, 0.0003, 0.013503095272735743, 0.6333333]) {
      expect(munsellValueToY(yToMunsellValue(y))).toBeCloseTo(y, 5);
    }
  });
});

describe('lToMunsellValue()', () => {
  test('clamp', () => {
    expect(lToMunsellValue(-1000000)).toBe(0);
    expect(lToMunsellValue(100.1)).toBe(10);
  });
  test('boundary case', () => {
    expect(lToMunsellValue(0)).toBe(0);
    expect(lToMunsellValue(100)).toBe(10);
  });
  test('round-trip', () => {
    for (const l of [0, 0.03, 1.3503095272735743, 63.33333]) {
      expect(munsellValueToL(lToMunsellValue(l))).toBeCloseTo(l, 3);
    }
  });
});

describe('LCHab <-> Munsell HVC()', () => {
  test('round-trip', () => {
    for (const mhvc of [
      [80, 40, 20],
      [33.3333, 291.6667, 31.2778],
      [91.3, 85.1, 331.6],
    ] as Array<Vector3>) {
      expect(mhvcToLchab(...lchabToMhvc(...mhvc))).toNearlyEqual(mhvc, 3);
    }
  });
  test('round-trip (for negative hab)', () => {
    expect(mhvcToLchab(...lchabToMhvc(50.1, 50.1, -50.1))).toNearlyEqual([50.1, 50.1, 309.9], 3);
  });
});

const roughLchabToMhvc = (lstar: number, cstarab: number, hab: number): Vector3 => {
  return [hab * 0.277777777778, lToMunsellValue(lstar), cstarab * 0.181818181818];
};

describe('lchabToMhvc()', () => {
  test('achromatic', () => {
    expect(() => lchabToMhvc(20, 1e-3, 40, 1e-2, 0, 'error')).not.toThrow(Error);
  });
  test('black', () => {
    expect(() => lchabToMhvc(1e-3, 20, 40, 1e-2, 0, 'error')).not.toThrow(Error);
  });
  test('ifReachMax: signal error', () => {
    expect(() => lchabToMhvc(20, 30, 40, 1e-6, 1)).toThrow(Error);
  });
  test('ifReachMax: return initial value', () => {
    expect(lchabToMhvc(20, 30, 40, 1e-9, 0, 'init')).toEqual(roughLchabToMhvc(20, 30, 40));
    expect(lchabToMhvc(20, 30, 40, 1e-9, 1, 'init')).toEqual(roughLchabToMhvc(20, 30, 40));
  });
  test('ifReachMax: return value as is', () => {
    expect(lchabToMhvc(20, 30, 40, 1e-9, 0, 'last')).toEqual(roughLchabToMhvc(20, 30, 40));
    expect(lchabToMhvc(20, 30, 40, 1e-9, 1, 'last')).not.toEqual(roughLchabToMhvc(20, 30, 40));
  });
  test('invalid ifReachMax case', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => lchabToMhvc(20, 30, 40, 1e-9, 0, 'no such keyword' as any)).toThrow(SyntaxError);
  });
});

describe('lchabToMunsell()', () => {
  test('consistency with dufy', () => {
    expect(lchabToMunsell(1.444, 14.444, -144.444, 2)).toEqual('5.1BG 0.14/4.30');
    expect(lchabToMunsell(1.444, 14.444, -144.444)).toEqual('5BG 0.1/4.3');
  });
});

describe('labToMunsell()', () => {
  test('consistency with dufy', () => {
    expect(labToMunsell(1.444, 15.555, -155.555, 2)).toEqual('2.4PB 0.14/34.59');
    expect(labToMunsell(1.444, 15.555, -15555.555)).toEqual('1PB 0.1/3581.3');
  });
});

describe('XYZ <-> Munsell string', () => {
  test('round-trip', () => {
    expect(munsellToXyz(xyzToMunsell(0.6, 1e-4, 1.1, ILLUMINANT_D65, 10))).toNearlyEqual(
      [0.6, 1e-4, 1.1],
      4,
    );
    expect(
      munsellToXyz(xyzToMunsell(-0.2, 0.1, 0.8, ILLUMINANT_C, 10), ILLUMINANT_C),
    ).toNearlyEqual([-0.2, 0.1, 0.8], 4);
    expect(munsellToXyz(xyzToMunsell(0, 0, 0))).toNearlyEqual([0, 0, 0], 4);
    expect(
      munsellToXyz(xyzToMunsell(1, 1, 1, ILLUMINANT_C, 10, 1e-10), ILLUMINANT_C),
    ).toNearlyEqual([1, 1, 1], 4);
  });
});

describe('linear RGB <-> Munsell string', () => {
  test('round-trip', () => {
    expect(munsellToLinearRgb(linearRgbToMunsell(-0.2, 1e-4, 1.1, SRGB, 10))).toNearlyEqual(
      [-0.2, 1e-4, 1.1],
      4,
    );
    expect(
      munsellToLinearRgb(linearRgbToMunsell(-0.2, 0.1, 0.8, ADOBE_RGB, 10), ADOBE_RGB),
    ).toNearlyEqual([-0.2, 0.1, 0.8], 4);
    expect(munsellToLinearRgb(linearRgbToMunsell(0, 0, 0))).toNearlyEqual([0, 0, 0], 4);
    expect(munsellToLinearRgb(linearRgbToMunsell(1, 1, 1, SRGB, 10))).toNearlyEqual([1, 1, 1], 4);
  });
});

describe('gamma-corrected RGB <-> Munsell string', () => {
  test('round-trip', () => {
    expect(munsellToRgb(rgbToMunsell(-0.2, 1e-4, 1.1, SRGB, 10))).toNearlyEqual(
      [-0.2, 1e-4, 1.1],
      4,
    );
    expect(munsellToRgb(rgbToMunsell(-0.2, 0.1, 0.8, ADOBE_RGB, 10), ADOBE_RGB)).toNearlyEqual(
      [-0.2, 0.1, 0.8],
      4,
    );
    expect(munsellToRgb(rgbToMunsell(0, 0, 0))).toNearlyEqual([0, 0, 0], 4);
    expect(munsellToRgb(rgbToMunsell(1, 1, 1, SRGB, 10))).toNearlyEqual([1, 1, 1], 4);
  });
});

describe('quantized RGB <-> Munsell HVC', () => {
  test('round-trip', () => {
    expect(mhvcToRgb255(...rgb255ToMhvc(-10, 20, 30))).toEqual([0, 20, 30]);
    expect(mhvcToRgb255(...rgb255ToMhvc(-10, 250, 270, ADOBE_RGB), false, ADOBE_RGB)).toEqual([
      -10, 250, 270,
    ]);
  });
});

describe('quantized RGB <-> Munsell string', () => {
  test('round-trip', () => {
    expect(munsellToRgb255(rgb255ToMunsell(-12, 34, 260, SRGB, 10), false)).toEqual([-12, 34, 260]);
    expect(munsellToRgb255(rgb255ToMunsell(-12, 34, 56, ADOBE_RGB, 10), true, ADOBE_RGB)).toEqual([
      0, 34, 56,
    ]);
    expect(munsellToRgb255(rgb255ToMunsell(0, 0, 0))).toEqual([0, 0, 0]);
    expect(munsellToRgb255(rgb255ToMunsell(255, 255, 255))).toEqual([255, 255, 255]);
  });
});

describe('rgb255ToMunsell()', () => {
  test('achromatic', () => {
    expect(rgb255ToMunsell(0, 0, 0, SRGB, 1)).toEqual('N 0.0');
    expect(rgb255ToMunsell(255, 255, 255, ADOBE_RGB, 2)).toEqual('N 10.00');
  });
});

describe('hex <-> Munsell string', () => {
  test('round-trip', () => {
    expect(munsellToHex(hexToMunsell('#fedcba', SRGB, 10))).toEqual('#fedcba');
    expect(munsellToHex(hexToMunsell('#fed', SRGB, 10))).toEqual('#ffeedd');
    expect(munsellToHex(hexToMunsell('#fedcba98', SRGB, 10))).toEqual('#fedcba');
    expect(munsellToHex(hexToMunsell('#fedc', SRGB, 10))).toEqual('#ffeedd');
    expect(munsellToHex(hexToMunsell('#012345', ADOBE_RGB, 10), ADOBE_RGB)).toEqual('#012345');
    expect(munsellToHex(hexToMunsell('#000000'))).toEqual('#000000');
    expect(munsellToHex(hexToMunsell('#ffffff'))).toEqual('#ffffff');
  });
});
