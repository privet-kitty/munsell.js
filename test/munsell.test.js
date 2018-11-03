import * as Munsell from '../munsell.js'

describe('munsell', () => {    
    test('calcMHVCToLCHabAllIntegerCase', () => {
        expect(Munsell.calcMHVCToLCHabAllIntegerCase(0, 0, 0, true)).toEqual([0, 0, 0]);
        })

})
