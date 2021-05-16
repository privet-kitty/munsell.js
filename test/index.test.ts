import { ILLUMINANT_C, munsellToRgb255 } from '../src/index';

describe('main.js', () => {
  test('exported', () => {
    expect(ILLUMINANT_C.catMatrixThisToC).toBeDefined();
    expect(munsellToRgb255).toBeInstanceOf(Function);
  });
});
