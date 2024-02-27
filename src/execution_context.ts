import * as semver from 'semver';
import {Request, Response, NextFunction} from 'express';
import {requriedNodeJsVersion} from './options';

export const EXECUTION_ID_LENGTH = 12;
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
  const timestampPart = Date.now().toString(36).slice(-6);
  const randomPart = Math.random().toString(36).slice(-6);
  return timestampPart + randomPart;
}

let asyncLocalStorage: any;

export async function executionContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (semver.lt(process.versions.node, requriedNodeJsVersion)) {
    // Skip for unsupported Node.js version.
    next();
    return;
  }
  const asyncHooks = await import('node:async_hooks');
  if (!asyncLocalStorage) {
    asyncLocalStorage = new asyncHooks.AsyncLocalStorage();
  }

  let executionId = req.header(FUNCTION_EXECUTION_ID_HEADER_KEY);
  if (!executionId || executionId.length !== EXECUTION_ID_LENGTH) {
    executionId = generateExecutionId();
  }

  let traceId, spanId, options;
  const cloudTraceContext = req.header(TRACE_CONTEXT_HEADER_KEY);
  const regex = TRACE_CONTEXT_PATTERN;
  if (cloudTraceContext) {
    const match = cloudTraceContext.match(regex);
    if (match?.groups) {
      ({traceId, spanId, options} = match.groups);
    }
  }

  const executionContext = <ExecutionContext>{
    executionId: executionId,
    traceId: traceId,
    spanId: spanId,
  };

  asyncLocalStorage.run(executionContext, () => {
    next();
  });
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
