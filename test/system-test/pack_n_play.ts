import {packNTest} from 'pack-n-play';
import {readFileSync} from 'fs';

describe('📦 pack-n-play test', () => {
  it('JavaScript code', async function () {
    this.timeout(300000);
    const options = {
      packageDir: process.cwd(),
      sample: {
        description: 'JavaScript user can use the cloud_events file',
        js: readFileSync('./build/src/cloud_events.js').toString(),
      },
    };
    await packNTest(options);
  });
});
