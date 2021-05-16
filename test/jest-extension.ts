export const toNearlyEqual = (
  actual: Array<number>,
  expected: Array<number>,
  precision = 2,
): jest.CustomMatcherResult => {
  // Is the fusion of the two built-in methods, toBeCloseTo() and toEqual().
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    throw new Error(
      'Cannot use toNearlyEqual with non-array objects. Arguments evaluated to: ' +
        'expect(' +
        actual +
        ').toNearlyEqual(' +
        expected +
        ').',
    );
  }
  const pow = Math.pow(10, precision + 1);
  const allowedMaxDelta = Math.pow(10, -precision) / 2;
  const maxDelta = actual
    .map((val, idx) => Math.abs(val - expected[idx]))
    .reduce((a, b) => Math.max(a, b));
  const pass = Math.round(maxDelta * pow) / pow <= allowedMaxDelta;

  if (pass) {
    return {
      message: () =>
        `received ${actual} to be sufficiently close to ${expected}. Allowed error: ${allowedMaxDelta}.`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `received ${actual} not to be sufficiently close to ${expected}. Allowed error: ${allowedMaxDelta}.`,
      pass: false,
    };
  }
};
