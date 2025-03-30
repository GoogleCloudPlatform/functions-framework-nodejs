import * as assert from 'assert';
import {NextFunction} from 'express';
import {Request, Response} from '../../src';
import * as express from 'express';
import {injectUserFunctionErrorHandleMiddlewareChain} from '../../src/middleware/inject_user_function_error_handle_middleware_chain';
import {ILayer} from 'express-serve-static-core';

describe('injectUserFunctionErrorHandleMiddlewareChain', () => {
  it('user app with error handle middleware injects into framework app', () => {
    const frameworkApp = express();
    const userApp = express();
    userApp.use(appBErrorHandle);
    function appBErrorHandle(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _err: Error,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _req: Request,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: NextFunction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any {}
    userApp.use(appBFollowUpMiddleware);
    function appBFollowUpMiddleware(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _req: Request,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: NextFunction
    ) {}

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);

    const appAMiddleware = frameworkApp._router.stack;
    const appAMiddlewareNames = appAMiddleware.map(
      (middleware: ILayer) => middleware.name
    );

    assert.deepStrictEqual(appAMiddlewareNames, [
      'query',
      'expressInit',
      'appBErrorHandle',
      'appBFollowUpMiddleware',
    ]);
  });

  it('user app without error handle not injected into framework app', () => {
    const frameworkApp = express();
    const userApp = express();
    userApp.use(appBFollowUpMiddleware);
    function appBFollowUpMiddleware(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _req: Request,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: NextFunction
    ) {}

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);

    assert.strictEqual('_router' in frameworkApp, false);
  });

  it('non-express user app not injected into framework app', () => {
    const frameworkApp = express();
    const userApp = (_req: Request, res: Response) => {
      res.send('Hello, World!');
    };

    injectUserFunctionErrorHandleMiddlewareChain(frameworkApp, userApp);

    assert.strictEqual('_router' in frameworkApp, false);
  });
});
