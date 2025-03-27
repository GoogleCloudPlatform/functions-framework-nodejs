import * as assert from 'assert';
import {Request, Response} from 'express';
import {Context, CloudEvent} from '../src/functions';
import {wrapUserFunction} from '../src/function_wrappers';
import EventEmitter = require('events');

describe('wrapUserFunction', () => {
  const CLOUD_EVENT = {
    specversion: '1.0',
    type: 'foobar',
    source: '//somewhere/',
    id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
    time: '1970-01-01T00:00:00.000Z',
    datacontenttype: 'application/json',
    data: {
      hello: 'world',
    },
  };

  const createRequest = (
    body: object | string,
    headers?: {[key: string]: string},
  ) =>
    ({
      body,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      header: (h: string) => {
        return headers === undefined ? '' : headers[h];
      },
    }) as Request;

  class ResponseMock extends EventEmitter {
    public headers: {[key: string]: string} = {};
    public statusCode = 200;
    public body: string | undefined;
    public locals = {
      functionExecutionFinished: false,
    };

    set(header: string, value: string) {
      this.headers[header.toLowerCase()] = value;
    }

    status(status: number) {
      this.statusCode = status;
    }

    sendStatus(status: number) {
      this.status(status);
    }

    end(body: string) {
      this.body = body;
      this.emit('done');
    }

    send(body: string) {
      this.end(body);
    }
  }

  const createResponse = () => {
    return new ResponseMock() as unknown as Response;
  };

  it('correctly wraps an http function', done => {
    const request = createRequest({foo: 'bar'});
    const response = createResponse();
    const func = wrapUserFunction((req: Request, res: Response) => {
      assert.deepStrictEqual(req, request);
      assert.deepStrictEqual(res, response);
      done();
    }, 'http');
    void func(request, response, () => {});
  });

  it('correctly wraps an async background function', done => {
    const request = createRequest({context: 'context', data: 'data'});
    const response = createResponse();
    const func = wrapUserFunction(async (data: {}, context: Context) => {
      assert.deepStrictEqual(data, 'data');
      assert.deepStrictEqual(context, 'context');
      // await to make sure wrapper handles async code
      await new Promise(resolve => setTimeout(resolve, 20));
      done();
    }, 'event');
    void func(request, response, () => {});
  });

  it('correctly wraps a background function with callback', done => {
    const request = createRequest({context: 'context', data: 'data'});
    const response = createResponse();
    const func = wrapUserFunction(
      (data: {}, context: Context, callback: Function) => {
        // timeout to make sure wrapper waits for callback
        setTimeout(() => {
          assert.deepStrictEqual(data, 'data');
          assert.deepStrictEqual(context, 'context');
          callback();
          done();
        }, 20);
      },
      'event',
    );
    void func(request, response, () => {});
  });

  it('correctly wraps an async CloudEvent function', done => {
    const request = createRequest(CLOUD_EVENT);
    const response = createResponse();
    const func = wrapUserFunction(
      async (cloudEvent: CloudEvent<typeof CLOUD_EVENT.data>) => {
        assert.deepStrictEqual(cloudEvent, CLOUD_EVENT);
        // await to make sure wrapper handles async code
        await new Promise(resolve => setTimeout(resolve, 20));
        done();
      },
      'cloudevent',
    );
    void func(request, response, () => {});
  });

  it('correctly wraps a CloudEvent function with callback', done => {
    const request = createRequest(CLOUD_EVENT);
    const response = createResponse();
    const func = wrapUserFunction(
      (cloudEvent: CloudEvent<typeof CLOUD_EVENT.data>, callback: Function) => {
        // timeout to make sure wrapper waits for callback
        setTimeout(() => {
          assert.deepStrictEqual(cloudEvent, CLOUD_EVENT);
          callback();
          done();
        }, 20);
      },
      'cloudevent',
    );
    void func(request, response, () => {});
  });
});
