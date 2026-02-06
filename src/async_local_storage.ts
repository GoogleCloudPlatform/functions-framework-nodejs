import {Request, Response} from './functions';
import {NextFunction} from 'express';
import type {AsyncLocalStorage} from 'node:async_hooks';

export interface ExecutionContext {
  executionId?: string;
  spanId?: string;
}

let asyncLocalStorage: AsyncLocalStorage<ExecutionContext> | undefined;

export async function asyncLocalStorageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!asyncLocalStorage) {
    const asyncHooks = await import('node:async_hooks');
    asyncLocalStorage = new asyncHooks.AsyncLocalStorage();
  }

  asyncLocalStorage.run(
    {
      executionId: req.executionId,
      spanId: req.spanId,
    },
    () => {
      next();
    },
  );
}

export function getCurrentContext(): ExecutionContext | undefined {
  if (!asyncLocalStorage) {
    return undefined;
  }
  return asyncLocalStorage.getStore();
}
