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

describe('HTTP Function', () => {
  let callCount = 0;

  before(() => {
    functions.http('testHttpFunction', (req, res) => {
      ++callCount;
      if (req.query.crash) {
        throw 'I crashed';
      }
      res.send({
        result: req.body.text,
        query: req.query.param,
      });
    });
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
      name: 'POST to empty path',
      httpVerb: 'POST',
      path: '/',
      expectedBody: {result: 'hello'},
      expectedStatus: 200,
      expectedCallCount: 1,
    },
    {
      name: 'POST to empty path',
      httpVerb: 'POST',
      path: '/foo',
      expectedBody: {result: 'hello'},
      expectedStatus: 200,
      expectedCallCount: 1,
    },
    {
      name: 'GET with query params',
      httpVerb: 'GET',
      path: '/foo?param=val',
      expectedBody: {query: 'val'},
      expectedStatus: 200,
      expectedCallCount: 1,
    },
    {
      name: 'GET throws exception',
      httpVerb: 'GET',
      path: '/foo?crash=true',
      expectedBody: {},
      expectedStatus: 500,
      expectedCallCount: 1,
    },
    {
      name: 'GET favicon.ico',
      httpVerb: 'GET',
      path: '/favicon.ico',
      expectedBody: '',
      expectedStatus: 404,
      expectedCallCount: 0,
    },
    {
      name: 'with robots.txt',
      httpVerb: 'GET',
      path: '/robots.txt',
      expectedBody: '',
      expectedStatus: 404,
      expectedCallCount: 0,
    },
  ];

  testData.forEach(test => {
    it(test.name, async () => {
      const st = supertest(getTestServer('testHttpFunction'));
      await (test.httpVerb === 'GET'
        ? st.get(test.path)
        : st.post(test.path).send({text: 'hello'})
      )
        .set('Content-Type', 'application/json')
        .expect(test.expectedBody)
        .expect(test.expectedStatus)
        .expect(res => assert(!res.get('etag')));
      assert.strictEqual(callCount, test.expectedCallCount);
    });
  });
});
