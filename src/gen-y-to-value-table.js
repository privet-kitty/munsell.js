/* 
   Usage: node -r esm gen-y-to-value-table.js
*/
import {munsellValueToY} from './convert.js';
import fs from 'fs';

function findRoot (func, rhs, min, max, threshold) {
  // bisection method
  let mid = (min + max) * 0.5;
  let lhs = func(mid);
  while (Math.abs(lhs - rhs) > threshold) {
    if (lhs > rhs){
      max = mid;
    } else {
      min = mid;
    }
    mid = (min + max) * 0.5;
    lhs = func(mid);
  }
  return mid;
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
