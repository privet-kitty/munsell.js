import * as Munsell from '../munsell.js'
import './jest_extension.js'

describe('munsell', () => {    
  test('calcMHVCToLCHabAllIntegerCase', () => {
    expect([5, 4.0001]).toNearlyEqual([5, 4], 3);
  })
})
