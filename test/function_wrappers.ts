import * as assert from 'assert';
import {Request, Response} from 'express';
import {
  Context,
  CloudEvent,
  JsonInvocationFormat,
  TypedFunction,
} from '../src/functions';
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
    headers?: {[key: string]: string}
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

  interface EchoMessage {
    message: string;
  }

  it('correctly wraps an http function', done => {
    const request = createRequest({foo: 'bar'});
    const response = createResponse();
    const func = wrapUserFunction((req: Request, res: Response) => {
      assert.deepStrictEqual(req, request);
      assert.deepStrictEqual(res, response);
      done();
    }, 'http');
    func(request, response, () => {});
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
    func(request, response, () => {});
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
      'event'
    );
    func(request, response, () => {});
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
      'cloudevent'
    );
    func(request, response, () => {});
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
      'cloudevent'
    );
    func(request, response, () => {});
  });

  describe('wraps a Typed JSON function', () => {
    const synchronousJsonFunction: TypedFunction<EchoMessage, EchoMessage> = {
      format: new JsonInvocationFormat<EchoMessage, EchoMessage>(),
      handler: (req: EchoMessage): EchoMessage => {
        return {
          message: req.message,
        };
      },
    };
    it('when the handler is synchronous', done => {
      const payload = JSON.stringify({
        message: 'test',
      });

      const request = createRequest(payload);
      const response = new ResponseMock();
      const func = wrapUserFunction(synchronousJsonFunction, 'typed');

      func(request, response as unknown as Response, () => {});

      response.on('done', () => {
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(
          response.headers['content-type'],
          'application/json'
        );
        assert.strictEqual(response.body, payload);
        done();
      });
    });

    it('when the format throws a parse error', done => {
      const payload = 'Asdf';

      const request = createRequest(payload);
      const response = new ResponseMock();
      const func = wrapUserFunction(synchronousJsonFunction, 'typed');

      func(request, response as unknown as Response, () => {});

      response.on('done', () => {
        assert.strictEqual(response.statusCode, 400);
        done();
      });
    });

    it('when the handler is asynchronous', done => {
      const payload = JSON.stringify({
        message: 'test',
      });

      const typedFn: TypedFunction<EchoMessage, EchoMessage> = {
        format: new JsonInvocationFormat<EchoMessage, EchoMessage>(),
        handler: (req: EchoMessage): Promise<EchoMessage> => {
          return new Promise(accept => {
            setImmediate(() => accept(req));
          });
        },
      };

      const request = createRequest(payload);
      const response = new ResponseMock();
      const func = wrapUserFunction(typedFn, 'typed');

      func(request, response as unknown as Response, () => {});

      response.on('done', () => {
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(
          response.headers['content-type'],
          'application/json'
        );
        assert.strictEqual(response.body, payload);
        done();
      });
    });

    it('when the async handler throws an error', done => {
      const payload = JSON.stringify({
        message: 'test',
      });

      const typedFn: TypedFunction<EchoMessage, EchoMessage> = {
        format: new JsonInvocationFormat<EchoMessage, EchoMessage>(),
        handler: (): Promise<EchoMessage> => {
          return new Promise((_, reject) => {
            setImmediate(() => reject(new Error('an error')));
          });
        },
      };

      const request = createRequest(payload);
      const response = new ResponseMock();
      const func = wrapUserFunction(typedFn, 'typed');

      func(request, response as unknown as Response, () => {});

      response.on('done', () => {
        assert.strictEqual(response.statusCode, 500);
        done();
      });
    });
  });
});
