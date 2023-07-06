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
import * as sinon from 'sinon';
import * as supertest from 'supertest';

import * as functions from '../../src/index';
import {getTestServer} from '../../src/testing';

describe('Typed Function', () => {
  let callCount = 0;

  interface NameConcatRequest {
    first: string;
    last: string;
  }

  interface NameConcatResponse {
    combined: string;
  }

  before(() => {
    functions.typed<NameConcatRequest, NameConcatResponse>(
      'nameConcatFunc',
      req => {
        callCount += 1;
        return {
          combined: req.first + req.last,
        };
      }
    );

    // Async function is expected to test asynchronous codepaths for echo handling.
    functions.typed<NameConcatRequest, NameConcatResponse>(
      'nameConcatFuncAsync',
      req => {
        callCount += 1;
        return new Promise(accept =>
          setImmediate(() => accept({combined: req.first + req.last}))
        );
      }
    );

    // Error prone function tests simply throwing an error a synchronous function
    functions.typed<NameConcatRequest, NameConcatResponse>(
      'errorProneTypedFunc',
      () => {
        callCount += 1;
        throw new Error('synchronous error');
      }
    );

    // Error prone async function throws an asynchronous error
    functions.typed<NameConcatRequest, NameConcatResponse>(
      'errorProneAsyncTypedFunc',
      () => {
        callCount += 1;
        return new Promise((_, reject) =>
          setImmediate(() => reject(new Error('async error')))
        );
      }
    );
  });

  beforeEach(() => {
    callCount = 0;
    // Prevent log spew from the PubSub emulator request.
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    (console.error as sinon.SinonSpy).restore();
  });

  const testData = [
    {
      func: 'nameConcatFunc',
      name: "basic POST request to '/'/",
      requestBody: {first: 'Jane', last: 'Doe'},
      expectedBody: {combined: 'JaneDoe'},
      expectedStatus: 200,
      expectedCallCount: 1,
    },
    {
      func: 'nameConcatFunc',
      name: 'POST malformatted JSON',
      requestBody: 'ASDF',
      expectedBody: /Failed to parse malformatted JSON in request.*/,
      expectedStatus: 400,
      expectedCallCount: 0,
    },
    {
      func: 'nameConcatFunc',
      name: 'POST /foo PATH',
      path: '/foo',
      requestBody: {first: 'Jane', last: 'Doe'},
      expectedBody: {combined: 'JaneDoe'},
      expectedStatus: 200,
      expectedCallCount: 1,
    },
    {
      func: 'nameConcatFuncAsync',
      name: "async basic POST request to '/'",
      requestBody: {first: 'Jane', last: 'Doe'},
      expectedBody: {combined: 'JaneDoe'},
      expectedStatus: 200,
      expectedCallCount: 1,
    },
    {
      func: 'errorProneTypedFunc',
      name: 'error in synchronous function',
      expectedStatus: 500,
      expectedCallCount: 1,
    },
    {
      func: 'errorProneAsyncTypedFunc',
      name: 'error in async function',
      expectedStatus: 500,
      expectedCallCount: 1,
    },
  ];

  it("does not support 'GET' HTTP verb", async () => {
    const st = supertest(getTestServer('nameConcatFunc'));
    await st.get('/').expect(404);
  });

  testData.forEach(test => {
    it(test.name, async () => {
      const st = supertest(getTestServer(test.func));

      const tc = st
        .post(test.path || '/')
        .send(test.requestBody || {})
        .set('Content-Type', 'application/json');
      if (test.expectedBody) {
        tc.expect(test.expectedBody);
      }
      if (test.expectedStatus) {
        tc.expect(test.expectedStatus);
      }
      await tc;
      assert.strictEqual(callCount, test.expectedCallCount);
    });
  });
});
