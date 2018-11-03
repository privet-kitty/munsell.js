import {calcMunsellValueToL} from '../munsell.js'
import './jest_extension.js'

describe('calcMunsellValueToL()', () => {
  test('boundary case', () => {
    expect(calcMunsellValueToL(10)).toBeCloseTo(100, 10);
    expect(calcMunsellValueToL(0)).toEqual(0);
  })
})

describe('munsell', () => {    
  test('calcMHVCToLCHabAllIntegerCase', () => {
    expect([5, 4.0001]).toNearlyEqual([5, 4], 3);
  })
})
