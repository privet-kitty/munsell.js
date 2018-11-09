// -*- encoding: utf-8 -*-

import {mod, TWO_PI} from './arithmetic.js';

// function radian2degree(rad) {
//   return rad / TWO_PI * 360;
// }

function degree2radian(deg) {
  return deg * TWO_PI / 360;
}

const DEGREE30 = degree2radian(30);
const DEGREE6 = degree2radian(6);
const DEGREE63 = degree2radian(63);
const DEGREE60 = degree2radian(60);
const DEGREE275 = degree2radian(275);
const DEGREE25_RECIPROCAL = 1/degree2radian(25);

export function calcDeltaE00(L1, a1, b1, L2, a2, b2) {
  const C1 = Math.sqrt(a1*a1 + b1*b1);
  const C2 = Math.sqrt(a2*a2 + b2*b2);
  const ΔLprime = L2 - L1;
  const Lmean = (L1 + L2) * 0.5;
  const Cmean = (C1 + C2) * 0.5;
  const Cmean7 = Math.pow(Cmean, 7);
  const G = (1 - Math.sqrt(Cmean7 / (Cmean7 + 6103515625))) * 0.5;
  const aprime1 = a1 + a1 * G;
  const aprime2 = a2 + a2 * G;
  const Cprime1 = Math.sqrt(aprime1*aprime1 + b1*b1);
  const Cprime2 = Math.sqrt(aprime2*aprime2 + b2*b2);
  const Cmeanprime = (Cprime1 + Cprime2) * 0.5;
  const Cmeanprime7 = Math.pow(Cmeanprime, 7);
  const ΔCprime = Cprime2 - Cprime1;
  const hprime1 = mod(Math.atan2(b1, aprime1), TWO_PI);
  const hprime2 = mod(Math.atan2(b2, aprime2), TWO_PI);
  let Δhprime = hprime2 - hprime1;
  let Hmeanprime = 0;
  if ((Cprime1 === 0) || (Cprime2 === 0)) {
    Δhprime = 0;
    Hmeanprime = hprime1 + hprime2;
  } else if (Math.abs(Δhprime) <= Math.PI) {
    Hmeanprime = (hprime1 + hprime2) * 0.5;
  } else if (hprime2 <= hprime1) {
    Δhprime += TWO_PI;
    if ((hprime1 + hprime2) < TWO_PI) {
      Hmeanprime = (hprime1 + hprime2 + TWO_PI) * 0.5;
    } else {
      Hmeanprime = (hprime1 + hprime2 - TWO_PI) * 0.5;
    }
  } else {
    Δhprime -= TWO_PI;
    if ((hprime1 + hprime2) < TWO_PI) {
      Hmeanprime = (hprime1 + hprime2 + TWO_PI) * 0.5;
    } else {
      Hmeanprime = (hprime1 + hprime2 - TWO_PI) * 0.5;
    }
  }
  const ΔHprime = Math.sqrt(Cprime1 * Cprime2) * Math.sin(Δhprime * 0.5) * 2;
  const T = 1
        - 0.17 * Math.cos(Hmeanprime - DEGREE30)
        + 0.24 * Math.cos(2 * Hmeanprime)
        + 0.32 * Math.cos(3 * Hmeanprime + DEGREE6)
        - 0.20 * Math.cos(4 * Hmeanprime - DEGREE63);
  const Lmean_offsetted = Lmean - 50;
  const Lmean_offsetted_squared = Lmean_offsetted * Lmean_offsetted;
  const SL = 1 + (0.015 * Lmean_offsetted_squared) / Math.sqrt(20 + Lmean_offsetted_squared);
  const SC = 1 + 0.045 * Cmeanprime;
  const SH = 1 + 0.015 * Cmeanprime * T;
  const Hmeanprime_corrected = (Hmeanprime - DEGREE275) * DEGREE25_RECIPROCAL;
  const RT = -2 * Math.sqrt(Cmeanprime7 / (Cmeanprime7 + 6103515625))
        * Math.sin(DEGREE60 * Math.exp(- Hmeanprime_corrected * Hmeanprime_corrected));
  const factorL = ΔLprime / SL;
  const factorC = ΔCprime / SC;
  const factorH = ΔHprime / SH;
  // console.log("a'1", aprime1, "a'2", aprime2);
  // console.log("C'1", Cprime1, "C'2", Cprime2);
  // console.log("h'1", radian2degree(hprime1), "h'2", radian2degree(hprime2));
  // console.log("Δhprime", Δhprime);
  // console.log(radian2degree(Hmeanprime));
  // console.log(G);
  // console.log(T);
  // console.log(factorL, factorC, factorH);
  // console.log(SL, SC, SH, RT);
  return Math.sqrt(factorL * factorL
                   + factorC * factorC
                   + factorH * factorH
                   + RT * factorC * factorH);
}

// console.log(calcDeltaE00(50.0000, 2.6772, -79.7751, 50.0000, 0.0000, -82.7485));
// console.log(calcDeltaE00(6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286));
