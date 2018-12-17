import {yToMunsellValue,
        lToMunsellValue,
        lchabToMhvc} from '../src/invert.js';
import {munsellValueToY,
        munsellValueToL,
        mhvcToLchab} from '../src/convert.js';
import './jest-extension.js'

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

describe('lchabToMhvc()', () => {
  test('round-trip', () => {
    for (let mhvc of [[80, 40, 20], [33.3333, 291.6667, 31.2778], [91.3, 85.1, 331.6]]) {
      expect(mhvcToLchab.apply(null, lchabToMhvc.apply(null, mhvc))).toNearlyEqual(mhvc, 3);
    }
  })
  test('round-trip (for negative hab)', () => {
    expect(mhvcToLchab.apply(null, lchabToMhvc(50.1, 50.1, -50.1))).toNearlyEqual([50.1, 50.1, 309.9], 3);
  })
})
    
