import {
  executionContextMiddleware,
  getCurrentContext,
  ExecutionContext,
  EXECUTION_ID_LENGTH,
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
  function assertExecutionContext(executionContext?: ExecutionContext) {
    assert(executionContext);
    assert.strictEqual(
      (executionContext as ExecutionContext).executionId.length,
      EXECUTION_ID_LENGTH
    );
    assert.strictEqual(executionContext.spanId, testSpanId);
    assert.strictEqual(executionContext.traceId, testTrace);
  }

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
      assertExecutionContext(executionContext);
    };

    executionContextMiddleware(
      request as Request,
      {} as Response,
      next as NextFunction
    );
  });

  it('generates execution ID if header is malformed', () => {
    const request = createRequest(
      {},
      {
        TRACE_CONTEXT_HEADER_KEY: cloudTraceContext,
        FUNCTION_EXECUTION_ID_HEADER_KEY: 'abcde',
      }
    );
    let executionContext;
    const next = () => {
      executionContext = getCurrentContext() as ExecutionContext;
      assertExecutionContext(executionContext);
    };

    executionContextMiddleware(
      request as Request,
      {} as Response,
      next as NextFunction
    );
  });
});
