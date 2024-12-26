import {executionContextMiddleware} from '../src/execution_context';
import {Request, Response} from '../src/functions';
import * as assert from 'assert';
import * as sinon from 'sinon';

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

  const next = sinon.spy();
  const testSpanId = '123';
  const testTrace = 'testtrace';
  const validExecutionId = 'xn1h9xdgv6zw';
  const headers = {
    'X-Cloud-Trace-Context': `${testTrace}/${testSpanId};o=1`,
    'function-execution-id': validExecutionId,
  };

  it('uses execution ID in header', () => {
    const req = createRequest({}, headers);

    executionContextMiddleware(req as Request, {} as Response, next);

    assert.strictEqual(req.executionId, validExecutionId);
    assert.strictEqual(req.spanId, testSpanId);
  });

  it('generates execution ID if not in header', () => {
    const req = createRequest({}, headers);

    executionContextMiddleware(req as Request, {} as Response, next);

    assert(req.executionId);
    assert.strictEqual(req.spanId, testSpanId);
  });

  it('req trace undefined if not in header', () => {
    const req = createRequest({}, {});

    executionContextMiddleware(req as Request, {} as Response, next);

    assert(req.executionId);
    assert.strictEqual(req.spanId, undefined);
  });
});
