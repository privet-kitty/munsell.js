import {yToMunsellValue} from '../src/invert.js';
import {munsellValueToY} from '../src/convert.js';

describe('yToMunsellValue()', () => {
  test('clamp', () => {
    expect(yToMunsellValue(-1000000)).toBe(0);
    expect(yToMunsellValue(10.1)).toBe(10);
  })
  test('boundary case', () => {
    expect(yToMunsellValue(0)).toBe(0);
    expect(yToMunsellValue(1)).toBe(10);
  })
  test('round-trip', () => {
    for(let v of [0, 0.0003, 0.013503095272735743, 6.333333]) {
      expect(yToMunsellValue(munsellValueToY(v))).toBeCloseTo(v, 1e-5);
    }
  })
})
