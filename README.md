# munsell.js - library for handling Munsell Color System

[![Build Status](https://api.travis-ci.org/privet-kitty/munsell.js.svg?branch=master)](https://travis-ci.org/privet-kitty/munsell.js)
[![Coverage Status](https://coveralls.io/repos/github/privet-kitty/munsell.js/badge.svg?branch=master)](https://coveralls.io/github/privet-kitty/munsell.js?branch=master)
**This library is still in a alpha stage.**

munsell.js is a library for JavaScript and Node.js, whose main facility is converting Munsell Color to/from other color spaces (e.g. RGB).

## Usage
[To Be Edited]

For the details, see [API Reference](https://privet-kitty.github.io/munsell.js/).

This module expresses the Munsell Color in two ways, a string or triplet of numbers, which can be identified by the name of method. The former is `munsell`, the standard string specification of the Munsell Color: e.g. `"4.2RP 3/11"`, `"N 10"`. The latter is `mhvc`, or Munsell HVC, its 3-number expression composed of [Hue, Value, Chroma]: e.g. `[94.2, 3, 11]`, `[0, 10 ,0]`. Here Hue is in the circle group R/100Z: i.e. 0R (= 10RP) corresponds to 0 (= 100 = 300 = -2000) and 2YR corresponds to 12 (= -88 = 412). Value is in the interval [0, 10] and the converters will clamp it if a given value exceeds it. Chroma is non-negative and the converters will assume it to be zero if a given chroma is negative. Note that every converter accepts a huge chroma outside the Munsell Renotation Data (e.g. 1000000) and returns a extrapolated result.

## Compatibility
munsell.js is completely written in the ES module format. You can `require` it from CommonJS without being conscious of that as this library uses [`esm` loader](https://www.npmjs.com/package/esm).

## Mechanism
The underlying data of this module is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php). Since this data assume the illuminant to be the Standard Illuminant C, munsell.js uses the Bradford transformation as CAT to other illumnants (e.g. D65).

The method of inter- and extrapolation is in common with [dufy](https://github.com/privet-kitty/dufy), my color library for Common Lisp, which is substantially based on the Paul Centore's method (though munsell.js interpolates the data via LCh<sub>ab</sub> space). See the links and articles for more details.

- Centore, Paul. (2012). An open-source inversion algorithm for the Munsell renotation. Color Research & Application. 37. 10.1002/col.20715. 

## Copyright
Copyright (c) 2018 Hugo I.
