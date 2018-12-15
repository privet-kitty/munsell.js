import {calcDeltaE00} from '../src/ciede2000.js';
import fs from 'fs';

// Reads and parses the .csv file into testSet.
const wholeStr = fs.readFileSync('./test/ciede2000-test-data.csv', {encoding: 'ascii'})
      .split('\n')
      .filter((s) => s.length !== 0); // Deletes the last empty row
const size = wholeStr.length;

let testSet = [];
for(let i = 0; i < size; i += 2) {
  const row1 = wholeStr[i].split(',').map(parseFloat);
  const row2 = wholeStr[i+1].split(',').map(parseFloat);
  testSet.push([row1[0], row1[1], row1[2], row2[0], row2[1], row2[2], row1.slice(-1)[0]]);
}

describe('calcDeltaE00()', () => {
  for(let i in testSet) {
    const row = testSet[i];
    test(`Sharma-Wu-Dalal test case ${i}`, () => {
      expect(calcDeltaE00.apply(null, row.slice(0, 6))).toBeCloseTo(row[6], 4);
    })
  }
})
