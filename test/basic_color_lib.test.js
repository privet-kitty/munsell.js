import {calcLCHabToLab,
        calcLabToLCHab,
        calcXYZToLinearRGB,
        calcLinearRGBToRGB,
        calcRGBToQuantizedRGB,
        calcRGBToHex} from '../src/basic_color_lib.js';
import './jest_extension.js';

describe('Lab <-> LCHab', () => {
  test('boundary case', () => {
    expect(calcLCHabToLab(1, 360)).toNearlyEqual([1, 0], 10);
    expect(calcLCHabToLab(2, -90)).toNearlyEqual([0, -2], 10);
  })
  test('round-trip', () => {
    for (let ab of [[-3, 4], [3.9e10, 3.9e-10], [0, 0]]) {
      expect(calcLCHabToLab.apply(null, calcLabToLCHab.apply(null, ab))).toNearlyEqual(ab, 10);
    }
  })
})

describe('XYZ <-> liner RGB', () => {
  test('consistency with dufy (sRGB)', () => {
    expect(calcXYZToLinearRGB(0.1, 0.2, 0.3)).toNearlyEqual([-0.1329496041195698, 0.29074078266626474, 0.28189274594473257], 5);
  })
})

describe('linear RGB <-> gamma-corrected RGB', () => {
  test('consistency with dufy (sRGB)', () => {
    expect(calcLinearRGBToRGB(0.002, 0.7, -0.2)).toNearlyEqual([0.025840000000000002, 0.85430583154494, -0.48452920448170694], 6);
  })
})

describe('RGB <-> quantized RGB', () => {
  test('clamp check', () => {
    expect(calcRGBToQuantizedRGB(0.101, 1.1, -0.3)).toEqual([26, 255, 0]);
  })
})

describe('RGB <-> Hex code', () => {
  test('clamp check', () => {
    expect(calcRGBToHex(0.101, 1.1, -0.3)).toEqual("#1aff00");
  })
})
