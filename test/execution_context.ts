import {
  executionContextMiddleware,
  getCurrentContext,
  ExeuctionContext,
  EXECUTION_CONTEXT_LABELS_KEY,
  EXECUTION_CONTEXT_TRACE_KEY,
  EXECUTION_CONTEXT_SPAN_ID_KEY,
  TRACE_CONTEXT_HEADER_KEY,
  FUNCTION_EXECUTION_ID_HEADER_KEY
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
  function assertExecutionContext(exeuctionContext?: ExeuctionContext) {
    assert(exeuctionContext);
    assert.strictEqual(
      (exeuctionContext as ExeuctionContext)[EXECUTION_CONTEXT_LABELS_KEY]
        ?.executionId.length,
      12
    );
    assert.strictEqual(
      exeuctionContext[EXECUTION_CONTEXT_SPAN_ID_KEY],
      testSpanId
    );
    assert.strictEqual(
      exeuctionContext[EXECUTION_CONTEXT_TRACE_KEY],
      testTrace
    );
  }

  it('uses execution ID in header', () => {
    const request = createRequest(
      {},
      {
        TRACE_CONTEXT_HEADER_KEY: cloudTraceContext,
        FUNCTION_EXECUTION_ID_HEADER_KEY: validExecutionId,
      }
    );
    let exeuctionContext;
    const next = () => {
      exeuctionContext = getCurrentContext() as ExeuctionContext;
      assert(exeuctionContext);
      assert.deepEqual(exeuctionContext[EXECUTION_CONTEXT_LABELS_KEY], {
        executionId: validExecutionId,
      });
      assert.strictEqual(
        exeuctionContext[EXECUTION_CONTEXT_SPAN_ID_KEY],
        testSpanId
      );
      assert.strictEqual(
        exeuctionContext[EXECUTION_CONTEXT_TRACE_KEY],
        testTrace
      );
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
    let exeuctionContext;
    const next = () => {
      exeuctionContext = getCurrentContext() as ExeuctionContext;
      assertExecutionContext(exeuctionContext);
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
    let exeuctionContext;
    const next = () => {
      exeuctionContext = getCurrentContext() as ExeuctionContext;
      assertExecutionContext(exeuctionContext);
    };

    executionContextMiddleware(
      request as Request,
      {} as Response,
      next as NextFunction
    );
  });
});
