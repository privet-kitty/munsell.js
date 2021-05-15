import {
  munsellValueToL,
  mhvcToLchab,
  munsellToMhvc,
  munsellToLchab,
  munsellToLab,
  mhvcToXyz,
  munsellToXyz,
  munsellToLinearRgb,
  munsellToRgb,
  munsellToRgb255,
  munsellToHex,
  mhvcToMunsell,
} from '../src/convert';
import { ILLUMINANT_C, SRGB, ADOBE_RGB } from '../src/colorspace';
import { toNearlyEqual } from './jest-extension';

beforeEach(() => expect.extend({ toNearlyEqual }));

describe('munsellValueToL()', () => {
  test('boundary case', () => {
    expect(munsellValueToL(10)).toBeCloseTo(100, 10);
    expect(munsellValueToL(0)).toEqual(0);
  });
});

describe('mhvcToLchab()', () => {
  test('zero case', () => {
    expect(mhvcToLchab(-300, 0, 0).splice(0, 2)).toEqual([0, 0]);
  });
});

describe('munsellToMhvc()', () => {
  test('not-3-number error', () => {
    expect(() => munsellToMhvc('RP 5.3')).toThrowError(SyntaxError);
  });
  test('invalid-hue-designator error', () => {
    expect(() => munsellToMhvc('8PP 4.3/5.2')).toThrowError(SyntaxError);
  });
  test('achromatic', () => {
    expect(munsellToMhvc('N 10')).toEqual([0, 10, 0]);
  });
  test('negative hue prefix', () => {
    expect(munsellToMhvc('-18Y 10/2')).toEqual(munsellToMhvc('2R 10/2'));
  });
});

describe('mhvcToMunsell()', () => {
  test('achromatic', () => {
    expect(mhvcToMunsell(-238492.33, 2, 0.004, 2)).toBe('N 2.00');
  });
  test('number of digits', () => {
    expect(mhvcToMunsell(1.234, 2.1166, 11.255, 3)).toBe('1.23R 2.117/11.255');
  });
  test('not 0 but 10 is used as hue prefix', () => {
    expect(mhvcToMunsell(100, 2, 3)).toBe('10RP 2.0/3.0');
  });
  test('hue outside [0, 100]', () => {
    expect(mhvcToMunsell(-1089, 100, 1000)).toBe('1YR 100.0/1000.0');
  });
  test('zero digits case', () => {
    expect(mhvcToMunsell(1.23, 4.1, 6.7, 0)).toBe('1R 4/7');
  });
});

describe('mhvcToLchab()', () => {
  test('extrapolation (V < 0.2)', () => {
    expect(mhvcToLchab(0, 0.1, 0.5)).toNearlyEqual(
      [1.0579241958909762, 3.575933774382648, 341.9999157759378],
      4,
    );
  });
});

describe('munsellToLchab()', () => {
  test('all integer case', () => {
    expect(munsellToLchab('10RP 1/2')).toNearlyEqual(
      [10.408445518542798, 12.62469571978245, 350.56362148026216],
      4,
    );
  });
  test('all integer case (dark)', () => {
    expect(munsellToLchab('10RP 0.2/2')).toNearlyEqual(
      [2.08753985167084, 14.303735097530591, 341.9999157759378],
      4,
    );
  });
});

describe('munsellToLab()', () => {
  test('boundary case', () => {
    expect(munsellToLab('N 10')).toNearlyEqual([100, 0, 0], 8);
    expect(munsellToLab('N 0')).toNearlyEqual([0, 0, 0], 8);
  });
});

describe('mhvcToXyz()', () => {
  test('consistency with dufy (Illuminant D65)', () => {
    expect(mhvcToXyz(0, 2.18, 3.1)).toNearlyEqual(
      [0.04407256823883116, 0.03510249845936815, 0.038100157923138124],
      6,
    );
  });
});

describe('munsellToXyz()', () => {
  test('consistency with dufy (Illuminant D65)', () => {
    expect(munsellToXyz('10RP 2.18/3.1')).toNearlyEqual(
      [0.04407256823883116, 0.03510249845936815, 0.038100157923138124],
      6,
    );
  });
  test('consistency with dufy (Illuminant C)', () => {
    expect(munsellToXyz('2.1YR 0.95/52.1', ILLUMINANT_C)).toNearlyEqual(
      [0.3160051332270124, 0.011126335673373787, -0.04901459409007915],
      6,
    );
  });
});

describe('munsellToLinearRgb()', () => {
  test('boundary case', () => {
    expect(munsellToLinearRgb('N 10', ADOBE_RGB)).toNearlyEqual([1, 1, 1], 10);
    expect(munsellToLinearRgb('N 0', SRGB)).toNearlyEqual([0, 0, 0], 10);
  });
});

describe('munsellToRgb()', () => {
  test('boundary case', () => {
    expect(munsellToRgb('N 10', ADOBE_RGB)).toNearlyEqual([1, 1, 1], 10);
    expect(munsellToRgb('N 0', SRGB)).toNearlyEqual([0, 0, 0], 10);
  });
});

describe('munsellToRgb255()', () => {
  test('boundary case', () => {
    expect(munsellToRgb255('N 0', false)).toEqual([0, 0, 0]);
    expect(munsellToRgb255('N 10', false, ADOBE_RGB)).toEqual([255, 255, 255]);
  });
  test('consistency with dufy (sRGB)', () => {
    expect(munsellToRgb255('3.1GY 2.5/4.9')).toEqual([55, 64, 11]);
  });
  test('clamp', () => {
    expect(munsellToRgb255('3.1GY 2.5/3000')).toEqual([222, 255, 0]);
  });
  test('no clamp', () => {
    expect(munsellToRgb255('3.1GY 2.5/3000', false)).toEqual([222, 281, -770]);
  });
});

describe('munsellToHex()', () => {
  test('boundary case', () => {
    expect(munsellToHex('N 0', ADOBE_RGB)).toEqual('#000000');
    expect(munsellToHex('N 10')).toEqual('#ffffff');
  });
  test('consistency with dufy (sRGB)', () => {
    expect(munsellToHex('3.1GY 2.5/4.9')).toEqual('#37400b');
  });
  test('clamp', () => {
    expect(munsellToHex('3.1GY 2.5/3000')).toEqual('#deff00');
  });
});
