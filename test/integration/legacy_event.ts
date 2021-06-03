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

describe('Event Function', () => {
  const testData = [
    {
      name: 'GCF event',
      headers: {},
      body: {
        context: {
          eventId: 'testEventId',
          timestamp: 'testTimestamp',
          eventType: 'testEventType',
          resource: 'testResource',
        },
        data: {some: 'payload'},
      },
      expectedResource: {
        eventId: 'testEventId',
        eventType: 'testEventType',
        resource: 'testResource',
        timestamp: 'testTimestamp',
      },
    },
    {
      name: 'GCF legacy event',
      headers: {},
      body: {
        eventId: 'testEventId',
        timestamp: 'testTimestamp',
        eventType: 'testEventType',
        resource: 'testResource',
        data: {some: 'payload'},
      },
      expectedResource: {
        eventId: 'testEventId',
        eventType: 'testEventType',
        resource: 'testResource',
        timestamp: 'testTimestamp',
      },
    },
    {
      name: 'GCF event with resource JSON',
      headers: {},
      body: {
        context: {
          eventId: 'testEventId',
          timestamp: 'testTimestamp',
          eventType: 'testEventType',
          resource: {
            service: 'testService',
            name: 'testName',
            type: 'testType',
          },
        },
        data: {some: 'payload'},
      },
      expectedResource: {
        eventId: 'testEventId',
        eventType: 'testEventType',
        resource: {
          name: 'testName',
          service: 'testService',
          type: 'testType',
        },
        timestamp: 'testTimestamp',
      },
    },
    {
      name: 'CloudEvents v1.0 structured content request',
      headers: {'Content-Type': 'application/cloudevents+json'},
      body: TEST_CLOUD_EVENT,
      expectedResource: {
        datacontenttype: 'application/json',
        id: 'test-1234-1234',
        source:
          'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
        specversion: '1.0',
        subject: 'test-subject',
        time: '2020-05-13T01:23:45Z',
        type: 'com.google.cloud.storage',
      },
    },
    {
      name: 'CloudEvents v1.0 binary content request',
      headers: {
        'Content-Type': 'application/cloudevents+json',
        'ce-specversion': TEST_CLOUD_EVENT.specversion,
        'ce-type': TEST_CLOUD_EVENT.type,
        'ce-source': TEST_CLOUD_EVENT.source,
        'ce-subject': TEST_CLOUD_EVENT.subject,
        'ce-id': TEST_CLOUD_EVENT.id,
        'ce-time': TEST_CLOUD_EVENT.time,
        'ce-datacontenttype': TEST_CLOUD_EVENT.datacontenttype,
      },
      body: TEST_CLOUD_EVENT.data,
      expectedResource: {
        datacontenttype: 'application/json',
        id: 'test-1234-1234',
        source:
          'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
        specversion: '1.0',
        subject: 'test-subject',
        time: '2020-05-13T01:23:45Z',
        type: 'com.google.cloud.storage',
      },
    },
  ];
  testData.forEach(test => {
    it(test.name, async () => {
      let receivedData: {} | null = null;
      let receivedContext: functions.CloudFunctionsContext | null = null;
      const server = getServer((data: {}, context: functions.Context) => {
        receivedData = data;
        receivedContext = context as functions.CloudFunctionsContext;
      }, SignatureType.EVENT);
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...test.headers,
      };
      await supertest(server)
        .post('/')
        .send(test.body)
        .set(requestHeaders)
        .expect(204);
      assert.deepStrictEqual(receivedData, {some: 'payload'});
      assert.deepStrictEqual(receivedContext, test.expectedResource);
    });
  });
});
