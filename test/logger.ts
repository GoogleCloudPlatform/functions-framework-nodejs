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

import {getTestServer} from '../src/testing';
import * as supertest from 'supertest';
import * as functions from '../src/index';

describe('logger', () => {
  // A normal http function request should return a 200.
  it('200 http', async () => {
    functions.http('myfunc', (req, res) => {
      res.send('200, OK!');
    });
    const server = getTestServer('myfunc');
    await supertest(server)
      .post('/')
      .send({})
      .expect(200);
  });

  // A normal cloudevent function request should return a 200.
  it('200 cloudevent', async () => {
    functions.cloudEvent('myfunc', (ce) => {
      return '200, OK! 204 No Content if no response.';
    });
    const server = getTestServer('myfunc');
    await supertest(server)
      .post('/')
      .send({})
      .expect(200);
  });

  // A function that throws a runtime error should return a 500.
  it('500 http', async () => {
    functions.http('myfunc', (req, res) => {
      throw new Error('500, Internal Server Error!');
    });
    const server = getTestServer('myfunc');
    await supertest(server)
      .post('/')
      .send({})
      .expect(500);
  });

  // A function that throws a runtime error should return a 500.
  it('500 cloudevent', async () => {
    functions.cloudEvent('myfunc', (ce) => {
      throw new Error('500, Internal Server Error!');
    });
    const server = getTestServer('myfunc');
    await supertest(server)
      .post('/')
      .send({})
      .expect(500);
  });
});
