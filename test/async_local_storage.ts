import {
  asyncLocalStorageMiddleware,
  getCurrentContext,
  ExecutionContext,
} from '../src/async_local_storage';
import {Request, Response} from '../src/functions';
import {NextFunction} from 'express';
import * as assert from 'assert';
import * as semver from 'semver';

const runOrSkip = semver.lt(process.versions.node, '13.0.0') ? it.skip : it;

describe('asyncLocalStorageMiddleware', () => {
  runOrSkip('async local storage', async () => {
    const req = {
      body: 'test body',
      executionId: 'testExecutionId',
      traceId: 'testtrace',
      spanId: 'testSpanId',
    };
    let executionContext;
    const next = () => {
      // The store is accessible to operations created within the callback of run().
      executionContext = getCurrentContext() as ExecutionContext;
      assert(executionContext);
      assert.strictEqual(executionContext.executionId, req.executionId);
      assert.strictEqual(executionContext.spanId, req.spanId);
      assert.strictEqual(executionContext.traceId, req.traceId);
    };

    await asyncLocalStorageMiddleware(
      req as Request,
      {} as Response,
      next as NextFunction
    );

    // The store is not accessible outside of the run()'s callback function.
    assert.strictEqual(getCurrentContext(), undefined);
  });
});
