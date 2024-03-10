/*
 * This script checks if the round trip conversion between 24-bit RGB and
 * Munsell HVC is lossless. If --output option is given, the Munsell Color
 * strings are saved to a file specified by the option, which is for
 * checking the invariance between the versions of this library.
 * command: npx ts-node test/round-trip-test.ts [--output path]
 */
import { mhvcToMunsell, mhvcToRgb255, rgb255ToMhvc } from '../src';
import fs from 'fs';

const start = process.hrtime.bigint();
let failed = false;
const isOutput = process.argv.includes('--output');
const storage: string[] = isOutput ? Array(2 ** 24).fill('') : [];

for (let rgb = 0; rgb < 2 ** 24; rgb++) {
  const [r, g, b] = [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
  const hvc = rgb255ToMhvc(r, g, b);
  const [r2, g2, b2] = mhvcToRgb255(...hvc);
  if (isOutput) {
    storage[rgb] = mhvcToMunsell(...hvc);
  }
  if (r !== r2 || g !== g2 || b !== b2) {
    console.log(`Failed at [${r}, ${g}, ${b}]: [${r2}, ${g2}, ${b2}]`);
    failed = true;
  }
}

const end = process.hrtime.bigint();
const elapsed = Number(end - start) / 1e9;
console.log(`Elapsed time: ${elapsed} sec.`);
console.log(`Performance: ${Math.round(256 ** 3 / elapsed)} queries per sec.`);

if (isOutput) {
  // save to output Path
  const path = process.argv[process.argv.indexOf('--output') + 1];
  fs.writeFileSync(path, storage.join('\n') + '\n');
}

if (failed) {
  console.log('Result: FAILED');
  process.exit(1);
} else {
  console.log('Result: PASSED');
}
