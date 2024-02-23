import {
  executionContextMiddleware,
  getCurrentContext,
  ExeuctionContext,
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
      (exeuctionContext as ExeuctionContext)['logging.googleapis.com/labels']
        ?.executionId.length,
      12
    );
    assert.strictEqual(
      exeuctionContext['logging.googleapis.com/spanId'],
      testSpanId
    );
    assert.strictEqual(
      exeuctionContext['logging.googleapis.com/trace'],
      testTrace
    );
  }

  it('uses execution ID in header', () => {
    const request = createRequest(
      {},
      {
        'X-Cloud-Trace-Context': cloudTraceContext,
        'function-execution-id': validExecutionId,
      }
    );
    let exeuctionContext;
    const next = () => {
      exeuctionContext = getCurrentContext() as ExeuctionContext;
      assert(exeuctionContext);
      assert.deepEqual(exeuctionContext['logging.googleapis.com/labels'], {
        executionId: validExecutionId,
      });
      assert.strictEqual(
        exeuctionContext['logging.googleapis.com/spanId'],
        testSpanId
      );
      assert.strictEqual(
        exeuctionContext['logging.googleapis.com/trace'],
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
      {'X-Cloud-Trace-Context': cloudTraceContext}
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
        'X-Cloud-Trace-Context': cloudTraceContext,
        'function-execution-id': 'abcde',
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
