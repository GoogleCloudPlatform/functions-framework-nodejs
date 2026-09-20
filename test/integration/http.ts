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
import {getTestServer, TestServerOptions} from '../../src/testing';

describe('HTTP Function', () => {
  let callCount = 0;

  before(() => {
    functions.http('testHttpFunction', (req, res) => {
      ++callCount;
      if (req.query.crash) {
        throw 'I crashed';
      }
      if (req.method === 'GET') {
        res.send({
          query: req.query.param,
        });
      } else {
        res.send({
          result: req.body.text,
          query: req.query.param,
        });
      }
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
      expectedBody: {},
      expectedStatus: 404,
      expectedCallCount: 0,
    },
    {
      name: 'with robots.txt',
      httpVerb: 'GET',
      path: '/robots.txt',
      expectedBody: {},
      expectedStatus: 404,
      expectedCallCount: 0,
    },
  ];

  testData.forEach(test => {
    it(test.name, async () => {
      const st = supertest(getTestServer('testHttpFunction'));
      const response = await (
        test.httpVerb === 'GET'
          ? st.get(test.path)
          : st.post(test.path).send({text: 'hello'})
      ).set('Content-Type', 'application/json');

      assert.deepStrictEqual(response.body, test.expectedBody);
      assert.strictEqual(response.status, test.expectedStatus);
      assert.equal(response.get('etag'), null);
      assert.strictEqual(callCount, test.expectedCallCount);
    });
  });

  const defaultOptions: {name: string; options?: TestServerOptions}[] = [
    {name: 'undefined options'},
    {name: 'an empty options object', options: {}},
    {name: 'an undefined route', options: {ignoredRoutes: undefined}},
    {name: 'a null route', options: {ignoredRoutes: null}},
  ];

  for (const {name, options} of defaultOptions) {
    for (const path of ['/favicon.ico', '/robots.txt']) {
      it(`keeps ${path} ignored with ${name}`, async () => {
        const response = await supertest(
          getTestServer('testHttpFunction', options),
        ).get(path);

        assert.strictEqual(response.status, 404);
        assert.strictEqual(callCount, 0);
      });
    }
  }

  for (const ignoredRoutes of ['', '  ']) {
    for (const path of ['/favicon.ico', '/robots.txt']) {
      it(`serves ${path} with ignoredRoutes=${JSON.stringify(ignoredRoutes)}`, async () => {
        const response = await supertest(
          getTestServer('testHttpFunction', {ignoredRoutes}),
        )
          .get(path)
          .query({param: 'served'});

        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(response.body, {query: 'served'});
        assert.strictEqual(callCount, 1);
      });
    }
  }

  for (const path of ['/healthz', '/favicon.ico', '/robots.txt', '/hello']) {
    it(`uses custom ignored routes for ${path}`, async () => {
      const response = await supertest(
        getTestServer('testHttpFunction', {ignoredRoutes: '/healthz'}),
      )
        .get(path)
        .query({param: 'served'});
      const ignored = path === '/healthz';

      assert.strictEqual(response.status, ignored ? 404 : 200);
      assert.deepStrictEqual(response.body, ignored ? {} : {query: 'served'});
      assert.strictEqual(callCount, ignored ? 0 : 1);
    });
  }

  it('preserves the error for an unregistered function', () => {
    assert.throws(
      () => getTestServer('unregisteredHttpFunction', {ignoredRoutes: ''}),
      /was not registered/,
    );
  });

  it('propagates an invalid ignored route expression', () => {
    assert.throws(
      () => getTestServer('testHttpFunction', {ignoredRoutes: '['}),
      TypeError,
    );
  });
});
