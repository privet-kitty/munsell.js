/* 
   Usage: node -r esm gen-y-to-value-table.js
*/
import {munsellValueToY} from './convert.js';
import fs from 'fs';

function findRoot (func, rhs, min, max, threshold) {
  // bisection method
  const mid = (min + max) * 0.5;
  const lhs = func(mid);
  if (Math.abs(lhs - rhs) <= threshold) {
    return mid;
  } else {
    return lhs > rhs ?
      findRoot(func, rhs, min, mid, threshold):
      findRoot(func, rhs, mid, max, threshold);
  }
}

const partitions = 2000;
const yToMunsellValueTable = Array(1+partitions).fill().map((_, i) => {
  return findRoot(munsellValueToY, i / partitions, 0, 10, 1e-8);
});
yToMunsellValueTable[0] = 0;
yToMunsellValueTable[partitions] = 10;

fs.writeFileSync("y-to-value-table.js",
                 `export const yToMunsellValueTable =
${JSON.stringify(yToMunsellValueTable, (key, val) => {
    return val.toFixed ? Number(val.toFixed(6)) : val;
})};
`)
