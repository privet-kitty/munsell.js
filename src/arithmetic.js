// -*- coding: utf-8 -*-

/**
 * Some arithmetic in a circle group.

 * Note that no functions take `multiple laps' into consideration:
 * i.e. the arc length of the interval [-2pi, 2pi] is not 4pi but 0.
 * @module
 */

export const TWO_PI = Math.PI + Math.PI;

export function mod(dividend, divisor) {
  const x = dividend % divisor;
  if (x >= 0) {
    return x;
  } else {
    return x + divisor;
  }
}

export function clamp(x, min, max) {
  if (x < min)
    return min;
  else if (x > max)
    return max;
  return x;
}


/**
 * Compares the counterclockwise distances between theta1 and x and
 * between x and theta2, and returns theta1 or theta2 whichever is
 * nearer.
 * @param {number} x - must be in the counterclockwise interval [min, max]
 * @param {number} theta1
 * @param {number} theta2
 * @param {number} [perimeter = TWO_PI]
 */
export function circularNearer(x, theta1, theta2, perimeter = TWO_PI) {
  if (mod(x - theta1, perimeter) <= mod(theta2 - x, perimeter)) {
    return theta1;
  } else {
    return theta2;
  }
}

/**
 * A clamp function in a circle group. If x is not in the
 * (counterclockwise) closed interval [min, max], circularClamp returns
 * min or max whichever is nearer to x.
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @param {number} [perimeter = TWO_PI]
 */
export function circularClamp(x, min, max, perimeter = TWO_PI) {
  const xMod = mod(x, perimeter);
  const minMod = mod(min, perimeter);
  const maxMod = mod(max, perimeter);
  if (isNaN(xMod) || isNaN(minMod) || isNaN(maxMod)) {
    return NaN;
  }
  if (minMod <= maxMod) {
    if (minMod <= xMod <= maxMod) {
      return x;
    } else {
      // minMod <= maxMod < xMod or xMod < minMod <= maxMod.
      return circularNearer(x, max, min);
    }
  } else {
    if ((xMod <= maxMod) || (minMod <= xMod)) {
      return x; // xMod <= maxMod < minMod or maxMod < minMod <= xMod
    } else {
      return circularNearer(x, max, min); // maxMod < xMod < minMod
    }
  }
}

/**
 * Counterclockwise linear interpolation from theta1 to theta2 in a
 * circle group. It is guaranteed that the return value is within the
 * given interval from theta1 to theta2 if coef is in [0, 1].
 * @param {number} coef - should be in [0, 1]
 * @param {number} theta1
 * @param {number} theta2
 * @param {number} [perimeter = TWO_PI]
 */
export function circularLerp (coef, theta1, theta2, perimeter = TWO_PI) {
  const arcLength = mod(theta2-theta1, perimeter);
  return circularClamp(theta1 + (arcLength * coef), theta1, theta2, perimeter);
}


// Only the following two kinds of multiplication are necessary.
export function multMatrixVector(A, x) {
  return [[A[0][0]*x[0]+A[0][1]*x[1]+A[0][2]*x[2]],
          [A[1][0]*x[0]+A[1][1]*x[1]+A[1][2]*x[2]],
          [A[2][0]*x[0]+A[2][1]*x[1]+A[2][2]*x[2]]];    
}

export function multMatrixMatrix(A, B) {
  return [[A[0][0]*B[0][0]+A[0][1]*B[1][0]+A[0][2]*B[2][0],
           A[0][0]*B[0][1]+A[0][1]*B[1][1]+A[0][2]*B[2][1],
           A[0][0]*B[0][2]+A[0][1]*B[1][2]+A[0][2]*B[2][2]]
          ,
          [A[1][0]*B[0][0]+A[1][1]*B[1][0]+A[1][2]*B[2][0],
           A[1][0]*B[0][1]+A[1][1]*B[1][1]+A[1][2]*B[2][1],
           A[1][0]*B[0][2]+A[1][1]*B[1][2]+A[1][2]*B[2][2]]
          ,
          [A[2][0]*B[0][0]+A[2][1]*B[1][0]+A[2][2]*B[2][0],
           A[2][0]*B[0][1]+A[2][1]*B[1][1]+A[2][2]*B[2][1],
           A[2][0]*B[0][2]+A[2][1]*B[1][2]+A[2][2]*B[2][2]]
         ];
}
