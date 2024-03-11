# munsell.js - A Library for Handling the Munsell Color System

[![Build Status](https://github.com/privet-kitty/munsell.js/actions/workflows/ci-master.yml/badge.svg)](https://github.com/privet-kitty/munsell.js/actions)
[![Coverage Status](https://coveralls.io/repos/github/privet-kitty/munsell.js/badge.svg?branch=master)](https://coveralls.io/github/privet-kitty/munsell.js?branch=master)

munsell.js is a JavaScript library primarily focused on converting colors between the Munsell Color System and other color spaces (e.g., RGB).

_[API Reference](https://privet-kitty.github.io/munsell.js/modules.html) provides the detailed information beyond this README._

## Getting started

### Install

```
$ npm install munsell
```

### Import

#### ES module

```javascript
import * as munsell from 'munsell';

munsell.munsellToRgb255('2.3YR 6.7/4.22');
// => [ 201, 156, 135 ]
```

#### CommonJS

```javascript
const munsell = require('munsell');

munsell.hexToMhvc('#ABCDEF');
// => [ 73.43648829473781, 8.05763439330249, 5.304123165279228 ]
```

## Mechanism

munsell.js represents Munsell colors in two formats: as strings or as triplets of numbers. These formats can be recognized by the function name used. The string format, `munsell`, follows the standard string specification of Munsell colors, e.g., `"4.2RP 3/11"`, `"N 10"`. The triplet format, `mhvc` (Munsell Hue, Value, Chroma), expresses colors as three numbers: e.g., `[94.2, 3, 11]`, `[0, 10, 0]`.

The foundation of this library is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php), which assumes the standard illuminant C as the light source. munsell.js employs the Bradford transformation for chromatic adaptation to other illuminants (e.g., D65).

munsell.js inter- and extrapolates the data via LCHab space, the method of which is in common with [dufy](https://github.com/privet-kitty/dufy), my color library for Common Lisp. The inversion from LCHab to Munsell colors is based on a method proposed by Paul Centore. For more information, refer to the following article.

- Centore, Paul. (2012). An open-source inversion algorithm for the Munsell renotation. Color Research & Application. 37. 10.1002/col.20715.

## Example

https://privet-kitty.github.io/albert/
This is a simple web app that uses munsell.js. It is a training tool to guess the Munsell code of a displayed color.

## Copyright

Copyright (c) 2018-2024 Hugo Sansaqua.
