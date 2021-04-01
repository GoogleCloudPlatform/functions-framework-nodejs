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
import * as functions from '../src/functions';
import {getServer} from '../src/server';
import {SignatureType} from '../src/types';
import * as supertest from 'supertest';
import {TestEventData} from './data/testData';

describe('Invoker: Legacy Event -> Legacy Event', () => {
  // Different HTTP inputs that expect to have the same output.
  const testData: TestEventData[] = [
    // Your normal GCF event
    {
      name: 'GCF event',
      body: {
        context: {
          eventId: 'testEventId',
          timestamp: 'testTimestamp',
          eventType: 'testEventType',
          resource: 'testResource',
        },
        data: {some: 'payload'},
      },
      expectedResource: 'testResource',
    },
    // A legacy style event
    {
      name: 'GCF legacy event',
      body: {
        eventId: 'testEventId',
        timestamp: 'testTimestamp',
        eventType: 'testEventType',
        resource: 'testResource',
        data: {some: 'payload'},
      },
      expectedResource: 'testResource',
    },
    // A legacy event with a resource object
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
        data: {some: 'payload'},
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
      const server = getServer((data: {}, context: functions.Context) => {
        receivedData = data;
        receivedContext = context as functions.CloudFunctionsContext;
      }, SignatureType.EVENT);
      await supertest(server)
        .post('/')
        .send(test.body)
        .set('Content-Type', 'application/json')
        .expect(204);

      // Assert all the fields are fine
      assert.deepStrictEqual(receivedData, {some: 'payload'}, '"data" is bad');
      assert.notStrictEqual(receivedContext, null, '"context" is bad');
      assert.strictEqual(
        receivedContext!.eventId,
        'testEventId',
        '"eventId" is bad'
      );
      assert.strictEqual(
        receivedContext!.timestamp,
        'testTimestamp',
        '"timestamp" is bad'
      );
      assert.strictEqual(
        receivedContext!.eventType,
        'testEventType',
        '"eventType" is bad'
      );
      assert.deepStrictEqual(
        receivedContext!.resource,
        test.expectedResource,
        '"resource" is bad'
      );
    });
  });
});
