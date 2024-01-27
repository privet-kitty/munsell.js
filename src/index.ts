/**
 * ## Data structure for Munsell Color
 * `mhvc`, or Munsell HVC, is a 3-number expression of Munsell
 * Color composed of [Hue, Value, Chroma]: e.g. `[94.2, 3.5, 11]` or
 * `[0, 10 ,0]`. Hue is in the circle group R/100Z, e.g. the value of 0R (=
 * 10RP) is 0 (= 100 = 300 = -2000) and that of 2YR is 12 (= -88
 * = 412). Value is in the interval [0, 10] and the converters will clamp it if
 * a given value exceeds it. Chroma is non-negative and the converters will
 * assume it to be zero if a given chroma is negative. Note that every converter
 * accepts a huge chroma outside the Munsell Renotation Data (e.g. 1000000) and
 * returns a extrapolated result.
 *
 * `munsell` is the standard string specification of the Munsell Color:
 * e.g. `"4.2RP 3.5/11"` or `"N 10"`. Here various notations of numbers are
 * accepted. An ugly specification like `"2e-02RP .9/0xf"` (equivalent to
 * `"0.02RP 0.9/15"`) will be also available. However, the capital letters
 * A-Z and the slash '/' are reserved.
 * @module
 */
export * from './convert';
export * from './invert';
export { ILLUMINANT_D65, ILLUMINANT_C, SRGB, ADOBE_RGB, RGBSpace, Illuminant } from './colorspace';
