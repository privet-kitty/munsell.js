import {calcMunsellValueToL,
        calcMHVCToLCHab,
        calcMunsellToMHVC,
        calcMunsellToLCHab,
        calcMHVCToXYZ,
        calcMunsellToRGB255,
        calcMunsellToHex} from '../src/munsell.js';
import './jest_extension.js';

describe('calcMunsellValueToL()', () => {
  test('boundary case', () => {
    expect(calcMunsellValueToL(10)).toBeCloseTo(100, 10);
    expect(calcMunsellValueToL(0)).toEqual(0);
  })
})

describe('calcMHVCToLCHab()', () => {    
  test('zero case', () => {
    expect(calcMHVCToLCHab(-300, 0, 0).splice(0,2)).toEqual([0, 0]);
  })
})

describe('calcMunsellToMHVC()', () => {
  test('not-3-number error', () => {
    expect(() => calcMunsellToMHVC("RP 5.3")).toThrowError(SyntaxError);
  })
  test('invalid-hue-designator error', () => {
    expect(() => calcMunsellToMHVC("8PP 4.3/5.2")).toThrowError(SyntaxError);
  })
  test('achromatic', () => {
    expect(calcMunsellToMHVC("N 10")).toEqual([0, 10, 0]);
  })
  test('negative hue prefix', () => {
    expect(calcMunsellToMHVC("2R 10/2")).toEqual(calcMunsellToMHVC("-18Y 10/2"));
  })
})

describe('calcMunsellToLCHab()', () => {
  test('all integer case', () => {
    expect(calcMunsellToLCHab("10RP 1/2")).toNearlyEqual([10.408445518542798, 12.62469571978245, 350.56362148026216], 5);
  })
  test('all integer case (dark)', () => {
    expect(calcMunsellToLCHab("10RP 0.2/2")).toNearlyEqual([2.08753985167084, 14.303735097530591, 341.9999157759378], 5);
  })
})

describe('calcMHVCToXYZ()', () => {
  test('consistency with dufy (Illuminant C)', () => {
    expect(calcMHVCToXYZ(0, 2.18, 3.1)).toNearlyEqual([0.0440725663863256, 0.03510249660220537, 0.03810015623085167], 6);
  })
})

describe('calcMunsellToRGB255()', () => {
  test('boundary case', () => {
    expect(calcMunsellToRGB255("N 0", false)).toEqual([0, 0, 0]);
    expect(calcMunsellToRGB255("N 10", false)).toEqual([255, 255, 255]);
  })
  test('consistency with dufy (sRGB)', () => {
    expect(calcMunsellToRGB255("3.1GY 2.5/4.9")).toEqual([55, 64, 11]);
  })
  test('clamp', () => {
    expect(calcMunsellToRGB255("3.1GY 2.5/3000")).toEqual([222, 255, 0]);
  })
  test('no clamp', () => {
    expect(calcMunsellToRGB255("3.1GY 2.5/3000", false)).toEqual([222, 281, -770]);
  })
})


describe('calcMunsellToHex()', () => {
  test('boundary case', () => {
    expect(calcMunsellToHex("N 0")).toEqual("#000000");
    expect(calcMunsellToHex("N 10")).toEqual("#ffffff");
  })
  test('consistency with dufy (sRGB)', () => {
    expect(calcMunsellToHex("3.1GY 2.5/4.9")).toEqual("#37400b");
  })
  test('clamp', () => {
    expect(calcMunsellToHex("3.1GY 2.5/3000")).toEqual("#deff00");
  })
})

