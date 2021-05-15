import { munsellValueToY } from './convert';
import fs from 'fs';

const findRoot = (
  func: (x: number) => number,
  rhs: number,
  min: number,
  max: number,
  eps: number,
): number => {
  // bisection method
  const mid = (min + max) * 0.5;
  const lhs = func(mid);
  if (Math.abs(lhs - rhs) <= eps) {
    return mid;
  } else {
    return lhs > rhs ? findRoot(func, rhs, min, mid, eps) : findRoot(func, rhs, mid, max, eps);
  }
};

const partitions = 2000;
const yToMunsellValueTable = Array(1 + partitions)
  .fill(0.0)
  .map((_, i) => {
    return findRoot(munsellValueToY, i / partitions, 0, 10, 1e-8);
  });
yToMunsellValueTable[0] = 0;
yToMunsellValueTable[partitions] = 10;

fs.writeFileSync(
  'src/y-to-value-table.ts',
  `export const yToMunsellValueTable =
${JSON.stringify(yToMunsellValueTable, (key, val) => {
  return val.toFixed ? Number(val.toFixed(6)) : val;
})};
`,
);
