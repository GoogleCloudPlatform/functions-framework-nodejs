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
import {Request, Response, NextFunction} from 'express';
import * as express from 'express';
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

  it('default error handler', async () => {
    const app = express();
    app.post('/foo', async (req, res) => {
      res.send('Foo!');
    });
    app.use(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).send('Caught error!');
      }
    );
    functions.http('testHttpFunction', app);
    const malformedBody = '{"key": "value", "anotherKey": }';
    const st = supertest(
      getServer(app, {
        port: '',
        target: '',
        sourceLocation: '',
        signatureType: 'http',
        printHelp: false,
        enableExecutionId: false,
        timeoutMilliseconds: 0,
        ignoredRoutes: null,
        propagateFrameworkErrors: false,
      })
    );
    const resBody =
      '<!DOCTYPE html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      '<meta charset="utf-8">\n' +
      '<title>Error</title>\n' +
      '</head>\n' +
      '<body>\n' +
      '<pre>SyntaxError: Unexpected token &#39;}&#39;, ...&quot;therKey&quot;: }&quot; is not valid JSON<br> &nbsp; &nbsp;at JSON.parse (&lt;anonymous&gt;)<br> &nbsp; &nbsp;at parse (/Users/gregei/IdeaProjects/functions-framework-nodejs/node_modules/body-parser/lib/types/json.js:92:19)<br> &nbsp; &nbsp;at /Users/gregei/IdeaProjects/functions-framework-nodejs/node_modules/body-parser/lib/read.js:128:18<br> &nbsp; &nbsp;at AsyncResource.runInAsyncScope (node:async_hooks:211:14)<br> &nbsp; &nbsp;at invokeCallback (/Users/gregei/IdeaProjects/functions-framework-nodejs/node_modules/raw-body/index.js:238:16)<br> &nbsp; &nbsp;at done (/Users/gregei/IdeaProjects/functions-framework-nodejs/node_modules/raw-body/index.js:227:7)<br> &nbsp; &nbsp;at IncomingMessage.onEnd (/Users/gregei/IdeaProjects/functions-framework-nodejs/node_modules/raw-body/index.js:287:7)<br> &nbsp; &nbsp;at IncomingMessage.emit (node:events:518:28)<br> &nbsp; &nbsp;at IncomingMessage.emit (node:domain:552:15)<br> &nbsp; &nbsp;at endReadableNT (node:internal/streams/readable:1698:12)<br> &nbsp; &nbsp;at process.processTicksAndRejections (node:internal/process/task_queues:90:21)</pre>\n' +
      '</body>\n' +
      '</html>\n';

    const response = await st
      .post('/foo')
      .set('Content-Type', 'application/json')
      .send(malformedBody);

    assert.strictEqual(response.status, 400);
    assert.equal(response.text, resBody);
  });

  it('user application error handler', async () => {
    const app = express();
    const resBody = 'Caught error!';
    app.post('/foo', async (req, res) => {
      res.send('Foo!');
    });
    app.use(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_err: Error, _req: Request, res: Response, _next: NextFunction) => {
        res.status(500).send(resBody);
      }
    );
    functions.http('testHttpFunction', app);
    const malformedBody = '{"key": "value", "anotherKey": }';
    const st = supertest(
      getServer(app, {
        port: '',
        target: '',
        sourceLocation: '',
        signatureType: 'http',
        printHelp: false,
        enableExecutionId: false,
        timeoutMilliseconds: 0,
        ignoredRoutes: null,
        propagateFrameworkErrors: true,
      })
    );

    const response = await st
      .post('/foo')
      .set('Content-Type', 'application/json')
      .send(malformedBody);

    assert.strictEqual(response.status, 500);
    assert.equal(response.text, resBody);
  });
});
