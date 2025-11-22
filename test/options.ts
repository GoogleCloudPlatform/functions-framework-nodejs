// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as assert from 'assert';
import {resolve} from 'path';
import {
  parseOptions,
  FrameworkOptions,
  logExecutionIdSupported,
} from '../src/options';

describe('parseOptions', () => {
  interface TestData {
    name: string;
    cliOpts: string[];
    envVars: {[key: string]: string};
    expectedOptions?: Partial<FrameworkOptions>;
  }

  const testData: TestData[] = [
    {
      name: 'parses the cli --help option',
      cliOpts: ['bin/node', '/index.js', '--help'],
      envVars: {},
      expectedOptions: {
        printHelp: true,
        enableExecutionId: false,
      },
    },
    {
      name: 'parses the cli -h option',
      cliOpts: ['bin/node', '/index.js', '-h'],
      envVars: {},
      expectedOptions: {
        printHelp: true,
        enableExecutionId: false,
      },
    },
    {
      name: 'sets the correct defaults for all options',
      cliOpts: ['bin/node', '/index.js'],
      envVars: {},
      expectedOptions: {
        port: '8080',
        target: 'function',
        sourceLocation: resolve(''),
        signatureType: 'http',
        printHelp: false,
        enableExecutionId: false,
        timeoutMilliseconds: 0,
        ignoredRoutes: null,
      },
    },
    {
      name: 'respects all cli flags',
      cliOpts: [
        'bin/node',
        '/index.js',
        '--port',
        '1234',
        '--target=helloWorld',
        '--signature-type',
        'cloudevent',
        '--source=/source',
        '--timeout',
        '6',
        '--ignored-routes=banana',
      ],
      envVars: {},
      expectedOptions: {
        port: '1234',
        target: 'helloWorld',
        sourceLocation: resolve('/source'),
        signatureType: 'cloudevent',
        printHelp: false,
        enableExecutionId: false,
        timeoutMilliseconds: 6000,
        ignoredRoutes: 'banana',
      },
    },
    {
      name: 'respects all env vars',
      cliOpts: ['bin/node', '/index.js'],
      envVars: {
        PORT: '1234',
        FUNCTION_TARGET: 'helloWorld',
        FUNCTION_SIGNATURE_TYPE: 'cloudevent',
        FUNCTION_SOURCE: '/source',
        CLOUD_RUN_TIMEOUT_SECONDS: '2',
        IGNORED_ROUTES: '',
      },
      expectedOptions: {
        port: '1234',
        target: 'helloWorld',
        sourceLocation: resolve('/source'),
        signatureType: 'cloudevent',
        printHelp: false,
        enableExecutionId: false,
        timeoutMilliseconds: 2000,
        ignoredRoutes: '',
      },
    },
    {
      name: 'prioritizes cli flags over env vars',
      cliOpts: [
        'bin/node',
        '/index.js',
        '--port',
        '1234',
        '--target=helloWorld',
        '--signature-type',
        'cloudevent',
        '--source=/source',
        '--timeout=3',
        '--ignored-routes=avocado',
      ],
      envVars: {
        PORT: '4567',
        FUNCTION_TARGET: 'fooBar',
        FUNCTION_SIGNATURE_TYPE: 'event',
        FUNCTION_SOURCE: '/somewhere/else',
        CLOUD_RUN_TIMEOUT_SECONDS: '5',
        IGNORED_ROUTES: 'banana',
      },
      expectedOptions: {
        port: '1234',
        target: 'helloWorld',
        sourceLocation: resolve('/source'),
        signatureType: 'cloudevent',
        printHelp: false,
        enableExecutionId: false,
        timeoutMilliseconds: 3000,
        ignoredRoutes: 'avocado',
      },
    },
  ];

  testData.forEach(testCase => {
    it(testCase.name, () => {
      const options = parseOptions(testCase.cliOpts, testCase.envVars);
      const {expectedOptions} = testCase;
      assert(expectedOptions);
      let opt: keyof FrameworkOptions;
      for (opt in expectedOptions) {
        assert.deepStrictEqual(expectedOptions[opt], options[opt]);
      }
    });
  });

  const cliOpts = ['bin/node', '/index.js'];
  it('default disable execution id support', () => {
    const options = parseOptions(cliOpts, {});
    assert.strictEqual(options.enableExecutionId, false);
  });

  it('disable execution id support by cli flag', () => {
    const options = parseOptions(
      ['bin/node', '/index.js', '--log-execution-id=false'],
      {},
    );
    assert.strictEqual(options.enableExecutionId, false);
  });

  it('disable execution id support by env var', () => {
    const envVars = {
      LOG_EXECUTION_ID: 'False',
    };
    const options = parseOptions(cliOpts, envVars);
    assert.strictEqual(options.enableExecutionId, false);
  });

  const executionIdTestData: TestData[] = [
    {
      name: 'enable execution id support by cli flag',
      cliOpts: ['bin/node', '/index.js', '--log-execution-id'],
      envVars: {},
    },
    {
      name: 'enable execution id support by env var',
      cliOpts: ['bin/node', '/index.js'],
      envVars: {LOG_EXECUTION_ID: 'True'},
    },
    {
      name: 'execution id prioritizes cli flag over env var',
      cliOpts: ['bin/node', '/index.js', '--log-execution-id=true'],
      envVars: {LOG_EXECUTION_ID: 'False'},
    },
  ];

  executionIdTestData.forEach(testCase => {
    it(testCase.name, () => {
      const options = parseOptions(testCase.cliOpts, testCase.envVars);
      if (logExecutionIdSupported === false) {
        assert.strictEqual(options.enableExecutionId, false);
      } else {
        assert.strictEqual(options.enableExecutionId, true);
      }
    });
  });

  const validationErrorTestCases: TestData[] = [
    {
      name: 'signature type is invalid',
      cliOpts: ['bin/node', 'index.js', '--signature-type=monkey'],
      envVars: {},
    },
    {
      name: 'timeout is not a number',
      cliOpts: ['bin/node', '/index.js', '--timeout=foobar'],
      envVars: {},
    },
    {
      name: 'timeout is a negative number',
      cliOpts: ['bin/node', '/index.js', '--timeout=-10'],
      envVars: {},
    },
  ];
  validationErrorTestCases.forEach(testCase => {
    it('throws an exception when ' + testCase.name, () => {
      assert.throws(() => {
        parseOptions(testCase.cliOpts, testCase.envVars);
      });
    });
  });
});
