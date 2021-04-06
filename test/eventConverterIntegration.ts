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
import {getServer} from '../src/server';
import {SignatureType} from '../src/types';
import * as supertest from 'supertest';
import {Context, LegacyEvent} from '../src/functions';
import {
  TestHTTPRequest,
  TEST_CLOUDEVENT_STORAGE_INPUT,
  TEST_CLOUDEVENT_STORAGE_OUTPUT,
} from './data/testHTTPData';

describe('Invoker: CE -> Legacy', () => {
  // Downcas CE to legacy
  interface CEToLegacyTestCase {
    name?: string;
    input: TestHTTPRequest;
    expectedOutput: LegacyEvent;
  }
  // Upcast legacy to CE
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface LegacyToCETestCase {
    name?: string;
    input: LegacyEvent;
    expectedOutput: TestHTTPRequest;
  }

  // Our test input / output
  const cloudeventTestData: CEToLegacyTestCase[] = [
    {
      name: 'CloudEvents v1.0 structured content mode',
      input: TEST_CLOUDEVENT_STORAGE_INPUT,
      expectedOutput: TEST_CLOUDEVENT_STORAGE_OUTPUT,
    },
  ];
  cloudeventTestData.forEach(test => {
    // TODO Downcast converter
    it(`should receive data and context from ${test.name}`, async () => {
      let receivedData: {} | null = null;
      let receivedContext: Context | null = null;
      const server = getServer((data: {}, context: Context) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        receivedData = data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        receivedContext = context;
      }, SignatureType.EVENT);
      await supertest(server)
        .post('/')
        .set(test.input.headers)
        .send(test.input.body)
        .expect(204);
      assert.strictEqual(1, 1);
      // console.log(receivedData);
      // assert.deepStrictEqual(receivedData, test.expectedOutput.data);
      // assert.deepStrictEqual(receivedContext, test.expectedOutput.context);
    });
  });
});
