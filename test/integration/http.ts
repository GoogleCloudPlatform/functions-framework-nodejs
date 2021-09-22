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
import {getServer} from '../../src/server';
import * as supertest from 'supertest';

describe('HTTP Function', () => {
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
      let callCount = 0;
      const server = getServer(
        (req: express.Request, res: express.Response) => {
          ++callCount;
          res.send({
            result: req.body.text,
            query: req.query.param,
          });
        },
        'http'
      );
      const st = supertest(server);
      await (test.httpVerb === 'GET'
        ? st.get(test.path)
        : st.post(test.path).send({text: 'hello'})
      )
        .set('Content-Type', 'application/json')
        .expect(test.expectedBody)
        .expect(test.expectedStatus);
      assert.strictEqual(callCount, test.expectedCallCount);
    });
  });
});
