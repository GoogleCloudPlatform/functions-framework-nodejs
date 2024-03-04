import {
  executionContextMiddleware,
  getCurrentContext,
  ExecutionContext,
} from '../src/execution_context';
import {Request, Response, NextFunction} from 'express';
import * as assert from 'assert';

describe('executionContextMiddleware', () => {
  const createRequest = (
    body: object | string,
    headers?: {[key: string]: string}
  ) =>
    ({
      body,
      header: (h: string) => {
        return headers === undefined ? '' : headers[h];
      },
    }) as Request;

  const testSpanId = '123';
  const testTrace = 'testtrace';
  const cloudTraceContext = `${testTrace}/${testSpanId};o=1`;
  const validExecutionId = 'xn1h9xdgv6zw';

  it('uses execution ID in header', () => {
    const request = createRequest(
      {},
      {
        TRACE_CONTEXT_HEADER_KEY: cloudTraceContext,
        FUNCTION_EXECUTION_ID_HEADER_KEY: validExecutionId,
      }
    );
    let executionContext;
    const next = () => {
      executionContext = getCurrentContext() as ExecutionContext;
      assert(executionContext);
      assert.strictEqual(executionContext.executionId, validExecutionId);
      assert.strictEqual(executionContext.spanId, testSpanId);
      assert.strictEqual(executionContext.traceId, testTrace);
    };

    executionContextMiddleware(
      request as Request,
      {} as Response,
      next as NextFunction
    );
  });

  it('generates execution ID if not in header', () => {
    const request = createRequest(
      {},
      {TRACE_CONTEXT_HEADER_KEY: cloudTraceContext}
    );
    let executionContext;
    const next = () => {
      executionContext = getCurrentContext() as ExecutionContext;
      assert(executionContext);
      assert((executionContext as ExecutionContext).executionId);
      assert.strictEqual(executionContext.spanId, testSpanId);
      assert.strictEqual(executionContext.traceId, testTrace);
    };

    executionContextMiddleware(
      request as Request,
      {} as Response,
      next as NextFunction
    );

    assert(typeof getCurrentContext() === 'undefined');
  });
});
