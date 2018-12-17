# munsell.js - library for handling Munsell Color System

**This library is not completely implemented yet.**

munsell.js is a library for JavaScript and Node.js, whose main facility is converting Munsell Color to/from other color spaces (e.g. RGB).

## Compatibility
munsell.js is completely written in ES6. You can `require` it from CommonJS without being conscious of that as this library uses [`esm` loader](https://www.npmjs.com/package/esm).

## Mechanism
The underlying data of this library is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php). Since this data assume the illuminant to be the Standard Illuminant C, munsell.js uses the Bradford transformation as CAT to other illumnants (e.g. D65).

The method of inter- and extrapolation is in common with [dufy](https://github.com/privet-kitty/dufy), my color library for Common Lisp, which is substantially based on the Paul Centore's method (though munsell.js interpolates the data via LCh<sup>ab</sup> space). See the links and articles for more details.

- Centore, Paul. (2012). An open-source inversion algorithm for the Munsell renotation. Color Research & Application. 37. 10.1002/col.20715. 

## Copyright
Copyright (c) 2018 Hugo I.
