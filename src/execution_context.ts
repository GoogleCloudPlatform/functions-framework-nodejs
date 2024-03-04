import * as semver from 'semver';
import {Request, Response, NextFunction} from 'express';
import {requiredNodeJsVersionForLogExecutionID} from './options';
import {randomUUID} from 'node:crypto';

export const TRACE_CONTEXT_HEADER_KEY = 'X-Cloud-Trace-Context';
export const FUNCTION_EXECUTION_ID_HEADER_KEY = 'function-execution-id';

export interface ExecutionContext {
  executionId: string;
  traceId?: string;
  spanId?: string;
}

const TRACE_CONTEXT_PATTERN =
  /^(?<traceId>\w+)\/(?<spanId>\d+);o=(?<options>.+)$/;

function generateExecutionId() {
  return randomUUID().slice(-12);
}

let asyncLocalStorage: any;

export async function executionContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (
    semver.lt(process.versions.node, requiredNodeJsVersionForLogExecutionID)
  ) {
    // Skip for unsupported Node.js version.
    next();
    return;
  }
  const asyncHooks = await import('node:async_hooks');
  if (!asyncLocalStorage) {
    asyncLocalStorage = new asyncHooks.AsyncLocalStorage();
  }

  asyncLocalStorage.run(getContextFromHeader(req), () => {
    next();
  });
}

function getContextFromHeader(req: Request): ExecutionContext {
  let executionId = req.header(FUNCTION_EXECUTION_ID_HEADER_KEY);
  if (!executionId) {
    executionId = generateExecutionId();
  }

  let traceId, spanId;
  const cloudTraceContext = req.header(TRACE_CONTEXT_HEADER_KEY);
  if (cloudTraceContext) {
    const match = cloudTraceContext.match(TRACE_CONTEXT_PATTERN);
    if (match?.groups) {
      ({traceId, spanId} = match.groups);
    }
  }

  return {executionId, traceId, spanId};
}

export function getCurrentContext(): ExecutionContext | undefined {
  if (!asyncLocalStorage) {
    return undefined;
  }
  return asyncLocalStorage.getStore();
}

export const getCurrentExecutionId = (): string | undefined => {
  return getCurrentContext()?.executionId;
};
