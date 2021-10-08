
import {packNTest} from 'pack-n-play';
import {readFileSync} from 'fs';
import {describe, it} from 'mocha';

describe('📦 pack-n-play test', () => {
  it('JavaScript code', async function () {
    this.timeout(300000);
    const options = {
      packageDir: process.cwd(),
      sample: {
        description: 'JavaScript user can use the main index',
        js: readFileSync(
          './build/src/cloudevents.js'
        ).toString(),
      },
    };
    await packNTest(options);
  });

  it('TypeScript code', async function () {
    this.timeout(300000);
    const options = {
      packageDir: process.cwd(),
      sample: {
        description: 'TypeScript user can use the main index',
        ts: readFileSync(
          './build/src/index.d.ts'
        ).toString(),
      },
    };
    await packNTest(options);
  });
});
