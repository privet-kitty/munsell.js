/**
 * Provides several arithmetic operations (mainly in a circle group) which are
 * called only internally.
 *
 * Note that no functions take `multiple laps' into consideration: i.e. the arc
 * length of the interval [-2pi, 2pi] is not 4pi but 0.
 * @module
 */

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];
export type Matrix33 = [Vector3, Vector3, Vector3];

export const TWO_PI = Math.PI + Math.PI;

export const mod = (dividend: number, divisor: number): number => {
  const x = dividend % divisor;
  if (x >= 0) {
    return x;
  } else {
    return x + divisor;
  }
};

export const clamp = (x: number, min: number, max: number): number => {
  if (x < min) return min;
  else if (x > max) return max;
  return x;
};

export const cartesianToPolar = (x: number, y: number, perimeter = TWO_PI): Vector2 => {
  const factor = perimeter / TWO_PI;
  return [Math.sqrt(x * x + y * y), mod(Math.atan2(y, x) * factor, 360)];
};

export const polarToCartesian = (r: number, theta: number, perimeter = TWO_PI): Vector2 => {
  const factor = TWO_PI / perimeter;
  const hueRad = theta * factor;
  return [r * Math.cos(hueRad), r * Math.sin(hueRad)];
};

/**
 * Compares the counterclockwise distance between theta1 and x and that
 * between x and theta2, and returns theta1 or theta2 whichever is
 * nearer.
 * @param x - must be in the counterclockwise interval [min, max]
 * @param theta1
 * @param theta2
 * @param [perimeter]
 */
export const circularNearer = (
  x: number,
  theta1: number,
  theta2: number,
  perimeter = TWO_PI,
): number => {
  if (mod(x - theta1, perimeter) <= mod(theta2 - x, perimeter)) {
    return theta1;
  } else {
    return theta2;
  }
};

/**
 * Is a clamp function in a circle group. If x is not in the
 * (counterclockwise) closed interval [min, max], circularClamp returns
 * min or max whichever is nearer to x.
 * @param x
 * @param min
 * @param max
 * @param [perimeter]
 */
export const circularClamp = (x: number, min: number, max: number, perimeter = TWO_PI): number => {
  const xMod = mod(x, perimeter);
  const minMod = mod(min, perimeter);
  const maxMod = mod(max, perimeter);
  if (isNaN(xMod) || isNaN(minMod) || isNaN(maxMod)) {
    return NaN;
  }
  if (minMod <= maxMod) {
    if (minMod <= xMod && xMod <= maxMod) {
      return x;
    } else {
      // minMod <= maxMod < xMod or xMod < minMod <= maxMod.
      return circularNearer(x, max, min);
    }
  } else {
    if (xMod <= maxMod || minMod <= xMod) {
      return x; // xMod <= maxMod < minMod or maxMod < minMod <= xMod
    } else {
      return circularNearer(x, max, min); // maxMod < xMod < minMod
    }
  }
};

/**
 * Is a counterclockwise linear interpolation from theta1 to theta2 in a
 * circle group. It is guaranteed that the returned value is within the
 * given interval from theta1 to theta2 if coef is in [0, 1].
 * @param coef - should be in [0, 1]
 * @param theta1
 * @param theta2
 * @param [perimeter]
 */
export const circularLerp = (
  coef: number,
  theta1: number,
  theta2: number,
  perimeter = TWO_PI,
): number => {
  const arcLength = mod(theta2 - theta1, perimeter);
  return circularClamp(theta1 + arcLength * coef, theta1, theta2, perimeter);
};

/**
 * Returns the 'difference' of two values in a circle group. The returned value
 * Δ satisfies theta2 + Δ ≡ theta1 and -perimeter/2 <= Δ <= perimeter/2.
 * @param theta1
 * @param theta2
 * @param [perimter]
 */
export const circularDelta = (theta1: number, theta2: number, perimeter = TWO_PI): number => {
  const d = mod(theta1 - theta2, perimeter);
  if (d <= perimeter / 2) {
    return d;
  } else {
    return d - perimeter;
  }
};

// We need only the following two kinds of multiplication.
export const multMatrixVector = (A: Matrix33, x: Vector3): Vector3 => {
  return [
    A[0][0] * x[0] + A[0][1] * x[1] + A[0][2] * x[2],
    A[1][0] * x[0] + A[1][1] * x[1] + A[1][2] * x[2],
    A[2][0] * x[0] + A[2][1] * x[1] + A[2][2] * x[2],
  ];
};

export const multMatrixMatrix = (A: Matrix33, B: Matrix33): Matrix33 => {
  return [
    [
      A[0][0] * B[0][0] + A[0][1] * B[1][0] + A[0][2] * B[2][0],
      A[0][0] * B[0][1] + A[0][1] * B[1][1] + A[0][2] * B[2][1],
      A[0][0] * B[0][2] + A[0][1] * B[1][2] + A[0][2] * B[2][2],
    ],
    [
      A[1][0] * B[0][0] + A[1][1] * B[1][0] + A[1][2] * B[2][0],
      A[1][0] * B[0][1] + A[1][1] * B[1][1] + A[1][2] * B[2][1],
      A[1][0] * B[0][2] + A[1][1] * B[1][2] + A[1][2] * B[2][2],
    ],
    [
      A[2][0] * B[0][0] + A[2][1] * B[1][0] + A[2][2] * B[2][0],
      A[2][0] * B[0][1] + A[2][1] * B[1][1] + A[2][2] * B[2][1],
      A[2][0] * B[0][2] + A[2][1] * B[1][2] + A[2][2] * B[2][2],
    ],
  ];
};
