/**
 * ## Naming convention
 *
 * Every converter is named as `xxxToYyy` where `xxx` and `yyy` are the names of color spaces,
 * e.g. `munsellToHex`. Please see the following sections for the names of color spaces.
 *
 * ## Data structure for Munsell Color
 * `mhvc`, or Munsell HVC, is a 3-number expression of Munsell
 * Color composed of [Hue, Value, Chroma]: e.g. `[94.2, 3.5, 11]` or
 * `[0, 10 ,0]`. The range of each number is as follows:
 *
 * - _Hue_ is in the circle group R/100Z.
 *   - e.g. the number of 0R (= 10RP) is 0 (= 100 = 300 = -2000) and that of 2YR is 12 (= -88 = 412).
 * - _Value_ is in the range [0, 10].
 *   - The converters will clamp it if a given value exceeds this range.
 * - _Chroma_ is a non-negative number.
 *   - The converters will assume it to be zero if a given chroma is negative.
 *   - Note that every converter accepts a huge chroma outside the Munsell Renotation Data (e.g. 1000000) and returns a extrapolated result.
 *
 * `munsell` is the standard string specification of the Munsell Color:
 * e.g. `"4.2RP 3.5/11"` or `"N 10"`. Here various notations of numbers are
 * accepted. An ugly specification like `"2e-02RP .9/0xf"` (equivalent to
 * `"0.02RP 0.9/15"`) will be also available. However, the capital letters
 * A-Z and the slash '/' are reserved.
 *
 * ## Other color spaces
 *
 * - `hex` is the hex string expression of the gamma-corrected RGB, e.g. `##f2f4f8`.
 *   - The output of the converters `xxxToHex` is always the 24-bit RGB.
 *   - The input of the converters `hexToYyy` may be 24-bit RGB (#rrggbb), 12-bit RGB (#rgb), 32-bit RGBA (#rrggbbaa), or 16-bit RGBA (#rgba).
 *   - The converters will ignore the alpha channel if it is given.
 * - `rgb255` is the 3-integer expression of the gamma-corrected RGB, quantized to 0, 1, ..., 255.
 * - `rgb` is the 3-number expression of the gamma-corrected RGB, normalized to the range [0, 1].
 * - `linearRgb` is the 3-number expression of the linear RGB, normalized to the range [0, 1].
 * - `xyz` is the 3-number expression of the CIE 1931 XYZ color space.
 * - `lab` is the 3-number expression of the CIE 1976 L\*a\*b\* color space.
 * - `lchab` is the 3-number expression of the CIE 1976 L\*C\*h(ab) color space.
 *
 * ## Mechanism
 *
 * The underlying data of this library is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php).
 * Since this data assume that the illuminant is the standard illuminant C,
 * munsell.js uses the Bradford transformation as CAT to other illumnants (e.g. D65).
 *
 * munsell.js inter- and extrapolates the above data via LCHab space, the method of which is
 * in common with [dufy](https://github.com/privet-kitty/dufy), my colorimetry library for
 * Common Lisp. The inversion method from LCHab to Munsell Color is essentially the same as
 * the one suggested by Paul Centore. Please see the links and articles for more information.
 *
 * Centore, Paul. (2012). An open-source inversion algorithm for the Munsell renotation.
 * Color Research & Application. 37. 10.1002/col.20715.
 * @module
 */
export * from './convert';
export * from './invert';
export { ILLUMINANT_D65, ILLUMINANT_C, SRGB, ADOBE_RGB, RGBSpace, Illuminant } from './colorspace';
