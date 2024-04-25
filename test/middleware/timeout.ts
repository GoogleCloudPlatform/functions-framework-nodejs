import * as assert from 'assert';
import * as sinon from 'sinon';
import {NextFunction} from 'express';
import {Request, Response} from '../../src/functions';

import {timeoutMiddleware} from '../../src/middleware/timeout';

describe('timeoutMiddleware', () => {
  let request: Request;
  let response: Response;
  let next: NextFunction;
  beforeEach(() => {
    request = {
      setTimeout: sinon.spy(),
      on: sinon.spy(),
    } as unknown as Request;
    response = {
      on: sinon.spy(),
    } as unknown as Response;
    next = sinon.spy();
  });

  it('calls the next function', () => {
    const middleware = timeoutMiddleware(1000);
    middleware(request, response, next);
    assert.strictEqual((next as sinon.SinonSpy).called, true);
  });

  it('adds an abort controller to the request', function () {
    if (!('AbortController' in global)) {
      this.skip();
    }
    const middleware = timeoutMiddleware(1000);
    middleware(request, response, next);
    assert.strictEqual(!!request.abortController, true);
  });

  it('adds an abort controller to the request', function () {
    if (!('AbortController' in global)) {
      this.skip();
    }
    const middleware = timeoutMiddleware(1000);
    middleware(request, response, next);
    assert.strictEqual(!!request.abortController, true);
  });

  it('sets the request timeout', function () {
    if (!('AbortController' in global)) {
      this.skip();
    }
    const middleware = timeoutMiddleware(1000);
    middleware(request, response, next);
    assert.strictEqual(
      (request.setTimeout as sinon.SinonSpy).calledWith(1000),
      true
    );
  });
});
