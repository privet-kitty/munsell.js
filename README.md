# Albert - simple training tool for colorimetry

https://privet-kitty.github.io/albert/

This is a simple training tool to guess the Munsell Color code of a given color. Currently it is supposed that your screen is calibrated to _sRGB_.

## Mechanism
The underlying data of this tool is the [Munsell Renotation Data](https://www.rit.edu/cos/colorscience/rc_munsell_renotation.php). Since this data assume the illuminant to be the Standard Illuminant C, Bradford transformation is used as chromatic adaptation to D65. The method of inter- and extrapolation is in common with [dufy](https://github.com/privet-kitty/dufy), my color library for Common Lisp. See the links for more details.

The score of your guess is computed based on CIEDE2000.

## Copyright
Copyright (c) 2018 Hugo I.
