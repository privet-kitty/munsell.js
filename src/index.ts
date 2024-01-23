/**
 * <code>mhvc</code>, or Munsell HVC, is a 3-number expression of Munsell
 * Color composed of [Hue, Value, Chroma]: e.g. <code>[94.2, 3.5, 11]</code>,
 * <code>[0, 10 ,0]</code>. Here Hue is in the circle group R/100Z: i.e. 0R (=
 * 10RP) corresponds to 0 (= 100 = 300 = -2000) and 2YR corresponds to 12 (= -88
 * = 412). Value is in the interval [0, 10] and the converters will clamp it if
 * a given value exceeds it. Chroma is non-negative and the converters will
 * assume it to be zero if a given chroma is negative. Note that every converter
 * accepts a huge chroma outside the Munsell Renotation Data (e.g. 1000000) and
 * returns a extrapolated result.
 *
 * <code>munsell</code> is the standard string specification of the
 * Munsell Color: e.g. <code>"4.2RP 3.5/11"</code>, <code>"N 10"</code>. Here
 * various notations of numbers are accepted; an ugly specification like
 * <code>"2e-02RP .9/0xf"</code> (equivalent to <code>"0.02RP 0.9/15"</code>)
 * will be also available. However, the capital letters A-Z and the slash '/'
 * are reserved.
 * @module
 */
export * from './convert';
export * from './invert';
export { ILLUMINANT_D65, ILLUMINANT_C, SRGB, ADOBE_RGB, RGBSpace, Illuminant } from './colorspace';
