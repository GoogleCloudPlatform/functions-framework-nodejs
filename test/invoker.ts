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
import * as invoker from '../src/invoker';
import * as supertest from 'supertest';

describe('loading function', () => {
  it('should load the function', () => {
    const loadedFunction = invoker.getUserFunction(
      process.cwd() + '/test/function',
      'foo'
    ) as invoker.EventFunction;
    const returned = loadedFunction({}, {});
    assert.strictEqual(returned, 'Hello from foo');
  });
});

describe('request to HTTP function', () => {
  it('should return transformed body', () => {
    const server = invoker.getServer(
      (req: express.Request, res: express.Response) => {
        res.send(req.body.text.toUpperCase());
      },
      invoker.SignatureType.HTTP,
      'testFunction'
    );
    return supertest(server)
      .post('/')
      .send({ text: 'hello' })
      .set('Content-Type', 'application/json')
      .expect('HELLO')
      .expect(200);
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
      let receivedContext: invoker.CloudFunctionsContext | null = null;
      const server = invoker.getServer(
        (data: {}, context: invoker.Context) => {
          receivedData = data;
          receivedContext = context as invoker.CloudFunctionsContext;
        },
        invoker.SignatureType.EVENT,
        'testFunction'
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

describe('CloudEvents request to event function', () => {
  interface TestData {
    name: string;
    headers: { [key: string]: string };
    body: {};
  }
  const testData: TestData[] = [
    {
      name: 'CloudEvents v0.2 structured content mode',
      headers: { 'Content-Type': 'application/cloudevents+json' },
      body: {
        type: 'testType',
        specversion: 'testSpecversion',
        source: 'testSource',
        id: 'testId',
        time: 'testTime',
        schemaurl: 'testSchemaurl',
        contenttype: 'testContenttype',
        data: {
          some: 'payload',
        },
      },
    },
    {
      name: 'CloudEvents v0.2 binary content mode',
      headers: {
        'Content-Type': 'application/json',
        'ce-type': 'testType',
        'ce-specversion': 'testSpecversion',
        'ce-source': 'testSource',
        'ce-id': 'testId',
        'ce-time': 'testTime',
        'ce-schemaurl': 'testSchemaurl',
        'ce-contenttype': 'testContenttype',
      },
      body: {
        some: 'payload',
      },
    },
  ];
  testData.forEach(test => {
    it(`should receive data and context from ${test.name}`, async () => {
      let receivedData: {} | null = null;
      let receivedContext: invoker.CloudEventsContext | null = null;
      const server = invoker.getServer(
        (data: {}, context: invoker.Context) => {
          receivedData = data;
          receivedContext = context as invoker.CloudEventsContext;
        },
        invoker.SignatureType.EVENT,
        'testFunction'
      );
      await supertest(server)
        .post('/')
        .set(test.headers)
        .send(test.body)
        .expect(204);
      assert.deepStrictEqual(receivedData, { some: 'payload' });
      assert.notStrictEqual(receivedContext, null);
      assert.strictEqual(receivedContext!.type, 'testType');
      assert.strictEqual(receivedContext!.specversion, 'testSpecversion');
      assert.strictEqual(receivedContext!.source, 'testSource');
      assert.strictEqual(receivedContext!.id, 'testId');
      assert.strictEqual(receivedContext!.time, 'testTime');
      assert.strictEqual(receivedContext!.schemaurl, 'testSchemaurl');
      assert.strictEqual(receivedContext!.contenttype, 'testContenttype');
    });
  });
});
