# munsell.js - library for handling Munsell Color System

[![Build Status](https://api.travis-ci.org/privet-kitty/munsell.js.svg?branch=master)](https://travis-ci.org/privet-kitty/munsell.js)
[![Coverage Status](https://coveralls.io/repos/github/privet-kitty/munsell.js/badge.svg?branch=master)](https://coveralls.io/github/privet-kitty/munsell.js?branch=master)

munsell.js is a library for JavaScript and Node.js, whose main facility is converting Munsell Color to/from other color spaces (e.g. RGB).

## Getting started
### Install
To install munsell.js to your project via npm, just run:

```
$ npm install munsell
```

### Load
munsell.js is written in the ES module format. You can `require` it from CommonJS, however, as this library uses [`esm` loader](https://www.npmjs.com/package/esm). Below are the simplest examples:

#### ES module
```javascript
import * as munsell from 'munsell';

munsell.munsellToRgb255("2.3YR 6.7/4.22");
// => [ 201, 156, 135 ]
```

#### CommonJS
```javascript
const munsell = require('munsell');

munsell.hexToMhvc("#ABCDEF");
// => [ 73.43648829473781, 8.05763439330249, 5.304123165279228 ]
```

## Mechanism
_[API Reference](https://privet-kitty.github.io/munsell.js/) provides the details beyond this README file._

munsell.js expresses the Munsell Color in two ways, a string or triplet of numbers, which can be identified by the name of method. The former is `munsell`, the standard string specification of the Munsell Color: e.g. `"4.2RP 3/11"`, `"N 10"`. The latter is `mhvc`, or Munsell HVC, its 3-number expression composed of [Hue, Value, Chroma]: e.g. `[94.2, 3, 11]`, `[0, 10 ,0]`.

The underlying data of this library is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php). Since this data assume the illuminant to be the Standard Illuminant C, munsell.js uses the Bradford transformation as CAT to other illumnants (e.g. D65).

The method of inter- and extrapolation is in common with [dufy](https://github.com/privet-kitty/dufy), my color library for Common Lisp, which is substantially based on the Paul Centore's method (though munsell.js interpolates the data via LCh<sub>ab</sub> space). See the links and articles for more information.

- Centore, Paul. (2012). An open-source inversion algorithm for the Munsell renotation. Color Research & Application. 37. 10.1002/col.20715. 

## Copyright
Copyright (c) 2018 Hugo I.
