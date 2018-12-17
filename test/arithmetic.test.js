import {mod,
        TWO_PI,
        cartesianToPolar, polarToCartesian,
        circularNearer, circularClamp, circularLerp} from '../src/arithmetic.js';
import './jest-extension.js';

describe('mod()', () => {    
    test('zero case', () => {
        expect(mod(-1.2, 0)).toBeNaN();
    })
    test('positivity of result', () => {
        expect(mod(33.4, 3)).toBeCloseTo(0.4, 5);
        expect(mod(-33.4, 3)).toBeCloseTo(2.6, 5);
    })
})

describe('cartesian <-> polar', () => {
  test('boundary case', () => {
    expect(polarToCartesian(1, TWO_PI)).toNearlyEqual([1, 0], 10);
    expect(polarToCartesian(2, -90, 360)).toNearlyEqual([0, -2], 10);
    expect(cartesianToPolar(1, 0)).toNearlyEqual([1, 0], 10);
  })
  test('round-trip', () => {
    for (let ab of [[-3, 4], [3.9e10, 3.9e-10], [0, 0]]) {
      expect(polarToCartesian(...cartesianToPolar(...ab, 100), 100)).toNearlyEqual(ab, 10);
    }
  })
})

describe('circularNearer()', () => {
    test('basic behaviours', () => {
        expect(circularNearer(6.2, 4.2, 1)).toBe(1);
        expect(circularNearer(-0.5, 358, 10, 360)).toBe(358);
    })
})

describe('circularClamp()', () => {
    test('zero perimeter case', () => {
        expect(circularClamp(2, 1, 3, 0)).toBeNaN();
    })
    test('basic behaviours', () => {
        expect(circularClamp(50, 0, 0)).toBe(0);
        expect(circularClamp(-3, 350, 10, 360)).toBe(-3);
        expect(circularClamp(-11, 350, 10, 360)).toBe(350);
        expect(circularClamp(30, 350, 10, 360)).toBe(10);
    })
})
         
describe('circularLerp()', () => {
    test('basic behaviours', () => {
        expect(circularLerp(1, 0.2, 1)).toBe(1);
        expect(circularLerp(0.4, 350, 10, 360)).toBeCloseTo(358);
    })
})
