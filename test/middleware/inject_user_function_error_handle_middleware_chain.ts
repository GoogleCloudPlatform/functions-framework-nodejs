import * as assert from 'assert';
import {Express, NextFunction} from 'express';
import {Request, Response} from '../../src';
import * as express from 'express';
import {injectUserFunctionErrorHandleMiddlewareChain} from '../../src/middleware/inject_user_function_error_handle_middleware_chain';
import {ILayer} from 'express-serve-static-core';

describe('injectUserFunctionErrorHandleMiddlewareChain', () => {
  const userAppErrorHandleMiddleware = (
    /* eslint-disable @typescript-eslint/no-unused-vars */
    _err: Error,
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};
  const userAppFollowUpErrorMiddleware = (
    /* eslint-disable @typescript-eslint/no-unused-vars */
    _err: Error,
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};
  const userAppNormalMiddleware = (
    /* eslint-disable @typescript-eslint/no-unused-vars */
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

  const getMiddlewareNames = (app: Express) => {
    return app._router.stack.map((middleware: ILayer) => middleware.name);
  };

  it('user app with error handle middleware injects middleware chain into framework app', () => {
    const frameworkApp = express();
    const userApp = express();
    userApp.use(userAppErrorHandleMiddleware);
    userApp.use(userAppNormalMiddleware);
    userApp.use(userAppFollowUpErrorMiddleware);

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);
    const frameworkAppMiddlewareNames = getMiddlewareNames(frameworkApp);

    assert.deepStrictEqual(frameworkAppMiddlewareNames, [
      'query',
      'expressInit',
      'userAppErrorHandleMiddleware',
      'userAppNormalMiddleware',
      'userAppFollowUpErrorMiddleware',
    ]);
  });

  it('user app with error handle middleware ignores routes and injects middleware chain into framework app', () => {
    const frameworkApp = express();
    const userApp = express();
    userApp.use(userAppErrorHandleMiddleware);
    userApp.post(
      '/foo',
      (_req: Request, _res: Response, _next: NextFunction) => {}
    );
    userApp.use(userAppFollowUpErrorMiddleware);

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);
    const frameworkAppMiddlewareNames = getMiddlewareNames(frameworkApp);

    assert.deepStrictEqual(frameworkAppMiddlewareNames, [
      'query',
      'expressInit',
      'userAppErrorHandleMiddleware',
      'userAppFollowUpErrorMiddleware',
    ]);
  });

  it('user app without error handle middleware chain not injected into framework app', () => {
    const frameworkApp = express();
    const userApp = express();
    userApp.use(userAppNormalMiddleware);

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);

    assert.strictEqual('_router' in frameworkApp, false);
  });

  it('non-express user app middleware chain not injected into framework app', () => {
    const frameworkApp = express();
    const userApp = (_req: Request, res: Response) => {
      res.send('Hello, World!');
    };

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);

    assert.strictEqual('_router' in frameworkApp, false);
  });
});
