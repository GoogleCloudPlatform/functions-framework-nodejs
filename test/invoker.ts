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
import * as express from 'express';
import * as functions from '../src/functions';
import * as invoker from '../src/invoker';
import * as supertest from 'supertest';

describe('request to HTTP function', () => {
  interface TestData {
    name: string;
    path: string;
    text: string;
    status: number;
  }

  const testData: TestData[] = [
    {
      name: 'empty path',
      path: '/',
      text: 'HELLO',
      status: 200,
    },
    {
      name: 'simple path',
      path: '/foo',
      text: 'HELLO',
      status: 200,
    },
    {
      name: 'with favicon.ico',
      path: '/favicon.ico',
      text: 'Not Found',
      status: 404,
    },
    {
      name: 'with robots.txt',
      path: '/robots.txt',
      text: 'Not Found',
      status: 404,
    },
  ];

  testData.forEach(test => {
    it(`should return transformed body: ${test.name}`, () => {
      const server = invoker.getServer(
        (req: express.Request, res: express.Response) => {
          res.send(req.body.text.toUpperCase());
        },
        invoker.SignatureType.HTTP
      );
      return supertest(server)
        .post(test.path)
        .send({ text: 'hello' })
        .set('Content-Type', 'application/json')
        .expect(test.text)
        .expect(test.status);
    });
  });
});

describe('GCF event request to event function', () => {
  interface TestData {
    name: string;
    body: {};
    expectedResource: {};
  }
  const testData: TestData[] = [
    {
      name: 'GCF event',
      body: {
        context: {
          eventId: 'testEventId',
          timestamp: 'testTimestamp',
          eventType: 'testEventType',
          resource: 'testResource',
        },
        data: { some: 'payload' },
      },
      expectedResource: 'testResource',
    },
    {
      name: 'GCF legacy event',
      body: {
        eventId: 'testEventId',
        timestamp: 'testTimestamp',
        eventType: 'testEventType',
        resource: 'testResource',
        data: { some: 'payload' },
      },
      expectedResource: 'testResource',
    },
    {
      name: 'GCF event with resource JSON',
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
        data: { some: 'payload' },
      },
      expectedResource: {
        service: 'testService',
        name: 'testName',
        type: 'testType',
      },
    },
  ];
  testData.forEach(test => {
    it(`should receive data and context from ${test.name}`, async () => {
      let receivedData: {} | null = null;
      let receivedContext: functions.CloudFunctionsContext | null = null;
      const server = invoker.getServer(
        (data: {}, context: functions.Context) => {
          receivedData = data;
          receivedContext = context as functions.CloudFunctionsContext;
        },
        invoker.SignatureType.EVENT
      );
      await supertest(server)
        .post('/')
        .send(test.body)
        .set('Content-Type', 'application/json')
        .expect(204);
      assert.deepStrictEqual(receivedData, { some: 'payload' });
      assert.notStrictEqual(receivedContext, null);
      assert.strictEqual(receivedContext!.eventId, 'testEventId');
      assert.strictEqual(receivedContext!.timestamp, 'testTimestamp');
      assert.strictEqual(receivedContext!.eventType, 'testEventType');
      assert.deepStrictEqual(receivedContext!.resource, test.expectedResource);
    });
  });
});

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

describe('CloudEvents request to event function', () => {
  interface TestData {
    name: string;
    headers: { [key: string]: string };
    body: {};
  }

  const testData: TestData[] = [
    {
      name: 'CloudEvents v1.0 structured content mode',
      headers: { 'Content-Type': 'application/cloudevents+json' },
      body: TEST_CLOUD_EVENT,
    },
    {
      name: 'CloudEvents v1.0 binary content mode',
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
    },
  ];
  testData.forEach(test => {
    it(`should receive data and context from ${test.name}`, async () => {
      let receivedData: {} | null = null;
      let receivedContext: functions.CloudEventsContext | null = null;
      const server = invoker.getServer(
        (data: {}, context: functions.Context) => {
          receivedData = data;
          receivedContext = context as functions.CloudEventsContext;
        },
        invoker.SignatureType.EVENT
      );
      await supertest(server)
        .post('/')
        .set(test.headers)
        .send(test.body)
        .expect(204);
      assert.deepStrictEqual(receivedData, TEST_CLOUD_EVENT.data);
      assert.notStrictEqual(receivedContext, null);
      assert.strictEqual(
        receivedContext!.specversion,
        TEST_CLOUD_EVENT.specversion
      );
      assert.strictEqual(receivedContext!.type, TEST_CLOUD_EVENT.type);
      assert.strictEqual(receivedContext!.source, TEST_CLOUD_EVENT.source);
      assert.strictEqual(receivedContext!.subject, TEST_CLOUD_EVENT.subject);
      assert.strictEqual(receivedContext!.id, TEST_CLOUD_EVENT.id);
      assert.strictEqual(receivedContext!.time, TEST_CLOUD_EVENT.time);
      assert.strictEqual(
        receivedContext!.datacontenttype,
        TEST_CLOUD_EVENT.datacontenttype
      );
    });
  });
});

describe('CloudEvents request to cloudevent function', () => {
  interface TestData {
    name: string;
    headers: { [key: string]: string };
    body: {};
  }

  const testData: TestData[] = [
    {
      name: 'CloudEvents v1.0 structured content mode',
      headers: { 'Content-Type': 'application/cloudevents+json' },
      body: TEST_CLOUD_EVENT,
    },
    {
      name: 'CloudEvents v1.0 binary content mode',
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
      const server = invoker.getServer(
        (cloudevent: functions.CloudEventsContext) => {
          receivedCloudEvent = cloudevent as functions.CloudEventsContext;
        },
        invoker.SignatureType.CLOUDEVENT
      );
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
