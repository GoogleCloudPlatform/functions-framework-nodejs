import * as semver from 'semver';
import {Request, Response, NextFunction} from 'express';
import {requriedNodeJsVersion} from './options';

export interface ExeuctionContext {
  'logging.googleapis.com/labels': {
    executionId: string;
  };
  'logging.googleapis.com/trace'?: string;
  'logging.googleapis.com/spanId'?: string;
}

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
  if (semver.gte(process.versions.node, requriedNodeJsVersion)) {
    const asyncHooks = await import('node:async_hooks');
    if (!asyncLocalStorage) {
      asyncLocalStorage = new asyncHooks.AsyncLocalStorage();
    }

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
  } else {
    // Continue for unsupported Node.js version.
    next();
  }
}

export function getCurrentContext() {
  if (!asyncLocalStorage) {
    return undefined;
  }
  return asyncLocalStorage.getStore();
}
