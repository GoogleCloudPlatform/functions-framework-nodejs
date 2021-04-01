import * as assert from 'assert';
import * as express from 'express';
import {SignatureType} from '../src/types';
import {getServer} from '../src/server';
import * as supertest from 'supertest';

/**
 * Tests HTTP requests to the Functions Framework
 */
describe('Invoker: HTTP requests', () => {
  interface TestData {
    name: string;
    path: string;
    text: string;
    status: number;
    callCount: number;
  }

  const testData: TestData[] = [
    // Normal HTTP request with no path
    {
      name: 'empty path',
      path: '/',
      text: 'HELLO',
      status: 200,
      callCount: 1,
    },
    // Normal HTTP request with simple path
    {
      name: 'simple path',
      path: '/foo',
      text: 'HELLO',
      status: 200,
      callCount: 1,
    },
    // HTTP request to favicon.ico
    {
      name: 'with favicon.ico',
      path: '/favicon.ico',
      text: '',
      status: 404,
      callCount: 0,
    },
    // HTTP request to robots.txt
    {
      name: 'with robots.txt',
      path: '/robots.txt',
      text: '',
      status: 404,
      callCount: 0,
    },
  ];

  testData.forEach(test => {
    it(`should return the correct HTTP status and call count: ${test.name}`, async () => {
      let callCount = 0;
      const server = getServer(
        // HTTP request that uppercases the request body text.
        (req: express.Request, res: express.Response) => {
          ++callCount;
          res.send(req.body.text.toUpperCase());
        },
        SignatureType.HTTP
      );
      // Send a request to the FF with test "hello".
      await supertest(server)
        .post(test.path)
        .send({text: 'hello'})
        .set('Content-Type', 'application/json')
        .expect(test.text)
        .expect(test.status);
      // Some paths (like favicon.ico and robots.txt shouldn't invoke the function)
      assert.strictEqual(callCount, test.callCount);
    });
  });
});
