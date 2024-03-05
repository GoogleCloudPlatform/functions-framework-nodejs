import * as semver from 'semver';
import {Request, Response} from './functions';
import {NextFunction} from 'express';
import {requiredNodeJsVersionForLogExecutionID} from './options';

export interface ExecutionContext {
  executionId?: string;
  traceId?: string;
  spanId?: string;
}

let asyncLocalStorage: any;

export async function asyncLocalStorageMiddleware(
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

  asyncLocalStorage.run(
    {
      executionId: req.executionId,
      traceId: req.traceId,
      spanId: req.spanId,
    },
    () => {
      next();
    }
  );
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
