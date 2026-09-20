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

  it('exposes configurable routes through the testing entry point', async function () {
    this.timeout(300000);
    await packNTest({
      packageDir: process.cwd(),
      sample: {
        description: 'JavaScript user can configure the public testing helper',
        js: `
          const assert = require('assert');
          const http = require('http');
          const functions = require('@google-cloud/functions-framework');
          const {getTestServer} = require('@google-cloud/functions-framework/testing');
          let calls = 0;
          functions.http('packagedHttpFunction', (_req, res) => {
            calls++;
            res.send('handler reached');
          });

          async function check(options, path, expectedStatus) {
            const server = getTestServer('packagedHttpFunction', options);
            calls = 0;
            await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
            try {
              const response = await new Promise((resolve, reject) => {
                const request = http.get({
                  hostname: '127.0.0.1', port: server.address().port, path,
                  agent: false,
                }, response => {
                  let body = '';
                  response.setEncoding('utf8');
                  response.on('data', chunk => body += chunk);
                  response.on('error', reject);
                  response.on('end', () => resolve({status: response.statusCode, body}));
                });
                request.on('error', reject);
              });
              assert.strictEqual(response.status, expectedStatus);
              assert.strictEqual(calls, expectedStatus === 200 ? 1 : 0);
              if (expectedStatus === 200) assert.strictEqual(response.body, 'handler reached');
            } finally {
              await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
            }
          }

          (async () => {
            for (const path of ['/favicon.ico', '/robots.txt']) {
              await check(undefined, path, 404);
              await check({ignoredRoutes: ''}, path, 200);
              await check({ignoredRoutes: '/healthz'}, path, 200);
            }
            await check({ignoredRoutes: '/healthz'}, '/healthz', 404);
          })().catch(error => { console.error(error); process.exitCode = 1; });
        `,
      },
    });
  });
});
