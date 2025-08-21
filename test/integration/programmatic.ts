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
import * as sinon from 'sinon';
import * as supertest from 'supertest';
import {main} from '../../src/main';
import * as server from '../../src/server';
import {HttpFunction, CloudEventFunction} from '../../src/functions';
import {Server} from 'http';

describe('programmatic functions', () => {
  let exitStub: sinon.SinonStub;
  let errorStub: sinon.SinonStub;
  let getServerStub: sinon.SinonStub;

  beforeEach(() => {
    exitStub = sinon.stub(process, 'exit');
    errorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    exitStub.restore();
    errorStub.restore();
    if (getServerStub) {
      getServerStub.restore();
    }
  });

  it('should run an HTTP function', async () => {
    const httpFunc: HttpFunction = (req, res) => {
      res.send('hello');
    };

    let capturedServer: Server | null = null;
    let listenStub: sinon.SinonStub;
    const originalGetServer = server.getServer;
    getServerStub = sinon.stub(server, 'getServer').callsFake((fn, opts) => {
      const s = originalGetServer(fn, opts);
      capturedServer = s;
      listenStub = sinon.stub(s, 'listen').returns(s);
      return s;
    });

    await main(httpFunc);

    listenStub!.restore();

    assert.ok(capturedServer);
    const st = supertest(capturedServer!);
    const response = await st.get('/');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.text, 'hello');
  });

  it('should run a CloudEvent function', async () => {
    let receivedEvent: any = null;
    const cloudEventFunc: CloudEventFunction = cloudEvent => {
      receivedEvent = cloudEvent;
    };

    let capturedServer: Server | null = null;
    let listenStub: sinon.SinonStub;
    const originalGetServer = server.getServer;
    getServerStub = sinon.stub(server, 'getServer').callsFake((fn, opts) => {
      const s = originalGetServer(fn, opts);
      capturedServer = s;
      listenStub = sinon.stub(s, 'listen').returns(s);
      return s;
    });

    const argv = process.argv;
    process.argv = ['node', 'index.js', '--signature-type=cloudevent'];
    await main(cloudEventFunc);
    process.argv = argv;

    listenStub!.restore();

    assert.ok(capturedServer);
    const st = supertest(capturedServer!);
    const event = {
      specversion: '1.0',
      type: 'com.google.cloud.storage',
      source: 'test',
      id: 'test',
      data: 'hello',
    };
    const response = await st
      .post('/')
      .send(event)
      .set('Content-Type', 'application/cloudevents+json');

    assert.strictEqual(response.status, 204);
    assert.ok(receivedEvent);
    assert.strictEqual(receivedEvent.data, 'hello');
  });
});
