import {yToMunsellValue,
        lToMunsellValue,
        lchabToMhvc,
        rgb255ToMhvc,
        rgb255ToMunsell,
        hexToMhvc,
        hexToMunsell} from '../src/invert.js';
import {munsellValueToY,
        munsellValueToL,
        mhvcToLchab,
        mhvcToHex,
        munsellToHex} from '../src/convert.js';
import {SRGB, ADOBE_RGB, ILLUMINANT_C, ILLUMINANT_D65} from '../src/colorspace.js';
import './jest-extension.js';

describe('yToMunsellValue()', () => {
  test('clamp', () => {
    expect(yToMunsellValue(-1000000)).toBe(0);
    expect(yToMunsellValue(10.1)).toBe(10);
  })
  test('boundary case', () => {
    expect(yToMunsellValue(0)).toBe(0);
    expect(yToMunsellValue(1)).toBe(10);
  })
  test('round-trip', () => {
    for(let y of [0, 0.0003, 0.013503095272735743, 0.6333333]) {
      expect(munsellValueToY(yToMunsellValue(y))).toBeCloseTo(y, 5);
    }
  })
})

describe('lToMunsellValue()', () => {
  test('clamp', () => {
    expect(lToMunsellValue(-1000000)).toBe(0);
    expect(lToMunsellValue(100.1)).toBe(10);
  })
  test('boundary case', () => {
    expect(lToMunsellValue(0)).toBe(0);
    expect(lToMunsellValue(100)).toBe(10);
  })
  test('round-trip', () => {
    for(let l of [0, 0.03, 1.3503095272735743, 63.33333]) {
      expect(munsellValueToL(lToMunsellValue(l))).toBeCloseTo(l, 3);
    }
  })
})

describe('LCHab <-> Munsell HVC()', () => {
  test('round-trip', () => {
    for (let mhvc of [[80, 40, 20], [33.3333, 291.6667, 31.2778], [91.3, 85.1, 331.6]]) {
      expect(mhvcToLchab(...lchabToMhvc(...mhvc))).toNearlyEqual(mhvc, 3);
    }
  })
  test('round-trip (for negative hab)', () => {
    expect(mhvcToLchab(...lchabToMhvc(50.1, 50.1, -50.1))).toNearlyEqual([50.1, 50.1, 309.9], 3);
  })
})

function roughLchabToMhvc(lstar, cstarab, hab) {
  return [hab * 0.277777777778, lToMunsellValue(lstar), cstarab * 0.181818181818];
}

describe('lchabToMhvc()', () => {
  test('achromatic', () => {
    expect(() => lchabToMhvc(20, 1e-3, 40, 1e-2, 0, "error")).not.toThrow(Error);
  })
  test('black', () => {
    expect(() => lchabToMhvc(1e-3, 20, 40, 1e-2, 0, "error")).not.toThrow(Error);
  })
  test('ifReachMax: signal error', () => {
    expect(() => lchabToMhvc(20, 30, 40, 1e-6, 1)).toThrow(Error);
  })
  test('ifReachMax: return initial value', () => {
    expect(lchabToMhvc(20, 30, 40, 1e-9, 0, "init")).toEqual(roughLchabToMhvc(20, 30, 40));
    expect(lchabToMhvc(20, 30, 40, 1e-9, 1, "init")).toEqual(roughLchabToMhvc(20, 30, 40));
  })
  test('ifReachMax: return value as is', () => {
    expect(lchabToMhvc(20, 30, 40, 1e-9, 0, "as-is")).toEqual(roughLchabToMhvc(20, 30, 40));
    expect(lchabToMhvc(20, 30, 40, 1e-9, 1, "as-is")).not.toEqual(roughLchabToMhvc(20, 30, 40));
  })
  test('invalid ifReachMax case', () => {
    expect(() => lchabToMhvc(20, 30, 40, 1e-9, 0, "no such keyword")).toThrow(SyntaxError);
  })
})
    
describe('rgb255ToMunsell()', () => {
  test('achromatic', () => {
    expect(rgb255ToMunsell(0, 0, 0, SRGB, 1)).toEqual("N 0.0");
    expect(rgb255ToMunsell(255, 255, 255, ADOBE_RGB, 1)).toEqual("N 10.0");
  })
})

describe('hex <-> Munsell HVC', () => {
  test('round-trip', () => {
    expect(mhvcToHex(...hexToMhvc("#FEDCBA")).toUpperCase()).toEqual("#FEDCBA");
    expect(mhvcToHex(...hexToMhvc("#012345", ADOBE_RGB), ADOBE_RGB).toUpperCase()).toEqual("#012345");
    expect(mhvcToHex(...hexToMhvc("#000000")).toUpperCase()).toEqual("#000000");
    expect(mhvcToHex(...hexToMhvc("#FFFFFF")).toUpperCase()).toEqual("#FFFFFF");
  })
})
