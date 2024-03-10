import {
  mod,
  TWO_PI,
  cartesianToPolar,
  polarToCartesian,
  circularLerp,
  circularDelta,
  Vector2,
} from '../src/arithmetic';
import { toNearlyEqual } from './jest-extension';

beforeEach(() => expect.extend({ toNearlyEqual }));

describe('mod()', () => {
  test('zero case', () => {
    expect(mod(-1.2, 0)).toBeNaN();
  });
  test('positivity of result', () => {
    expect(mod(33.4, 3)).toBeCloseTo(0.4, 5);
    expect(mod(-33.4, 3)).toBeCloseTo(2.6, 5);
  });
});

describe('cartesian <-> polar', () => {
  test('boundary case', () => {
    expect(polarToCartesian(1, TWO_PI)).toNearlyEqual([1, 0], 10);
    expect(polarToCartesian(2, -90, 360)).toNearlyEqual([0, -2], 10);
    expect(cartesianToPolar(1, 0)).toNearlyEqual([1, 0], 10);
  });
  test('round-trip', () => {
    for (const perimeter of [TWO_PI, 360, 100, 1, 1000] as Array<number>) {
      for (const [a, b] of [
        [-3, 4],
        [3.9e10, 3.9e-10],
        [0, 0],
        [-1, 1],
      ] as Array<Vector2>) {
        expect(polarToCartesian(...cartesianToPolar(a, b, perimeter), perimeter)).toNearlyEqual(
          [a, b],
          8,
        );
      }
    }
  });
});

describe('circularLerp()', () => {
  test('non-wrapped case', () => {
    expect(circularLerp(0.4, 10, 30, 360)).toBe(18);
    expect(circularLerp(0.6, 10, 30, 360)).toBe(22);
  });
  test('wrapped case', () => {
    expect(circularLerp(0.4, 350, 10, 360)).toBe(358);
    expect(circularLerp(0.6, 350, 10, 360)).toBe(2);
  });
  test('theta1 == theta2', () => {
    expect(circularLerp(0.5, 0, 0)).toBe(0);
    expect(circularLerp(0.6, 0.12, 0.12)).toBe(0.12);
    expect(circularLerp(0, 0.123, 0.123)).toBe(0.123);
  });
  test('should return theta2 when amount is 1', () => {
    expect(circularLerp(1, 0.1, 1.2)).toBe(1.2);
    expect(circularLerp(1, 0.12, 0.1)).toBe(0.1);
    expect(circularLerp(1, 0.1, 1.2, 0.03)).toBe(mod(0.12, 0.03));
    expect(circularLerp(1, 0.12, 0.1, 0.03)).toBe(mod(0.1, 0.03));
  });
  test('should return theta1 when amount is 0', () => {
    expect(circularLerp(0, 0.1, 1.2)).toBe(0.1);
    expect(circularLerp(0, 0.12, 0.1)).toBe(0.12);
    expect(circularLerp(0, 0.1, 1.2, 0.03)).toBe(mod(0.1, 0.03));
    expect(circularLerp(0, 0.12, 0.1, 0.03)).toBe(mod(0.12, 0.03));
  });
});

describe('circularDelta()', () => {
  test('basic behaviours', () => {
    expect(circularDelta(13, 6)).toBe(7 - TWO_PI);
    expect(circularDelta(4, 6)).toBe(-2);
    expect(circularDelta(1, 350, 360)).toBe(11);
  });
});
