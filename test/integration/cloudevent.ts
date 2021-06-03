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
import * as functions from '../../src/functions';
import {getServer} from '../../src/server';
import {SignatureType} from '../../src/types';
import * as supertest from 'supertest';

const TEST_CLOUD_EVENT = {
  specversion: '1.0',
  type: 'com.google.cloud.storage',
  source: 'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
  subject: 'test-subject',
  id: 'test-1234-1234',
  time: '2020-05-13T01:23:45Z',
  datacontenttype: 'application/json',
  data: {
    some: 'payload',
  },
};

describe('CloudEvent Function', () => {
  const testData = [
    {
      name: 'CloudEvents v1.0 structured content request',
      headers: {'Content-Type': 'application/cloudevents+json'},
      body: TEST_CLOUD_EVENT,
    },
    {
      name: 'CloudEvents v1.0 binary content request',
      headers: {
        'Content-Type': 'application/json',
        'ce-specversion': TEST_CLOUD_EVENT.specversion,
        'ce-type': TEST_CLOUD_EVENT.type,
        'ce-source': TEST_CLOUD_EVENT.source,
        'ce-subject': TEST_CLOUD_EVENT.subject,
        'ce-id': TEST_CLOUD_EVENT.id,
        'ce-time': TEST_CLOUD_EVENT.time,
        'ce-datacontenttype': TEST_CLOUD_EVENT.datacontenttype,
      },
      body: TEST_CLOUD_EVENT.data,
    },
  ];
  testData.forEach(test => {
    it(`should receive data and context from ${test.name}`, async () => {
      let receivedCloudEvent: functions.CloudEventsContext | null = null;
      const server = getServer((cloudevent: functions.CloudEventsContext) => {
        receivedCloudEvent = cloudevent as functions.CloudEventsContext;
      }, SignatureType.CLOUDEVENT);
      await supertest(server)
        .post('/')
        .set(test.headers)
        .send(test.body)
        .expect(204);
      assert.notStrictEqual(receivedCloudEvent, null);
      assert.strictEqual(
        receivedCloudEvent!.specversion,
        TEST_CLOUD_EVENT.specversion
      );
      assert.strictEqual(receivedCloudEvent!.type, TEST_CLOUD_EVENT.type);
      assert.strictEqual(receivedCloudEvent!.source, TEST_CLOUD_EVENT.source);
      assert.strictEqual(receivedCloudEvent!.subject, TEST_CLOUD_EVENT.subject);
      assert.strictEqual(receivedCloudEvent!.id, TEST_CLOUD_EVENT.id);
      assert.strictEqual(receivedCloudEvent!.time, TEST_CLOUD_EVENT.time);
      assert.strictEqual(
        receivedCloudEvent!.datacontenttype,
        TEST_CLOUD_EVENT.datacontenttype
      );
      assert.deepStrictEqual(receivedCloudEvent!.data, TEST_CLOUD_EVENT.data);
    });
  });
});
