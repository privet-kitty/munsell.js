import {mod, circularNearer, circularClamp, circularLerp} from '../src/arithmetic.js';

describe('mod()', () => {    
    test('zero case', () => {
        expect(mod(-1.2, 0)).toBeNaN();
    })
    test('positivity of result', () => {
        expect(mod(33.4, 3)).toBeCloseTo(0.4, 5);
        expect(mod(-33.4, 3)).toBeCloseTo(2.6, 5);
    })
})

describe('circularNearer()', () => {
    test('basics', () => {
        expect(circularNearer(6.2, 4.2, 1)).toBe(1);
        expect(circularNearer(-0.5, 358, 10, 360)).toBe(358);
    })
})
         

describe('circularClamp()', () => {
    test('zero perimeter', () => {
        expect(circularClamp(2, 1, 3, 0)).toBeNaN();
    })
    test('basics', () => {
        expect(circularClamp(50, 0, 0)).toBe(0);
        expect(circularClamp(-3, 350, 10, 360)).toBe(-3);
        expect(circularClamp(-11, 350, 10, 360)).toBe(350);
        expect(circularClamp(30, 350, 10, 360)).toBe(10);
    })
})
         
describe('circularLerp()', () => {
    test('basics', () => {
        expect(circularLerp(1, 0.2, 1)).toBe(1);
        expect(circularLerp(0.4, 350, 10, 360)).toBeCloseTo(358);
    })
})
