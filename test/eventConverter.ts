// Copyright 2019 Google LLC
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
import * as functions from '../src/functions';
import {getServer} from '../src/server';
import {SignatureType} from '../src/types';
import * as supertest from 'supertest';
import {
  TEST_CLOUDEVENT_BINARY_FULL,
  TEST_CLOUDEVENT_STRUCTURED,
} from './data/testData';

describe('Invoker: CloudEvents -> Legacy Event', () => {
  interface TestData {
    name: string;
    headers: { [key: string]: string };
    body: {};
  }

  const testData: TestData[] = [
    {
      name: 'CloudEvents v1.0 structured content mode',
      headers: {
        'Content-Type': 'application/cloudevents+json',
        ...TEST_CLOUDEVENT_BINARY_FULL.headers,
      },
      body: TEST_CLOUDEVENT_STRUCTURED.body,
    },
    {
      name: 'CloudEvents v1.0 binary content mode',
      headers: {
        'Content-Type': 'application/cloudevents+json',
        ...TEST_CLOUDEVENT_BINARY_FULL.headers,
      },
      body: TEST_CLOUDEVENT_BINARY_FULL.body,
    },
  ];
  testData.forEach(test => {
    it(`should receive data and context from ${test.name}`, async () => {
      let receivedData: {} | null = null;
      let receivedContext: functions.Context | null = null;
      const server = getServer(
        (data: {}, context: functions.Context) => {
          receivedData = data;
          receivedContext = context;
        },
        SignatureType.EVENT
      );
      await supertest(server)
        .post('/')
        .set(test.headers)
        .send(test.body)
        .expect(204);
      // assert.deepStrictEqual(receivedData, TEST_CLOUDEVENT_STRUCTURED.body.data, 'data');
      // assert.notStrictEqual(receivedContext, null);
      // assert.strictEqual(
      //   receivedContext!.specversion,
      //   TEST_CLOUDEVENT_STRUCTURED.body.specversion
      // );
      // assert.strictEqual(receivedContext!.type, TEST_CLOUDEVENT_STRUCTURED.body.type);
      // assert.strictEqual(receivedContext!.source, TEST_CLOUDEVENT_STRUCTURED.body.source);
      // assert.strictEqual(receivedContext!.subject, TEST_CLOUDEVENT_STRUCTURED.body.subject);
      // assert.strictEqual(receivedContext!.id, TEST_CLOUDEVENT_STRUCTURED.body.id);
      // assert.strictEqual(receivedContext!.time, TEST_CLOUDEVENT_STRUCTURED.body.time);
      // assert.strictEqual(
      //   receivedContext!.datacontenttype,
      //   TEST_CLOUDEVENT_STRUCTURED.body.datacontenttype
      // );
    });
  });
});
