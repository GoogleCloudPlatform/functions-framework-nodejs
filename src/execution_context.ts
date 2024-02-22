import {AsyncLocalStorage} from 'node:async_hooks';
import {Request, Response, NextFunction} from 'express';

export const asyncLocalStorage = new AsyncLocalStorage();

export interface ExeuctionContext {
  'logging.googleapis.com/labels': {
    executionId: string;
  };
  'logging.googleapis.com/trace'?: string;
  'logging.googleapis.com/spanId'?: string;
}

export const executionContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let executionId = req.header('function-execution-id');
  if (!executionId || executionId.length !== 12) {
    executionId = generateExecutionId();
  }

  let traceId, spanId, options;
  const cloudTraceContext = req.header('X-Cloud-Trace-Context');
  const regex = /^(?<traceId>\w+)\/(?<spanId>\d+);o=(?<options>.+)$/;
  if (cloudTraceContext) {
    const match = cloudTraceContext.match(regex);
    if (match?.groups) {
      ({traceId, spanId, options} = match.groups);
    }
  }

  const executionContext = <ExeuctionContext>{
    'logging.googleapis.com/labels': {
      executionId: executionId,
    },
    'logging.googleapis.com/trace': traceId,
    'logging.googleapis.com/spanId': spanId,
  };

  asyncLocalStorage.run(executionContext, () => {
    next();
  });
};

export function getCurrentContext() {
  return asyncLocalStorage.getStore();
}

function generateExecutionId() {
  const timestampPart = Date.now().toString(36).slice(-6);
  const randomPart = Math.random().toString(36).slice(-6);
  return timestampPart + randomPart;
}
