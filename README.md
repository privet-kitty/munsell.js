# munsell.js - library for handling Munsell Color System

[![Build Status](https://github.com/privet-kitty/munsell.js/actions/workflows/ci-master.yml/badge.svg)](https://github.com/privet-kitty/munsell.js/actions)
[![Coverage Status](https://coveralls.io/repos/github/privet-kitty/munsell.js/badge.svg?branch=master)](https://coveralls.io/github/privet-kitty/munsell.js?branch=master)

munsell.js is a library for JavaScript and Node.js, whose main facility is converting Munsell Color to/from other color spaces (e.g. RGB).

_[API Reference](https://privet-kitty.github.io/munsell.js/) provides the details beyond this README file._

## Getting started

### Install

```
$ npm install munsell
```

### Load

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

munsell.js expresses the Munsell Color in two ways, a string or triplet of numbers, which can be identified by the name of method. The former is `munsell`, the standard string specification of the Munsell Color: e.g. `"4.2RP 3/11"`, `"N 10"`. The latter is `mhvc`, or Munsell HVC, its 3-number expression composed of [Hue, Value, Chroma]: e.g. `[94.2, 3, 11]`, `[0, 10 ,0]`.

The underlying data of this library is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php). Since this data assume the illuminant to be the Standard Illuminant C, munsell.js uses the Bradford transformation as CAT to other illumnants (e.g. D65).

munsell.js inter- and extrapolates the data via LCHab space, the method of which is in common with [dufy](https://github.com/privet-kitty/dufy), my color library for Common Lisp. The inversion from LCHab to Munsell Color is based on the method suggested by Paul Centore. See the links and articles for more information.

- Centore, Paul. (2012). An open-source inversion algorithm for the Munsell renotation. Color Research & Application. 37. 10.1002/col.20715.

## Copyright

Copyright (c) 2018-2021 Hugo Sansaqua.
