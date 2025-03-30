// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {Request, Response, NextFunction, Express} from 'express';
import {HandlerFunction} from '../functions';
import {ILayer} from 'express-serve-static-core';

/**
 * Common properties that exists on Express object instances. Extracted by calling
 * `Object.getOwnPropertyNames` on an express instance.
 */
const COMMON_EXPRESS_OBJECT_PROPERTIES = [
  '_router',
  'use',
  'get',
  'post',
  'put',
  'delete',
];

/** The number of parameters on an express error handler. */
const EXPRESS_ERROR_HANDLE_PARAM_LENGTH = 4;

/** A express app error handle. */
interface ErrorHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (err: Error, req: Request, res: Response, next: NextFunction): any;
}

/**
 * Express middleware to propagate framework errors to the user function error handle.
 * This enables users to handle framework errors that would otherwise be handled by the
 * default Express error handle. If the user function doesn't have an error handle,
 * it falls back to the default Express error handle.
 * @param userFunction - User handler function
 */
export const createPropagateErrorToClientErrorHandleMiddleware = (
  userFunction: HandlerFunction
): ErrorHandle => {
  const userFunctionErrorHandle =
    getFirstUserFunctionErrorHandleMiddleware(userFunction);

  return function (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Propagate error to user function error handle.
    if (userFunctionErrorHandle) {
      return userFunctionErrorHandle(err, req, res, next);
    }

    // Propagate error to default Express error handle.
    return next();
  };
};

/**
 * Returns the first user handler function defined error handle, if available.
 * @param userFunction - User handler function
 */
const getFirstUserFunctionErrorHandleMiddleware = (
  userFunction: HandlerFunction
): ErrorHandle | null => {
  if (!isExpressApp(userFunction)) {
    return null;
  }

  const middlewares: ILayer[] = (userFunction as Express)._router.stack;
  for (const middleware of middlewares) {
    if (
      middleware.handle &&
      middleware.handle.length === EXPRESS_ERROR_HANDLE_PARAM_LENGTH
    ) {
      return middleware.handle as unknown as ErrorHandle;
    }
  }

  return null;
};

/**
 * Returns if the user function contains common properties of an Express app.
 * @param userFunction
 */
const isExpressApp = (userFunction: HandlerFunction): boolean => {
  const userFunctionProperties = Object.getOwnPropertyNames(userFunction);
  return COMMON_EXPRESS_OBJECT_PROPERTIES.every(prop =>
    userFunctionProperties.includes(prop)
  );
};
