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
import {getServer} from '../../src/server';

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

  describe('proxy headers', () => {
    before(() => {
      functions.http('testProxyHeaders', (req, res) => {
        res.send({
          ip: req.ip,
          ips: req.ips,
          hostname: req.hostname,
          protocol: req.protocol,
        });
      });
    });

    it('derives the client address from the hop Cloud Run adds, not from a value the client sent', async () => {
      // Cloud Run appends the connecting client's address to whatever the
      // client already put in X-Forwarded-For, so the last entry is the one the
      // platform vouches for.
      const response = await supertest(getTestServer('testProxyHeaders'))
        .get('/')
        .set('X-Forwarded-For', '198.51.100.77, 203.0.113.9')
        .set('X-Forwarded-Proto', 'https');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.ip, '203.0.113.9');
      assert.deepStrictEqual(response.body.ips, ['203.0.113.9']);
      assert.strictEqual(response.body.protocol, 'https');
    });

    it('only trusts every hop when trust proxy is set to true explicitly', async () => {
      const handler: functions.HttpFunction = (req, res) => {
        res.send({ip: req.ip, ips: req.ips});
      };
      const server = getServer(handler, {
        signatureType: 'http',
        enableExecutionId: false,
        timeoutMilliseconds: 0,
        port: '0',
        target: '',
        sourceLocation: '',
        printHelp: false,
        ignoredRoutes: null,
        trustProxy: true,
      });
      const response = await supertest(server)
        .get('/')
        .set('X-Forwarded-For', '198.51.100.77, 203.0.113.9');
      assert.strictEqual(response.status, 200);
      // The previous default: the first, client-supplied entry wins.
      assert.strictEqual(response.body.ip, '198.51.100.77');
      assert.deepStrictEqual(response.body.ips, [
        '198.51.100.77',
        '203.0.113.9',
      ]);
    });
  });
});
