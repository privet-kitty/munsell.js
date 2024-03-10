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

export const TWO_PI = Math.PI * 2;

export const mod = (dividend: number, divisor: number): number => {
  const x = dividend % divisor;
  if (x >= 0) {
    return x;
  } else {
    return x + divisor;
  }
};

export const clamp = (x: number, min: number, max: number): number => {
  return Math.min(Math.max(x, min), max);
};

export const cartesianToPolar = (x: number, y: number, perimeter = TWO_PI): Vector2 => {
  const factor = perimeter / TWO_PI;
  return [Math.sqrt(x * x + y * y), mod(Math.atan2(y, x) * factor, perimeter)];
};

export const polarToCartesian = (r: number, theta: number, perimeter = TWO_PI): Vector2 => {
  const factor = TWO_PI / perimeter;
  const hueRad = theta * factor;
  return [r * Math.cos(hueRad), r * Math.sin(hueRad)];
};

/**
 * Is a counterclockwise linear interpolation from theta1 to theta2 in a
 * circle group. It is guaranteed that the returned value is within the
 * given interval if amount is in [0, 1].
 * @param amount - should be in [0, 1]
 * @param theta1
 * @param theta2
 * @param [perimeter]
 */
export const circularLerp = (
  amount: number,
  theta1: number,
  theta2: number,
  perimeter = TWO_PI,
): number => {
  const theta1Mod = mod(theta1, perimeter);
  const theta2Mod = mod(theta2, perimeter);
  if (amount === 1) return theta2Mod; // special treatment to decrease computational error
  const res =
    theta1Mod * (1 - amount) + (theta1Mod > theta2Mod ? theta2Mod + perimeter : theta2Mod) * amount;
  if (res >= perimeter) {
    return Math.min(res - perimeter, theta2Mod);
  } else {
    return res;
  }
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
