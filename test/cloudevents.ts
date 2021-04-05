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
import * as express from 'express';
import * as functions from '../src/functions';
import {getServer} from '../src/server';
import {SignatureType} from '../src/types';
import * as supertest from 'supertest';
import {
  TEST_CLOUDEVENT_STRUCTURED,
  TEST_CLOUDEVENT_STRUCTURED_INVALID,
  TEST_CLOUDEVENT_BINARY_FULL,
  TEST_CLOUDEVENT_BINARY_INVALID,
  TEST_CLOUDEVENT_BINARY_PARTIAL,
  TestHTTPRequest,
} from './data/testHTTPData';
import {
  isBinaryCloudEvent,
  isStructuredCloudEvent,
  convertRequestToStructuredCE,
  getStructuredCloudEventContext,
} from '../src/cloudevents';

describe('CloudEvents: Utility methods', () => {
  // A full binary CloudEvent request
  const fullBinaryCloudEventRequest: express.Request = {
    headers: TEST_CLOUDEVENT_BINARY_FULL.headers,
    header: (name: string) => {
      return TEST_CLOUDEVENT_BINARY_FULL.headers[name];
    },
    body: TEST_CLOUDEVENT_BINARY_FULL.body,
  } as express.Request;

  // An incomplete binary CloudEvent requst
  const incompleteBinaryCloudEventRequest: express.Request = {
    headers: TEST_CLOUDEVENT_BINARY_INVALID.headers,
    header: (name: string) => {
      return TEST_CLOUDEVENT_BINARY_INVALID.headers[name];
    },
    body: TEST_CLOUDEVENT_BINARY_INVALID.body,
  } as express.Request;

  // A full structured CloudEvent request
  const fullStructuredCloudEventRequest: express.Request = {
    headers: TEST_CLOUDEVENT_STRUCTURED.headers,
    header: (name: string) => {
      return TEST_CLOUDEVENT_STRUCTURED.headers[name];
    },
    body: TEST_CLOUDEVENT_STRUCTURED.body,
  } as express.Request;

  // An incomplete structured CloudEvent request
  const incompleteStructuredCloudEventRequest: express.Request = {
    headers: TEST_CLOUDEVENT_STRUCTURED_INVALID.headers,
    header: (name: string) => {
      return TEST_CLOUDEVENT_STRUCTURED_INVALID.headers[name];
    },
    body: TEST_CLOUDEVENT_STRUCTURED_INVALID.body,
  } as express.Request;

  it('should correctly eval if a CloudEvent is "binary"', async () => {
    assert.strictEqual(isBinaryCloudEvent(fullBinaryCloudEventRequest), true);
    assert.strictEqual(
      isBinaryCloudEvent(incompleteBinaryCloudEventRequest),
      false
    );
  });

  it('should correctly eval if a CloudEvent is "structured"', async () => {
    assert.strictEqual(
      isStructuredCloudEvent(fullStructuredCloudEventRequest),
      true
    );
    assert.strictEqual(
      isStructuredCloudEvent(incompleteStructuredCloudEventRequest),
      false
    );
  });

  it('should convert requests to a structured CE', async () => {
    // Request that is a full CloudEvent
    assert.deepStrictEqual(
      convertRequestToStructuredCE(fullBinaryCloudEventRequest),
      TEST_CLOUDEVENT_STRUCTURED.body
    );
  });

  it('should get a binary CE from a request', async () => {
    // Request that is a full CloudEvent
    const convertedBinaryCE = getStructuredCloudEventContext(
      fullBinaryCloudEventRequest
    );
    const structuredCE = TEST_CLOUDEVENT_STRUCTURED.body;
    assert.deepStrictEqual(convertedBinaryCE, structuredCE);
  });
});

describe('Invoker: CE -> CE', () => {
  // Test data
  interface TestData extends TestHTTPRequest {
    name: string;
    isPartialCE: boolean;
  }

  const testData: TestData[] = [
    // Test a structured CloudEvent
    {
      name: 'CloudEvents v1.0 structured content mode',
      headers: {'Content-Type': 'application/cloudevents+json'},
      body: TEST_CLOUDEVENT_STRUCTURED.body,
      isPartialCE: false,
    },
    // Test a binary CloudEvent
    {
      name: 'CloudEvents v1.0 binary content mode',
      headers: {
        'Content-Type': 'application/json',
        ...TEST_CLOUDEVENT_BINARY_FULL.headers,
      },
      body: TEST_CLOUDEVENT_BINARY_FULL.body,
      isPartialCE: false,
    },
    // Test a partial CloudEvent
    {
      name: 'CloudEvents v1.0 binary content mode with only required fields',
      headers: {
        'Content-Type': 'application/json',
        ...TEST_CLOUDEVENT_BINARY_PARTIAL.headers,
      },
      body: TEST_CLOUDEVENT_BINARY_PARTIAL.body,
      isPartialCE: true,
    },
  ];
  testData.forEach(test => {
    it(`should receive cloudevent from ${test.name}`, async () => {
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
      // Required fields
      assert.strictEqual(
        receivedCloudEvent!.specversion,
        TEST_CLOUDEVENT_STRUCTURED.body.specversion
      );
      assert.strictEqual(
        receivedCloudEvent!.id,
        TEST_CLOUDEVENT_STRUCTURED.body.id
      );
      assert.strictEqual(
        receivedCloudEvent!.type,
        TEST_CLOUDEVENT_STRUCTURED.body.type
      );
      assert.strictEqual(
        receivedCloudEvent!.source,
        TEST_CLOUDEVENT_STRUCTURED.body.source
      );
      // Optional CloudEvent fields, we don't need to test
      if (!test.isPartialCE) {
        assert.strictEqual(
          receivedCloudEvent!.subject,
          TEST_CLOUDEVENT_STRUCTURED.body.subject
        );
        assert.strictEqual(
          receivedCloudEvent!.time,
          TEST_CLOUDEVENT_STRUCTURED.body.time
        );
        assert.strictEqual(
          receivedCloudEvent!.datacontenttype,
          TEST_CLOUDEVENT_STRUCTURED.body.datacontenttype
        );
        assert.deepStrictEqual(
          receivedCloudEvent!.data,
          TEST_CLOUDEVENT_STRUCTURED.body.data
        );
      }
    });
  });
});
