import {calcLCHabToLab, calcLabToLCHab} from '../src/basic_color_lib.js'
import './jest_extension.js'

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
