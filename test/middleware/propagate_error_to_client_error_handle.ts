import * as assert from 'assert';
import * as sinon from 'sinon';
import {NextFunction} from 'express';
import {Request, Response} from '../../src';
import {createPropagateErrorToClientErrorHandleMiddleware} from '../../src/middleware/propagate_error_to_client_error_handle';
import * as express from 'express';

describe('propagateErrorToClientErrorHandleMiddleware', () => {
  let request: Request;
  let response: Response;
  let next: NextFunction;
  let errListener = () => {};
  let error: Error;
  beforeEach(() => {
    error = Error('Something went wrong!');
    request = {
      setTimeout: sinon.spy(),
      on: sinon.spy(),
    } as unknown as Request;
    response = {
      on: sinon.spy(),
    } as unknown as Response;
    next = sinon.spy();
    errListener = sinon.spy();
  });

  it('user express app with error handle calls user function app error handle', () => {
    const app = express();
    app.use(
      (
        _err: Error,
        _req: Request,
        _res: Response,
        _next: NextFunction
      ): any => {
        errListener();
      }
    );

    const middleware = createPropagateErrorToClientErrorHandleMiddleware(app);
    middleware(error, request, response, next);

    assert.strictEqual((errListener as sinon.SinonSpy).called, true);
    assert.strictEqual((next as sinon.SinonSpy).called, false);
  });

  it('user express app without error handle calls default express error handle', () => {
    const app = express();

    const middleware = createPropagateErrorToClientErrorHandleMiddleware(app);
    middleware(error, request, response, next);

    assert.strictEqual((errListener as sinon.SinonSpy).called, false);
    assert.strictEqual((next as sinon.SinonSpy).called, true);
  });

  it('non-express user app calls default express error handle', () => {
    const app = (_req: Request, res: Response) => {
      res.send('Hello, World!');
    };

    const middleware = createPropagateErrorToClientErrorHandleMiddleware(app);
    middleware(error, request, response, next);

    assert.strictEqual((errListener as sinon.SinonSpy).called, false);
    assert.strictEqual((next as sinon.SinonSpy).called, true);
  });
});
